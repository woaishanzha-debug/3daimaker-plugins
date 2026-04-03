import { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Center } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowLeft, Plus, Trash2, Hammer } from 'lucide-react';
import { STLExporter } from 'three-stdlib';

// ==========================================
// 核心 3D 组件：单层灯笼骨架 (LanternSegment)
// ==========================================
const LanternSegment = ({ radius, height, boneCount, startY }: any) => {
    const ribs = useMemo(() => {
        const generatedRibs = [];
        // 定义骨架曲线：起点在底部中心，控制点向外凸出，终点在顶部中心
        const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(0, startY, 0),
            new THREE.Vector3(radius, startY + height / 2, 0),
            new THREE.Vector3(0, startY + height, 0)
        );
        // TubeGeometry 参数：(路径, 分段数, 半径/粗细, 径向分段, 是否闭合)
        const geometry = new THREE.TubeGeometry(curve, 32, 0.1, 8, false); 
        
        for (let i = 0; i < boneCount; i++) {
            const angle = (Math.PI * 2 / boneCount) * i;
            generatedRibs.push(
                <mesh key={i} geometry={geometry} rotation={[0, angle, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color="#8b4513" roughness={0.6} metalness={0.2} />
                </mesh>
            );
        }
        return generatedRibs;
    }, [radius, height, boneCount, startY]);

    return <group>{ribs}</group>;
};

// ==========================================
// 核心插件出口 UI 与外层包裹
// ==========================================
export default function Plugin({ config: _config }: { config: any }) {
    // 状态树：保存所有层级的参数
    const [segments, setSegments] = useState([
        { id: Date.now(), radius: 4, height: 6, boneCount: 16 }
    ]);

    const addSegment = () => {
        setSegments([...segments, { id: Date.now(), radius: 2.5, height: 4, boneCount: 12 }]);
    };

    const updateSegment = (id: number, key: string, value: number) => {
        setSegments(segments.map(s => s.id === id ? { ...s, [key]: value } : s));
    };

    const removeSegment = (id: number) => {
        if (segments.length > 1) setSegments(segments.filter(s => s.id !== id));
    };

    const handleExportSTL = () => {
        const exporter = new STLExporter();
        const scene = new THREE.Scene();
        
        // 动态构建导出场景
        segments.forEach((seg, index) => {
            const startY = segments.slice(0, index).reduce((sum, s) => sum + s.height, 0);
            const curve = new THREE.QuadraticBezierCurve3(
                new THREE.Vector3(0, startY, 0),
                new THREE.Vector3(seg.radius, startY + seg.height / 2, 0),
                new THREE.Vector3(0, startY + seg.height, 0)
            );
            const geometry = new THREE.TubeGeometry(curve, 32, 0.1, 8, false);
            
            for (let i = 0; i < seg.boneCount; i++) {
                const angle = (Math.PI * 2 / seg.boneCount) * i;
                const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
                mesh.rotation.y = angle;
                mesh.updateMatrixWorld();
                scene.add(mesh);
            }
        });

        const stlString = exporter.parse(scene);
        const blob = new Blob([stlString], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lantern_skeleton_${Date.now()}.stl`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full h-screen bg-[#020617] text-white flex overflow-hidden font-sans">
            {/* 左侧：参数化控制台 */}
            <div className="w-96 bg-slate-900 border-r border-white/10 flex flex-col z-10 shadow-2xl relative">
                <div className="p-6 border-b border-white/10 flex items-center gap-4">
                    <button onClick={() => window.parent.postMessage({ type: 'EXIT_PLUGIN' }, '*')} className="text-white/40 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-orange-600/20 text-orange-500 text-[10px] font-black uppercase tracking-tighter">L1-03</span>
                        <h1 className="font-black text-sm italic tracking-widest uppercase">参数化扎骨实验室</h1>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                             结构层级控制
                        </p>
                        {segments.map((seg, index) => (
                            <div key={seg.id} className="group bg-white/5 p-5 rounded-3xl border border-white/5 space-y-5 hover:border-orange-500/30 transition-all">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black italic text-white/30 uppercase tracking-tighter">Level 0{index + 1}</span>
                                    {segments.length > 1 && (
                                        <button onClick={() => removeSegment(seg.id)} className="text-red-400/40 hover:text-red-400 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">骨架步长</label>
                                        <span className="text-xs font-black italic text-orange-400">{seg.boneCount} Units</span>
                                    </div>
                                    <input type="range" min="4" max="32" step="1" value={seg.boneCount} onChange={(e) => updateSegment(seg.id, 'boneCount', Number(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">曲率半径</label>
                                        <span className="text-xs font-black italic text-orange-400">R {seg.radius}</span>
                                    </div>
                                    <input type="range" min="1" max="10" step="0.5" value={seg.radius} onChange={(e) => updateSegment(seg.id, 'radius', Number(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">结构高度</label>
                                        <span className="text-xs font-black italic text-orange-400">H {seg.height}</span>
                                    </div>
                                    <input type="range" min="2" max="15" step="0.5" value={seg.height} onChange={(e) => updateSegment(seg.id, 'height', Number(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <button onClick={addSegment} className="w-full py-5 bg-orange-600/10 text-orange-500 border border-orange-500/20 rounded-3xl font-black text-xs flex justify-center items-center gap-3 hover:bg-orange-600 hover:text-white transition-all group">
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> 叠加层级结构 (STALKING)
                    </button>
                </div>

                <div className="p-6 bg-black/40 backdrop-blur-xl border-t border-white/5">
                    <button onClick={handleExportSTL} className="w-full py-4 bg-white text-black rounded-2xl font-black italic text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5">
                        <Hammer className="w-4 h-4" /> 导出扎骨模型 (STL)
                    </button>
                </div>
            </div>

            {/* 右侧：实时 3D 渲染区 */}
            <div className="flex-1 relative bg-[radial-gradient(circle_at_50%_50%,_#1e293b_0%,_#020617_100%)]">
                <div className="absolute top-8 right-8 z-20 flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black italic text-orange-500 uppercase tracking-tighter">Real-time Rendering</span>
                    <h2 className="text-2xl font-black italic text-white uppercase tracking-widest leading-none">Skeleton Preview</h2>
                </div>

                <Canvas camera={{ position: [0, 10, 25], fov: 40 }}>
                    <OrbitControls makeDefault minDistance={5} maxDistance={100} />
                    <ambientLight intensity={0.4} />
                    <pointLight position={[10, 10, 10]} intensity={1.5} color="#fbbf24" />
                    <Environment preset="night" />
                    
                    <Center top>
                        <group>
                            {/* 动态计算并渲染每一层，累加 Y 轴高度 */}
                            {segments.map((seg, index) => {
                                const startY = segments.slice(0, index).reduce((sum, s) => sum + s.height, 0);
                                return <LanternSegment key={seg.id} {...seg} startY={startY} />;
                            })}
                        </group>
                    </Center>
                    <ContactShadows position={[0, -0.1, 0]} opacity={0.6} scale={40} blur={3} far={10} color="#000" />
                </Canvas>

                {/* 装饰线条 */}
                <div className="absolute bottom-12 right-12 flex gap-4 opacity-10">
                   <div className="w-32 h-[1px] bg-white" />
                   <div className="w-12 h-[1px] bg-white" />
                </div>
            </div>
        </div>
    );
}
