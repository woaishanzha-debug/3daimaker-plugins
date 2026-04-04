import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Center, GizmoHelper, GizmoViewport, useGLTF } from '@react-three/drei';
import { ArrowLeft, SlidersHorizontal, Download } from 'lucide-react';
import * as THREE from 'three';
import { MeshoptDecoder } from 'three-stdlib';
import { exportTo3MF } from 'three-3mf-exporter';

// 文化拓扑矩阵定义
const CULTURE_MATRIX = [
    { id: 'red', name: '忠勇赤诚', color: '#E62129', desc: '天庭饱满，向外平滑鼓起' },
    { id: 'black', name: '刚烈铁面', color: '#1A1A1A', desc: '眉骨凸出，阶梯状硬边缘' },
    { id: 'white', name: '奸诈阴险', color: '#FFFFFF', desc: '眼眶凹陷，鼻梁骨尖锐' },
    { id: 'yellow', name: '骁勇狂野', color: '#F39800', desc: '肌肉虬结，高频崎岖突刺' },
    { id: 'gold', name: '神魔仙怪', color: '#FFD700', desc: '天眼拉伸，极高金属反光' }
];

// 核心修复：去除开头的 /，确保在 GitHub Pages 子目录下能正确寻址
const LOCAL_MODEL_PATH = 'models/FaceCap.glb';

// === 强悍的 ARKit 面部肌肉映射引擎 ===
const FaceCapModel = ({ sliders }: { sliders: Record<string, number> }) => {
    // 强制指定本地路径，并注入 MeshoptDecoder 解决压缩报错
    const gltf = useGLTF(LOCAL_MODEL_PATH, true, true, (loader) => {
        loader.setMeshoptDecoder(MeshoptDecoder);
    });

    const materialRef = useRef<THREE.MeshStandardMaterial>(null);
    
    // ... 保持后续 useEffect 逻辑不变 ...
    // 监听滑块并同步面部肌肉形变
    useEffect(() => {
        let faceMesh: THREE.Mesh | null = null;
        
        // 安全遍历：自动寻找带有形态键的面部 Mesh
        gltf.scene.traverse((child: any) => {
            if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).morphTargetDictionary) {
                faceMesh = child as THREE.Mesh;
            }
        });

        if (faceMesh) {
            const mesh = faceMesh as THREE.Mesh;
            const dict = mesh.morphTargetDictionary;
            const inf = mesh.morphTargetInfluences;

            if (dict && inf) {
                const redW = sliders.red / 100;
                const blackW = sliders.black / 100;
                const whiteW = sliders.white / 100;
                const yellowW = sliders.yellow / 100;
                const goldW = sliders.gold / 100;

                // 🔴 红色：忠勇 (对应 ARKit: 鼓腮 CheekPuff)
                if (dict['cheekPuff'] !== undefined) inf[dict['cheekPuff']] = redW * 0.8;
                if (dict['jawOpen'] !== undefined) inf[dict['jawOpen']] = redW * 0.2;

                // ⚫️ 黑色：刚烈 (对应 ARKit: 怒眉 browDownLeft/Right)
                if (dict['browDownLeft'] !== undefined) inf[dict['browDownLeft']] = blackW;
                if (dict['browDownRight'] !== undefined) inf[dict['browDownRight']] = blackW;
                if (dict['jawForward'] !== undefined) inf[dict['jawForward']] = blackW * 0.5;

                // ⚪️ 白色：阴险 (对应 ARKit: 皱鼻 noseSneerLeft/Right)
                if (dict['noseSneerLeft'] !== undefined) inf[dict['noseSneerLeft']] = whiteW;
                if (dict['noseSneerRight'] !== undefined) inf[dict['noseSneerRight']] = whiteW;
                if (dict['eyeSquintLeft'] !== undefined) inf[dict['eyeSquintLeft']] = whiteW;
                if (dict['eyeSquintRight'] !== undefined) inf[dict['eyeSquintRight']] = whiteW;

                // 🟡 黄色：野性 (对应 ARKit: 咧嘴 mouthRollUpper/Lower)
                if (dict['mouthRollUpper'] !== undefined) inf[dict['mouthRollUpper']] = yellowW;
                if (dict['mouthRollLower'] !== undefined) inf[dict['mouthRollLower']] = yellowW;

                // 🟡 金色：神魔 (对应 ARKit: 眉心上提 browInnerUp)
                if (dict['browInnerUp'] !== undefined) inf[dict['browInnerUp']] = goldW;
            }
        }

        // 金色滑块依然接管物理材质的金属度
        if (materialRef.current) {
            materialRef.current.metalness = (sliders.gold / 100) * 0.8;
            materialRef.current.roughness = 0.5 - (sliders.gold / 100) * 0.3;
        }
    }, [sliders, gltf.scene]);

    // 注入新的材质以支持颜色混合
    useEffect(() => {
        gltf.scene.traverse((child: any) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                // 替换掉模型自带的写实材质，换成我们的参数化基底材质
                mesh.material = new THREE.MeshStandardMaterial({
                    color: '#e7e5e4', // 朴素的底胎颜色
                    roughness: 0.8,
                    side: THREE.DoubleSide
                });
                // @ts-ignore
                materialRef.current = mesh.material;
            }
        });
    }, [gltf.scene]);

    return <primitive object={gltf.scene} scale={20} />;
};

