import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, GizmoHelper, GizmoViewport, Html, Environment } from '@react-three/drei';
import { ArrowLeft, SlidersHorizontal, Download } from 'lucide-react';
import * as THREE from 'three';
// 只引入最核心、最原始的 GLTFLoader，抛弃所有关于解码的冗余
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { exportTo3MF } from 'three-3mf-exporter';

const CULTURE_MATRIX = [
    { id: 'red', name: '忠勇赤诚', color: '#E62129', desc: '天庭饱满，向外平滑鼓起' },
    { id: 'black', name: '刚烈铁面', color: '#1A1A1A', desc: '眉骨凸出，阶梯状硬边缘' },
    { id: 'white', name: '奸诈阴险', color: '#FFFFFF', desc: '眼眶凹陷，鼻梁骨尖锐' },
    { id: 'yellow', name: '骁勇狂野', color: '#F39800', desc: '肌肉虬结，高频崎岖突刺' },
    { id: 'gold', name: '神魔仙怪', color: '#FFD700', desc: '天眼拉伸，极高金属反光' }
];

const FaceCapModel = ({ sliders }: { sliders: Record<string, number> }) => {
    const [model, setModel] = useState<THREE.Group | null>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);

    // 纯手动加载：指向已经物理脱壳解压后的 RAW 文件，彻底解决解码报错
    useEffect(() => {
        const loader = new GLTFLoader();
        loader.load('models/FaceCap_raw.glb', (gltf) => {
            gltf.scene.traverse((child: THREE.Object3D) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh;
                    mesh.material = new THREE.MeshStandardMaterial({
                        color: '#e7e5e4',
                        roughness: 0.8,
                        side: THREE.DoubleSide
                    });
                    // @ts-ignore
                    materialRef.current = mesh.material;
                }
            });
            setModel(gltf.scene);
        });
    }, []);

    // 肌肉绑定逻辑 (保持稳定)
    useEffect(() => {
        if (!model) return;
        let faceMesh: THREE.Mesh | null = null;
        model.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh && (child as any).morphTargetDictionary) {
                faceMesh = child as THREE.Mesh;
            }
        });

        if (faceMesh && (faceMesh as any).morphTargetDictionary && (faceMesh as any).morphTargetInfluences) {
            const dict = (faceMesh as any).morphTargetDictionary;
            const inf = (faceMesh as any).morphTargetInfluences;
            const w = sliders;

            if (dict['cheekPuff'] !== undefined) inf[dict['cheekPuff']] = (w.red/100) * 0.8;
            if (dict['jawOpen'] !== undefined) inf[dict['jawOpen']] = (w.red/100) * 0.2;
            if (dict['browDownLeft'] !== undefined) inf[dict['browDownLeft']] = (w.black/100);
            if (dict['browDownRight'] !== undefined) inf[dict['browDownRight']] = (w.black/100);
            if (dict['jawForward'] !== undefined) inf[dict['jawForward']] = (w.black/100) * 0.5;
            if (dict['noseSneerLeft'] !== undefined) inf[dict['noseSneerLeft']] = (w.white/100);
            if (dict['noseSneerRight'] !== undefined) inf[dict['noseSneerRight']] = (w.white/100);
            if (dict['eyeSquintLeft'] !== undefined) inf[dict['eyeSquintLeft']] = (w.white/100);
            if (dict['eyeSquintRight'] !== undefined) inf[dict['eyeSquintRight']] = (w.white/100);
            if (dict['mouthRollUpper'] !== undefined) inf[dict['mouthRollUpper']] = (w.yellow/100);
            if (dict['mouthRollLower'] !== undefined) inf[dict['mouthRollLower']] = (w.yellow/100);
            if (dict['browInnerUp'] !== undefined) inf[dict['browInnerUp']] = (w.gold/100);
        }

        if (materialRef.current) {
            materialRef.current.metalness = (sliders.gold / 100) * 0.8;
            materialRef.current.roughness = 0.5 - (sliders.gold / 100) * 0.3;
        }
    }, [sliders, model]);

    if (!model) return <Html center><div className="text-stone-300 bg-stone-900/80 px-8 py-6 rounded-3xl border border-white/10 whitespace-nowrap shadow-2xl flex flex-col items-center gap-4 backdrop-blur-xl animate-pulse uppercase tracking-widest text-[10px] font-bold">同步圣门原始拓扑...</div></Html>;

    return <primitive object={model} scale={20} />;
};

