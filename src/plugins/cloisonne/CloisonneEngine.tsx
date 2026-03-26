import { useState, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { STLExporter, SVGLoader } from 'three-stdlib';
import { Trash2, Zap, Layers3, Settings2, MousePointer2 } from 'lucide-react';
// @ts-ignore
import ImageTracer from 'imagetracerjs';

const RASTR_RES = 2048;

// --- 辅助工具函数 ---

// 数据点移动平均平滑过滤器 (去除抖动)
const smoothPoints = (points: { x: number; y: number }[]): { x: number; y: number }[] => {
  if (points.length < 3) return points;
  const smoothed = [points[0]];
  const windowSize = 5; // 平滑窗口大小
  for (let i = 1; i < points.length - 1; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(points.length, i + Math.floor(windowSize / 2) + 1);
    const windowPoints = points.slice(start, end);
    smoothed.push({
      x: windowPoints.reduce((sum, p) => sum + p.x, 0) / windowPoints.length,
      y: windowPoints.reduce((sum, p) => sum + p.y, 0) / windowPoints.length
    });
  }
  smoothed.push(points[points.length - 1]);
  return smoothed;
};

// --- 实时 3D 渲染组件 ---

// 金丝实时挤出几何体组件 (扁平矩形截面)
const FiligreeMesh = ({ points, thickness }: { points: { x: number; y: number }[], thickness: number }) => {
  const curve = useMemo(() => {
    if (points.length < 2) return null;
    const v3Points = points.map(p => new THREE.Vector3(p.x, p.y, 0));
    return new THREE.CatmullRomCurve3(v3Points);
  }, [points]);

  // 定义扁平金丝的 Shape 截面
  const wireShape = useMemo(() => {
    const s = new THREE.Shape();
    // 渲染时的厚度反馈
    const h = 0.15; 
    const w = thickness * 0.5; // 根据滑块动态计算宽度
    s.moveTo(-w, -h/2);
    s.lineTo(w, -h/2);
    s.lineTo(w, h/2);
    s.lineTo(-w, h/2);
    s.lineTo(-w, -h/2);
    return s;
  }, [thickness]);

  if (!curve) return null;

  return (
    <mesh castShadow receiveShadow>
      <extrudeGeometry args={[wireShape, {
        extrudePath: curve,
        bevelEnabled: false,
        steps: 128
      }]} />
      <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} emissive="#D4AF37" emissiveIntensity={0.15} />
    </mesh>
  );
};

// --- 主引擎组件 ---

