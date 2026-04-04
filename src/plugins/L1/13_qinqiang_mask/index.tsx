import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, GizmoHelper, GizmoViewport, Environment } from '@react-three/drei';
import { ArrowLeft, SlidersHorizontal, Download } from 'lucide-react';
import * as THREE from 'three';

const CULTURE_MATRIX = [
    { id: 'red', name: '忠勇赤诚', color: '#E62129', desc: '天庭饱满，向外平滑鼓起' },
    { id: 'black', name: '刚烈铁面', color: '#1A1A1A', desc: '眉骨凸出，阶梯状硬边缘' },
    { id: 'white', name: '奸诈阴险', color: '#FFFFFF', desc: '眼眶凹陷，鼻梁骨尖锐' },
    { id: 'yellow', name: '骁勇狂野', color: '#F39800', desc: '肌肉虬结，高频崎岖突刺' },
    { id: 'gold', name: '神魔仙怪', color: '#FFD700', desc: '天眼拉伸，极高金属反光' }
];

// === V2 核心引擎：高阶数学雕刻基模 ===
const ProceduralHDMask = ({ sliders }: { sliders: Record<string, number> }) => {
    const geoRef = useRef<THREE.BufferGeometry>(null);
    const matRef = useRef<THREE.MeshStandardMaterial>(null);

    useEffect(() => {
        // 1. 初始化高细分半球胎 (极致丝滑)
        if (!geoRef.current) {
            const geo = new THREE.SphereGeometry(60, 128, 128, 0, Math.PI);
            geo.rotateY(Math.PI / 2);
            
            const count = geo.attributes.position.count;
            geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
            geo.setAttribute('basePosition', geo.attributes.position.clone()); // 备份原坐标
            geoRef.current = geo;
        }

        const geo = geoRef.current;
        const pos = geo.attributes.position;
        const basePos = geo.getAttribute('basePosition');
        const colors = geo.attributes.color;
        
        const palette = CULTURE_MATRIX.map(m => new THREE.Color(m.color));
        const cBase = new THREE.Color('#e7e5e4'); // 陶瓷素胎色

        // 2. 实时拓扑与形变重算 (纯 CPU 极速运算)
        for (let i = 0; i < pos.count; i++) {
            let x = basePos.getX(i);
            let y = basePos.getY(i);
            let z = basePos.getZ(i);

            // --- A. 基础解剖学曲面 ---
            x *= 0.8; // 压窄脸型
            y *= 1.15; // 拉长脸颊
            
            // 鼻梁 (平滑高斯突起)
            const nose = Math.max(0, 1 - (x*x + (y-5)*(y-5))/200) * 22;
            // 眼窝 (平滑双高斯凹陷)
            const eyeDist = Math.pow(Math.abs(x) - 20, 2) + Math.pow(y - 25, 2);
            const eyeDip = Math.max(0, 1 - eyeDist / 180) * -10;
            // 下颌内收
            const jaw = y < -20 ? (y + 20) * 0.2 : 0;

            const baseZ = z + nose + eyeDip + jaw;

            // --- B. 五色文化参数形变映射 ---
            const w = {
                r: sliders.red / 100, b: sliders.black / 100, w: sliders.white / 100,
                y: sliders.yellow / 100, g: sliders.gold / 100
            };

            // 🔴 红：忠勇 (全局脸颊与额头饱满膨胀)
            const redInflate = Math.max(0, 1 - (x*x + y*y)/3500) * 12 * w.r;
            // ⚫️ 黑：刚烈 (眉骨阶梯状硬边缘外突)
            const isBrow = y > 25 && y < 35 && Math.abs(x) < 45;
            const blackBake = isBrow ? 8 * w.b : 0;
            // ⚪️ 白：阴险 (眼窝深度向下侵蚀，表现瘦骨嶙峋)
            const whiteCarve = Math.max(0, 1 - eyeDist/250) * -15 * w.w;
            // 🟡 黄：野性 (下颌不规则高频肌肉纹理)
            const isJaw = y < -10;
            const yellowRidge = isJaw ? (Math.sin(x*0.5)*Math.cos(y*0.5)) * 6 * w.y : 0;
            // 🟡 金：神魔 (额头天眼尖锐拉伸)
            const goldPeak = Math.max(0, 1 - (x*x + (y-50)*(y-50))/80) * 25 * w.g;

            // 执行顶点偏移
            pos.setXYZ(i, x, y, baseZ + redInflate + blackBake + whiteCarve + yellowRidge + goldPeak);

            // --- C. 动态色彩浸染 ---
            let col = cBase.clone();
            if (w.r > 0.1 && redInflate > 2) col.lerp(palette[0], w.r);
            if (w.b > 0.1 && isBrow) col.lerp(palette[1], w.b);
            if (w.w > 0.1 && whiteCarve < -2) col.lerp(palette[2], w.w);
            if (w.y > 0.1 && isJaw) col.lerp(palette[3], w.y);
            if (w.g > 0.1 && goldPeak > 5) col.lerp(palette[4], w.g);
            
            colors.setXYZ(i, col.r, col.g, col.b);
        }

        pos.needsUpdate = true;
        colors.needsUpdate = true;
        geo.computeVertexNormals(); // 重算法线生成逼真光影
        
        if (matRef.current) {
            matRef.current.metalness = (sliders.gold / 100) * 0.8;
            matRef.current.roughness = 0.5 - (sliders.gold / 100) * 0.3;
        }
    }, [sliders]);

    const geometry = geoRef.current;
    if (!geometry) return null;

    return (
        <mesh geometry={geometry} castShadow receiveShadow>
            <meshStandardMaterial ref={matRef} vertexColors={true} side={THREE.DoubleSide} />
        </mesh>
    );
};

export default function QinqiangMaskPlugin({ config: _config }: { config: any }) {
    const [sliders, setSliders] = useState({ red: 0, black: 0, white: 0, yellow: 0, gold: 0 });

    const handleSliderChange = (id: string, value: number) => {
        setSliders(prev => ({ ...prev, [id]: value }));
    };

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
                    <div className="space-y-6">
                        {CULTURE_MATRIX.map((item) => (
                            <div key={item.id} className="space-y-2 group">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-sm font-bold text-stone-300">{item.name}</span>
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
                
                <div className="p-6">
                    <button onClick={() => window.parent.postMessage({ type: 'EXPORT_3MF_SOLID' }, '*')} className="w-full py-4 rounded bg-purple-700 hover:bg-purple-600 transition-colors font-bold text-sm flex justify-center items-center gap-2 text-white shadow-xl">
                        <Download className="w-4 h-4" /> 导出立体脸谱
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-stone-800 relative">
                <Canvas camera={{ fov: 45 }}>
                    <color attach="background" args={['#1c1917']} />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[50, 50, 100]} intensity={2} castShadow />
                    <Environment preset="studio" />
                    <OrbitControls makeDefault enablePan={true} maxPolarAngle={Math.PI / 1.5} />
                    <Center top>
                        <ProceduralHDMask sliders={sliders} />
                    </Center>
                    <GizmoHelper alignment="top-right" margin={[60, 60]}>
                        <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
                    </GizmoHelper>
                </Canvas>
            </div>
        </div>
    );
}
