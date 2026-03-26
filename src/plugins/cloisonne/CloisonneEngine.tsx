import { useState, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { STLExporter, SVGLoader } from 'three-stdlib';
import { Trash2, Layers3, Zap } from 'lucide-react';
// @ts-ignore
import ImageTracer from 'imagetracerjs';

// --- 数据平滑算法 ---
const smoothPoints = (points: { x: number; y: number }[]): { x: number; y: number }[] => {
  if (points.length < 3) return points;
  const smoothed = [points[0]];
  const windowSize = 5;
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

// --- 视觉预览组件 (使用 Tube 防止转角扭曲破音) ---
const FiligreePreview = ({ points, thickness }: { points: { x: number; y: number }[], thickness: number }) => {
  const curve = useMemo(() => {
    if (points.length < 2) return null;
    return new THREE.CatmullRomCurve3(
      points.map(p => new THREE.Vector3(p.x, p.y, 0)),
      false, 'chordal', 0.5
    );
  }, [points]);

  if (!curve) return null;

  return (
    <mesh>
      {/* 视觉上使用 Tube，正交俯视看起来就是带圆帽的完美线段，绝不扭曲 */}
      <tubeGeometry args={[curve, Math.max(20, points.length * 2), thickness / 2, 8, false]} />
      <meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.3} emissive="#D4AF37" emissiveIntensity={0.1} />
    </mesh>
  );
};

// --- 主引擎 ---
export default function CloisonneEngine({ config }: { config: any }) {
  console.log('Engine started with lesson:', config?.lessonId);
  const [strokes, setStrokes] = useState<{ id: string; points: { x: number; y: number }[]; thickness: number }[]>([]);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [symmetry, setSymmetry] = useState(true);
  const [wireThickness, setWireThickness] = useState(0.1); // 默认粗细
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');

  const isDrawing = useRef(false);

  // --- 画笔交互 (射线捕获) ---
  const handlePointer = (e: any, type: string) => {
    if (type === 'down') {
      e.stopPropagation();
      e.target.setPointerCapture(e.pointerId);
      isDrawing.current = true;
      if (e.point) setCurrentPoints([{ x: e.point.x, y: e.point.y }]);
    } else if (type === 'move' && isDrawing.current && e.point) {
      const p = { x: e.point.x, y: e.point.y };
      if (currentPoints.length > 0) {
        const last = currentPoints[currentPoints.length - 1];
        const dist = Math.sqrt(Math.pow(p.x - last.x, 2) + Math.pow(p.y - last.y, 2));
        if (dist > 0.05) setCurrentPoints([...currentPoints, p]); // 降噪
      } else {
        setCurrentPoints([p]);
      }
    } else if (type === 'up') {
      e.target.releasePointerCapture(e.pointerId);
      if (isDrawing.current && currentPoints.length > 1) {
        const smoothed = smoothPoints(currentPoints);
        const id = Math.random().toString(36);
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

  // --- 打印导出管线 (后台 2D Boolean -> SVG -> 3D 挤出) ---
  const handleExport = () => {
    if (strokes.length === 0 || isExporting) return;
    setIsExporting(true);
    setExportStatus('正在合并交叉线条...');

    setTimeout(() => {
      // 1. 创建高分辨率离线 Canvas
      const canvas = document.createElement('canvas');
      const res = 2048;
      canvas.width = res; canvas.height = res;
      const ctx = canvas.getContext('2d');
      if (!ctx) { setIsExporting(false); return; }

      ctx.fillStyle = 'white'; ctx.fillRect(0, 0, res, res);
      // 将 Three.js 的 [-5, 5] 坐标系映射到 Canvas 的 [0, 2048]
      ctx.translate(res / 2, res / 2);
      ctx.scale(res / 10, -res / 10);

      // 2. 绘制黑色线段实现完美的 Boolean 并集
      ctx.strokeStyle = 'black';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      strokes.forEach(s => {
        if (s.points.length < 2) return;
        ctx.lineWidth = s.thickness; // 精确映射粗细
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
        ctx.stroke();
      });

      setExportStatus('正在生成 3D 打印实体...');

      // 3. 转为 Base64 防 404 崩溃
      const base64Img = canvas.toDataURL('image/png');

      // 4. 提取轮廓并挤出
      ImageTracer.imageToSVG(base64Img, (svgString: string) => {
        try {
          const loader = new SVGLoader();
          const svgData = loader.parse(svgString);
          const shapes: THREE.Shape[] = [];
          svgData.paths.forEach(path => shapes.push(...SVGLoader.createShapes(path)));

          // 挤出深度为 0.2，保证打印厚度
          const geometry = new THREE.ExtrudeGeometry(shapes, { depth: 0.2, bevelEnabled: false });

          // 将挤出后的模型尺寸和位置逆向映射回原比例
          const scaleDown = 10 / res;
          geometry.scale(scaleDown, -scaleDown, 1);
          geometry.translate(-5, 5, 0);

          // 5. 导出下载
          const exporter = new STLExporter();
          const result = exporter.parse(new THREE.Mesh(geometry), { binary: true });
          const url = URL.createObjectURL(new Blob([result], { type: 'application/octet-stream' }));
          const link = document.createElement('a');
          link.href = url; link.download = 'cloisonne_design.stl'; link.click();
          
          window.parent.postMessage({ type: 'ACTION_COMPLETE', action: 'EXPORT_SUCCESS' }, '*');
        } catch (e) {
          console.error("Export Error: ", e);
          alert("模型生成失败，请尝试刷新页面。");
        } finally {
          setIsExporting(false);
          setExportStatus('');
        }
      }, { ltres: 0.1, qtres: 0.1, scale: 1 }); // 高精度追踪
    }, 100); // 略微延时让 UI 渲染 Loading
  };

  return (
    <div className="relative w-full h-full bg-[#020617] flex gap-2 p-4 overflow-hidden">
      {/* 核心 2D 画板区 */}
      <div className="flex-1 rounded-[24px] overflow-hidden border border-white/10 bg-[#0a0f1e] relative">
        <Canvas gl={{ antialias: true, preserveDrawingBuffer: true }}>
          {/* 正交相机：永远平视，没有透视形变 */}
          <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={60} />
          <ambientLight intensity={0.8} />
          <Environment preset="studio" />
          
          <group>
            {/* 隐形射线接收板 */}
            <mesh position={[0, 0, -0.01]} onPointerDown={e => handlePointer(e, 'down')} onPointerMove={e => handlePointer(e, 'move')} onPointerUp={e => handlePointer(e, 'up')}>
              <planeGeometry args={[20, 20]} />
              <meshBasicMaterial visible={false} />
            </mesh>

            {/* 绘制渲染区 */}
            {strokes.map(s => <FiligreePreview key={s.id} points={s.points} thickness={s.thickness} />)}
            {currentPoints.length > 1 && (
              <>
                <FiligreePreview points={currentPoints} thickness={wireThickness} />
                {symmetry && <FiligreePreview points={currentPoints.map(p => ({ x: -p.x, y: p.y }))} thickness={wireThickness} />}
              </>
            )}
          </group>

          {/* 辅助线 */}
          {symmetry && <mesh position={[0, 0, -0.1]}><planeGeometry args={[0.01, 20]} /><meshBasicMaterial color="#3b82f6" transparent opacity={0.2} /></mesh>}

          {/* 彻底锁死旋转，仅允许右键平移和滚轮缩放 */}
          <OrbitControls enableRotate={false} enableDamping />
        </Canvas>

        {/* 顶部标签 */}
        <div className="absolute top-6 left-6 z-20 px-4 py-2 bg-blue-600/20 backdrop-blur-md border border-blue-500/30 rounded-full flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-blue-400 font-bold tracking-widest uppercase">掐丝珐琅引擎 2D-PRO v3.6</span>
        </div>

        {/* 底部控制台 */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-6 bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl">
          <button onClick={() => setStrokes([])} className="p-3 bg-white/5 hover:bg-red-500/20 text-slate-400 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
          
          <button onClick={() => setSymmetry(!symmetry)} className={`px-6 py-3 rounded-xl text-xs font-bold tracking-widest transition-colors ${symmetry ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-400'}`}>
            对称模式: {symmetry ? '开' : '关'}
          </button>

          <div className="flex flex-col gap-2 w-40 px-4 border-l border-white/10">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold tracking-wider">
              <span>金丝粗细</span>
              <span className="text-blue-400">{wireThickness.toFixed(2)}</span>
            </div>
            <input type="range" min="0.02" max="0.3" step="0.01" value={wireThickness} onChange={e => setWireThickness(parseFloat(e.target.value))} className="w-full accent-blue-500 cursor-pointer" />
          </div>

          <button onClick={handleExport} disabled={isExporting} className={`flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs tracking-widest transition-all ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Layers3 className="w-4 h-4" />
            {isExporting ? '生成中...' : '导出打印模型'}
          </button>
        </div>

        {/* 导出 Loading 遮罩 */}
        {isExporting && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-[24px]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-blue-400 font-bold tracking-widest text-sm animate-pulse">{exportStatus}</p>
            </div>
          </div>
        )}
      </div>

      {/* 右侧说明面板 */}
      <div className="w-64 bg-[#0a0f1e] rounded-[24px] border border-white/10 p-6 flex flex-col gap-4">
        <div>
          <h3 className="text-[10px] font-black text-slate-500 tracking-widest mb-1">WORKSPACE</h3>
          <p className="text-base font-bold text-white">掐丝珐琅实验室</p>
        </div>
        <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-xs text-slate-400 leading-relaxed space-y-3 font-medium">
          <p><span className="text-blue-400 font-bold">1. 绘图：</span>在左侧画板拖拽鼠标。引擎会自动执行高级平滑过滤。</p>
          <p><span className="text-blue-400 font-bold">2. 视角：</span>已锁定为纯 2D 俯视。右键平移画布，滚轮缩放。</p>
          <p><span className="text-blue-400 font-bold">3. 打印：</span>导出时自动合并交叉点，产生 100% 流形可打印实体。</p>
        </div>
        <div className="mt-auto pt-4 border-t border-white/10 flex justify-between text-[10px] text-slate-500 font-bold tracking-wider italic">
          <span>总笔画: {strokes.length}</span>
          <span>STABLE_V3.6</span>
        </div>
      </div>
    </div>
  );
}