// 预加载本地资产，并注入 MeshoptDecoder 解决解压报错
useGLTF.preload(LOCAL_MODEL_PATH, true, true, (loader) => {
    loader.setMeshoptDecoder(MeshoptDecoder);
});

export default function QinqiangMaskPlugin({ config: _config }: { config: any }) {
    const [sliders, setSliders] = useState({ red: 0, black: 0, white: 0, yellow: 0, gold: 0 });
    const sceneRef = useRef<THREE.Group>(null);
    const [exporting, setExporting] = useState(false);

    const handleSliderChange = (id: string, value: number) => {
        setSliders(prev => ({ ...prev, [id]: value }));
    };

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
            {/* 左侧控制台：文化参数注入 */}
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
                            拖动滑块，将非遗文化中的性格寓意映射到解剖学级的 ARKit 面部肌肉形变上，实现骨相生命力。
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

                {/* 导出按钮：实体打印引擎 */}
                <div className="p-6 border-t border-white/5 bg-stone-900/50 backdrop-blur-md">
                    <button 
                        onClick={handleExport3MF}
                        disabled={exporting}
                        className="w-full py-4 rounded bg-purple-700 hover:bg-purple-600 disabled:bg-stone-700 transition-colors font-bold text-sm flex justify-center items-center gap-2 text-white shadow-xl ring-1 ring-white/10 group active:scale-95 duration-200"
                    >
                        {exporting ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                        )}
                        {exporting ? '正在生成实体脸模...' : '导出 3D 打印立体脸谱'}
                    </button>
                    <p className="text-[10px] text-stone-600 text-center mt-3 font-mono">3MF | ARKit Morph Matrix | AMS Ready</p>
                </div>
            </div>

            {/* 右侧 3D 视口：ARKit 肌肉驱动版 */}
            <div className="flex-1 bg-stone-800 relative">
                <Canvas shadows camera={{ fov: 45 }}>
                    <color attach="background" args={['#1c1917']} />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[50, 50, 100]} intensity={2} castShadow />
                    <Environment preset="studio" />
                    
                    <OrbitControls makeDefault enablePan={true} maxPolarAngle={Math.PI / 1.5} />

                {/* <Center> 组件是拯救视口过小的终极魔法，它会自动将模型Bounding Box中心移至原点并适配相机 */}
                <Center top>
                    <group ref={sceneRef}>
                        <FaceCapModel sliders={sliders} />
                    </group>
                </Center>
                    
                    <GizmoHelper alignment="top-right" margin={[60, 60]}>
                        <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
                    </GizmoHelper>
                </Canvas>
                
                {/* 状态看板 */}
                <div className="absolute bottom-6 right-6 flex flex-col items-end pointer-events-none z-20">
                    <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/5 mb-2">
                        <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest leading-none">High-Poly FaceCap Base</span>
                    </div>
                    <span className="text-[9px] text-stone-600 font-mono tracking-tighter">ARKit 52 Shapes | Zero Procedural Artifacts</span>
                </div>
            </div>
        </div>
    );
}
