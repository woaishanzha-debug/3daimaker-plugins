import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Canvas as ThreeCanvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Center, Edges } from '@react-three/drei';
import { Hand, Pencil, Eraser, Download, Box, Layers2, Shapes, Trash2 } from 'lucide-react';
import * as THREE from 'three';

// === 1. 物理常数与拓扑数据 ===
const FACE_SIZE = 30; 
const TRI_H = FACE_SIZE * Math.sqrt(3) / 2;
const PALETTE = ['#ffffff', '#ef4444', '#f59e0b', '#10b981', '#3b82f6'];

// 14面体折角 (立方八面体: 125.26度二面角)
const A14 = Math.PI - (125.264 * Math.PI / 180); 
// 26面体折角 (小菱形立方八面体: 方-方135度, 方-三角144.74度)
const A26_SS = Math.PI - (135 * Math.PI / 180);  
const A26_ST = Math.PI - (144.736 * Math.PI / 180); 

const squareShape = new THREE.Shape().moveTo(-FACE_SIZE/2, 0).lineTo(FACE_SIZE/2, 0).lineTo(FACE_SIZE/2, FACE_SIZE).lineTo(-FACE_SIZE/2, FACE_SIZE);
const circleShape = new THREE.Shape().moveTo(-FACE_SIZE/2, 0).lineTo(FACE_SIZE/2, 0).lineTo(0, TRI_H); // Used for triangles, variable name historical
const triangleShape = circleShape;

// 分离式基础网格（纯黑 0 Z 0.8 拉伸），消除索引干扰带来的缝隙伪影
const squareBaseGeo = new THREE.ExtrudeGeometry(squareShape, { depth: 0.8, bevelEnabled: false });
const triangleBaseGeo = new THREE.ExtrudeGeometry(triangleShape, { depth: 0.8, bevelEnabled: false });
// 薄层纯白画纸 (附着于 Z=0.8)
const squarePaperGeo = new THREE.ShapeGeometry(squareShape);
const trianglePaperGeo = new THREE.ShapeGeometry(triangleShape);

// 将虚线转换为 BufferGeometry 适配 LineSegments
const createDashedHingeGeo = (length: number) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([-length/2, 0, 0.81, length/2, 0, 0.81], 3));
    return geo;
};
const squareDashedHinge = createDashedHingeGeo(FACE_SIZE);

// 14面体拓扑
const NET_14 = {
    id: 's0', type: 'square', edge: 0, fa: A14, children: [
        { id: 't1', type: 'triangle', edge: 0, fa: A14, children: [ { id: 's1', type: 'square', edge: 1, fa: A14, children: [ { id: 't5', type: 'triangle', edge: 0, fa: A14, children: [ { id: 's5', type: 'square', edge: 1, fa: A14, children: [] } ]} ]} ]},
        { id: 't2', type: 'triangle', edge: 1, fa: A14, children: [ { id: 's2', type: 'square', edge: 1, fa: A14, children: [ { id: 't6', type: 'triangle', edge: 0, fa: A14, children: [] } ]} ]},
        { id: 't3', type: 'triangle', edge: 2, fa: A14, children: [ { id: 's3', type: 'square', edge: 1, fa: A14, children: [ { id: 't7', type: 'triangle', edge: 0, fa: A14, children: [] } ]} ]},
        { id: 't4', type: 'triangle', edge: 3, fa: A14, children: [ { id: 's4', type: 'square', edge: 1, fa: A14, children: [ { id: 't8', type: 'triangle', edge: 0, fa: A14, children: [] } ]} ]}
    ]
};

