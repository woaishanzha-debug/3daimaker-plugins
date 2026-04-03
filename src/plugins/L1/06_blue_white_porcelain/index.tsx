import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls, STLExporter } from 'three-stdlib';
import { ArrowLeft, ChevronRight, Trophy, Download, Undo2, MousePointer2 } from 'lucide-react';

// --- Constants ---
const INITIAL_POINTS = [
    { x: 40, y: 0 },
    { x: 60, y: 30 },
    { x: 80, y: 80 },
    { x: 50, y: 140 },
    { x: 30, y: 170 },
    { x: 40, y: 190 },
    { x: 45, y: 200 }
];

const WALL_THICKNESS = 4;
const BASE_THICKNESS = 6;

// --- Engine Component: PotteryLathe (Solid Mesh) ---
const PotteryLathe = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [points, setPoints] = useState(INITIAL_POINTS);
    const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
    const dragStateRef = useRef<{ startX: number; startY: number; startPointX: number; startPointY: number; } | null>(null);
    
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const meshRef = useRef<THREE.Mesh | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.background = new THREE.Color('#0f172a');

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 150, 400);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        rendererRef.current = renderer;
        containerRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.target.set(0, 100, 0);

        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(200, 300, 200);
        scene.add(dirLight);
        scene.add(new THREE.GridHelper(300, 30, 0x334155, 0x1e293b));

        const material = new THREE.MeshPhysicalMaterial({
            color: 0xf8fafc,
            metalness: 0.1,
            roughness: 0.15,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
        meshRef.current = mesh;
        scene.add(mesh);

        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            if (containerRef.current && rendererRef.current) {
                containerRef.current.removeChild(rendererRef.current.domElement);
            }
            renderer.dispose();
            material.dispose();
        };
    }, []);

    // --- Core Logic: Solid Lathe Generation (Manifold Geometry) ---
    useEffect(() => {
        if (!meshRef.current) return;

        const vectorPoints = points.map(p => new THREE.Vector2(p.x, p.y));
        const spline = new THREE.SplineCurve(vectorPoints);
        const smoothPoints = spline.getPoints(50); 

        const outerPoints = [...smoothPoints];
        const innerPoints = [];

        // Reverse for inner wall calculation
        for (let i = smoothPoints.length - 1; i >= 0; i--) {
            const p = smoothPoints[i];
            const innerX = Math.max(0.1, p.x - WALL_THICKNESS);
            const innerY = Math.max(smoothPoints[0].y + BASE_THICKNESS, p.y);
            innerPoints.push(new THREE.Vector2(innerX, innerY));
        }

        // Closed profile for a solid manifold object
        const closedProfile = [
            new THREE.Vector2(0, smoothPoints[0].y), 
            ...outerPoints,
            ...innerPoints,
            new THREE.Vector2(0, smoothPoints[0].y + BASE_THICKNESS)
        ];

        const geometry = new THREE.LatheGeometry(closedProfile, 64);
        geometry.computeVertexNormals();

        if (meshRef.current.geometry) meshRef.current.geometry.dispose();
        meshRef.current.geometry = geometry;
    }, [points]);

    const handleSvgPointerDown = (e: React.PointerEvent, idx: number) => {
        const svg = e.currentTarget.closest('svg');
        if (!svg) return;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const ctm = svg.getScreenCTM();
        if (!ctm) return;
        const svgP = pt.matrixTransform(ctm.inverse());
        dragStateRef.current = { startX: svgP.x, startY: svgP.y, startPointX: points[idx].x, startPointY: points[idx].y };
        (e.currentTarget as Element).setPointerCapture((e as React.PointerEvent).pointerId);
        setDraggingIdx(idx);
    };

    const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
        if (draggingIdx === null || !dragStateRef.current) return;
        const svg = e.currentTarget;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const ctm = svg.getScreenCTM();
        if (!ctm) return;
        const svgP = pt.matrixTransform(ctm.inverse());
        const deltaX = svgP.x - dragStateRef.current.startX;
        const deltaY = -(svgP.y - dragStateRef.current.startY);

        setPoints(prev => prev.map((p, i) => {
            if (i === draggingIdx) {
                const newX = Math.max(10, Math.min(dragStateRef.current!.startPointX + deltaX, 140));
                let newY = p.y;
                if (i > 0) {
                    const minY = prev[i - 1].y + 5;
                    const maxY = i < prev.length - 1 ? prev[i + 1].y - 5 : 250;
                    newY = Math.max(minY, Math.min(dragStateRef.current!.startPointY + deltaY, maxY));
                }
                return { ...p, x: newX, y: newY };
            }
            return p;
        }));
    };

    const exportSTL = () => {
        if (!sceneRef.current || !meshRef.current) return;
        const exportScene = new THREE.Scene();
        exportScene.add(meshRef.current.clone());
        const exporter = new STLExporter();
        const stlString = exporter.parse(exportScene);
        const blob = new Blob([stlString], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = 'porcelain_vase_solid.stl';
        link.click(); URL.revokeObjectURL(url);
    };

    const pathD = `M ${points[0].x} ${250 - points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${250 - p.y}`).join(' ');
    const polygonD = `M 0 250 L ${points[0].x} 250 ` + points.slice(1).map(p => `L ${p.x} ${250 - p.y}`).join(' ') + ` L 0 ${250 - points[points.length-1].y} Z`;

    return (
        <div className="w-full h-[600px] flex flex-col md:flex-row gap-6 bg-slate-800/50 p-6 rounded-[40px] border border-white/5 shadow-2xl relative">
            <div className="w-full md:w-1/3 flex flex-col gap-4">
                <div className="bg-slate-900 rounded-3xl p-6 flex-1 border border-white/10 relative overflow-hidden flex flex-col shadow-inner shadow-black/50">
                    <div className="flex items-center gap-2 mb-4 text-sm font-black italic tracking-widest text-slate-300">
                        <MousePointer2 className="w-4 h-4 text-blue-500" /> 二维轮廓设计 / PROFILE
                    </div>
                    <div className="flex-1 relative w-full flex items-center justify-center bg-slate-950 rounded-2xl border border-white/5 select-none overflow-hidden">
                        <svg viewBox="0 0 150 250" className="w-full h-full max-h-[450px] touch-none" onPointerMove={handleSvgPointerMove} onPointerUp={() => setDraggingIdx(null)} onPointerLeave={() => setDraggingIdx(null)}>
                            <path d={polygonD} fill="rgba(59, 130, 246, 0.2)" />
                            <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                            {points.map((p, idx) => (
                                <circle key={idx} cx={p.x} cy={250 - p.y} r={draggingIdx === idx ? 8 : 5} fill={draggingIdx === idx ? "#60a5fa" : "#fff"} stroke="#2563eb" strokeWidth="2" className="cursor-move" onPointerDown={(e) => handleSvgPointerDown(e, idx)} />
                            ))}
                        </svg>
                    </div>
                    <button onClick={() => setPoints(INITIAL_POINTS)} className="mt-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-white/5">
                        <Undo2 className="w-4 h-4" /> 恢复标准器型
                    </button>
                </div>
            </div>
            <div className="w-full md:w-2/3 relative rounded-3xl overflow-hidden border border-white/10 shadow-inner bg-slate-900 group">
                <div ref={containerRef} className="w-full h-full absolute inset-0 cursor-move" />
                <div className="absolute top-6 right-6 flex gap-2">
                    <button onClick={exportSTL} className="px-6 py-3 bg-white text-blue-600 rounded-2xl font-black text-sm flex items-center gap-2 shadow-2xl transition-all hover:scale-105 active:scale-95">
                        <Download className="w-5 h-5" /> 烧制并导出 STL
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Plugin Component ---
export default function Plugin({ config }: { config: any }) {
    const [step, setStep] = useState(0);

    return (
        <div className="w-full h-screen overflow-y-auto bg-[#020617] text-white selection:bg-blue-500/30 font-sans">
            <div className="fixed top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-8">
                <div className="flex items-center gap-6">
                    <button onClick={() => window.parent.postMessage({ type: 'EXIT_PLUGIN' }, '*')} className="text-white/40 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-tighter">L1-11</span>
                        <h1 className="font-black text-sm italic tracking-widest uppercase">素胚勾勒：青花瓷纹饰</h1>
                    </div>
                </div>
            </div>

            <div className="pt-24 pb-12 px-6 max-w-[1400px] mx-auto min-h-[calc(100vh-4rem)] flex flex-col">
                {step === 0 && (
                    <div className="flex-1 relative rounded-[48px] overflow-hidden bg-slate-900 border border-white/5 shadow-2xl flex flex-col p-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10 opacity-30" />
                        <div className="relative z-10 flex-1 flex flex-col justify-center gap-8">
                            <h2 className="text-5xl md:text-6xl font-black italic leading-[1.2]">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">数字非遗进化：</span><br />
                                素胚勾勒
                            </h2>
                            <p className="text-xl text-blue-100/60 max-w-2xl leading-relaxed font-light">
                                “天青色等烟雨，而我在等你。” 探索青花瓷的造型与纹样，利用 3D 车削算法与 3D 打印技术重塑拉胚工艺。
                            </p>
                            <button onClick={() => setStep(1)} className="w-fit px-12 py-5 bg-white text-black rounded-3xl font-black italic hover:scale-105 transition-transform flex items-center gap-3 shadow-2xl">
                                进入数字拉胚工坊 <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="flex-1 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500">
                        <PotteryLathe />
                        <div className="flex justify-end pt-4 border-t border-white/5">
                            <button onClick={() => setStep(2)} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center gap-2">
                                完成设计并导出 <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="flex-1 rounded-[48px] bg-slate-900 border border-white/5 flex flex-col items-center justify-center p-20 text-center gap-10 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
                        <div className="w-32 h-32 bg-blue-600 rounded-[40px] flex items-center justify-center shadow-[0_0_80px_rgba(37,99,235,0.4)] relative z-10">
                            <Trophy className="w-16 h-16 text-white" />
                        </div>
                        <div className="space-y-4 relative z-10">
                            <h2 className="text-6xl font-black italic tracking-tighter text-white">READY FOR 3D PRINT</h2>
                            <p className="text-blue-200/60 font-medium max-w-lg mx-auto leading-relaxed">
                                恭喜！你已成功设计了专属的瓷瓶。现在可以导出 STL 文件进行物理打印，开启你的数字非遗之旅。
                            </p>
                        </div>
                        <div className="flex gap-4 relative z-10">
                            <button onClick={() => setStep(1)} className="px-8 py-4 bg-white/5 rounded-2xl font-black text-sm text-white/60 hover:text-white transition-colors">
                                返回继续优化
                            </button>
                            <button onClick={() => window.parent.postMessage({ type: 'LESSON_COMPLETE', slug: config?.slug, nextLesson: 'l1_07_tiger_tally' }, '*')} className="px-10 py-4 bg-blue-600 rounded-2xl font-black text-sm text-white shadow-xl hover:bg-blue-500 transition-all">
                                提交并进入下一关卡 <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
