import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, GizmoHelper, GizmoViewport, Html, Environment } from '@react-three/drei';
import { ArrowLeft, SlidersHorizontal, Download } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// 核心解法：利用 Vite 环境变量自动注入生产环境前缀，杜绝 404
const MODEL_PATH = import.meta.env.BASE_URL + 'models/mask_base.glb';

const CULTURE_MATRIX = [
    { id: 'red', name: '忠勇赤诚', color: '#E62129', desc: '天庭饱满，向外平滑鼓起' },
    { id: 'black', name: '刚烈铁面', color: '#1A1A1A', desc: '眉骨凸出，阶梯状硬边缘' },
    { id: 'white', name: '奸诈阴险', color: '#FFFFFF', desc: '眼眶凹陷，鼻梁骨尖锐' },
    { id: 'yellow', name: '骁勇狂野', color: '#F39800', desc: '肌肉虬结，高频崎岖突刺' },
    { id: 'gold', name: '神魔仙怪', color: '#FFD700', desc: '天眼拉伸，极高金属反光' }
];

const FaceCapModel = ({ sliders }: { sliders: Record<string, number> }) => {
    const [model, setModel] = useState<THREE.Group | null>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);

    useEffect(() => {
        const loader = new GLTFLoader();
        loader.load(MODEL_PATH, (gltf) => {
            gltf.scene.traverse((child: any) => {
                if (child.isMesh) {
                    const mat = new THREE.MeshStandardMaterial({
                        color: '#e7e5e4',
                        roughness: 0.8,
                        side: THREE.DoubleSide
                    });
                    child.material = mat;
                    materialRef.current = mat;
                }
            });
            // 归一化模型的基础缩放和位置，防止中心点偏移
            gltf.scene.scale.set(10, 10, 10);
            gltf.scene.position.set(0, 0, 0);
            setModel(gltf.scene);
        }, undefined, (error) => {
            console.error('[Stargate] 模型加载失败, 检查路径:', MODEL_PATH, error);
        });
    }, []);

    // 肌肉绑定逻辑 (ARKit 工业标准形态键)
    useEffect(() => {
        if (!model) return;
        let faceMesh: any = null;
        model.traverse((child: any) => {
            if (child.isMesh && child.morphTargetDictionary) faceMesh = child;
        });

        if (faceMesh && faceMesh.morphTargetDictionary && faceMesh.morphTargetInfluences) {
            const dict = faceMesh.morphTargetDictionary;
            const inf = faceMesh.morphTargetInfluences;
            const w = sliders;

            // 清理影响值
            inf.fill(0);

            if (dict['cheekPuff'] !== undefined) inf[dict['cheekPuff']] = (w.red/100) * 0.8;
            if (dict['jawOpen'] !== undefined) inf[dict['jawOpen']] = (w.red/100) * 0.2;
            if (dict['browDownLeft'] !== undefined) inf[dict['browDownLeft']] = (w.black/100);
            if (dict['browDownRight'] !== undefined) inf[dict['browDownRight']] = (w.black/100);
            if (dict['jawForward'] !== undefined) inf[dict['jawForward']] = (w.black/100) * 0.5;
            if (dict['noseSneerLeft'] !== undefined) inf[dict['noseSneerLeft']] = (w.white/100);
            if (dict['noseSneerRight'] !== undefined) inf[dict['noseSneerRight']] = (w.white/100);
            if (dict['mouthRollUpper'] !== undefined) inf[dict['mouthRollUpper']] = (w.yellow/100);
            if (dict['mouthRollLower'] !== undefined) inf[dict['mouthRollLower']] = (w.yellow/100);
            if (dict['browInnerUp'] !== undefined) inf[dict['browInnerUp']] = (w.gold/100);
        }

        if (materialRef.current) {
            materialRef.current.metalness = (sliders.gold / 100) * 0.8;
            materialRef.current.roughness = 0.5 - (sliders.gold / 100) * 0.3;
        }
    }, [sliders, model]);

    if (!model) return <Html center><div className="text-stone-300 bg-black/80 px-6 py-4 rounded-2xl whitespace-nowrap shadow-xl">挂载工业级基底网格中...</div></Html>;

    return <primitive object={model} />;
};