export default function CloisonneEngine({ config }: { config: any }) {
  console.log('Engine started with lesson:', config?.lessonId);
  const [strokes, setStrokes] = useState<{ id: string; points: { x: number; y: number }[]; thickness: number }[]>([]);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [symmetry, setSymmetry] = useState(true);
  const [wireThickness, setWireThickness] = useState(0.05);
  const sceneRef = useRef<THREE.Group>(null);
  const isDrawing = useRef(false);

  // --- 交互核心逻辑 (隐形画板 + 像素级精准对齐) ---

  const handlePointer = (e: any, type: string) => {
    if (type === 'down') {
      e.stopPropagation();
      e.target.setPointerCapture(e.pointerId);
      isDrawing.current = true;
      if (e.point) setCurrentPoints([new THREE.Vector2(e.point.x, e.point.y)]);
    } else if (type === 'move' && isDrawing.current && e.point) {
      const p = new THREE.Vector2(e.point.x, e.point.y);
      if (currentPoints.length > 0) {
        if (p.distanceTo(currentPoints[currentPoints.length - 1]) > 0.03) {
          setCurrentPoints([...currentPoints, p]);
        }
      } else {
        setCurrentPoints([p]);
      }
    } else if (type === 'up') {
      e.target.releasePointerCapture(e.pointerId);
      if (isDrawing.current && currentPoints.length > 1) {
        const smoothed = smoothPoints(currentPoints);
        const id = Math.random().toString(36).substr(2, 9);
        const newStrokes = [{ id, points: smoothed, thickness: wireThickness }];
        if (symmetry) {
          newStrokes.push({
            id: id + '_m',
            points: smoothed.map(pt => ({ x: -pt.x, y: pt.y })),
            thickness: wireThickness
          });
        }
        setStrokes([...strokes, ...newStrokes]);
      }
      setCurrentPoints([]);
      isDrawing.current = false;
    }
  };

  // --- 导出逻辑 (栅格化合并) ---

  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');

  const handleExport = () => {
    if (strokes.length === 0 || isExporting) return;
    setIsExporting(true);
    setExportStatus('正在合并所有路径...');

    const rasterCanvas = document.createElement('canvas');
    rasterCanvas.width = RASTR_RES;
    rasterCanvas.height = RASTR_RES;
    const ctx = rasterCanvas.getContext('2d');
    if (!ctx) { setIsExporting(false); return; }

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, RASTR_RES, RASTR_RES);
    ctx.translate(RASTR_RES / 2, RASTR_RES / 2);
    ctx.scale(RASTR_RES / 10, -RASTR_RES / 10);

    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokes.forEach(s => {
      if (s.points.length < 2) return;
      ctx.lineWidth = s.thickness; // 严格使用每笔画的存储粗细
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      ctx.stroke();
    });

    setExportStatus('正在提取流形轮廓...');

    // 使用 toDataURL 解决 ImageTracer 对象的 404 错误
    const base64DataUrl = rasterCanvas.toDataURL('image/png');
    ImageTracer.imageToSVG(base64DataUrl, (svgString: string) => {
      setExportStatus('正在执行 3D 打印挤出...');
      const loader = new SVGLoader();
      const svgData = loader.parse(svgString);

      const shapes : THREE.Shape[] = [];
      svgData.paths.forEach(path => {
        shapes.push(...SVGLoader.createShapes(path));
      });

      const geometry = new THREE.ExtrudeGeometry(shapes, { depth: 0.15, bevelEnabled: false });
      const scaleDown = 10 / RASTR_RES;
      geometry.scale(scaleDown, -scaleDown, 1);
      geometry.translate(-5, 5, 0);

      const exporter = new STLExporter();
      const result = exporter.parse(new THREE.Mesh(geometry), { binary: true });
      const url = URL.createObjectURL(new Blob([result as any], { type: 'application/octet-stream' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `cloisonne_printable_${Date.now()}.stl`;
      link.click();
      
      window.parent.postMessage({ type: 'ACTION_COMPLETE', action: 'EXPORT_SUCCESS' }, '*');
      setIsExporting(false);
      setExportStatus('');
    }, { ltres: 0.1, qtres: 0.1, scale: 1 });
  };

  return (
    <div className="relative w-full h-full bg-[#020617] flex gap-1 p-4 overflow-hidden font-sans text-slate-200">
      <div className="flex-1 rounded-[32px] overflow-hidden border border-white/5 bg-[#0a0f1e] relative shadow-2xl">
        <Canvas 
          shadows={{ type: THREE.PCFShadowMap }} 
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          dpr={[1, 2]}
        >
          {/* 正交相机锁死平视视角，确保像素级绘图精准度 */}
          <OrthographicCamera 
            makeDefault 
            position={[0, 0, 10]} 
            left={-5} 
            right={5} 
            top={5} 
            bottom={-5} 
            near={0.1} 
            far={100}
            zoom={60} 
          />
          
          <ambientLight intensity={0.6} />
          <Environment preset="studio" />
          
          <group ref={sceneRef}>
            {/* 隐形交互板：接受射线检测 */}
            <mesh 
              name="canvas_plate" 
              position={[0, 0, -0.01]} 
              onPointerDown={e => handlePointer(e, 'down')} 
              onPointerMove={e => handlePointer(e, 'move')} 
              onPointerUp={e => handlePointer(e, 'up')}
            >
              <planeGeometry args={[20, 20]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {/* 3D 渲染各色笔画 */}
            {strokes.map(s => <FiligreeMesh key={s.id} points={s.points} thickness={s.thickness} />)}
            {currentPoints.length > 1 && (
              <>
                <FiligreeMesh points={currentPoints} thickness={wireThickness} />
                {symmetry && <FiligreeMesh points={currentPoints.map(p => ({ x: -p.x, y: p.y }))} thickness={wireThickness} />}
              </>
            )}
          </group>

          {symmetry && <mesh position={[0, 0, -0.1]}><planeGeometry args={[0.02, 10]} /><meshBasicMaterial color="#3b82f6" transparent opacity={0.3} /></mesh>}

          <OrbitControls enableRotate={false} enableDamping minZoom={20} maxZoom={200} />
        </Canvas>

        {/* UI 控件：中文化及同步修复 */}
        <div className="absolute top-6 left-6 z-20 px-5 py-2.5 bg-blue-600/10 backdrop-blur-xl border border-blue-500/30 rounded-full flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-400 animate-pulse" />
          <span className="text-[10px] text-blue-400 font-black tracking-widest uppercase italic">REAL-TIME FILIGREE ENGINE v3.5</span>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-slate-900/90 backdrop-blur-2xl p-4 rounded-[32px] border border-white/10 shadow-2xl">
          <button onClick={() => setStrokes([])} className="p-3.5 bg-white/5 hover:bg-red-500/20 text-slate-400 rounded-2xl transition-all active:scale-95">
            <Trash2 className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setSymmetry(!symmetry)} 
            className={`px-6 py-3.5 rounded-2xl text-[10px] font-black tracking-widest border transition-all ${symmetry ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-white/5 text-slate-500 border-white/10'}`}
          >
            对称模式
          </button>

          <div className="flex flex-col gap-1 w-32 px-2">
            <label className="text-[10px] text-white/40 font-black tracking-widest uppercase flex items-center gap-1.5 leading-none mb-1">
              <Settings2 className="w-3 h-3" /> 金丝粗细
            </label>
            <input 
              type="range" 
              min="0.01" 
              max="0.12" 
              step="0.005" 
              value={wireThickness} 
              onChange={e => setWireThickness(parseFloat(e.target.value))} 
              className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400" 
            />
          </div>

          <button 
            onClick={handleExport} 
            disabled={isExporting} 
            className={`flex items-center gap-3 px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-900/50 ${isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-500 active:scale-95'}`}
          >
            <Layers3 className="w-5 h-5" /> {isExporting ? '导出中...' : '导出打印 STL'}
          </button>
        </div>

        {isExporting && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center rounded-[32px]">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-sm font-black text-white italic tracking-widest uppercase">实验室正在运作...</p>
              <p className="text-xs text-blue-400 animate-pulse font-bold">{exportStatus}</p>
            </div>
          </div>
        )}
      </div>

      <div className="w-80 bg-[#0a0f1e] rounded-[32px] border border-white/5 p-6 flex flex-col gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-1 mt-2">
          <h3 className="text-xs font-black text-white/30 tracking-widest uppercase flex items-center gap-2">
            <span className="w-1 h-1 bg-blue-500 rounded-full" /> Workspace
          </h3>
          <p className="text-2xl font-black text-white italic tracking-tighter">掐丝珐琅实验室</p>
        </div>
        
        <div className="p-5 bg-white/5 rounded-[24px] border border-white/5 text-[11px] text-slate-400 leading-relaxed font-medium space-y-5">
          <div className="space-y-2.5">
            <p className="font-black text-[10px] text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <MousePointer2 className="w-3 h-3" /> 绘制提示
            </p>
            <p className="pl-1 italic shadow-sm">直接在左侧 2D 画板上绘制圆润金丝。系统会自动执行高级平滑过滤，确保导出模型可打印。</p>
          </div>
          
          <div className="space-y-3 pt-2">
            <p className="font-black text-[10px] text-blue-400 uppercase tracking-widest">操作控制 (2D Mode)</p>
            <ul className="space-y-2 pl-1 italic">
              <li className="flex items-center gap-2 underline decoration-blue-500/30">视角：正交平视 (100% 像素级对齐)</li>
              <li className="flex items-center gap-2 underline decoration-blue-500/30">平移：按住右键或滚轮进行拖拽</li>
              <li className="flex items-center gap-2 underline decoration-blue-500/30">缩放：通过鼠标滚轮调整大小</li>
            </ul>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-black text-white/20 tracking-widest uppercase italic">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span>笔画总数: <span className="text-white/40">{strokes.length}</span></span>
          </div>
          <span className="text-[8px] opacity-30 italic">P0_BUGFIX_V3.5_OK</span>
        </div>
      </div>
    </div>
  );
}
