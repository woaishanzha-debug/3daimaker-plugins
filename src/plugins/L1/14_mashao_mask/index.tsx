import React, { useState, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Center } from '@react-three/drei';
import { ArrowLeft, Download, Zap, Trash2 } from 'lucide-react';
import * as THREE from 'three';
import { STLExporter } from 'three-stdlib';

// --- 核心数据字典 (五行相生相克逻辑) ---
const WUXING_DICT = [
    { id: 0, name: '金', color: '#fcd34d', shape: 'box' },      // 0
    { id: 1, name: '水', color: '#3b82f6', shape: 'sphere' },   // 1
    { id: 2, name: '木', color: '#22c55e', shape: 'cylinder' }, // 2
    { id: 3, name: '火', color: '#ef4444', shape: 'cone' },     // 3
    { id: 4, name: '土', color: '#a8a29e', shape: 'torus' },    // 4
];
const SPECIAL_DICT = [
    { id: 5, name: '风', color: '#94a3b8', shape: 'octahedron' },
    { id: 6, name: '雷', color: '#8b5cf6', shape: 'dodecahedron' },
    { id: 7, name: '云', color: '#f8fafc', shape: 'icosahedron' },
];
const ALL_ELEMENTS = [...WUXING_DICT, ...SPECIAL_DICT];

const WUXING_LORE = {
    generate: ['金销熔生水', '水润泽生木', '木干暖生火', '火焚木生土', '土蕴藏生金'],
    overcome: ['金锐利伐木', '木扎根破土', '土厚实掩水', '水寒冷灭火', '火烈焰熔金']
};


