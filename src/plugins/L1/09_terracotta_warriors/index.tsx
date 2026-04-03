import { useState, useEffect, Suspense, useRef } from 'react';
import { ArrowLeft, ChevronRight, Hammer, ShieldAlert } from 'lucide-react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, ContactShadows, DragControls } from '@react-three/drei';
import * as THREE from 'three';
import { STLExporter } from 'three-stdlib';

// ==========================================
// 核心 3D 场景组件 (必须被包裹在 Canvas 内部)
// ==========================================
function TerracottaScene({ onComplete, exportRef }: { onComplete: () => void, exportRef: React.MutableRefObject<any> }) {
    const MODEL_URL = `${import.meta.env.BASE_URL}models/terracotta_broken.glb`;
    const { scene, nodes } = useGLTF(MODEL_URL) as any;
    const { camera } = useThree();
    
    const [isDragging, setIsDragging] = useState(false);
    const [modelDim, setModelDim] = useState(10); // 用于适配阴影平面和相机裁剪
    const snapThreshold = useRef(0.8);
    const pieceRefs = useRef<{ [key: string]: THREE.Mesh }>({});
    const [pieces, setPieces] = useState<any[]>([]);

    // 每次渲染都保持最新引用的导出函数，使用 Ref 直连突破 React 闭包限制
    exportRef.current = () => {
        const exporter = new STLExporter();
        const group = new THREE.Group();
        
        pieces.forEach((p: any) => {
            const currentMesh = pieceRefs.current[p.id];
            if (currentMesh) {
                const clone = currentMesh.clone();
                
                // 【核心修复】：强行提取网格在三维世界中的绝对状态，覆盖其本地状态
                currentMesh.getWorldPosition(clone.position);
                currentMesh.getWorldQuaternion(clone.quaternion);
                currentMesh.getWorldScale(clone.scale);
                
                // 清除可能残留的父级矩阵干扰
                clone.updateMatrixWorld(true);
                group.add(clone);
            }
        });

        const stlString = exporter.parse(group);
        const blob = new Blob([stlString], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `terracotta_status_${Date.now()}.stl`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
    };

    // 初始化散落算法 (自适应相机范式)
    useEffect(() => {
        if (!scene || !nodes) return;
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        setModelDim(maxDim);
        snapThreshold.current = maxDim * 0.06; // 动态吸附阈值

        // 不改模型缩放，而是动态拉远相机的物理距离与裁剪平面
        camera.position.set(0, 0, maxDim * 1.5);
        camera.far = maxDim * 10;
        camera.updateProjectionMatrix();

        const meshes = Object.values(nodes).filter((n: any) => n.isMesh);
        const initialPieces = meshes.map((node: any) => ({
            id: node.uuid,
            node: node,
            isSnapped: false,
            initialPos: new THREE.Vector3(
                (Math.random() - 0.5) * maxDim * 1.2, 
                (Math.random() - 0.5) * maxDim * 0.8, 
                0 
            )
        }));
        setPieces(initialPieces);
    }, [scene, nodes, camera]);

    // 初始化物理坐标注入
    useEffect(() => {
        pieces.forEach(p => {
            const mesh = pieceRefs.current[p.id];
            if (mesh && !p.isSnapped && mesh.position.length() === 0) {
                mesh.position.copy(p.initialPos);
            }
        });
    }, [pieces]);

    const handleDragStart = () => {
        setIsDragging(true);
        document.body.style.cursor = 'grabbing';
    };

    const handleDragEnd = (pieceId: string) => {
        setIsDragging(false);
        document.body.style.cursor = 'auto';

        const mesh = pieceRefs.current[pieceId];
        if (mesh) {
            const dist = mesh.position.distanceTo(new THREE.Vector3(0, 0, 0));
            if (dist < snapThreshold.current) {
                mesh.position.set(0, 0, 0); 
                (mesh.material as THREE.MeshStandardMaterial).emissive = new THREE.Color("#d4af37");
                (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2;

                setPieces(prev => {
                    const next = prev.map(p => p.id === pieceId ? { ...p, isSnapped: true } : p);
                    if (next.every(p => p.isSnapped)) {
                        setTimeout(onComplete, 1000);
                    }
                    return next;
                });
            }
        }
    };

    return (
        <>
            <OrbitControls enabled={!isDragging} makeDefault />
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
            <Environment preset="city" />
            
            <group>
                {pieces.map(p => (
                    <DragControls 
                        key={p.id}
                        onDragStart={handleDragStart}
                        onDragEnd={() => handleDragEnd(p.id)}
                    >
                        <mesh 
                            ref={(el) => { if (el) pieceRefs.current[p.id] = el; }}
                            geometry={p.node.geometry} 
                            material={p.node.material.clone()}
                            onPointerOver={() => {
                                if (!p.isSnapped && !isDragging) document.body.style.cursor = 'grab';
                            }}
                            onPointerOut={() => {
                                if (!isDragging) document.body.style.cursor = 'auto';
                            }}
                            castShadow receiveShadow
                        />
                    </DragControls>
                ))}
            </group>
            
            <ContactShadows position={[0, -modelDim * 0.5, 0]} opacity={0.4} scale={modelDim * 2} blur={2} far={modelDim} />
        </>
    );
}

// ==========================================
// 核心插件出口 UI 与外层包裹
// ==========================================
export default function Plugin({ config }: { config: any }) {
    const [step, setStep] = useState(0);
    const exportRef = useRef<any>(null);

    return (
        <div className="w-full h-screen overflow-y-auto bg-[#020617] text-white selection:bg-orange-500/30 font-sans">
            <div className="fixed top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-8">
                <div className="flex items-center gap-6">
                    <button onClick={() => window.parent.postMessage({ type: 'EXIT_PLUGIN' }, '*')} className="text-white/40 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-orange-600/20 text-orange-500 text-[10px] font-black uppercase tracking-tighter">L1-09</span>
                        <h1 className="font-black text-sm italic tracking-widest uppercase">秦俑之光：数字修复实验</h1>
                    </div>
                </div>
            </div>

            <div className="pt-24 pb-12 px-6 max-w-[1400px] mx-auto min-h-[calc(100vh-4rem)] flex flex-col">
                {step === 0 && (
                    <div className="flex-1 relative rounded-[48px] overflow-hidden bg-slate-900 border border-white/5 shadow-2xl flex flex-col p-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-transparent to-stone-800/20 opacity-30" />
                        <div className="relative z-10 flex-1 flex flex-col justify-center gap-8">
                            <h2 className="text-5xl md:text-6xl font-black italic leading-[1.2]">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200">文明碎片的重构：</span><br />
                                秦俑之光
                            </h2>
                            <p className="text-xl text-orange-100/60 max-w-2xl leading-relaxed font-light">
                                沉睡千年的地下军团，出土时往往化为齑粉。进入 3D 修复空间，利用拓扑吸附算法，将破碎的兵马俑重新拼合，唤醒大秦帝国的荣耀。
                            </p>
                            <button onClick={() => setStep(1)} className="w-fit px-12 py-5 bg-white text-black rounded-3xl font-black italic hover:scale-105 transition-transform flex items-center gap-3 shadow-2xl">
                                开启 3D 修复引擎 <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="flex-1 rounded-[48px] overflow-hidden shadow-2xl border border-white/5 bg-slate-900 flex flex-col relative animate-in fade-in zoom-in-95 duration-500 min-h-[600px]">
                        <div className="absolute top-8 left-8 z-30 flex items-center gap-3 bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                            <ShieldAlert className="w-5 h-5 text-orange-400" />
                            <span className="text-xs font-black text-orange-100 tracking-widest">请拖拽悬浮碎块至正确坐标进行吸附</span>
                        </div>
                        
                        <div className="absolute top-8 right-8 z-30">
                            <button 
                                onClick={() => exportRef.current && exportRef.current()} 
                                className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl font-black text-xs text-white hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2"
                            >
                                <Hammer size={16} /> 导出当前修复进度 (STL)
                            </button>
                        </div>

                        <div className="absolute inset-0 w-full h-full z-10">
                            <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-orange-500 font-bold animate-pulse">正在载入高精度文物数据...</div>}>
                                <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
                                    <TerracottaScene 
                                        onComplete={() => setStep(2)} 
                                        exportRef={exportRef}
                                    />
                                </Canvas>
                            </Suspense>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="flex-1 rounded-[48px] bg-slate-900 border border-white/5 flex flex-col items-center justify-center p-20 text-center gap-10 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 min-h-[600px]">
                        <div className="w-32 h-32 bg-orange-500 rounded-[40px] flex items-center justify-center shadow-[0_0_80px_rgba(249,115,22,0.4)] relative z-10">
                            <Hammer className="w-16 h-16 text-white" />
                        </div>
                        <div className="space-y-4 relative z-10">
                            <h2 className="text-6xl font-black italic tracking-tighter text-white">RESTORATION COMPLETE</h2>
                            <p className="text-orange-200/60 font-medium max-w-lg mx-auto leading-relaxed">
                                完美吸附！数字空间中的修复已完成，文物的形体坐标已锁定。接下来请移步创客空间，开始实体 3D 打印！
                            </p>
                        </div>
                        <div className="flex gap-4 relative z-10">
                            <button onClick={() => exportRef.current && exportRef.current()} className="px-8 py-4 bg-white/5 rounded-2xl font-black text-sm text-white/80 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2 border border-white/10">
                                <Hammer size={18} /> 一键导出修复版 STL
                            </button>
                            <button onClick={() => window.parent.postMessage({ type: 'LESSON_COMPLETE', slug: config?.slug, nextLesson: 'l1_10_calligraphy' }, '*')} className="px-10 py-4 bg-orange-600 rounded-2xl font-black text-sm text-white shadow-xl hover:bg-orange-500 transition-all">
                                提交数据并进入下一关卡 <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