// 26面体拓扑 (菱方八面体)
const NET_26 = {
    id: 's0', type: 'square', edge: 0, fa: A26_SS, children: [
        { id: 's1', type: 'square', edge: 0, fa: A26_SS, children: [
            { id: 't1', type: 'triangle', edge: 1, fa: A26_ST, children: [ { id: 's13', type: 'square', edge: 1, fa: A26_ST, children: [ { id: 't5', type: 'triangle', edge: 0, fa: A26_ST, children: []} ] } ] },
            { id: 't2', type: 'triangle', edge: 3, fa: A26_ST, children: [ { id: 's14', type: 'square', edge: 1, fa: A26_ST, children: [ { id: 't6', type: 'triangle', edge: 0, fa: A26_ST, children: []} ] } ] },
            { id: 's5', type: 'square', edge: 0, fa: A26_SS, children: [ { id: 's9', type: 'square', edge: 0, fa: A26_SS, children: [] } ]}
        ]},
        { id: 's2', type: 'square', edge: 1, fa: A26_SS, children: [ { id: 's6', type: 'square', edge: 0, fa: A26_SS, children: [ { id: 's10', type: 'square', edge: 0, fa: A26_SS, children: [] } ]} ]},
        { id: 's3', type: 'square', edge: 2, fa: A26_SS, children: [
            { id: 't3', type: 'triangle', edge: 1, fa: A26_ST, children: [ { id: 's15', type: 'square', edge: 1, fa: A26_ST, children: [ { id: 't7', type: 'triangle', edge: 0, fa: A26_ST, children: []} ] } ] },
            { id: 't4', type: 'triangle', edge: 3, fa: A26_ST, children: [ { id: 's16', type: 'square', edge: 1, fa: A26_ST, children: [ { id: 't8', type: 'triangle', edge: 0, fa: A26_ST, children: []} ] } ] },
            { id: 's7', type: 'square', edge: 0, fa: A26_SS, children: [ { id: 's11', type: 'square', edge: 0, fa: A26_SS, children: [] } ]}
        ]},
        { id: 's4', type: 'square', edge: 3, fa: A26_SS, children: [ { id: 's8', type: 'square', edge: 0, fa: A26_SS, children: [ { id: 's12', type: 'square', edge: 0, fa: A26_SS, children: [ { id: 's17', type: 'square', edge: 0, fa: A26_SS, children: [] } ]} ]} ]}
    ]
};

// === 2. 3D 实体画笔部件 ===
const VolumetricLine = ({ points, color }: { points: THREE.Vector3[], color: string }) => {
    const geometry = useMemo(() => {
        let validPoints = points;
        if (points.length === 1) validPoints = [points[0], points[0].clone().add(new THREE.Vector3(0, 0.001, 0))];
        if (validPoints.length < 2) return null;
        
        const curve = new THREE.CatmullRomCurve3(validPoints, false, 'centripetal', 0.5);
        return new THREE.TubeGeometry(curve, Math.max(10, validPoints.length * 2), 0.5, 8, false);
    }, [points]);

    if (!geometry) return null;
    return (
        <mesh geometry={geometry} raycast={() => null}>
            <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
        </mesh>
    );
};

// === 3. 绝对坐标变换管线 ===
// 预先将 NET_14 / NET_26 转换为展平或组装状态的绝对矩阵数组，彻底消除 React DOM 递归产生的性能消耗。
interface AbsoluteFace {
    id: string;
    type: string;
    flatMatrix: THREE.Matrix4;
    assembledMatrix: THREE.Matrix4;
}

