import { useState, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { STLExporter } from 'three-stdlib';
import { Trash2, Download, Zap, Move3D, MousePointer2, BoxSelect } from 'lucide-react';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Stroke {
  id: string;
  points: Point3D[];
  isMirror?: boolean;
}

// 扁平金丝截面定义 (Shape: 0.03 x 0.15 矩形)
const filigreeShape = new THREE.Shape();
const w = 0.015; // 半宽
const h = 0.075; // 半高
filigreeShape.moveTo(-w, -h);
filigreeShape.lineTo(w, -h);
filigreeShape.lineTo(w, h);
filigreeShape.lineTo(-w, h);
filigreeShape.lineTo(-w, -h);

const FiligreeExtrusion = ({ points }: { points: Point3D[] }) => {
  const curve = useMemo(() => {
    if (points.length < 2) return null;
    const v3Points = points.map(p => new THREE.Vector3(p.x, p.y, p.z));
    return new THREE.CatmullRomCurve3(v3Points);
  }, [points]);

  if (!curve) return null;

  return (
    <mesh>
      <extrudeGeometry 
        args={[
          filigreeShape, 
          { 
            extrudePath: curve, 
            bevelEnabled: false, 
            steps: Math.max(points.length * 2, 64) 
          }
        ]} 
      />
      <meshStandardMaterial 
        color="#D4AF37" 
        metalness={0.9} 
        roughness={0.1} 
        emissive="#D4AF37"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
};

export default function CloisonneEngine({ config }: { config: any }) {
  console.log('Engine started with lesson:', config?.lessonId);
  const [strokes, setStroking] = useState<Stroke[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point3D[]>([]);
  const [symmetry, setSymmetry] = useState(true);
  const sceneRef = useRef<THREE.Group>(null);
  const orbitalRef = useRef<any>(null);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    // 强制停止轨道控制器，防止绘图时相机移动
    if (orbitalRef.current) orbitalRef.current.enabled = false;
    setCurrentPoints([e.point]);
  };

  const handlePointerMove = (e: any) => {
    if (currentPoints.length === 0) return;
    e.stopPropagation();
    
    const p = e.point;
    const lastPoint = currentPoints[currentPoints.length - 1];
    const dist = new THREE.Vector3(p.x, p.y, p.z).distanceTo(new THREE.Vector3(lastPoint.x, lastPoint.y, lastPoint.z));
    
    if (dist > 0.05) {
      setCurrentPoints([...currentPoints, p]);
    }
  };

  const handlePointerUp = () => {
    if (currentPoints.length > 1) {
      const id = Math.random().toString(36).substr(2, 9);
      const newStrokes: Stroke[] = [{ id, points: currentPoints }];
      
      if (symmetry) {
        newStrokes.push({ 
          id: id + '_mirror', 
          points: currentPoints.map(p => ({ x: -p.x, y: p.y, z: p.z })),
          isMirror: true
        });
      }
      
      setStroking([...strokes, ...newStrokes]);
    }
    setCurrentPoints([]);
    if (orbitalRef.current) orbitalRef.current.enabled = true;
  };

  const handleExport = () => {
    if (!sceneRef.current) return;
    
    const exporter = new STLExporter();
    const result = exporter.parse(sceneRef.current, { binary: true });
    const blob = new Blob([result as any], { type: 'application/octet-stream' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cloisonne_p0_${Date.now()}.stl`;
    link.click();
    URL.revokeObjectURL(url);

    window.parent.postMessage({ 
      type: 'ACTION_COMPLETE', 
      action: 'EXPORT_SUCCESS',
      metadata: { strokeCount: strokes.length }
    }, '*');
  };

  const clearCanvas = () => setStroking([]);

  return (
    <div className="relative w-full h-full bg-[#020617] flex gap-1 p-4">
      
      <div className="flex-1 rounded-[32px] overflow-hidden border border-white/5 bg-[#0a0f1e] relative">
        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={50} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} castShadow />
          <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />
          
          <Environment preset="city" />
          <ContactShadows position={[0, -6, 0]} opacity={0.4} scale={20} blur={2} />

          {/* 核心实体 Group - 仅用于导出 */}
          <group ref={sceneRef}>
            {strokes.map(s => <FiligreeExtrusion key={s.id} points={s.points} />)}
            {currentPoints.length > 1 && (
              <>
                <FiligreeExtrusion points={currentPoints} />
                {symmetry && <FiligreeExtrusion points={currentPoints.map(p => ({ x: -p.x, y: p.y, z: p.z }))} />}
              </>
            )}
          </group>

          {/* 对称辅助线 - 移出 sceneRef 避免导出 */}
          {symmetry && (
            <mesh position={[0, 0, -0.1]}>
              <planeGeometry args={[0.02, 10]} />
              <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} />
            </mesh>
          )}

          {/* 全屏透明画板 Mesh - 负责 3D Raycasting */}
          <mesh 
            position={[0, 0, 0]} 
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <planeGeometry args={[50, 50]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>

          <OrbitControls ref={orbitalRef} enableDamping minDistance={5} maxDistance={20} />
        </Canvas>

        {/* 顶部 UI */}
        <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
          <div className="px-5 py-2.5 bg-blue-600/10 backdrop-blur-xl border border-blue-500/30 rounded-full flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">
              实时掐丝引擎 v3.0
            </span>
          </div>
        </div>

        {/* 底部 UI */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-slate-900/90 backdrop-blur-2xl p-4 rounded-[32px] border border-white/10 shadow-2xl">
          <button onClick={clearCanvas} className="p-3.5 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-2xl transition-all">
            <Trash2 className="w-5 h-5" />
          </button>
          
          <div className="w-[1px] h-8 bg-white/10 mx-1" />

          <button 
            onClick={() => setSymmetry(!symmetry)}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all ${symmetry ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500'}`}
          >
            <BoxSelect className="w-4 h-4" />
            对称模式
          </button>

          <button 
            onClick={handleExport}
            className="flex items-center gap-3 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs tracking-[0.2em] uppercase shadow-lg shadow-blue-900/40 transition-all active:scale-95"
          >
            <Download className="w-5 h-5" /> 导出 STL 模型
          </button>
        </div>
      </div>
      
      {/* 侧边信息面板 */}
      <div className="w-72 bg-[#0a0f1e] rounded-[32px] border border-white/5 p-6 flex flex-col gap-6">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-white/40 uppercase tracking-widest">工作区</h3>
          <p className="text-lg font-black text-white italic">景泰蓝掐丝实验室</p>
        </div>

        <div className="flex-1 space-y-4 mt-4">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">
              <MousePointer2 className="w-3 h-3" /> 绘制提示
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              直接在 3D 视图中拖拽鼠标或触控绘制扁平金丝。
            </p>
          </div>
          
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">
              <Move3D className="w-3 h-3" /> 视角控制
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              右键或双指平移旋转视图，滚轮缩放。
            </p>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-white/5">
          <div className="flex justify-between items-center text-[10px] font-black text-white/20 uppercase tracking-widest">
            <span>笔画数: {strokes.length}</span>
            <span>Ver: P0_B16</span>
          </div>
        </div>
      </div>

    </div>
  );
}