export default function QinqiangMaskPlugin({ config: _config }: { config: any }) {
    const [sliders, setSliders] = useState({ red: 0, black: 0, white: 0, yellow: 0, gold: 0 });
    const handleSliderChange = (id: string, value: number) => setSliders(prev => ({ ...prev, [id]: value }));

    return (
        <div className="w-full h-screen flex bg-stone-950 text-white font-sans overflow-hidden">
            <div className="w-[360px] bg-stone-900 border-r border-stone-800 flex flex-col z-10 shrink-0 shadow-2xl">
                <div className="p-6 border-b border-white/5 flex items-center gap-4 shrink-0">
                    <button onClick={() => window.parent.postMessage({ type: 'EXIT_PLUGIN' }, '*')} className="text-white/30 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-400 text-[10px] font-black uppercase">L1-13</span>
                        <h1 className="font-black text-lg tracking-widest text-stone-200 mt-1">秦腔脸谱：性格拓扑</h1>
                    </div>
                </div>

                <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <h3 className="text-stone-300 font-bold text-sm mb-2 flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4" /> 注入文化性格
                        </h3>
                        <p className="text-[11px] text-stone-500 leading-relaxed font-medium">
                            基于 52 组 ARKit 面部形态键，将秦腔各色性格寓意映射到高精度面模的基础解剖结构上。
                        </p>
                    </div>

                    <div className="space-y-6">
                        {CULTURE_MATRIX.map((item) => (
                            <div key={item.id} className="space-y-2 group">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: item.color }} />
                                        <span className="text-sm font-bold text-stone-300 group-hover:text-white transition-colors">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-mono text-stone-500">{sliders[item.id as keyof typeof sliders]}%</span>
                                </div>
                                <input 
                                    type="range" min="0" max="100" value={sliders[item.id as keyof typeof sliders]}
                                    onChange={(e) => handleSliderChange(item.id, parseInt(e.target.value))}
                                    className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-stone-400"
                                />
                                <p className="text-[10px] text-stone-600 font-medium italic">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="p-6 border-t border-white/5">
                    <button onClick={() => window.parent.postMessage({ type: 'EXPORT_3MF_SOLID' }, '*')} className="w-full py-4 rounded bg-white text-stone-900 hover:bg-stone-200 transition-all font-bold text-sm flex justify-center items-center gap-2 shadow-xl ring-1 ring-white/10 group active:scale-95 duration-200">
                        <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" /> 导出立体脸谱
                    </button>
                    <p className="text-[10px] text-stone-600 text-center mt-3 font-mono">INDUSTRIAL BLENDSHAPES | 3MF READY</p>
                </div>
            </div>

            <div className="flex-1 bg-stone-800 relative">
                <Canvas camera={{ fov: 45, position: [0, 0, 150] }}>
                    <color attach="background" args={['#1c1917']} />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[50, 50, 100]} intensity={2} castShadow />
                    <Environment preset="studio" />
                    <OrbitControls makeDefault enablePan={true} target={[0, 0, 0]} maxPolarAngle={Math.PI / 1.5} />
                    <Center top>
                        <FaceCapModel sliders={sliders} />
                    </Center>
                    <GizmoHelper alignment="top-right" margin={[60, 60]}>
                        <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
                    </GizmoHelper>
                </Canvas>
                
                <div className="absolute bottom-6 right-6 flex flex-col items-end pointer-events-none z-20">
                    <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/5 mb-2">
                        <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest leading-none">Industrial Base Mesh V1.0</span>
                    </div>
                    <span className="text-[9px] text-stone-600 font-mono tracking-tighter italic">52-Group Blendshape Dynamics</span>
                </div>
            </div>
        </div>
    );
}