function buildAbsoluteLayout(rootDef: any): AbsoluteFace[] {
    const list: AbsoluteFace[] = [];
    
    function traverse(node: any, parentType: string | null, parentFlat: THREE.Matrix4, parentAssembled: THREE.Matrix4, isRoot: boolean) {
        const localFlat = new THREE.Matrix4();
        const localAssembled = new THREE.Matrix4();
        let tx = 0, ty = 0, rz = 0;
        
        if (!isRoot) {
            if (parentType === 'square') {
                if (node.edge === 0) { tx = 0; ty = FACE_SIZE; rz = 0; }
                if (node.edge === 1) { tx = FACE_SIZE/2; ty = FACE_SIZE/2; rz = -Math.PI/2; }
                if (node.edge === 2) { tx = 0; ty = 0; rz = Math.PI; } 
                if (node.edge === 3) { tx = -FACE_SIZE/2; ty = FACE_SIZE/2; rz = Math.PI/2; }
            } else {
                if (node.edge === 0) { tx = 0; ty = 0; rz = Math.PI; }
                if (node.edge === 1) { tx = FACE_SIZE/4; ty = TRI_H/2; rz = -Math.PI/3; }
                if (node.edge === 2) { tx = -FACE_SIZE/4; ty = TRI_H/2; rz = Math.PI/3; }
            }
        } else {
            tx = 0; ty = -FACE_SIZE/2; rz = 0; 
        }

        const trMat = new THREE.Matrix4().makeTranslation(tx, ty, 0);
        const rzMat = new THREE.Matrix4().makeRotationZ(rz);
        
        localFlat.multiply(trMat).multiply(rzMat);
        localAssembled.multiply(trMat).multiply(rzMat);
        
        if (!isRoot) {
            // Fix folding direction: negative fold angle ensures folding happens OUTWARD toward -Z, 
            // so +Z (the paper face) stays on the OUTSIDE of the convex hull.
            const rxMat = new THREE.Matrix4().makeRotationX(-node.fa);
            localAssembled.multiply(rxMat);
        }

        const absFlat = parentFlat.clone().multiply(localFlat);
        const absAssembled = parentAssembled.clone().multiply(localAssembled);

        list.push({ id: node.id, type: node.type, flatMatrix: absFlat, assembledMatrix: absAssembled });

        if (node.children) {
            for (const child of node.children) traverse(child, node.type, absFlat, absAssembled, false);
        }
    }
    
    traverse(rootDef, null, new THREE.Matrix4(), new THREE.Matrix4(), true);
    return list;
}

const ABS_14 = buildAbsoluteLayout(NET_14);
const ABS_26 = buildAbsoluteLayout(NET_26);

// === 4. 面片装配组件 ===
const MappedFace = React.memo(({ faceDef, viewMode, strokes }: { faceDef: AbsoluteFace, viewMode: string, strokes: any[] }) => {
    const groupRef = useRef<THREE.Group>(null);
    const isSquare = faceDef.type === 'square';
    const isAssemble = viewMode === 'assemble';

    // 瞬间切换矩阵，无动画带来的卡顿和折射溢出
    useFrame(() => {
        if (!groupRef.current) return;
        const targetMat = isAssemble ? faceDef.assembledMatrix : faceDef.flatMatrix;
        groupRef.current.matrixAutoUpdate = false;
        groupRef.current.matrix.copy(targetMat);
        
        // 当处于 assemble 模式，将整体翻转面向镜头，否则保持平铺
        if (isAssemble) {
            // 补偿视角旋转，使组装好的立体感正对镜头，同时因为折叠方向改为了 outward，重新调整角度展示
            const viewAdj = new THREE.Matrix4().makeRotationX(-Math.PI/2).premultiply(new THREE.Matrix4().makeRotationY(Math.PI/4));
            groupRef.current.matrix.premultiply(viewAdj);
        }
        groupRef.current.updateMatrixWorld(true);
    });

    return (
        <group ref={groupRef} userData={{ faceId: faceDef.id }}>
            {/* 煤精统一黑体，白色边缘线 */}
            <mesh geometry={isSquare ? squareBaseGeo : triangleBaseGeo}>
                <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
                <Edges scale={1.001} threshold={1} color="#ffffff" opacity={0.6} transparent />
            </mesh>
            
            <mesh geometry={isSquare ? squarePaperGeo : trianglePaperGeo} position={[0, 0, 0.81]} userData={{ isPaper: true }}>
                <meshStandardMaterial color="#111111" roughness={0.8} />
            </mesh>

            {/* Flat mode 下展示纯白虚线 */}
            {!isAssemble && faceDef.id !== 's0' && (
                <lineSegments geometry={squareDashedHinge}>
                    <lineDashedMaterial color="#ffffff" dashSize={2} gapSize={2} opacity={0.8} transparent />
                </lineSegments>
            )}

            {strokes.filter(s => s.faceId === faceDef.id).map(line => (
                <VolumetricLine key={line.id} points={line.points} color={line.color} />
            ))}
        </group>
    );
});

