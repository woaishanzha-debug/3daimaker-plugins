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

// --- 3D 渲染组件 (仅用于 2D 视角下的视觉预览) ---

// 金丝实时挤出几何体组件 (扁平矩形截面)
const FiligreeMesh = ({ points, thickness }: { points: { x: number; y: number }[], thickness: number }) => {
  const curve = useMemo(() => {
    if (points.length < 2) return null;
    const v3Points = points.map(p => new THREE.Vector3(p.x, p.y, 0));
    return new THREE.CatmullRomCurve3(v3Points);
  }, [points]);

  // 定义扁平金丝的 Shape 截面 (在 2D 视角下看着像面)
  const wireShape = useMemo(() => {
    const s = new THREE.Shape();
    const h = 0.15; // 材质深度
    const w = thickness * 0.5; // 宽度的一半
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
  const [wireThickness, setWireThickness] = useState(0.05); // 默认 0.05
  const sceneRef = useRef<THREE.Group>(null);
  const isDrawing = useRef(false);

  // --- 交互核心逻辑 (射线检测与平滑) ---

  const handlePointer = (e: any, type: string) => {
    if (type === 'down') {
      e.stopPropagation(); // 防止与 OrbitControls 冲突
      e.target.setPointerCapture(e.pointerId); // 捕获光标
      isDrawing.current = true;
      if (e.point) setCurrentPoints([new THREE.Vector2(e.point.x, e.point.y)]);
    } else if (type === 'move' && isDrawing.current && e.point) {
      const p = new THREE.Vector2(e.point.x, e.point.y);
      if (currentPoints.length > 0) {
        // 数据过滤：仅在移动距离超过阈值时记录点，降低算力
        if (p.distanceTo(currentPoints[currentPoints.length - 1]) > 0.03) {
          setCurrentPoints([...currentPoints, p]);
        }
      } else {
        setCurrentPoints([p]);
      }
    } else if (type === 'up') {
      e.target.releasePointerCapture(e.pointerId); // 释放光标
      if (isDrawing.current && currentPoints.length > 1) {
        // 1. 应用自动平滑过滤器 (去除抖动)
        const smoothed = smoothPoints(currentPoints);

        const id = Math.random().toString(36);
        // 记录当前粗细
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

  // --- 核心导出逻辑 (栅格化 Boolean 并集管线) ---

  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');

  const handleExport = () => {
    if (strokes.length === 0 || isExporting) return;
    setIsExporting(true);
    setExportStatus('母舰正在合并金丝...');

    // 1. 创建高分辨率隐藏 2D Canvas (栅格化 Boolean 合并中枢)
    const rasterCanvas = document.createElement('canvas');
    rasterCanvas.width = RASTR_RES; rasterCanvas.height = RASTR_RES;
    const ctx = rasterCanvas.getContext('2d');
    if (!ctx) { setIsExporting(false); return; }

    // 初始化白色背景
    ctx.fillStyle = 'white'; ctx.fillRect(0, 0, RASTR_RES, RASTR_RES);
    // 坐标系变换：将 Three.js [-5, 5] 坐标系映射到 Canvas [0, RASTR_RES] 坐标系，并反转Y轴
    ctx.translate(RASTR_RES / 2, RASTR_RES / 2);
    ctx.scale(RASTR_RES / 10, -RASTR_RES / 10); // 1个世界单位 = (RASTR_RES/10) 像素

    // 2. 将所有笔画按粗细绘制成黑色墨迹 (利用渲染引擎实现完美 Boolean Union)
    ctx.fillStyle = 'black'; ctx.strokeStyle = 'black';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    strokes.forEach(s => {
      if (s.points.length < 2) return;
      // 缩放笔画粗细到 2D 坐标系中
      ctx.lineWidth = s.thickness;
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      ctx.stroke();
    });

    setExportStatus('兵工厂正在追踪轮廓...');

    // 3. 轮廓追踪 (Path Tracing)：将 2D 栅格墨迹追踪为封闭轮廓 SVG
    const imgData = ctx.getImageData(0, 0, RASTR_RES, RASTR_RES);
    // 使用 imagetracerjs 瞬间提取轮廓 (设定高精度配置)
    ImageTracer.imageToSVG(imgData, (svgString: string) => {
      setExportStatus('兵工厂正在进行 3D 打印挤出...');
      // 4. 一次性垂直挤出：解析轮廓 SVG 并生成完美的、无交叉的 3D 实体模型
      const loader = new SVGLoader();
      const svgData = loader.parse(svgString);

      const shapes : THREE.Shape[] = [];
      svgData.paths.forEach(path => {
        shapes.push(...SVGLoader.createShapes(path));
      });

      // 挤出深度 ( bevelEnabled: false 保证 3D 打印直边)
      const geometry = new THREE.ExtrudeGeometry(shapes, { depth: 0.15, bevelEnabled: false });

      // 修复 ImageTracer 的坐标偏移，将其移回 Three.js 场景中心 (-5, 5 映射)
      const inverseScale = 10 / RASTR_RES;
      geometry.scale(inverseScale, -inverseScale, 1);
      geometry.translate(-5, 5, 0); // 逆向移位

      // 5. STL 导出闭环
      const exporter = new STLExporter();
      const result = exporter.parse(new THREE.Mesh(geometry), { binary: true });
      const url = URL.createObjectURL(new Blob([result as any], { type: 'application/octet-stream' }));
      const link = document.createElement('a');
      link.href = url; link.download = 'cloisonne_printable.stl'; link.click();
      window.parent.postMessage({ type: 'ACTION_COMPLETE', action: 'EXPORT_SUCCESS' }, '*');
      setIsExporting(false);
      setExportStatus('');
    }, { ltres: 0.1, qtres: 0.1, scale: 1 }); // 高分辨率配置
  };

  return (
    <div className="relative w-full h-full bg-[#020617] flex gap-1 p-4 overflow-hidden font-sans">
      <div className="flex-1 rounded-[32px] overflow-hidden border border-white/5 bg-[#0a0f1e] relative shadow-2xl">
        {/* 实时 3D 视图 Canvas (2D 视角) */}
        <Canvas 
          shadows={{ type: THREE.PCFShadowMap }} 
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          dpr={[1, 2]}
        >
          {/* 正交相机锁死视角，确保像素级对齐体验 */}
          <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={60} />
          
          <ambientLight intensity={0.6} />
          <Environment preset="studio" />
          
          <group ref={sceneRef}>
            {/* 隐形画板 (用于像素级射线坐标捕获) */}
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

            {/* 渲染实体金丝预览 */}
            {strokes.map(s => <FiligreeMesh key={s.id} points={s.points} thickness={s.thickness} />)}
            {currentPoints.length > 1 && (
              <>
                <FiligreeMesh points={currentPoints} thickness={wireThickness} />
                {symmetry && <FiligreeMesh points={currentPoints.map(p => ({ x: -p.x, y: p.y }))} thickness={wireThickness} />}
              </>
            )}
          </group>

          {/* 对称辅助线 (导出时不被 sceneRef 包裹) */}
          {symmetry && <mesh position={[0, 0, -0.1]}><planeGeometry args={[0.02, 10]} /><meshBasicMaterial color="#3b82f6" transparent opacity={0.3} /></mesh>}

          {/* 交互控制：锁死旋转，仅保留平移和缩放 */}
          <OrbitControls enableRotate={false} enableDamping minZoom={20} maxZoom={200} />
        </Canvas>

        {/* 状态栏 */}
        <div className="absolute top-6 left-6 z-20 px-5 py-2.5 bg-blue-600/10 backdrop-blur-xl border border-blue-500/30 rounded-full flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-400 animate-pulse" /><span className="text-[10px] text-blue-400 font-black tracking-widest uppercase">实时掐丝珐琅引擎 v3.4</span>
        </div>

        {/* 主操作面板 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-slate-900/90 backdrop-blur-2xl p-4 rounded-[32px] border border-white/10 shadow-2xl">
          <button onClick={() => setStrokes([])} className="p-3.5 bg-white/5 hover:bg-red-500/20 text-slate-400 rounded-2xl transition-all active:scale-90 shadow-lg">
            <Trash2 className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setSymmetry(!symmetry)} 
            className={`px-6 py-3.5 rounded-2xl text-[10px] font-black tracking-widest border transition-all ${symmetry ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-white/5 text-slate-500 border-white/10'}`}
          >
            对称模式
          </button>

          {/* 笔画粗细控制 */}
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
              className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all" 
            />
          </div>

          <button 
            onClick={handleExport} 
            disabled={isExporting} 
            className={`flex items-center gap-3 px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40 ${isExporting ? 'animate-pulse opacity-50' : 'hover:bg-blue-500 active:scale-95'}`}
          >
            <Layers3 className="w-5 h-5" /> {isExporting ? '处理中...' : '导出打印 STL'}
          </button>
        </div>

        {/* 导出遮罩界面 */}
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

      {/* 右侧面板 */}
      <div className="w-80 bg-[#0a0f1e] rounded-[32px] border border-white/5 p-6 flex flex-col gap-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="space-y-1 mt-2">
            <h3 className="text-xs font-black text-white/30 tracking-widest uppercase flex items-center gap-2">
              <span className="w-1 h-1 bg-blue-500 rounded-full" /> Workspace
            </h3>
            <p className="text-2xl font-black text-white italic tracking-tighter">掐丝珐琅实验室</p>
          </div>
          
          <div className="mt-8 p-5 bg-white/5 rounded-[24px] border border-white/5 text-[11px] text-slate-400 leading-relaxed font-medium space-y-5">
            <div className="space-y-2.5">
              <p className="font-black text-[10px] text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <MousePointer2 className="w-3 h-3" /> 绘制提示
              </p>
              <p className="pl-1 italic shadow-sm">直接在左侧画板上绘制圆润金丝。系统会自动执行高级抖动平滑过滤，确保导出模型可打印。</p>
            </div>
            
            <div className="space-y-3 pt-2">
              <p className="font-black text-[10px] text-blue-400 uppercase tracking-widest">操作锁定 (2D Mode)</p>
              <ul className="space-y-2 pl-1 italic">
                <li className="flex items-center gap-2 underline decoration-blue-500/30">旋转：已锁死 (锁定 2D 视角)</li>
                <li className="flex items-center gap-2 underline decoration-blue-500/30">平移：按住右键或滚轮进行拖拽</li>
                <li className="flex items-center gap-2 underline decoration-blue-500/30">缩放：通过滚轮自由调整</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-black text-white/20 tracking-widest uppercase italic">
          <div className="flex items-center gap-2.5">
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/80 animate-pulse" />
            </div>
            <span>笔划总数: <span className="text-white/40">{strokes.length}</span></span>
          </div>
          <span className="text-[8px] opacity-30 tracking-normal">P0_FINAL_V3.4_MANIFOLD_READY</span>
        </div>
      </div>
    </div>
  );
}
