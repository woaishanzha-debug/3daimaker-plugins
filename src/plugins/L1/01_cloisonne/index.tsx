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

// 判断颜色是否为深色 (用于过滤背景)
const isDarkColor = (colorStr: string): boolean => {
  // 匹配 rgb(r,g,b) 格式
  const rgbMatch = colorStr.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    // 亮度阈值：只有足够暗的颜色才算"墨迹"
    return (r + g + b) / 3 < 128;
  }
  // 匹配 #hex 格式
  const hexMatch = colorStr.match(/^#([0-9a-f]{6})$/i);
  if (hexMatch) {
    const r = parseInt(hexMatch[1].substring(0, 2), 16);
    const g = parseInt(hexMatch[1].substring(2, 4), 16);
    const b = parseInt(hexMatch[1].substring(4, 6), 16);
    return (r + g + b) / 3 < 128;
  }
  // 纯黑
  if (colorStr === 'black' || colorStr === '#000' || colorStr === '#000000') return true;
  return false;
};

// --- 视觉预览组件 ---
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
  const [wireThickness, setWireThickness] = useState(0.1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');

  const isDrawing = useRef(false);

  // --- 画笔交互 ---
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
        if (dist > 0.05) setCurrentPoints([...currentPoints, p]);
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

  // --- 导出管线 (白底黑线 + 纯黑过滤 + 15x 物理放大) ---
  const handleExport = () => {
    if (strokes.length === 0 || isExporting) return;
    setIsExporting(true);
    setExportStatus('正在融合线条交叉点...');

    setTimeout(() => {
      const canvas = document.createElement('canvas');
      const res = 2048;
      canvas.width = res; canvas.height = res;
      const ctx = canvas.getContext('2d');
      if (!ctx) { setIsExporting(false); return; }

      // 1. 计算包围盒 (Bounding Box)，考虑线条粗细以防止边缘裁切
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      let maxThickness = 0;
      
      strokes.forEach(s => {
        maxThickness = Math.max(maxThickness, s.thickness);
        s.points.forEach(p => {
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
          minY = Math.min(minY, p.y);
          maxY = Math.max(maxY, p.y);
        });
      });

      if (minX === Infinity) { setIsExporting(false); return; }

      // 引入厚度补偿，确保线条外缘不被切断
      const buffer = maxThickness / 2;
      minX -= buffer; maxX += buffer;
      minY -= buffer; maxY += buffer;

      // 2. 计算动态缩放与安全边距 (强制 10% Padding)
      const paddingPercent = 0.1;
      const W = maxX - minX;
      const H = maxY - minY;
      const CX = (minX + maxX) / 2;
      const CY = (minY + maxY) / 2;
      const maxDim = Math.max(W, H) || 1;
      
      // 这里的 1 - paddingPercent * 2 确保了内容只占据中间的 80% 区域，四周各有 10% 留白
      const scaleFactor = (res * (1 - paddingPercent * 2)) / maxDim;

      // 白底：清除画布
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, res, res);

      // 3. 坐标映射：将 3D 线条居中映射到 Canvas 内部（带 10% 留白）
      // 这里的顺序至关重要：先定位到画布中心，再缩放并翻转 Y 轴，最后移动到 3D 质心
      ctx.translate(res / 2, res / 2);
      ctx.scale(scaleFactor, -scaleFactor); // 处理 Y 轴反向（3D Y向上，Canvas Y向下）
      ctx.translate(-CX, -CY);

      // 画纯黑墨迹
      ctx.strokeStyle = '#000000';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      strokes.forEach(s => {
        if (s.points.length < 2) return;
        ctx.lineWidth = s.thickness;
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
        ctx.stroke();
      });

      setExportStatus('正在提取纯净轮廓...');

      const base64Img = canvas.toDataURL('image/png');

      ImageTracer.imageToSVG(base64Img, (svgString: string) => {
        try {
          const loader = new SVGLoader();
          const svgData = loader.parse(svgString);
          const shapes: THREE.Shape[] = [];

          // 严格过滤：只保留深色/黑色路径，丢弃白色背景和灰色抗锯齿边
          svgData.paths.forEach(path => {
            const style = (path as any).userData?.style;
            if (style?.fill) {
              if (!isDarkColor(style.fill)) return; // 非深色 -> 丢弃
            }
            const created = SVGLoader.createShapes(path);
            shapes.push(...created);
          });

          if (shapes.length === 0) {
            alert('未检测到有效路径，请多画一些线条后重试。');
            setIsExporting(false);
            setExportStatus('');
            return;
          }

          // 挤出深度：在原始坐标系中为 0.2 单位
          const geometry = new THREE.ExtrudeGeometry(shapes, { depth: 0.2, bevelEnabled: false });

          // 步骤1：逆向映射 ImageTracer 的像素坐标回 Three.js 3D 坐标系
          geometry.translate(-res / 2, -res / 2, 0); // 坐标归心
          geometry.scale(1 / scaleFactor, -1 / scaleFactor, 1); // 缩放还原并轴反向
          geometry.translate(CX, CY, 0); // 回位到原始质心

          // 步骤2：物理放大 15 倍 (Three.js 1 单位 = 切片软件 1mm)
          geometry.scale(15, 15, 15);

          const exporter = new STLExporter();
          const mesh = new THREE.Mesh(geometry);
          const result = exporter.parse(mesh, { binary: true }) as unknown as DataView;
          const url = URL.createObjectURL(new Blob([result.buffer as ArrayBuffer], { type: 'application/octet-stream' }));
          const link = document.createElement('a');
          link.href = url; link.download = 'cloisonne_design.stl'; link.click();

          window.parent.postMessage({ type: 'ACTION_COMPLETE', action: 'EXPORT_SUCCESS' }, '*');
        } catch (e) {
          console.error('Export Error:', e);
          alert('模型生成失败，请尝试刷新页面。');
        } finally {
          setIsExporting(false);
          setExportStatus('');
        }
      }, { ltres: 0.1, qtres: 0.1, scale: 1 });
    }, 100);
  };

  return (
    <div className="relative w-full h-full bg-[#020617] flex gap-2 p-4 overflow-hidden">
      <div className="flex-1 rounded-[24px] overflow-hidden border border-white/10 bg-[#0a0f1e] relative">
        <Canvas>
          <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={60} />
          <ambientLight intensity={0.8} />
          <Environment preset="studio" />
          
          <group>
            <mesh position={[0, 0, -0.01]} onPointerDown={e => handlePointer(e, 'down')} onPointerMove={e => handlePointer(e, 'move')} onPointerUp={e => handlePointer(e, 'up')}>
              <planeGeometry args={[20, 20]} />
              <meshBasicMaterial visible={false} />
            </mesh>

            {strokes.map(s => <FiligreePreview key={s.id} points={s.points} thickness={s.thickness} />)}
            {currentPoints.length > 1 && (
              <>
                <FiligreePreview points={currentPoints} thickness={wireThickness} />
                {symmetry && <FiligreePreview points={currentPoints.map(p => ({ x: -p.x, y: p.y }))} thickness={wireThickness} />}
              </>
            )}
          </group>

          {symmetry && <mesh position={[0, 0, -0.1]}><planeGeometry args={[0.01, 20]} /><meshBasicMaterial color="#3b82f6" transparent opacity={0.2} /></mesh>}
          <OrbitControls enableRotate={false} enableDamping />
        </Canvas>

        <div className="absolute top-6 left-6 z-20 px-4 py-2 bg-blue-600/20 backdrop-blur-md border border-blue-500/30 rounded-full flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-blue-400 font-bold tracking-widest uppercase">掐丝珐琅引擎 2D-PRO v3.8</span>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-6 bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl">
          <button onClick={() => setStrokes([])} className="p-3 bg-white/5 hover:bg-red-500/20 text-slate-400 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
          
          <button onClick={() => setSymmetry(!symmetry)} className={`px-6 py-3 rounded-xl text-xs font-bold tracking-widest transition-colors ${symmetry ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-white/10 text-slate-400'}`}>
            对称模式: {symmetry ? '开' : '关'}
          </button>

          <div className="flex flex-col gap-2 w-40 px-4 border-l border-white/10">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold tracking-wider">
              <span>金丝粗细</span>
              <span className="text-blue-400">{wireThickness.toFixed(2)}</span>
            </div>
            <input type="range" min="0.02" max="0.3" step="0.01" value={wireThickness} onChange={e => setWireThickness(parseFloat(e.target.value))} className="w-full accent-blue-500 cursor-pointer" />
          </div>

          <button onClick={handleExport} disabled={isExporting} className={`flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs tracking-widest transition-all ${isExporting ? 'opacity-50 cursor-not-allowed' : 'shadow-lg shadow-blue-900/40'}`}>
            <Layers3 className="w-4 h-4" />
            {isExporting ? '生成中...' : '导出打印模型'}
          </button>
        </div>

        {isExporting && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-[24px]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-blue-400 font-bold tracking-widest text-sm animate-pulse">{exportStatus}</p>
            </div>
          </div>
        )}
      </div>

      <div className="w-64 bg-[#0a0f1e] rounded-[24px] border border-white/10 p-6 flex flex-col gap-4 shadow-xl">
        <div>
          <h3 className="text-[10px] font-black text-slate-500 tracking-widest mb-1">WORKSPACE</h3>
          <p className="text-base font-bold text-white">掐丝珐琅实验室</p>
        </div>
        <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-xs text-slate-400 leading-relaxed space-y-3 font-medium">
          <p><span className="text-blue-400 font-bold">1. 绘图：</span>在左侧画板拖拽鼠标绘制金丝。引擎自动平滑线条。</p>
          <p><span className="text-blue-400 font-bold">2. 视角：</span>锁定 2D 俯视。右键平移，滚轮缩放。</p>
          <p><span className="text-blue-400 font-bold">3. 打印：</span>导出后模型自动放大至 ~150mm 桌面级尺寸。</p>
        </div>
        <div className="mt-auto pt-4 border-t border-white/10 flex justify-between text-[10px] text-slate-500 font-bold tracking-wider italic">
          <span>总笔画: {strokes.length}</span>
          <span>STABLE_V3.8</span>
        </div>
      </div>
    </div>
  );
}