const CoalSealSystem = ({ activeTopology, viewMode, activeTool, activeColor, strokes, setStrokes }: any) => {
    const isDrawing = useRef(false);
    const lastPoint = useRef<{ faceId: string, pt: THREE.Vector3 } | null>(null);
    const activeLayout = activeTopology === 'NET_14' ? ABS_14 : ABS_26;

    const getHitContext = (e: any) => {
        const hit = e.intersections.find((i: any) => i.object.userData.isPaper);
        if (!hit) return null;
        // The parent group holds the faceId and correct local matrix
        const group = hit.object.parent;
        const faceId = group.userData.faceId;
        const localPt = group.worldToLocal(hit.point.clone());
        localPt.z += 0.25; 
        return { faceId, pt: localPt };
    };

    const onPointerDown = useCallback((e: any) => {
        if (activeTool === 'drag' || viewMode !== 'paint') return;
        const ctx = getHitContext(e);
        if (!ctx) return;

        isDrawing.current = true;
        e.stopPropagation();

        lastPoint.current = ctx;
        setStrokes((prev: any) => [...prev, { id: Date.now(), faceId: ctx.faceId, color: activeTool === 'eraser' ? '#ffffff' : activeColor, points: [ctx.pt] }]);
    }, [activeTool, viewMode, activeColor]);

    const onPointerMove = useCallback((e: any) => {
        if (!isDrawing.current || activeTool === 'drag' || viewMode !== 'paint') return;
        const ctx = getHitContext(e);
        if (!ctx) { lastPoint.current = null; return; }

        e.stopPropagation();

        if (lastPoint.current && lastPoint.current.faceId !== ctx.faceId) {
            setStrokes((prev: any) => [...prev, { id: Date.now(), faceId: ctx.faceId, color: activeTool === 'eraser' ? '#ffffff' : activeColor, points: [ctx.pt] }]);
        } else {
            setStrokes((prev: any) => {
                const newStrokes = [...prev];
                const activeStrokeMatches = newStrokes.filter(s => s.faceId === ctx.faceId);
                if (activeStrokeMatches.length === 0) return prev;
                
                const currentStroke = activeStrokeMatches[activeStrokeMatches.length - 1];
                const lastPt = currentStroke.points[currentStroke.points.length - 1];
                if (lastPt && lastPt.distanceTo(ctx.pt) > 0.5) { 
                    currentStroke.points = [...currentStroke.points, ctx.pt];
                }
                return newStrokes;
            });
        }
        lastPoint.current = ctx;
    }, [activeTool, viewMode, activeColor]);

    const onPointerUp = () => { isDrawing.current = false; lastPoint.current = null; };

    return (
        <group 
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
        >
            {activeLayout.map(faceDef => (
                <MappedFace key={faceDef.id} faceDef={faceDef} viewMode={viewMode} strokes={strokes} />
            ))}
        </group>
    );
};