// 预设通用元素超级符号 (矢量路径)
const getElementShapes = () => {
    // 1. 金 (Gear - 齿轮)
    const gear = new THREE.Shape();
    const teeth = 8;
    for (let i = 0; i < teeth * 2; i++) {
        const r = i % 2 === 0 ? 0.08 : 0.05;
        const a = (i / (teeth * 2)) * Math.PI * 2;
        if (i === 0) gear.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else gear.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    gear.closePath();
    const gearHole = new THREE.Path();
    gearHole.absarc(0, 0, 0.02, 0, Math.PI * 2, false);
    gear.holes.push(gearHole);

    // 2. 水 (Water - 水滴)
    const water = new THREE.Shape();
    water.moveTo(0, 0.08);
    water.quadraticCurveTo(0.06, -0.02, 0, -0.06);
    water.quadraticCurveTo(-0.06, -0.02, 0, 0.08);

    // 3. 木 (Wood - 树叶)
    const wood = new THREE.Shape();
    wood.moveTo(0, 0.08);
    wood.quadraticCurveTo(0.06, 0.0, 0, -0.08);
    wood.quadraticCurveTo(-0.06, 0.0, 0, 0.08);

    // 4. 火 (Fire - 火焰)
    const fire = new THREE.Shape();
    fire.moveTo(0, 0.1);
    fire.quadraticCurveTo(0.08, -0.02, 0, -0.08);
    fire.quadraticCurveTo(-0.06, -0.02, -0.02, 0.04);
    fire.quadraticCurveTo(-0.02, 0.02, 0, 0.1);

    // 5. 土 (Earth - 坚岩)
    const earth = new THREE.Shape();
    earth.moveTo(0, 0.08);
    earth.lineTo(0.06, -0.06);
    earth.lineTo(-0.06, -0.06);
    earth.closePath();

    // 6. 风 (Wind - 旋风镖)
    const wind = new THREE.Shape();
    wind.moveTo(0, 0.08);
    wind.quadraticCurveTo(0.02, 0.02, 0.08, 0);
    wind.quadraticCurveTo(0.02, -0.02, 0, -0.08);
    wind.quadraticCurveTo(-0.02, -0.02, -0.08, 0);
    wind.quadraticCurveTo(-0.02, 0.02, 0, 0.08);

    // 7. 雷 (Thunder - 闪电)
    const thunder = new THREE.Shape();
    thunder.moveTo(0.02, 0.08);
    thunder.lineTo(-0.04, 0.0);
    thunder.lineTo(0.02, 0.0);
    thunder.lineTo(-0.02, -0.08);
    thunder.lineTo(0.06, 0.02);
    thunder.lineTo(0.0, 0.02);
    thunder.closePath();

    // 8. 云 (Cloud - 云团)
    const cloud = new THREE.Shape();
    cloud.moveTo(-0.04, -0.02);
    cloud.quadraticCurveTo(-0.08, -0.02, -0.08, 0.02);
    cloud.quadraticCurveTo(-0.08, 0.06, -0.04, 0.06);
    cloud.quadraticCurveTo(0, 0.1, 0.04, 0.06);
    cloud.quadraticCurveTo(0.08, 0.06, 0.08, 0.02);
    cloud.quadraticCurveTo(0.08, -0.02, 0.04, -0.02);
    cloud.closePath();

    return { gear, water, wood, fire, earth, wind, thunder, cloud };
};

const SYMBOL_SHAPES = getElementShapes();
const EXTRUDE_SETTINGS = { depth: 0.02, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 3 };

// --- 3D 实体镜像画笔组件 ---
const VolumetricLine = ({ points, color, mirrored }: { points: THREE.Vector3[], color: string, mirrored?: boolean }) => {
    const geometry = useMemo(() => {
        let validPoints = points;
        // 防崩溃机制：如果是单点，做极小偏移
        if (points.length === 1) {
            validPoints = [points[0], points[0].clone().add(new THREE.Vector3(0, 0.001, 0))];
        }
        if (validPoints.length < 2) return null;
        
        // 核心修复 1：使用 centripetal 类型，并提供更高的分段，让曲率更圆滑
        const curve = new THREE.CatmullRomCurve3(validPoints, false, 'centripetal', 0.5);
        // 核心修复 2：半径调细至 0.015，分段数拉高确保不切入曲面
        return new THREE.TubeGeometry(curve, Math.max(20, validPoints.length * 4), 0.015, 8, false);
    }, [points]);

    if (!geometry) return null;

    return (
        <group scale={mirrored ? [-1, 1, 1] : [1, 1, 1]}>
            <mesh geometry={geometry} raycast={() => null}>
                <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
            </mesh>
        </group>
    );
};

const PremiumTotem = ({ type, color, rotation }: { type: string, color: string, rotation: THREE.Euler }) => {
    let shape;
    switch(type) {
        case 'box': shape = SYMBOL_SHAPES.gear; break;          // 金
        case 'sphere': shape = SYMBOL_SHAPES.water; break;      // 水
        case 'cylinder': shape = SYMBOL_SHAPES.wood; break;     // 木
        case 'cone': shape = SYMBOL_SHAPES.fire; break;         // 火
        case 'torus': shape = SYMBOL_SHAPES.earth; break;       // 土
        case 'octahedron': shape = SYMBOL_SHAPES.wind; break;   // 风
        case 'dodecahedron': shape = SYMBOL_SHAPES.thunder; break; // 雷
        case 'icosahedron': shape = SYMBOL_SHAPES.cloud; break; // 云
        default: shape = SYMBOL_SHAPES.gear;
    }

    return (
        // 核心修复：应用专属曲面欧拉角，放大 3.5 倍使徽章具有视觉冲击力
        <group rotation={rotation} scale={[3.5, 3.5, 3.5]}>
            <Center>
                <mesh raycast={() => null}>
                    <extrudeGeometry args={[shape, EXTRUDE_SETTINGS]} />
                    <meshStandardMaterial 
                        color={color} 
                        roughness={0.3} 
                        metalness={type === 'box' ? 0.8 : 0.2} 
                        emissive={type === 'cone' || type === 'dodecahedron' ? color : '#000000'} 
                        emissiveIntensity={0.6} 
                    />
                </mesh>
            </Center>
        </group>
    );
};

export default function MashaoMaskPlugin({ config: _config }: { config: any }) {
    // 状态管理
    const [lines, setLines] = useState<{ id: number, color: string, points: THREE.Vector3[] }[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [activeColor, setActiveColor] = useState('#ef4444');
    const [totems, setTotems] = useState<{ anchorIdx: number, elId: number }[]>([]);
    const [scoreLog, setScoreLog] = useState<{ score: number, logs: string[], rank: string, rankColor: string } | null>(null);
    const [baseType, setBaseType] = useState<'flat' | 'scoop'>('flat');
    const [interactionMode, setInteractionMode] = useState<'draw' | 'view'>('draw');
    const exportRef = useRef<THREE.Group>(null);

    // 平面葫芦专属锚点 (大幅拓宽间距，适应 3.5 倍大徽章)
    const FLAT_ANCHORS = [
        { pos: new THREE.Vector3(0, 1.45, 0.12), rot: new THREE.Euler(0, 0, 0) },    // 额头 (大幅上移)
        { pos: new THREE.Vector3(-0.75, 0.1, 0.12), rot: new THREE.Euler(0, 0, 0) }, // 左颊 (向外扩)
        { pos: new THREE.Vector3(0.75, 0.1, 0.12), rot: new THREE.Euler(0, 0, 0) },  // 右颊 (向外扩)
        { pos: new THREE.Vector3(0, -1.15, 0.12), rot: new THREE.Euler(0, 0, 0) },   // 下巴 (大幅下移)
        { pos: new THREE.Vector3(0, 0.15, 0.12), rot: new THREE.Euler(0, 0, 0) }     // 鼻心
    ];
    
    // 勺形曲面专属锚点 (仅下巴 Z 轴回调至 0.46)
    const SCOOP_ANCHORS = [
        { pos: new THREE.Vector3(0, 2.0, 0.02), rot: new THREE.Euler(0, 0, 0) },         // 勺柄顶部 (保持不变)
        { pos: new THREE.Vector3(-0.85, 0.0, 0.42), rot: new THREE.Euler(0, -0.45, 0) }, // 左颊 (保持不变)
        { pos: new THREE.Vector3(0.85, 0.0, 0.42), rot: new THREE.Euler(0, 0.45, 0) },   // 右颊 (保持不变)
        { pos: new THREE.Vector3(0, -0.85, 0.46), rot: new THREE.Euler(0.2, 0, 0) },     // 下巴 (Z轴从 0.52 回调至 0.46)
        { pos: new THREE.Vector3(0, 0.15, 0.58), rot: new THREE.Euler(0, 0, 0) }         // 鼻心 (保持不变)
    ];
    const activeAnchors = baseType === 'flat' ? FLAT_ANCHORS : SCOOP_ANCHORS;

    // 绘制形状生成
    const gourdShape = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(0, 1.8);
        shape.bezierCurveTo(0.9, 1.8, 1.1, 0.8, 0.4, 0.4); 
        shape.bezierCurveTo(1.4, 0.1, 1.4, -1.6, 0, -1.8); 
        shape.bezierCurveTo(-1.4, -1.6, -1.4, 0.1, -0.4, 0.4); 
        shape.bezierCurveTo(-1.1, 0.8, -0.9, 1.8, 0, 1.8); 
        return shape;
    }, []);

    // 交互绘制逻辑
    const onPointerDown = (e: any) => {
        if (interactionMode !== 'draw') return;
        e.stopPropagation();
        setIsDrawing(true);
        
        const worldNormal = e.face?.normal 
            ? e.face.normal.clone().transformDirection(e.object.matrixWorld).normalize() 
            : new THREE.Vector3(0, 0, 1);
            
        // 核心修复 1：偏移量降至 0.01 (略小于管线半径 0.015)，实现半嵌入咬合
        const startPt = e.point.clone().add(worldNormal.multiplyScalar(0.01));
        setLines(prev => [...prev, { id: Date.now(), color: activeColor, points: [startPt] }]);
    };

    const onPointerMove = (e: any) => {
        if (interactionMode !== 'draw' || !isDrawing) return;
        e.stopPropagation();
        
        const worldNormal = e.face?.normal 
            ? e.face.normal.clone().transformDirection(e.object.matrixWorld).normalize() 
            : new THREE.Vector3(0, 0, 1);
            
        // 核心修复 1：偏移量降至 0.01
        const drawPoint = e.point.clone().add(worldNormal.multiplyScalar(0.01));
        
        setLines(prev => {
            const newLines = [...prev];
            const lastIdx = newLines.length - 1;
            const currentLine = newLines[lastIdx];
            if (!currentLine) return prev;
            
            // 核心修复 4：极高频采样 (0.005)，缩短弦长，杜绝中段切入球体内部
            if (currentLine.points[currentLine.points.length - 1].distanceTo(drawPoint) > 0.005) {
                newLines[lastIdx] = {
                    ...currentLine,
                    points: [...currentLine.points, drawPoint]
                };
            }
            return newLines;
        });
    };

    const onPointerUp = () => setIsDrawing(false);

    // 图腾注入
    const addTotem = (elId: number) => {
        const used = totems.map(t => t.anchorIdx);
        const free = [0, 1, 2, 3, 4].filter(i => !used.includes(i));
        if (free.length === 0) return;
        const targetAnchor = free[Math.floor(Math.random() * free.length)];
        setTotems([...totems, { anchorIdx: targetAnchor, elId }]);
        setScoreLog(null);
    };

    // 五行演算逻辑
    const evaluateHarmony = () => {
        if (totems.length < 2) {
            setScoreLog({ score: 0, logs: ['至少需注入两种命格元素方可演算。'], rank: 'N/A', rankColor: 'text-white/20' });
            return;
        }

        let score = 40; 
        const logs: string[] = [];
        const presentIds = totems.map(t => t.elId);

        const hasAllWuxing = [0, 1, 2, 3, 4].every(id => presentIds.includes(id));
        if (hasAllWuxing) { score += 100; logs.push('🌟 触发羁绊 [五行大衍] 共鸣大爆发现象 (+100)'); }
        const hasTianjie = [5, 6, 7].every(id => presentIds.includes(id));
        if (hasTianjie) { score += 50; logs.push('⚡ 触发羁绊 [天劫降临] 特殊命格 (+50)'); }

        for (let i = 0; i < presentIds.length; i++) {
            for (let j = i + 1; j < presentIds.length; j++) {
                const a = presentIds[i]; const b = presentIds[j];
                if (a > 4 || b > 4) continue;

                if ((a + 1) % 5 === b) { score += 10; logs.push(`[相生判定] ${WUXING_DICT[a].name} 生 ${WUXING_DICT[b].name}：${WUXING_LORE.generate[a]} (+10分)`); }
                else if ((b + 1) % 5 === a) { score += 10; logs.push(`[相生判定] ${WUXING_DICT[b].name} 生 ${WUXING_DICT[a].name}：${WUXING_LORE.generate[b]} (+10分)`); }
                else if ((a + 2) % 5 === b) { score -= 5; logs.push(`[相克惩罚] ${WUXING_DICT[a].name} 克 ${WUXING_DICT[b].name}：${WUXING_LORE.overcome[a]} (-5分)`); }
                else if ((b + 2) % 5 === a) { score -= 5; logs.push(`[相克惩罚] ${WUXING_DICT[b].name} 克 ${WUXING_DICT[a].name}：${WUXING_LORE.overcome[b]} (-5分)`); }
            }
        }

        let rank = 'R'; let rankColor = 'text-gray-400';
        if (score >= 140) { rank = 'SP'; rankColor = 'text-red-500 animate-pulse'; }
        else if (score >= 90) { rank = 'SSR'; rankColor = 'text-yellow-400'; }
        else if (score >= 60) { rank = 'SR'; rankColor = 'text-purple-400'; }

        setScoreLog({ score, logs, rank, rankColor });
    };

    const handleExport = () => {
        if (!exportRef.current) return;
        const exporter = new STLExporter();
        exportRef.current.updateMatrixWorld(true);
        const stlString = exporter.parse(exportRef.current);
        const blob = new Blob([stlString], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Mashao_Totem_${Date.now()}.stl`;
        link.click();
    };

    return (
        <div className="w-full h-screen flex bg-[#02040a] text-white overflow-hidden font-sans select-none">
            {/* 左侧控制台 */}
            <div className="w-[400px] bg-[#0a0c10] border-r border-white/5 flex flex-col z-10 shadow-2xl">
                <div className="p-6 border-b border-white/5 flex items-center gap-4 shrink-0">
                    <button onClick={() => window.parent.postMessage({ type: 'EXIT_PLUGIN' }, '*')} className="text-white/30 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <span className="px-2 py-0.5 rounded bg-red-600/20 text-red-500 text-[10px] font-black uppercase tracking-[0.2em]">L1-14</span>
                        <h1 className="font-black text-sm tracking-widest text-white/90 mt-1 uppercase italic">关中马勺：五行图腾演武</h1>
                    </div>
                </div>

                <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/20 tracking-widest uppercase">操作模式</label>
                        <div className="flex bg-black/40 rounded-xl p-1 border border-white/10 relative overflow-hidden">
                            <button onClick={() => setInteractionMode('draw')} className={`flex-1 py-2 text-[10px] font-black tracking-widest uppercase rounded-lg transition-all z-10 ${interactionMode === 'draw' ? 'text-white shadow-lg bg-red-600' : 'text-white/30 hover:text-white'}`}>镜像画笔</button>
                            <button onClick={() => setInteractionMode('view')} className={`flex-1 py-2 text-[10px] font-black tracking-widest uppercase rounded-lg transition-all z-10 ${interactionMode === 'view' ? 'text-white shadow-lg bg-blue-600' : 'text-white/30 hover:text-white'}`}>旋转观察</button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/20 tracking-widest uppercase">面具底板</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setBaseType('flat')} className={`py-2 rounded-lg text-[10px] font-black tracking-widest uppercase border transition-all ${baseType === 'flat' ? 'bg-red-600/10 border-red-500 text-red-400' : 'border-white/5 text-white/30'}`}>葫芦形平面</button>
                            <button onClick={() => setBaseType('scoop')} className={`py-2 rounded-lg text-[10px] font-black tracking-widest uppercase border transition-all ${baseType === 'scoop' ? 'bg-red-600/10 border-red-500 text-red-400' : 'border-white/5 text-white/30'}`}>勺形曲面</button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/20 tracking-widest uppercase">作画颜色</label>
                        <div className="flex gap-2">
                            {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ffffff', '#000000'].map(c => (
                                <button key={c} onClick={() => setActiveColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all ${activeColor === c ? 'border-red-500 scale-110' : 'border-transparent opacity-40'}`} style={{ backgroundColor: c }} />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/20 tracking-widest uppercase">注入命格图腾 ({totems.length}/5)</label>
                        <div className="grid grid-cols-4 gap-2">
                            {ALL_ELEMENTS.map(el => (
                                <button key={el.id} onClick={() => addTotem(el.id)} disabled={totems.length >= 5} className="py-3 border border-white/5 rounded-xl hover:bg-white/5 disabled:opacity-20 text-[10px] font-black" style={{ color: el.color }}>
                                    {el.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2 pt-4">
                        <button onClick={evaluateHarmony} className="w-full py-4 rounded-2xl bg-red-600 font-black text-xs tracking-widest uppercase flex justify-center items-center gap-2 shadow-xl">
                            <Zap className="w-4 h-4 fill-current" /> 演算五行命格
                        </button>
                        <div className="flex gap-2">
                            <button onClick={() => { setLines([]); setTotems([]); setScoreLog(null); }} className="flex-1 py-3 rounded-xl bg-white/5 text-[9px] font-black tracking-widest uppercase text-white/20 hover:text-red-400 border border-white/5">
                                <Trash2 className="w-3 h-3" /> 清理面具
                            </button>
                            <button onClick={handleExport} className="flex-1 py-3 rounded-xl bg-blue-600/5 text-blue-400/60 border border-blue-500/10 text-[9px] font-black tracking-widest uppercase flex justify-center items-center gap-2">
                                <Download className="w-3 h-3" /> 导出 STL
                            </button>
                        </div>
                    </div>

                    {scoreLog && (
                        <div className="rounded-3xl bg-white/[0.01] border border-white/5 overflow-hidden mt-4 shadow-2xl">
                            <div className="p-5 flex justify-between items-center bg-white/[0.02]">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">演算结果</p>
                                    <h4 className="text-sm font-black text-white italic">{scoreLog.score} PT</h4>
                                </div>
                                <div className={`text-4xl font-black italic tracking-tighter ${scoreLog.rankColor}`}>
                                    {scoreLog.rank}
                                </div>
                            </div>
                            <ul className="p-4 space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar border-t border-white/5">
                                {scoreLog.logs.map((log, i) => (
                                    <li key={i} className="text-[9px] font-bold text-white/40 bg-white/[0.01] p-3 rounded-xl border border-white/5 italic">
                                        {log}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* 右侧 3D 渲染区 */}
            <div className="flex-1 relative bg-[#f8f6f0]">
                <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                    <OrbitControls makeDefault enablePan={false} enabled={interactionMode === 'view'} maxPolarAngle={Math.PI / 1.5} minPolarAngle={Math.PI / 3} />
                    <ambientLight intensity={0.9} />
                    <directionalLight position={[5, 5, 5]} intensity={1.2} />
                    <Environment preset="city" />
                    
                    <Center>
                        <group ref={exportRef}>
                            <group onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
                                {baseType === 'flat' ? (
                                    <mesh position={[0, 0, -0.1]}>
                                        <extrudeGeometry args={[gourdShape, { depth: 0.2, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05 }]} />
                                        <meshStandardMaterial color="#8b4513" roughness={0.85} />
                                    </mesh>
                                ) : (
                                    <group>
                                        <mesh position={[0, 1.8, -0.1]} rotation={[0.05, 0, 0]} scale={[1, 1, 0.4]}>
                                            <cylinderGeometry args={[0.3, 0.35, 2.5, 32]} />
                                            <meshStandardMaterial color="#8b4513" roughness={0.85} />
                                        </mesh>
                                        <mesh position={[0, 0, 0]} scale={[1, 1.1, 0.4]}>
                                            <sphereGeometry args={[1.4, 64, 64]} />
                                            <meshStandardMaterial color="#8b4513" roughness={0.85} />
                                        </mesh>
                                    </group>
                                )}
                            </group>

                            {lines.map(line => (
                                <React.Fragment key={`line-${line.id}`}>
                                    <VolumetricLine points={line.points} color={line.color} />
                                    <VolumetricLine points={line.points} color={line.color} mirrored />
                                </React.Fragment>
                            ))}

                            {/* 渲染五行图腾 */}
                            {totems.map((t, idx) => {
                                const el = ALL_ELEMENTS.find(e => e.id === t.elId)!;
                                const anchor = activeAnchors[t.anchorIdx];
                                return (
                                    <group key={`totem-${idx}`} position={anchor.pos}>
                                        <PremiumTotem type={el.shape} color={el.color} rotation={anchor.rot} />
                                    </group>
                                );
                            })}
                        </group>
                    </Center>
                    <ContactShadows position={[0, -2.5, 0]} opacity={0.3} scale={10} blur={2} color="#000000" />
                </Canvas>

                <div className="absolute top-8 right-8 pointer-events-none">
                    <div className="px-5 py-3 bg-black/[0.03] backdrop-blur-3xl border border-black/10 rounded-3xl flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${interactionMode === 'draw' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#000]/40">
                            {interactionMode === 'draw' ? '镜像绘笔：高频物理采样' : '旋转观察：多维视角解锁'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

const style = document.createElement('style');
style.textContent = `
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 2px; }
`;
document.head.appendChild(style);
