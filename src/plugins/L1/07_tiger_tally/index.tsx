import { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF, Center } from '@react-three/drei';
import { Geometry, Base, Addition, Subtraction } from '@react-three/csg';
import { ArrowLeft, Box, Cylinder, Diamond, Download, Trash2, Plus, Zap, RefreshCcw } from 'lucide-react';
import * as THREE from 'three';
import { STLExporter } from 'three-stdlib';

interface Cutter {
    id: number;
    type: string;
    y: number;
    z: number;
    scale: number;
}

interface TallyProps {
    isEncrypted: boolean;
    cutters: Cutter[];
    exportRef: React.MutableRefObject<(() => void) | null>;
}

function TallyEncryptionLab({ isEncrypted, cutters, exportRef }: TallyProps) {
    const MODEL_URL = `${import.meta.env.BASE_URL}models/tiger_tally.glb`;
    const { scene } = useGLTF(MODEL_URL) as any;
    const exportGroupRef = useRef<THREE.Group>(null);
    
    const [viewScale, setViewScale] = useState(1);
    const [meshes, setMeshes] = useState<THREE.Mesh[]>([]);
    const [modelCenter, setModelCenter] = useState(new THREE.Vector3(0, 0, 0));

    // 核心确保属性完全一致 (解决 CSG Cannot read properties of undefined (reading 'array') 的根本原因)
    const ensureAttributes = (geometry: THREE.BufferGeometry) => {
        const cleanGeom = new THREE.BufferGeometry();
        if (geometry.attributes.position) {
            cleanGeom.setAttribute('position', (geometry.attributes.position as THREE.BufferAttribute).clone());
        }
        if (geometry.attributes.normal) {
            cleanGeom.setAttribute('normal', (geometry.attributes.normal as THREE.BufferAttribute).clone());
        } else {
            geometry.computeVertexNormals();
            if (geometry.attributes.normal) cleanGeom.setAttribute('normal', (geometry.attributes.normal as THREE.BufferAttribute).clone());
        }
        // 最关键修复：统一强行补齐 uv 属性，否则 CSG 多材质合并时会直接崩溃
        if (geometry.attributes.uv) {
            cleanGeom.setAttribute('uv', (geometry.attributes.uv as THREE.BufferAttribute).clone());
        } else if (geometry.attributes.position) {
            const count = (geometry.attributes.position as THREE.BufferAttribute).count;
            cleanGeom.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
        }
        if (geometry.index) {
            cleanGeom.setIndex(geometry.index.clone());
        }
        return cleanGeom;
    };

    // 核心修复1：深层遍历网格，并执行“暴力”属性清洗 
    useEffect(() => {
        if (!scene) return;
        
        const extracted: THREE.Mesh[] = [];
        scene.traverse((child: any) => {
            if (child.isMesh) {
                child.geometry = ensureAttributes(child.geometry);
                extracted.push(child);
            }
        });
        setMeshes(extracted);

        const box = new THREE.Box3().setFromObject(scene);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = box.getSize(new THREE.Vector3());
        
        setModelCenter(center); 
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            setViewScale(6 / maxDim); 
        }
    }, [scene]);

    // 核心修复2：预生成“净值”属性的切刀几何体缓存
    const cuttersGeomCache = useMemo(() => {
        const box = new THREE.BoxGeometry(1, 1, 1);
        const cyl = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 32);
        cyl.rotateX(Math.PI / 2);
        const diamond = new THREE.OctahedronGeometry(0.8);
        
        return { 
            box: ensureAttributes(box), 
            cylinder: ensureAttributes(cyl), 
            diamond: ensureAttributes(diamond) 
        };
    }, []);

    // 动态生成缩放后的切刀
    const getCutterGeometry = (type: string, scale: number) => {
        const base = cuttersGeomCache[type as 'box' | 'cylinder' | 'diamond'];
        const cloned = base.clone();
        cloned.scale(scale, scale, scale);
        return cloned;
    };

    // 挂载 CSG 导出引擎 (所见即所得导出)
    useEffect(() => {
        exportRef.current = () => {
            if (!exportGroupRef.current) return;
            const exporter = new STLExporter();
            // 核心修复：重构纯净导出组，剔除 `@react-three/csg` 遗留的隐形操作数以及未加密时的全息网格
            const cleanExportGroup = new THREE.Group();
            
            exportGroupRef.current.children.forEach(halfGroup => {
                if (halfGroup.type === 'Group') {
                    // 第一个子元素永远是挂载基础/运算结果几何体的主 Mesh
                    const targetMesh = halfGroup.children[0] as THREE.Mesh;
                    if (targetMesh && targetMesh.isMesh) {
                        const cleanMesh = new THREE.Mesh(targetMesh.geometry.clone(), new THREE.MeshBasicMaterial());
                        // 继承左右分离状态，便于切片软件中直接双拼打印
                        cleanMesh.position.copy(halfGroup.position);
                        cleanMesh.rotation.copy(halfGroup.rotation);
                        cleanMesh.scale.copy(halfGroup.scale);
                        cleanExportGroup.add(cleanMesh);
                    }
                }
            });
            
            // 核心修复2：切片软件默认 1 unit = 1 mm。
            // 之前的 `viewScale` 是为了将最长边压缩到 6 使得网页能够显示全 (即 maxDim = 6 / viewScale)
            // 用户要求物理切片模型最大高度为 100mm 左右。
            // 因此我们需要计算缩放因子：100 / maxDim = 100 / (6 / viewScale) = (viewScale / 6) * 100
            cleanExportGroup.scale.setScalar((viewScale / 6) * 100);
            cleanExportGroup.updateMatrixWorld(true);
            
            const stlString = exporter.parse(cleanExportGroup);
            const blob = new Blob([stlString], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const aLink = document.createElement('a');
            aLink.href = url;
            aLink.download = `tiger_tally_encrypted_${Date.now()}.stl`;
            document.body.appendChild(aLink);
            aLink.click();
            document.body.removeChild(aLink);
            URL.revokeObjectURL(url);
        };
    }, [exportRef, viewScale]);

    const offset = 1.5; // 固定分离距离，左右平分

    // 根据几何体物理中心坐标，严格判定哪一个是左半符，哪一个是右半符
    const sortedMeshes = useMemo(() => {
        if (meshes.length < 2) return [];
        const m1 = meshes[0];
        const m2 = meshes[1];
        m1.geometry.computeBoundingBox();
        m2.geometry.computeBoundingBox();
        const center1 = m1.geometry.boundingBox!.getCenter(new THREE.Vector3());
        const center2 = m2.geometry.boundingBox!.getCenter(new THREE.Vector3());
        return center1.x < center2.x ? [m1, m2] : [m2, m1];
    }, [meshes]);

    const leftMesh = sortedMeshes[0];
    const rightMesh = sortedMeshes[1];

    const { leftMatingPlaneX, rightMatingPlaneX } = useMemo(() => {
        if (!leftMesh || !rightMesh) return { leftMatingPlaneX: 0, rightMatingPlaneX: 0 };
        leftMesh.geometry.computeBoundingBox();
        rightMesh.geometry.computeBoundingBox();
        return {
            leftMatingPlaneX: leftMesh.geometry.boundingBox!.max.x,
            rightMatingPlaneX: rightMesh.geometry.boundingBox!.min.x
        };
    }, [leftMesh, rightMesh]);

    // 容错警报覆盖
    if (meshes.length < 2 || !leftMesh || !rightMesh) {
        return (
            <mesh>
                <boxGeometry args={[2, 2, 2]} />
                <meshBasicMaterial color="#ef4444" wireframe />
            </mesh>
        );
    }

    return (
        <group scale={viewScale} ref={exportGroupRef}>
            {/* 左半符 (私钥层 - 差集打孔) */}
            <group position={[-offset, 0, 0]}>
                <mesh castShadow receiveShadow>
                    <meshStandardMaterial color="#c0a060" metalness={0.8} roughness={0.3} />
                    {isEncrypted ? (
                        <Geometry>
                            <Base geometry={leftMesh.geometry} position={leftMesh.position} rotation={leftMesh.rotation} scale={leftMesh.scale} />
                            {cutters.map(cutter => (
                                <Subtraction key={cutter.id} geometry={getCutterGeometry(cutter.type, cutter.scale)} position={[leftMatingPlaneX, modelCenter.y + cutter.y, modelCenter.z + cutter.z]} />
                            ))}
                        </Geometry>
                    ) : (
                        <primitive object={leftMesh.geometry} attach="geometry" />
                    )}
                </mesh>
                {/* 待加密时附着于左半符的全息切刀 (明确展示差集范围) */}
                {!isEncrypted && cutters.map(cutter => (
                    <mesh key={`ghost-left-${cutter.id}`} geometry={getCutterGeometry(cutter.type, cutter.scale)} position={[leftMatingPlaneX, modelCenter.y + cutter.y, modelCenter.z + cutter.z]}>
                        <meshBasicMaterial color="#ef4444" wireframe transparent opacity={0.6} depthWrite={false} />
                    </mesh>
                ))}
            </group>

            {/* 右半符 (公钥层 - 并集凸起) */}
            <group position={[offset, 0, 0]}>
                <mesh castShadow receiveShadow>
                    <meshStandardMaterial color="#c0a060" metalness={0.8} roughness={0.3} />
                    {isEncrypted ? (
                        <Geometry>
                            <Base geometry={rightMesh.geometry} position={rightMesh.position} rotation={rightMesh.rotation} scale={rightMesh.scale} />
                            {cutters.map(cutter => (
                                <Addition key={cutter.id} geometry={getCutterGeometry(cutter.type, cutter.scale)} position={[rightMatingPlaneX, modelCenter.y + cutter.y, modelCenter.z + cutter.z]} />
                            ))}
                        </Geometry>
                    ) : (
                        <primitive object={rightMesh.geometry} attach="geometry" />
                    )}
                </mesh>
                {/* 待加密时附着于右半符的实体模型 (明确展示并集模型) */}
                {!isEncrypted && cutters.map(cutter => (
                    <mesh key={`solid-right-${cutter.id}`} geometry={getCutterGeometry(cutter.type, cutter.scale)} position={[rightMatingPlaneX, modelCenter.y + cutter.y, modelCenter.z + cutter.z]} castShadow receiveShadow>
                        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

export default function Plugin({ config: _config }: { config: any }) {
    const [isEncrypted, setIsEncrypted] = useState(false);
    const [cutters, setCutters] = useState([
        { id: 1, type: 'box', y: 0, z: 0, scale: 1.0 }
    ]);
    const exportRef = useRef<(() => void) | null>(null);

    const addCutter = () => {
        if (cutters.length >= 3) return;
        setCutters([...cutters, { id: Date.now(), type: 'cylinder', y: 1.5, z: 0, scale: 0.8 }]);
    };

    const updateCutter = (id: number, key: string, value: any) => {
        setCutters(cutters.map(c => c.id === id ? { ...c, [key]: value } : c));
    };

    const removeCutter = (id: number) => {
        if (cutters.length > 1) setCutters(cutters.filter(c => c.id !== id));
    };

    return (
        <div className="w-full h-screen flex bg-slate-950 text-white overflow-hidden font-sans">
            <div className="w-[400px] bg-slate-900 border-r border-white/10 flex flex-col z-10 shadow-2xl">
                <div className="p-6 border-b border-white/10 flex items-center gap-4 shrink-0">
                    <button onClick={() => window.parent.postMessage({ type: 'EXIT_PLUGIN' }, '*')} className="text-white/50 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-orange-600/20 text-orange-500 text-[10px] font-black uppercase tracking-tighter">L1-07</span>
                        <h1 className="font-black text-sm italic tracking-widest text-orange-400 font-sans">秦虎符：加密演算层</h1>
                    </div>
                </div>

                <div className="p-6 space-y-6 flex-1 overflow-y-auto scrollbar-hide bg-slate-900">
                    <label className="text-[10px] font-black text-white/50 tracking-widest uppercase block">物理密钥阵列 (多重加密层)</label>
                    
                    {cutters.map((cutter, index) => (
                        <div key={cutter.id} className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-4 relative group">
                            <div className="flex justify-between items-center transition-opacity">
                                <span className="text-[10px] font-black text-orange-500 uppercase italic">物理密匙-{index+1}</span>
                                {cutters.length > 1 && (
                                    <button onClick={() => removeCutter(cutter.id)} className="text-white/20 hover:text-red-400 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'box', icon: Box },
                                    { id: 'cylinder', icon: Cylinder },
                                    { id: 'diamond', icon: Diamond }
                                ].map(t => (
                                    <button 
                                        key={t.id} onClick={() => updateCutter(cutter.id, 'type', t.id)}
                                        className={`p-2 rounded-lg border flex justify-center items-center transition-all ${cutter.type === t.id ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-lg shadow-orange-500/10' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                                    >
                                        <t.icon size={16} />
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[9px] text-white/30 font-bold uppercase"><span>缩放比例</span><span>{cutter.scale.toFixed(1)}x</span></div>
                                    <input type="range" min="0.1" max="10" step="0.1" value={cutter.scale} onChange={e => updateCutter(cutter.id, 'scale', parseFloat(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500" disabled={isEncrypted} />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[9px] text-white/30 font-bold uppercase"><span>Y轴 垂直位移</span><span>{cutter.y.toFixed(1)}</span></div>
                                    <input type="range" min="-10" max="10" step="0.5" value={cutter.y} onChange={e => updateCutter(cutter.id, 'y', parseFloat(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500" disabled={isEncrypted} />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[9px] text-white/30 font-bold uppercase"><span>Z轴 深度位移</span><span>{cutter.z.toFixed(1)}</span></div>
                                    <input type="range" min="-10" max="10" step="0.5" value={cutter.z} onChange={e => updateCutter(cutter.id, 'z', parseFloat(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500" disabled={isEncrypted} />
                                </div>
                            </div>
                        </div>
                    ))}

                    {cutters.length < 3 && (
                        <button onClick={addCutter} className="w-full py-4 rounded-2xl border border-dashed border-white/20 text-white/30 hover:border-white/40 hover:text-white transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/0 hover:bg-white/5">
                            <Plus className="w-4 h-4" /> 增加多重加密层级
                        </button>
                    )}
                </div>

                <div className="p-6 border-t border-white/10 bg-slate-900/80 backdrop-blur-xl shrink-0 space-y-3">
                    <button 
                        onClick={() => setIsEncrypted(!isEncrypted)} 
                        className={`w-full py-4 rounded-xl font-black text-sm flex justify-center items-center gap-3 transition-all shadow-xl ${isEncrypted ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-orange-600 text-white hover:bg-orange-500 hover:shadow-orange-500/20'}`}
                    >
                        {isEncrypted ? <><RefreshCcw className="w-5 h-5" /> 一键复原 (进入设计模式)</> : <><Zap className="w-5 h-5" /> 一键加密 (进行布尔运算)</>}
                    </button>

                    <button 
                        onClick={() => exportRef.current && exportRef.current()}
                        className="w-full py-4 rounded-xl font-bold text-xs bg-white/10 text-white hover:bg-white/20 transition-all flex justify-center items-center gap-2 border border-white/10 uppercase tracking-widest"
                    >
                        <Download className="w-4 h-4" /> 导出加密结构件 (STL)
                    </button>
                </div>
            </div>

            <div className="flex-1 relative bg-[radial-gradient(circle_at_50%_40%,_#1e293b_0%,_#020617_100%)]">
                <Canvas camera={{ position: [0, 4, 12], fov: 35 }}>
                    <OrbitControls makeDefault minDistance={3} maxDistance={40} />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 10]} intensity={2} castShadow />
                    <Environment preset="city" />
                    <Center top>
                        <Suspense fallback={null}>
                            <TallyEncryptionLab isEncrypted={isEncrypted} cutters={cutters} exportRef={exportRef} />
                        </Suspense>
                    </Center>
                    <ContactShadows position={[0, -0.6, 0]} opacity={0.5} scale={20} blur={2.4} far={4} color="#000" />
                </Canvas>

                {/* 装饰层 */}
                <div className="absolute top-8 right-8 z-20 flex flex-col items-end gap-1 font-sans">
                    <span className="text-[10px] font-black italic text-orange-500 uppercase tracking-tighter">CSG Attribute Parity</span>
                    <h2 className="text-2xl font-black italic text-white uppercase tracking-widest leading-none text-right">Tiger Tally<br/><span className="text-sm font-bold opacity-50 font-sans">Encryption Matrix</span></h2>
                </div>
            </div>
        </div>
    );
}