export default function CoalSealPlugin() {
    const [viewMode, setViewMode] = useState<'paint' | 'assemble'>('paint'); 
    const [activeTool, setActiveTool] = useState<'pencil' | 'eraser' | 'drag'>('pencil'); 
    const [activeColor, setActiveColor] = useState(PALETTE[0]);
    const [activeTopology, setActiveTopology] = useState<'NET_14' | 'NET_26'>('NET_14');
    
    // 全量画笔记录：[ { id, faceId, color, points[] } ]
    const [strokes, setStrokes] = useState<any[]>([]);

    const cursorClassName = useMemo(() => {
        if (activeTool === 'drag') return 'cursor-grab';
        if (viewMode === 'paint') return 'cursor-crosshair';
        return 'cursor-alias';
    }, [activeTool, viewMode]);

    return (
        <div className="w-full h-screen flex bg-[#0a0a0a] text-white font-sans overflow-hidden">
            <div className="w-[320px] bg-neutral-900 border-r border-white/10 flex flex-col z-10 shrink-0 shadow-2xl">
                <div className="p-6 border-b border-white/10">
                    <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">L1-16</span>
                    <h1 className="font-black text-lg tracking-widest text-neutral-200 mt-1 uppercase">煤精组印</h1>
                </div>
                
                <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                    
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-white/50 tracking-widest">拓扑底板结构</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => { setActiveTopology('NET_14'); setStrokes([]); }} className={`py-4 rounded-xl text-xs font-black tracking-widest uppercase border transition-all ${activeTopology === 'NET_14' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-white/5 text-white/30'}`}><Shapes className="w-4 h-4 mx-auto mb-2 opacity-50" /> 14面体</button>
                            <button onClick={() => { setActiveTopology('NET_26'); setStrokes([]); }} className={`py-4 rounded-xl text-xs font-black tracking-widest uppercase border transition-all ${activeTopology === 'NET_26' ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'border-white/5 text-white/30'}`}><Shapes className="w-4 h-4 mx-auto mb-2 opacity-50" /> 26面体</button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-white/50 tracking-widest">工坊阶段</label>
                        <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
                            <button onClick={() => setViewMode('paint')} className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-lg transition-all ${viewMode === 'paint' ? 'bg-emerald-600 text-white shadow-lg' : 'text-white/40'}`}><Layers2 className="w-4 h-4"/> 1. 平铺作画</button>
                            <button onClick={() => setViewMode('assemble')} className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-lg transition-all ${viewMode === 'assemble' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40'}`}><Box className="w-4 h-4"/> 2. 立体组装</button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-bold text-white/50 tracking-widest">工具箱 (互斥操作)</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setActiveTool('drag')} className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${activeTool === 'drag' ? 'bg-amber-600 border-amber-500 shadow-xl' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}><Hand className="w-6 h-6"/></button>
                            <button onClick={() => setActiveTool('pencil')} className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${activeTool === 'pencil' ? 'bg-emerald-600 border-emerald-500 shadow-xl' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}><Pencil className="w-6 h-6"/></button>
                            
                            {activeTool !== 'drag' && (
                                <div className="col-span-2 space-y-3 pt-3">
                                    <div className="flex gap-2.5">
                                        <button onClick={() => setActiveTool('eraser')} className={`p-2 rounded flex-1 flex justify-center items-center border ${activeTool === 'eraser' ? 'bg-white text-black border-white' : 'bg-black text-white border-white/20'}`}><Eraser className="w-4 h-4"/></button>
                                        {PALETTE.map(c => ( <button key={c} onClick={() => { setActiveColor(c); setActiveTool('pencil'); }} className={`w-8 h-8 rounded-full border-2 transition-transform ${activeColor === c && activeTool === 'pencil' ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} /> ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-white/10">
                        <button onClick={() => setStrokes([])} className="flex-1 py-4 rounded-xl bg-white/5 text-[10px] font-black tracking-widest uppercase text-white/40 hover:text-red-400 hover:border-red-500/50 border border-transparent transition-all">
                            <Trash2 className="w-4 h-4 mx-auto mb-1" /> 清理印面
                        </button>
                    </div>

                </div>

                <div className="p-6">
                    <button className="w-full py-4 rounded bg-neutral-800 font-bold text-sm flex justify-center items-center gap-2 text-white/50 cursor-not-allowed">
                        <Download className="w-4 h-4" /> 导出 3MF 物理切片 (TODO)
                    </button>
                </div>
            </div>

            <div className={`flex-1 relative bg-[#f8f9fa] ${cursorClassName}`}>
                <ThreeCanvas camera={{ position: [0, 0, 260], fov: 45 }}>
                    <color attach="background" args={['#f8f9fa']} />
                    <ambientLight intensity={0.9} />
                    <directionalLight position={[50, 100, 100]} intensity={1.5} />
                    <Environment preset="city" />
                    
                    <OrbitControls 
                        makeDefault 
                        enableRotate={viewMode === 'assemble' || activeTool === 'drag'} 
                        mouseButtons={{
                            LEFT: (activeTool === 'drag') ? THREE.MOUSE.ROTATE : null as any, 
                            MIDDLE: THREE.MOUSE.DOLLY,
                            RIGHT: THREE.MOUSE.ROTATE
                        }}
                    />
                    
                    <Center>
                        <CoalSealSystem activeTopology={activeTopology} viewMode={viewMode} activeTool={activeTool} activeColor={activeColor} strokes={strokes} setStrokes={setStrokes} />
                    </Center>
                </ThreeCanvas>
            </div>
        </div>
    );
}
