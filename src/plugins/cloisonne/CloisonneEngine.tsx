import React, { useState, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { STLExporter } from 'three-stdlib';
import { Trash2, Download, Zap, Move3D, MousePointer2 } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  id: string;
  points: Point[];
  isMirror?: boolean;
}

const FiligreeTube = ({ points }: { points: Point[] }) => {
  const curve = useMemo(() => {
    if (points.length < 2) return null;
    const v3Points = points.map(p => new THREE.Vector3(p.x, p.y, 0));
    return new THREE.CatmullRomCurve3(v3Points);
  }, [points]);

  if (!curve) return null;

  return (
    <mesh>
      <tubeGeometry args={[curve, 64, 0.05, 8, false]} />
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
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [symmetry, setSymmetry] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Group>(null);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Normalize coordinates to Three.js-like space (-5 to 5 for example)
    const x = ((clientX - rect.left) / rect.width) * 10 - 5;
    const y = -(((clientY - rect.top) / rect.height) * 10 - 5);
    
    setCurrentPoints([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (currentPoints.length === 0) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = ((clientX - rect.left) / rect.width) * 10 - 5;
    const y = -(((clientY - rect.top) / rect.height) * 10 - 5);

    // Filter points to avoid noise
    const lastPoint = currentPoints[currentPoints.length - 1];
    const dist = Math.sqrt(Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2));
    if (dist > 0.05) {
      setCurrentPoints([...currentPoints, { x, y }]);
    }
  };

  const handleMouseUp = () => {
    if (currentPoints.length > 1) {
      const id = Math.random().toString(36).substr(2, 9);
      const newStrokes: Stroke[] = [{ id, points: currentPoints }];
      
      if (symmetry) {
        newStrokes.push({ 
          id: id + '_mirror', 
          points: currentPoints.map(p => ({ x: -p.x, y: p.y })),
          isMirror: true
        });
      }
      
      setStroking([...strokes, ...newStrokes]);
    }
    setCurrentPoints([]);
  };

  const handleExport = () => {
    if (!sceneRef.current) return;
    
    const exporter = new STLExporter();
    const result = exporter.parse(sceneRef.current, { binary: true });
    const blob = new Blob([result as any], { type: 'application/octet-stream' });
    
    // Trigger download (for local testing) and notify mothership
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
      
      {/* 2D Interaction Layer (Hidden Canvas for Point Capture) */}
      <div className="absolute inset-x-4 inset-y-4 z-10 pointer-events-none">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          className="w-full h-full pointer-events-auto cursor-crosshair opacity-0"
        />
      </div>

      {/* 3D Real-time Rendering Layer */}
      <div className="flex-1 rounded-[32px] overflow-hidden border border-white/5 bg-[#0a0f1e] relative">
        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={50} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} castShadow />
          <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />
          
          <Environment preset="city" />
          <ContactShadows position={[0, -6, 0]} opacity={0.4} scale={20} blur={2} />

          <group ref={sceneRef}>
            {/* Render Finished Strokes */}
            {strokes.map(s => <FiligreeTube key={s.id} points={s.points} />)}
            
            {/* Render Active Stroke */}
            {currentPoints.length > 1 && (
              <>
                <FiligreeTube points={currentPoints} />
                {symmetry && <FiligreeTube points={currentPoints.map(p => ({ x: -p.x, y: p.y }))} />}
              </>
            )}

            {/* Symmetry Axis Helper */}
            {symmetry && (
              <mesh position={[0, 0, -0.1]}>
                <planeGeometry args={[0.02, 10]} />
                <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} />
              </mesh>
            )}
          </group>

          <OrbitControls enableDamping minDistance={5} maxDistance={20} />
        </Canvas>

        {/* Floating UI */}
        <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
          <div className="px-5 py-2.5 bg-blue-600/10 backdrop-blur-xl border border-blue-500/30 rounded-full flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">
              Real-time Filigree Engine v3.0
            </span>
          </div>
        </div>

        <div className="absolute bottom-8 right-8 z-20 flex flex-col gap-3">
          <button 
            onClick={() => setSymmetry(!symmetry)}
            className={`p-4 rounded-2xl border transition-all shadow-xl flex items-center gap-3 ${symmetry ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-900 border-white/10 text-slate-400'}`}
          >
            <div className="text-xs font-black uppercase tracking-widest">{symmetry ? 'Symmetry ON' : 'Symmetry OFF'}</div>
          </button>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-slate-900/90 backdrop-blur-2xl p-4 rounded-[32px] border border-white/10 shadow-2xl">
          <button onClick={clearCanvas} className="p-3.5 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-2xl transition-all">
            <Trash2 className="w-5 h-5" />
          </button>
          
          <div className="w-[1px] h-8 bg-white/10 mx-1" />

          <button 
            onClick={handleExport}
            className="flex items-center gap-3 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs tracking-[0.2em] uppercase shadow-lg shadow-blue-900/40 transition-all active:scale-95"
          >
            <Download className="w-5 h-5" /> Export STL
          </button>
        </div>
      </div>
      
      {/* Side Status Panel */}
      <div className="w-72 bg-[#0a0f1e] rounded-[32px] border border-white/5 p-6 flex flex-col gap-6">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-white/40 uppercase tracking-widest">Workspace</h3>
          <p className="text-lg font-black text-white italic">Cloisonne Lab</p>
        </div>

        <div className="flex-1 space-y-4 mt-4">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">
              <MousePointer2 className="w-3 h-3" /> Drawing Tip
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Click and drag directly on the 3D viewport to trace your filigree gold线.
            </p>
          </div>
          
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">
              <Move3D className="w-3 h-3" /> Navigation
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Use Right-Click or two fingers to rotate. Scroll to zoom.
            </p>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-white/5">
          <div className="flex justify-between items-center text-[10px] font-black text-white/20 uppercase tracking-widest">
            <span>Strokes: {strokes.length}</span>
            <span>Ver: P0_B16</span>
          </div>
        </div>
      </div>

    </div>
  );
}
