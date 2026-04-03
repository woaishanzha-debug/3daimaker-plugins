import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, Environment } from '@react-three/drei';
import { ArrowLeft, Upload, PaintBucket, Box, Download } from 'lucide-react';
import * as THREE from 'three';
import { exportTo3MF } from 'three-3mf-exporter';

// 基础颜色库
const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#000000'];

// 将 Hex 转换为 RGB 数组
const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b, 255];
};

export default function EmbroideryPlugin({ config: _config }: { config: any }) {
    const [originalImg, setOriginalImg] = useState<HTMLImageElement | null>(null);
    const [threshold, setThreshold] = useState(128);
    const [activeColor, setActiveColor] = useState(COLORS[0]);
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // 3D 簇绒数据: { color: string, matrices: THREE.Matrix4[] }
    const [tuftingData, setTuftingData] = useState<Record<string, THREE.Matrix4[]>>({});

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const exportGroupRef = useRef<THREE.Group>(null);

    // --- 图像与线稿处理 ---
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const MAX_SIZE = 600; 
                let width = img.width; let height = img.height;
                if (width > MAX_SIZE || height > MAX_SIZE) {
                    const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
                    width *= ratio; height *= ratio;
                }
                img.width = width; img.height = height;
                setOriginalImg(img);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const processImageToLineArt = useCallback(() => {
        if (!originalImg || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        canvas.width = originalImg.width; canvas.height = originalImg.height;
        ctx.drawImage(originalImg, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const val = gray < threshold ? 0 : 255;
            data[i] = val; data[i + 1] = val; data[i + 2] = val; data[i + 3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
    }, [originalImg, threshold]);

    useEffect(() => { if (viewMode === '2d') processImageToLineArt(); }, [processImageToLineArt, viewMode]);

    // --- 核心：BFS 泛洪填色算法 ---
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (viewMode !== '2d') return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d', { willReadFrequently: true });
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleY);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const targetColor = hexToRgb(activeColor);
        
        const startPos = (y * canvas.width + x) * 4;
        const startR = data[startPos];
        const startG = data[startPos + 1];
        const startB = data[startPos + 2];

        if (startR === targetColor[0] && startG === targetColor[1] && startB === targetColor[2]) return;
        if (startR < 50 && startG < 50 && startB < 50) return;

        const pixelStack = [[x, y]];
        const width = canvas.width;
        const height = canvas.height;

        const matchStartColor = (pixelPos: number) => {
            return data[pixelPos] === startR && data[pixelPos + 1] === startG && data[pixelPos + 2] === startB;
        };

        const colorPixel = (pixelPos: number) => {
            data[pixelPos] = targetColor[0]; data[pixelPos + 1] = targetColor[1]; data[pixelPos + 2] = targetColor[2]; data[pixelPos + 3] = 255;
        };

        while (pixelStack.length) {
            const newPos = pixelStack.pop()!;
            const px = newPos[0]; let py = newPos[1];
            let pixelPos = (py * width + px) * 4;
            while (py >= 0 && matchStartColor(pixelPos)) { py--; pixelPos -= width * 4; }
            pixelPos += width * 4; py++;
            let reachLeft = false; let reachRight = false;
            while (py < height && matchStartColor(pixelPos)) {
                colorPixel(pixelPos);
                if (px > 0) {
                    if (matchStartColor(pixelPos - 4)) { if (!reachLeft) { pixelStack.push([px - 1, py]); reachLeft = true; } }
                    else if (reachLeft) { reachLeft = false; }
                }
                if (px < width - 1) {
                    if (matchStartColor(pixelPos + 4)) { if (!reachRight) { pixelStack.push([px + 1, py]); reachRight = true; } }
                    else if (reachRight) { reachRight = false; }
                }
                py++; pixelPos += width * 4;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    };

    // 核心算法：欧氏距离色彩收敛 (将任意 RGB 强制吸附到预设色板)
    const getNearestPaletteColor = (r: number, g: number, b: number) => {
        // 绝对阈值锁：极暗像素直接归类为纯黑线稿，消除边缘抗锯齿导致的变色
        if (r < 40 && g < 40 && b < 40) return '#000000';

        let MathMinDist = Infinity;
        let nearestHex = COLORS[0];
        
        COLORS.forEach(hex => {
            const paletteRgb = hexToRgb(hex);
            // 计算 3D 色彩空间的平方距离 (规避开方运算以压榨性能)
            const dist = Math.pow(r - paletteRgb[0], 2) + Math.pow(g - paletteRgb[1], 2) + Math.pow(b - paletteRgb[2], 2);
            if (dist < MathMinDist) {
                MathMinDist = dist;
                nearestHex = hex;
            }
        });
        return nearestHex;
    };

    // --- 核心：提取像素转换为 3D 簇绒矩阵 ---
    const generateTufting3D = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const SAMPLE_SIZE = 120;
        const scale = Math.min(SAMPLE_SIZE / canvas.width, SAMPLE_SIZE / canvas.height);
        const w = Math.floor(canvas.width * scale);
        const h = Math.floor(canvas.height * scale);

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w; tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d')!;

        // 核心修复：彻底关闭抗锯齿与平滑插值，强制最近邻采样，保障黑白线稿绝对锐利
        tempCtx.imageSmoothingEnabled = false;

        tempCtx.drawImage(canvas, 0, 0, w, h);
        
        const imgData = tempCtx.getImageData(0, 0, w, h).data;
        const colorGroups: Record<string, THREE.Matrix4[]> = {};
        const tuftSize = 0.08; 

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = (y * w + x) * 4;
                const r = imgData[i]; const g = imgData[i+1]; const b = imgData[i+2];
                if (r > 240 && g > 240 && b > 240) continue;
                
                // 核心修复：强制进行色彩收敛归类，解决切片机因材质过多崩溃的问题
                const hex = getNearestPaletteColor(r, g, b);
                if (!colorGroups[hex]) colorGroups[hex] = [];

                const matrix = new THREE.Matrix4();
                const posX = (x - w / 2) * tuftSize;
                const posY = -(y - h / 2) * tuftSize;
                const randomHeight = 0.2 + Math.random() * 0.15;
                const position = new THREE.Vector3(posX, posY, randomHeight / 2);
                const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
                const scale = new THREE.Vector3(1, randomHeight, 1);
                matrix.compose(position, rotation, scale);
                colorGroups[hex].push(matrix);
            }
        }
        setTuftingData(colorGroups);
        setViewMode('3d');
    };

    // --- 工业级全彩模型导出 (V1 溯源版 3MF 终极管线) ---
    const handleExport = useCallback(async () => {
        setIsProcessing(true);
        
        try {
            const printGroup = new THREE.Group();
            
            // 1. 组装底板 (厚度 0.4)
            const baseGeometry = new THREE.BoxGeometry(12, 12, 0.4);
            const baseMaterial = new THREE.MeshStandardMaterial({ color: "#e5e5e5" });
            const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
            // 底板下沉，表面刚好在 Z=0
            baseMesh.position.set(0, 0, -0.2); 
            printGroup.add(baseMesh);

            // 2. 原位还原 3D 簇绒
            const tuftGeometry = new THREE.CylinderGeometry(0.04, 0.04, 1, 6);
            Object.entries(tuftingData).forEach(([color, matrices]) => {
                if (matrices.length === 0) return;
                
                const partMaterial = new THREE.MeshStandardMaterial({ color: color });
                matrices.forEach((mat) => {
                    const tuftMesh = new THREE.Mesh(tuftGeometry, partMaterial);
                    mat.decompose(tuftMesh.position, tuftMesh.quaternion, tuftMesh.scale);
                    
                    // 物理隔离机制：确保簇绒底部略微高于或刚好贴合 Z=0，防止切片时颜色与底板发生冲突碰撞
                    tuftMesh.position.z += 0.01; 
                    
                    printGroup.add(tuftMesh);
                });
            });

            // 3. 物理尺度 10 倍膨胀 (突破切片软件薄壁剔除限制)
            printGroup.scale.set(10, 10, 10);
            printGroup.updateMatrixWorld(true);

            // 4. V1 核心黑科技：异步 3MF 序列化与拓竹元数据注入
            const blob = await exportTo3MF(printGroup, { printer_name: 'Bambu Lab' });
            
            // 5. 触发下载
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Tufting_Embroidery_${Date.now()}.3mf`;
            link.click();

        } catch (error) {
            console.error('3MF 终极封包失败:', error);
        } finally {
            setIsProcessing(false);
        }
    }, [tuftingData]);

    return (
        <div className="w-full h-screen flex bg-slate-950 text-white overflow-hidden font-sans">
            <div className="w-[360px] bg-slate-900 border-r border-white/10 flex flex-col z-10 shrink-0">
                <div className="p-6 border-b border-white/10 flex items-center gap-4 shrink-0">
                    <button onClick={() => window.parent.postMessage({ type: 'EXIT_PLUGIN' }, '*')} className="text-white/50 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
                    <div>
                        <span className="px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-500 text-[10px] font-black uppercase">L1-11</span>
                        <h1 className="font-black text-sm tracking-widest text-emerald-400 mt-1">智能刺绣：簇绒织造引擎</h1>
                    </div>
                </div>

                <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                    <div className="flex bg-black/40 rounded-xl p-1 border border-white/10 relative">
                        <button onClick={() => setViewMode('2d')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all z-10 ${viewMode === '2d' ? 'text-white shadow-lg bg-emerald-600' : 'text-white/50 hover:text-white/80'}`}><PaintBucket className="w-4 h-4" /> 线稿着色</button>
                        <button onClick={generateTufting3D} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all z-10 ${viewMode === '3d' ? 'text-white shadow-lg bg-blue-600' : 'text-white/50 hover:text-white/80'}`}><Box className="w-4 h-4" /> 3D簇绒</button>
                    </div>

                    {viewMode === '2d' && (
                        <>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-white/50 tracking-widest">导入设计图</label>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 border border-white/20 hover:border-emerald-500 rounded flex items-center justify-center gap-2 transition-colors"><Upload className="w-4 h-4 text-white/40" /><span className="text-xs font-bold">重新上传</span></button>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/50">线稿提取强度 ({threshold})</label>
                                <input type="range" min="0" max="255" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full accent-emerald-500" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-white/50 tracking-widest">簇绒毛线库</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLORS.map(c => (
                                        <button key={c} onClick={() => setActiveColor(c)} className={`w-8 h-8 rounded-full border-2 ${activeColor === c ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent shadow-md'}`} style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                    
                    {viewMode === '3d' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                                <p className="text-xs text-blue-300 leading-relaxed font-bold">
                                    簇绒阵列已生成完毕！<br/>底层算法已将像素矩阵转化为 {Object.values(tuftingData).flat().length} 根独立的 3D 毛线管。
                                </p>
                            </div>
                            <button 
                                onClick={handleExport} 
                                disabled={isProcessing}
                                className="w-full py-3 rounded bg-blue-600 hover:bg-blue-500 font-bold text-sm flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                <Download className="w-4 h-4" /> 
                                {isProcessing ? '正在封装 Bambu 工业级 3MF 数据...' : '导出全彩 3MF 切片模型'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 bg-[#f5f5f0] relative flex items-center justify-center p-8">
                {viewMode === '2d' ? (
                    <div className="relative z-10 p-4 bg-white rounded-lg shadow-2xl ring-1 ring-black/5 cursor-crosshair">
                        <canvas ref={canvasRef} onClick={handleCanvasClick} className="max-w-full max-h-[80vh] object-contain" />
                    </div>
                ) : (
                    <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
                        <color attach="background" args={['#f5f5f0']} />
                        <ambientLight intensity={0.6} />
                        <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
                        <Environment preset="city" />
                        <OrbitControls makeDefault maxPolarAngle={Math.PI / 1.5} />
                        
                        <Center>
                            <group ref={exportGroupRef}>
                                <mesh position={[0, 0, -0.2]}>
                                    <boxGeometry args={[12, 12, 0.4]} />
                                    <meshStandardMaterial color="#e5e5e5" roughness={1} />
                                </mesh>
                                {Object.entries(tuftingData).map(([color, matrices], idx) => {
                                    if (matrices.length === 0) return null;
                                    return (
                                        <instancedMesh key={`tuft-${idx}`} args={[undefined, undefined, matrices.length]} 
                                            ref={(mesh) => {
                                                if (mesh) {
                                                    matrices.forEach((mat, i) => mesh.setMatrixAt(i, mat));
                                                    mesh.instanceMatrix.needsUpdate = true;
                                                }
                                            }}
                                        >
                                            <cylinderGeometry args={[0.04, 0.04, 1, 6]} />
                                            <meshStandardMaterial color={color} roughness={0.9} />
                                        </instancedMesh>
                                    );
                                })}
                            </group>
                        </Center>
                    </Canvas>
                )}
            </div>
        </div>
    );
}
