import React, { useState, useMemo, useRef } from 'react';
import { Canvas as ThreeCanvas } from '@react-three/fiber';
import { OrbitControls, Environment, Center } from '@react-three/drei';
import { Upload, Download, Sparkles } from 'lucide-react';
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';
import { exportTo3MF } from 'three-3mf-exporter';

// 传统薄螺钿幻彩色盘 (夜光蝾螺、鲍鱼壳的青、紫、粉、绿)
const RADEN_COLORS = [
    new THREE.Color('#38bdf8'), // 幻彩天蓝
    new THREE.Color('#c084fc'), // 珍珠紫
    new THREE.Color('#f472b6'), // 樱花粉
    new THREE.Color('#34d399')  // 极光绿
];

// === 1. 第一性原理：3D 空间 Voronoi Shader ===
// 抛弃 UV，直接读取模型顶点的 local position 计算距离场。极低算力消耗！
const VoronoiShaderMaterial = {
    uniforms: {
        uSeeds: { value: Array(500).fill(new THREE.Vector3()) },      // 扩容至 500
        uColors: { value: RADEN_COLORS }, 
        uSeedCount: { value: 0 },   
        uGapWidth: { value: 0.05 }  
    },
    vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal; // 新增：传递法线给片元着色器
        void main() {
            vPosition = position;
            // 将法线转换到视觉坐标系，供光照计算
            vNormal = normalMatrix * normal;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 uSeeds[500]; // 扩容至 500
        uniform vec3 uColors[4];
        uniform int uSeedCount;
        uniform float uGapWidth;
        
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
            if (uSeedCount == 0) {
                gl_FragColor = vec4(0.1, 0.1, 0.1, 1.0);
                return;
            }

            float minDist1 = 99999.0; // 扩大初始极大值防溢出
            float minDist2 = 99999.0;
            int closestIndex = 0;

            // 循环上限同步提升为 500
            for(int i = 0; i < 500; i++) {
                if (i >= uSeedCount) break;
                float dist = distance(vPosition, uSeeds[i]);
                if (dist < minDist1) {
                    minDist2 = minDist1;
                    minDist1 = dist;
                    closestIndex = i;
                } else if (dist < minDist2) {
                    minDist2 = dist;
                }
            }

            float edgeDist = minDist2 - minDist1;

            if (edgeDist < uGapWidth) {
                // 落入缝隙区间：黑漆底
                gl_FragColor = vec4(0.02, 0.02, 0.02, 1.0); 
            } else {
                // 落入螺片区域：幻彩色
                vec3 baseColor = uColors[int(mod(float(closestIndex), 4.0))];
                
                // 核心修复：引入真实的 3D 漫反射光照
                vec3 normal = normalize(vNormal);
                vec3 lightDir = normalize(vec3(1.0, 2.0, 3.0)); // 模拟右上角主光源
                float diff = max(dot(normal, lightDir), 0.0);
                
                // 环境光 0.4 + 漫反射 0.6
                vec3 finalColor = baseColor * (diff * 0.6 + 0.4);
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        }
    `
};

// === 2. 核心渲染组件 ===
const RadenModel = ({ geometry, density, seeds, gapWidth }: { geometry: THREE.BufferGeometry | null, density: number, seeds: THREE.Vector3[], gapWidth: number }) => {
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    useMemo(() => {
        if (!materialRef.current) return;
        materialRef.current.uniforms.uSeeds.value = seeds;
        materialRef.current.uniforms.uSeedCount.value = density;
        materialRef.current.uniforms.uGapWidth.value = gapWidth;
    }, [density, seeds, gapWidth]);

    if (!geometry) return null;

    return (
        <mesh geometry={geometry}>
            <shaderMaterial 
                ref={materialRef}
                attach="material"
                args={[VoronoiShaderMaterial]}
                uniformsNeedUpdate={true}
            />
        </mesh>
    );
};

// === 3. 主控制面板 ===
export default function RadenPlugin() {
    const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
    const [density, setDensity] = useState(300); 
    const [isExporting, setIsExporting] = useState(false);

    // === 核心修正 1：状态提升，同源计算特征点 ===
    const { seeds, gapWidth } = useMemo(() => {
        if (!geometry) return { seeds: Array(500).fill(new THREE.Vector3()), gapWidth: 0.05 };
        
        geometry.computeVertexNormals(); 
        geometry.computeBoundingBox();
        const box = geometry.boundingBox!;
        const size = new THREE.Vector3();
        box.getSize(size);
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const calculatedGap = maxDim * 0.015;
        
        const generatedSeeds = [];
        for (let i = 0; i < 500; i++) {
            generatedSeeds.push(new THREE.Vector3(
                box.min.x + Math.random() * size.x,
                box.min.y + Math.random() * size.y,
                box.min.z + Math.random() * size.z
            ));
        }
        return { seeds: generatedSeeds, gapWidth: calculatedGap };
    }, [geometry]);

    // === 终极物理学：3MF 实体嵌体挤出引擎 ===
    const handleExport3MF = async () => {
        if (!geometry || seeds.length === 0) return;
        setIsExporting(true);
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            // 确保每个三角面独立
            const exportGeo = geometry.index ? geometry.toNonIndexed() : geometry.clone();
            const posAttr = exportGeo.attributes.position;

            // 我们只需要 4 个幻彩色的实体缓存池。黑漆缝隙由原胎体自身提供
            const radenHexes = RADEN_COLORS.map(c => '#' + c.getHexString());
            const colorBuffers: Record<string, number[]> = {};
            radenHexes.forEach(hex => colorBuffers[hex] = []);

            const v0 = new THREE.Vector3();
            const v1 = new THREE.Vector3();
            const v2 = new THREE.Vector3();

            // 物理制造参数：向外凸起 0.6mm 形成实体螺片，向内嵌入 0.2mm 确保与底座完美咬合
            const extOut = 0.6;
            const extIn = -0.2;

            for (let i = 0; i < posAttr.count; i += 3) {
                v0.fromBufferAttribute(posAttr, i);
                v1.fromBufferAttribute(posAttr, i+1);
                v2.fromBufferAttribute(posAttr, i+2);

                // 核心优化：使用三角形中心点计算距离，比使用单顶点更精准
                const center = new THREE.Vector3().addVectors(v0, v1).add(v2).divideScalar(3);

                let minDist1 = 99999.0;
                let minDist2 = 99999.0;
                let closestIdx = 0;

                for (let j = 0; j < density; j++) {
                    const dist = center.distanceTo(seeds[j]);
                    if (dist < minDist1) {
                        minDist2 = minDist1;
                        minDist1 = dist;
                        closestIdx = j;
                    } else if (dist < minDist2) {
                        minDist2 = dist;
                    }
                }

                // 如果是黑漆缝隙，跳过挤出（直接露出底座的黑色）
                if ((minDist2 - minDist1) < gapWidth) continue;

                const targetHex = radenHexes[closestIdx % 4];

                // 计算真实面法线，用于向外挤出
                const cb = new THREE.Vector3().subVectors(v2, v1);
                const ab = new THREE.Vector3().subVectors(v0, v1);
                const normal = new THREE.Vector3().crossVectors(cb, ab);
                if (normal.lengthSq() < 0.000001) continue; // 剔除面积为 0 的坏面
                normal.normalize();

                const offsetTop = normal.clone().multiplyScalar(extOut);
                const offsetBot = normal.clone().multiplyScalar(extIn);

                // 顶面顶点
                const v0t = v0.clone().add(offsetTop);
                const v1t = v1.clone().add(offsetTop);
                const v2t = v2.clone().add(offsetTop);
                // 底面顶点
                const v0b = v0.clone().add(offsetBot);
                const v1b = v1.clone().add(offsetBot);
                const v2b = v2.clone().add(offsetBot);

                const pushTri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
                    colorBuffers[targetHex].push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
                };

                // === 闭合实体魔法：将 1 个面膨胀为 1 块三棱柱积木 (8个面) ===
                pushTri(v0t, v1t, v2t); // 顶面 (朝外)
                pushTri(v0b, v2b, v1b); // 底面 (朝内，顶点顺序反转以法线朝外)
                // 侧围 1
                pushTri(v0t, v0b, v1b); pushTri(v0t, v1b, v1t);
                // 侧围 2
                pushTri(v1t, v1b, v2b); pushTri(v1t, v2b, v2t);
                // 侧围 3
                pushTri(v2t, v2b, v0b); pushTri(v2t, v0b, v0t);
            }

            const printGroup = new THREE.Group();

            // 1. 底座护航：将完整的原素模作为纯黑大漆底座加入
            const baseMat = new THREE.MeshStandardMaterial({ color: '#050505', roughness: 0.8 });
            const baseMesh = new THREE.Mesh(exportGeo, baseMat);
            printGroup.add(baseMesh);

            // 2. 实体拼装：将挤出成型的彩色物理实体积木挂载
            for (const hex of radenHexes) {
                const positions = colorBuffers[hex];
                if (positions.length === 0) continue;

                const partGeom = new THREE.BufferGeometry();
                partGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                partGeom.computeVertexNormals(); // 重算法线保障实体完美闭合

                const partMat = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.2 });
                const partMesh = new THREE.Mesh(partGeom, partMat);
                printGroup.add(partMesh);
            }

            const blob = await exportTo3MF(printGroup, { printer_name: 'Bambu Lab AMS' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Raden_Craft_Solid_Inlay_${Date.now()}.3mf`;
            link.click();

        } catch (error) {
            console.error('3MF 挤出实体导出失败:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const contents = event.target?.result as ArrayBuffer;
            const loader = new STLLoader();
            const geo = loader.parse(contents);
            geo.center(); // 自动居中
            setGeometry(geo);
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="w-full h-screen flex bg-neutral-950 text-white font-sans overflow-hidden">
            {/* 左侧控制台 */}
            <div className="w-[320px] bg-neutral-900 border-r border-white/10 flex flex-col z-10 shrink-0 shadow-2xl">
                <div className="p-6 border-b border-white/10">
                    <span className="px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 text-[10px] font-black uppercase tracking-widest">L1-15</span>
                    <h1 className="font-black text-lg tracking-widest text-neutral-200 mt-1 uppercase">碎拼螺钿工艺</h1>
                </div>

                <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                    {/* 上传模组 */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-white/50 tracking-widest uppercase">1. 引入胎体 (STL)</label>
                        <div className="relative">
                            <input type="file" accept=".stl" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className="w-full py-10 rounded-xl border-2 border-dashed border-white/10 bg-black/40 flex flex-col items-center justify-center gap-3 group hover:border-purple-500/50 hover:bg-black/60 transition-all duration-300">
                                <div className="p-3 rounded-full bg-white/5 group-hover:bg-purple-500/20 transition-colors">
                                    <Upload className="w-6 h-6 text-white/30 group-hover:text-purple-400.transition-colors" />
                                </div>
                                <span className="text-xs font-bold text-white/40 group-hover:text-purple-300 tracking-wider">点击或拖拽上传素模</span>
                            </div>
                        </div>
                    </div>

                    {/* 镶嵌密度滑块 */}
                    {geometry && (
                        <div className="space-y-5 p-4 rounded-xl bg-black/30 border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <label className="text-xs font-bold text-white/50 flex justify-between tracking-widest uppercase">
                                <span>2. 螺片镶嵌密度</span>
                                <span className="text-purple-400 font-mono">{density} CP</span>
                            </label>
                            <input 
                                type="range" min="10" max="500" step="1" 
                                value={density} 
                                onChange={(e) => setDensity(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                            <p className="text-[10px] text-white/30 leading-relaxed italic">
                                系统正在 3D 欧几里得空间内实时解构高达 500 个特征点，模拟极致繁复的非遗冰裂纹路。
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-6 mt-auto">
                    <button 
                        onClick={handleExport3MF}
                        disabled={isExporting || !geometry}
                        className="w-full py-4 rounded-xl bg-purple-700 hover:bg-purple-600 transition-colors font-black text-[10px] tracking-widest uppercase text-white flex justify-center items-center gap-2 shadow-xl ring-1 ring-white/10 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <Download className="w-4 h-4" /> 
                        {isExporting ? '3D 实体挤出重组中...' : '导出 3MF 实体镶嵌模型'}
                    </button>
                    <p className="text-center text-[9px] text-white/20 mt-4 font-bold tracking-tighter uppercase">Physical Splicing Engine v1.0</p>
                </div>
            </div>

            {/* 右侧 3D 视口 */}
            <div className="flex-1 relative bg-[#050505] cursor-move">
                <ThreeCanvas camera={{ position: [0, 0, 150], fov: 45 }}>
                    <color attach="background" args={['#050505']} />
                    <ambientLight intensity={1.5} />
                    <directionalLight position={[50, 100, 100]} intensity={2.5} />
                    <spotLight position={[-50, 50, 50]} angle={0.15} penumbra={1} intensity={1} />
                    <Environment preset="studio" />
                    
                    <OrbitControls 
                        makeDefault 
                        enableDamping={true}
                        dampingFactor={0.05}
                        enablePan={false}
                        minDistance={50}
                        maxDistance={500}
                    />
                    
                    <Center>
                        {geometry ? (
                            <RadenModel geometry={geometry} density={density} seeds={seeds} gapWidth={gapWidth} />
                        ) : (
                            <mesh scale={[1,1,1]}>
                                <boxGeometry args={[40, 40, 40]} />
                                <meshStandardMaterial color="#222222" wireframe opacity={0.2} transparent />
                            </mesh>
                        )}
                    </Center>
                </ThreeCanvas>

                {/* 引导装饰 UI */}
                {!geometry && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center space-y-4 opacity-20">
                            <Sparkles className="w-12 h-12 mx-auto text-white" />
                            <p className="text-xs font-black tracking-[0.5em] uppercase text-white">等待胎体装载</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