export default function QinqiangMaskPlugin({ config: _config }: { config: any }) {
    const [sliders, setSliders] = useState({ red: 0, black: 0, white: 0, yellow: 0, gold: 0 });
    const sceneRef = useRef<THREE.Group>(null);
    const [exporting, setExporting] = useState(false);

    const handleSliderChange = (id: string, value: number) => setSliders(prev => ({ ...prev, [id]: value }));

    const handleExport3MF = async () => {
        if (!sceneRef.current) return;
        setExporting(true);
        try {
            const blob = await exportTo3MF(sceneRef.current);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `qinqiang_mask_${new Date().getTime()}.3mf`;
            link.click();
            URL.revokeObjectURL(url);
            setExporting(false);
        } catch (error) {
            console.error('Export failed:', error);
            setExporting(false);
        }
    };

    return (
        <div className="w-full h-screen flex bg-stone-950 text-white font-sans overflow-hidden">
            {/* 左侧 UI 控制台 */}
            <div className="w-[360px] bg-stone-900 border-r border-stone-800 flex flex-col z-10 shrink-0 shadow-[20px_0_50px_-20px_rgba(0,0,0,0.5)]">
                <div className="p-8 border-b border-white/5 flex items-center gap-5 shrink-0">
                    <button onClick={() => window.parent.postMessage({ type: 'EXIT_PLUGIN' }, '*')} className="text-white/20 hover:text-white transition-all transform hover:-translate-x-1">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-500 text-[9px] font-black uppercase tracking-[0.2em] border border-white/5">Course L1-13</span>
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
                        </div>
                        <h1 className="font-black text-xl tracking-tighter text-stone-100 uppercase">秦腔：性格拓扑机</h1>
                    </div>
                </div>

                <div className="p-8 space-y-10 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-5 bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/10 shadow-inner">
                        <h3 className="text-stone-200 font-black text-xs mb-3 flex items-center gap-2 uppercase tracking-widest">
                            <SlidersHorizontal className="w-4 h-4 text-stone-500" /> 注入文化性格
                        </h3>
                        <p className="text-[11px] text-stone-500 leading-relaxed font-bold italic opacity-80">
                            "RAW 版面心拓拔器"：已脱离 Meshopt 依赖，支持全平台高性能呈现。
                        </p>
                    </div>

                    <div className="space-y-8">
                        {CULTURE_MATRIX.map((item) => (
                            <div key={item.id} className="space-y-4 group">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full shadow-inner border border-white/10" style={{ backgroundColor: item.color }} />
                                        <span className="text-sm font-black text-stone-400 group-hover:text-stone-100 transition-colors uppercase tracking-tight">{item.name}</span>
                                    </div>
                                    <div className="px-2 py-1 bg-stone-800 rounded font-mono text-[10px] text-stone-300 border border-white/5">{sliders[item.id as keyof typeof sliders]}%</div>
                                </div>
                                <input 
                                    type="range" min="0" max="100" value={sliders[item.id as keyof typeof sliders]}
                                    onChange={(e) => handleSliderChange(item.id, parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-stone-800 rounded-full appearance-none cursor-pointer accent-stone-300 hover:accent-white transition-all outline-none border border-white/5"
                                />
                                <p className="text-[10px] text-stone-600 font-bold uppercase tracking-widest leading-none opacity-50">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="p-8 border-t border-white/5 bg-stone-900/80 backdrop-blur-3xl shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.5)]">
                    <button 
                        onClick={handleExport3MF}
                        disabled={exporting}
                        className="w-full py-5 rounded-2xl bg-white text-stone-950 hover:bg-stone-200 disabled:bg-stone-800 disabled:text-stone-600 font-black text-xs uppercase tracking-widest flex justify-center items-center gap-3 shadow-[0_10px_30px_-10px_rgba(255,255,255,0.3)] transition-all active:scale-[0.98] group"
                    >
                        {exporting ? (
                            <div className="w-4 h-4 border-3 border-stone-800/20 border-t-stone-800 rounded-full animate-spin" />
                        ) : (
                            <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                        )}
                        {exporting ? 'RAW 实体脸模计算中...' : '导出 3MF 立体脸谱'}
                    </button>
                </div>
            </div>

            {/* 右侧 3D 视口 */}
            <div className="flex-1 bg-stone-950 relative">
                <Canvas camera={{ fov: 45 }}>
                    <color attach="background" args={['#0c0a09']} />
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} intensity={1} castShadow />
                    <Environment preset="studio" />
                    <OrbitControls makeDefault enablePan={true} maxPolarAngle={Math.PI / 1.5} />
                    <Center top>
                        <group ref={sceneRef}>
                            <FaceCapModel sliders={sliders} />
                        </group>
                    </Center>
                    <GizmoHelper alignment="top-right" margin={[80, 80]}>
                        <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
                    </GizmoHelper>
                </Canvas>
                
                {/* 状态看板 */}
                <div className="absolute top-8 right-8 pointer-events-none z-20 flex flex-col items-end gap-2 opacity-40">
                    <div className="px-4 py-1 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
                        <span className="text-[10px] font-black text-stone-300 uppercase tracking-[0.3em]">FaceCap RAW Engine</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
