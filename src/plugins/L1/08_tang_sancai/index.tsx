import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Center, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { ArrowLeft, Upload, Download, Eye, Droplet } from 'lucide-react';
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';
import { exportTo3MF } from 'three-3mf-exporter';

// 唐三彩经典釉色盘
const GLAZE_COLORS = ['#d97706', '#15803d', '#f8fafc', '#78350f', '#0369a1'];

// 欧氏距离色彩收敛器
const getNearestPaletteColor = (r: number, g: number, b: number, palette: string[]) => {
    let MathMinDist = Infinity;
    let nearestHex = palette[0];
    
    palette.forEach(hex => {
        // Hex 转 RGB 浮点数 (0-1) 用于对比
        const pr = parseInt(hex.slice(1, 3), 16) / 255;
        const pg = parseInt(hex.slice(3, 5), 16) / 255;
        const pb = parseInt(hex.slice(5, 7), 16) / 255;
        
        const distSq = (r - pr)*(r - pr) + (g - pg)*(g - pg) + (b - pb)*(b - pb);
        if (distSq < MathMinDist) {
            MathMinDist = distSq;
            nearestHex = hex;
        }
    });
    return nearestHex;
};

// 纯前端动态生成彩色勺子/水滴光标 (零模型加载算力)
const getSpoonCursor = (color: string) => {
    const hex = color.replace('#', '%23'); // 必须转义 # 才能写入 DataURI
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><path d="M12 2C8 6 6 10 6 14a6 6 0 1 0 12 0c0-4-2-8-6-12z" fill="${hex}" stroke="white" stroke-width="1.5"/><line x1="12" y1="2" x2="12" y2="-4" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>`;
    return `url('data:image/svg+xml;utf8,${svg}') 24 24, crosshair`;
};

// 3D 淋釉交互组件
const GlazeMesh = ({ geometry, mode, activeColor }: { geometry: THREE.BufferGeometry, mode: string, activeColor: string }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const lastHitRef = useRef<THREE.Vector3 | null>(null);

    // 工业级流体力学着色引擎：溅射与重力泪滴 (Splat & Drip)
    const handlePointer = (e: any) => {
        if (mode !== 'glaze' || !meshRef.current) return;
        
        if (e.buttons !== 1) {
            lastHitRef.current = null;
            return;
        }
        e.stopPropagation();

        const localHitPoint = meshRef.current.worldToLocal(e.point.clone());

        // 性能节流阀
        if (e.type === 'pointermove' && lastHitRef.current) {
            if (lastHitRef.current.distanceTo(localHitPoint) < 0.5) return;
        }
        lastHitRef.current = localHitPoint.clone();

        const geom = meshRef.current.geometry;
        const positions = geom.attributes.position;
        const colors = geom.attributes.color;
        
        const targetColor = new THREE.Color(activeColor);
        const baseRadius = 2.0; // 基础溅射半径
        const baseRadiusSq = baseRadius * baseRadius;

        let isUpdated = false;

        for (let i = 0; i < positions.count; i++) {
            const dx = positions.getX(i) - localHitPoint.x;
            const dy = positions.getY(i) - localHitPoint.y;
            const dz = positions.getZ(i) - localHitPoint.z;

            const distSq = dx * dx + dy * dy + dz * dz;
            let isColored = false;

            // 形态 1：中心溅射区 (釉水刚接触表面的圆形区域)
            if (distSq < baseRadiusSq) {
                isColored = true;
            } 
            // 形态 2：重力流淌区 (釉水向下滴落拉出的长尾巴)
            else if (dy < 0) {
                const dropDepth = Math.abs(dy); // 下落深度
                const horizontalDist = Math.sqrt(dx * dx + dz * dz); // 水平横截向偏移

                // 物理魔法：越往下流，釉水越窄，形成上宽下窄的水滴尾巴
                const allowedWidth = baseRadius / (1.0 + dropDepth * 0.3);
                // 随机流淌极限：模拟釉水在不同表面的不规则断流
                const maxDrop = baseRadius * 6 + Math.random() * 4;

                // 判断是否在水滴包络线内，并加入 0.5 的随机毛刺扰动边缘
                if (dropDepth < maxDrop && horizontalDist < allowedWidth + Math.random() * 0.5) {
                    isColored = true;
                }
            }

            if (isColored) {
                const currentR = colors.getX(i);
                const currentG = colors.getY(i);
                const currentB = colors.getZ(i);
                
                // 釉色交融：80% 新釉色 + 20% 底色透出
                colors.setXYZ(
                    i, 
                    currentR * 0.2 + targetColor.r * 0.8,
                    currentG * 0.2 + targetColor.g * 0.8,
                    currentB * 0.2 + targetColor.b * 0.8
                );
                isUpdated = true;
            }
        }
        
        if (isUpdated) colors.needsUpdate = true;
    };

    return (
        <mesh 
            ref={meshRef} 
            geometry={geometry} 
            onPointerDown={handlePointer}
            onPointerMove={handlePointer}
            onPointerUp={() => { lastHitRef.current = null; }}
            onPointerLeave={() => { lastHitRef.current = null; }}
        >
            <meshStandardMaterial 
                vertexColors={true} 
                roughness={0.1} // 唐三彩高反光玻璃釉面特征
                metalness={0.1}
            />
        </mesh>
    );
};

export default function TangSancaiPlugin() {
    const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
    const [mode, setMode] = useState<'view' | 'glaze'>('view');
    const [activeColor, setActiveColor] = useState(GLAZE_COLORS[0]);
    const [isExporting, setIsExporting] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // STL 非索引化与素胎重构
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const loader = new STLLoader();
            const loadedGeom = loader.parse(event.target?.result as ArrayBuffer);
            
            // 必须解构为 NonIndexed，保障每个面的顶点独立持色
            let nonIndexedGeom = loadedGeom.toNonIndexed();
            nonIndexedGeom.computeVertexNormals();
            
            // 核心解耦 1：工业 Z-up 转 WebGL Y-up，让模型在浏览器中正常站立
            nonIndexedGeom.rotateX(-Math.PI / 2);
            
            // 注入纯白高岭土素胎底色
            const count = nonIndexedGeom.attributes.position.count;
            const colors = new Float32Array(count * 3);
            for(let i=0; i<count*3; i++) colors[i] = 1; 
            nonIndexedGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            
            // 尺寸标准化：将模型统一缩放至适合操作与 3D 打印的物理尺度 (半径约 50mm)
            nonIndexedGeom.computeBoundingSphere();
            const radius = nonIndexedGeom.boundingSphere?.radius || 1;
            nonIndexedGeom.scale(50/radius, 50/radius, 50/radius);

            setGeometry(nonIndexedGeom);
        };
        reader.readAsArrayBuffer(file);
    };

    // === 终极物理学：唐三彩 3MF 釉面实体挤出引擎 ===
    const handleExport = async () => {
        if (!geometry) return;
        setIsExporting(true);

        // 释放主线程让 UI 更新 loading 状态
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            const positions = geometry.attributes.position;
            const colors = geometry.attributes.color;

            // 1. 初始化釉色实体缓存池
            const colorBuffers: Record<string, number[]> = {};
            GLAZE_COLORS.forEach(c => colorBuffers[c] = []);

            const v0 = new THREE.Vector3();
            const v1 = new THREE.Vector3();
            const v2 = new THREE.Vector3();

            // 物理制造参数：唐三彩的釉层较薄，向外凸起 0.4mm 形成釉面，向内嵌入 0.4mm 咬合胎体
            const extOut = 0.4;
            const extIn = -0.4;

            // 2. 遍历所有面片
            for (let i = 0; i < positions.count; i += 3) {
                // 采样该三角形第一个顶点的颜色
                const r = colors.getX(i);
                const g = colors.getY(i);
                const b = colors.getZ(i);

                // 核心判断：如果是纯白素胎 (1,1,1)，表示未上釉，跳过挤出，直接露出底座
                if (r === 1 && g === 1 && b === 1) continue;

                const matchedHex = getNearestPaletteColor(r, g, b, GLAZE_COLORS);

                v0.fromBufferAttribute(positions, i);
                v1.fromBufferAttribute(positions, i+1);
                v2.fromBufferAttribute(positions, i+2);

                // 计算真实面法线
                const cb = new THREE.Vector3().subVectors(v2, v1);
                const ab = new THREE.Vector3().subVectors(v0, v1);
                const normal = new THREE.Vector3().crossVectors(cb, ab);
                if (normal.lengthSq() < 0.000001) continue; 
                normal.normalize();

                const offsetTop = normal.clone().multiplyScalar(extOut);
                const offsetBot = normal.clone().multiplyScalar(extIn);

                const v0t = v0.clone().add(offsetTop);
                const v1t = v1.clone().add(offsetTop);
                const v2t = v2.clone().add(offsetTop);
                
                const v0b = v0.clone().add(offsetBot);
                const v1b = v1.clone().add(offsetBot);
                const v2b = v2.clone().add(offsetBot);

                const pushTri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
                    colorBuffers[matchedHex].push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
                };

                // 将单薄的面片膨胀为 8 个面构成的绝对闭合三棱柱
                pushTri(v0t, v1t, v2t); // 顶面
                pushTri(v0b, v2b, v1b); // 底面
                pushTri(v0t, v0b, v1b); pushTri(v0t, v1b, v1t); // 侧围 1
                pushTri(v1t, v1b, v2b); pushTri(v1t, v2b, v2t); // 侧围 2
                pushTri(v2t, v2b, v0b); pushTri(v2t, v0b, v0t); // 侧围 3
            }

            const printGroup = new THREE.Group();

            // 3. 素胎护航：将原素模作为纯白/米黄色的素胎底座打底
            const baseMat = new THREE.MeshStandardMaterial({ color: '#f5f5f4', roughness: 0.9 });
            const baseMesh = new THREE.Mesh(geometry, baseMat);
            printGroup.add(baseMesh);

            // 4. 实体拼装：将挤出的釉色积木挂载
            for (const hex of GLAZE_COLORS) {
                const posArray = colorBuffers[hex];
                if (posArray.length === 0) continue;

                const partGeom = new THREE.BufferGeometry();
                partGeom.setAttribute('position', new THREE.Float32BufferAttribute(posArray, 3));
                partGeom.computeVertexNormals();

                const partMat = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.1 }); // 保持高光泽度
                const partMesh = new THREE.Mesh(partGeom, partMat);
                printGroup.add(partMesh);
            }

            // 5. 坐标系解耦与工业封包 (恢复 Z-up)
            printGroup.rotation.x = Math.PI / 2;
            printGroup.scale.set(1, 1, 1);
            printGroup.updateMatrixWorld(true);

            const blob = await exportTo3MF(printGroup, { printer_name: 'Bambu Lab AMS' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Tang_Sancai_Solid_${Date.now()}.3mf`;
            link.click();

        } catch (error) {
            console.error('实体挤出 3MF 导出失败:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="w-full h-screen flex bg-stone-950 text-white font-sans overflow-hidden">
            {/* 左侧控制台 */}
            <div className="w-[360px] bg-stone-900 border-r border-amber-900/30 flex flex-col z-10 shrink-0 shadow-2xl">
                <div className="p-6 border-b border-white/5 flex items-center gap-4 shrink-0">
                    <button onClick={() => window.parent.postMessage({ type: 'EXIT_PLUGIN' }, '*')} className="text-white/30 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <span className="px-2 py-0.5 rounded bg-amber-600/20 text-amber-500 text-[10px] font-black uppercase">L1-08</span>
                        <h1 className="font-black text-lg tracking-widest text-amber-500 mt-1">唐三彩：流釉工坊</h1>
                    </div>
                </div>

                <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                    {!geometry ? (
                        <div className="space-y-6">
                            <div className="p-4 bg-amber-950/20 border border-amber-500/10 rounded-xl">
                                <h3 className="text-amber-500 font-bold text-sm mb-2">欢迎来到流釉工坊</h3>
                                <p className="text-[11px] text-amber-400/60 leading-relaxed font-medium">
                                    请上传高岭土陶胎（STL格式），准备施以斑斓釉彩。
                                </p>
                            </div>
                            <button onClick={() => fileInputRef.current?.click()} className="w-full h-48 border-2 border-dashed border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/5 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all group scale-100 hover:scale-[1.02]">
                                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                                    <Upload className="w-8 h-8 text-amber-500/60" />
                                </div>
                                <span className="text-sm font-bold text-amber-500/80">上传素胎模型 (STL)</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
                                <button onClick={() => setMode('view')} className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-lg transition-all ${mode === 'view' ? 'bg-stone-700 text-amber-400 shadow-xl' : 'text-white/40 hover:text-white/70'}`}><Eye className="w-4 h-4"/> 鉴赏素胎</button>
                                <button onClick={() => setMode('glaze')} className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-lg transition-all ${mode === 'glaze' ? 'bg-amber-600 text-white shadow-xl' : 'text-white/40 hover:text-white/70'}`}><Droplet className="w-4 h-4"/> 提勺浇釉</button>
                            </div>

                            {mode === 'glaze' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-amber-500/50 uppercase tracking-[2px]">盛唐经典釉色</label>
                                        <div className="flex flex-wrap gap-4">
                                            {GLAZE_COLORS.map(c => (
                                                <button 
                                                    key={c} 
                                                    onClick={() => setActiveColor(c)} 
                                                    className={`w-12 h-12 rounded-full border-4 transition-all duration-300 transform ${activeColor === c ? 'border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'border-black/30 scale-100 hover:scale-105'}`} 
                                                    style={{ backgroundColor: c }} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-5 bg-amber-900/10 border-l-4 border-amber-600 rounded-lg">
                                        <p className="text-[11px] text-amber-400/80 leading-relaxed font-bold italic">
                                            “釉色交融，重力使然。倾倒釉水后，它将自然向下流淌，形成如泪痕般的釉斑。”
                                        </p>
                                    </div>
                                </div>
                            )}

                            <button onClick={handleExport} disabled={isExporting} className="w-full py-5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 font-black text-xs uppercase tracking-[2px] flex justify-center items-center gap-3 transition-all disabled:opacity-50 mt-auto shadow-xl ring-1 ring-white/10 active:scale-95">
                                <Download className="w-4 h-4" /> 
                                {isExporting ? '3D 实体挤出成瓷中...' : '出窑：导出 3MF 实体镶嵌模型'}
                            </button>
                        </>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".stl" className="hidden" />
                </div>
            </div>

            {/* 右侧 3D 窑炉空间：恢复原生 Y-Up 世界，彻底解封交互逻辑 */}
            <div 
                className="flex-1 bg-stone-800 relative"
                style={{ cursor: mode === 'glaze' ? getSpoonCursor(activeColor) : 'auto' }}
            >
                <Canvas camera={{ position: [0, 60, 100], fov: 45 }}>
                    <color attach="background" args={['#292524']} />
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[50, 100, 50]} intensity={1.5} castShadow />
                    <Environment preset="studio" />
                    
                    <OrbitControls 
                        makeDefault 
                        mouseButtons={{
                            LEFT: mode === 'glaze' ? null as any : THREE.MOUSE.ROTATE, 
                            MIDDLE: THREE.MOUSE.DOLLY,
                            RIGHT: THREE.MOUSE.ROTATE
                        }}
                    />

                    {geometry && (
                        <Center>
                            <GlazeMesh geometry={geometry} mode={mode} activeColor={activeColor} />
                        </Center>
                    )}
                    
                    {/* 工业级 XYZ 空间交互罗盘 (迁移至右上角防遮挡) */}
                    <GizmoHelper alignment="top-right" margin={[60, 60]}>
                        <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
                    </GizmoHelper>
                </Canvas>
                <div className="absolute bottom-6 right-6 flex items-center gap-4 bg-black/60 backdrop-blur-md px-5 py-3 rounded-full border border-white/10">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">三彩窑炉</span>
                        <span className="text-[9px] text-white/40 font-mono tracking-tighter italic">High-Performance Vertex Engine v2.0</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
