import { useRef, useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, Download, Eraser, Spline } from 'lucide-react';

export default function Plugin({ config: _config }: { config: any }) {
    const [step, setStep] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [patternUrl, setPatternUrl] = useState<string>('');
    const [isDrawing, setIsDrawing] = useState(false);
    const [matrixScale, setMatrixScale] = useState(100);
    const [symmetryMode, setSymmetryMode] = useState(true); // 默认开启四象限对称
    const [baseColor, setBaseColor] = useState('#0f172a'); // 宋锦经典青色
    
    const lastPos = useRef<{x: number, y: number} | null>(null);

    // 初始化画布背景
    useEffect(() => {
        if (step === 1 && canvasRef.current) {
            clearCanvas();
        }
    }, [step]);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        // 核心修复：不填充颜色，只清空物理像素，保持全透明
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        updatePattern();
    };

    const updatePattern = () => {
        if (canvasRef.current) {
            setPatternUrl(canvasRef.current.toDataURL('image/png'));
        }
    };

    // 核心绘制逻辑：支持中心对称渲染
    const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        if (lastPos.current) {
            const { x: lastX, y: lastY } = lastPos.current;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#f8fafc'; // 象牙白丝线，适配所有深色宋锦底色

            const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            };

            // 原始笔触
            drawLine(lastX, lastY, currentX, currentY);

            // 宋锦对称算法 (X轴、Y轴、中心原点镜像)
            if (symmetryMode) {
                const w = canvas.width;
                const h = canvas.height;
                drawLine(w - lastX, lastY, w - currentX, currentY); // X轴镜像
                drawLine(lastX, h - lastY, currentX, h - currentY); // Y轴镜像
                drawLine(w - lastX, h - lastY, w - currentX, h - currentY); // 中心镜像
            }
        }
        lastPos.current = { x: currentX, y: currentY };
    };

    const handleExport = () => {
        if (!patternUrl || !canvasRef.current) return;
        
        // 1. 创建一个高分辨率的导出画布 (2048x2048)
        const exportRes = 2048; 
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = exportRes;
        exportCanvas.height = exportRes;
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) return;

        // 2. 将单元 Pattern 读取为 Image 对象
        const img = new Image();
        img.onload = () => {
            // 3. 基于当前调节好的 matrixScale 计算比例
            const scaledUnitRes = matrixScale; 
            const unitCanvas = document.createElement('canvas');
            unitCanvas.width = scaledUnitRes;
            unitCanvas.height = scaledUnitRes;
            const unitCtx = unitCanvas.getContext('2d');
            if(!unitCtx) return;
            
            // 将 400x400 的单元图缩放绘制到调节好的 matrixScale 尺寸上
            unitCtx.drawImage(img, 0, 0, scaledUnitRes, scaledUnitRes); 

            // 先铺下层：物理填充用户选定的底色
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

            // 再叠上层：由于单元图是透明背景的白色笔触，平铺上去将完美透出底色
            const pattern = ctx.createPattern(unitCanvas, 'repeat');
            if (pattern) {
                ctx.fillStyle = pattern;
                ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
            }

            // 5. 执行导出
            const finalMatrixUrl = exportCanvas.toDataURL('image/png', 1.0);
            const a = document.createElement('a');
            a.href = finalMatrixUrl;
            a.download = `song_brocade_matrix_${exportRes}_${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
        img.src = patternUrl;
    };

    return (
        <div className="w-full h-screen bg-[#020617] text-white flex flex-col font-sans overflow-hidden text-sm">
            <div className="h-16 bg-black/40 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-6">
                    <button onClick={() => window.parent.postMessage({ type: 'EXIT_PLUGIN' }, '*')} className="text-white/40 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-orange-600/20 text-orange-500 text-[10px] font-black uppercase tracking-tighter">L1-04</span>
                        <h1 className="font-black text-sm italic tracking-widest uppercase">宋锦：矩阵纹样演算</h1>
                    </div>
                </div>
            </div>

            {step === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="max-w-2xl text-center space-y-8">
                        <h2 className="text-5xl md:text-6xl font-black italic leading-[1.1]">
                            经纬之间的<br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200">像素克隆演算</span>
                        </h2>
                        <p className="text-xl text-orange-100/60 leading-relaxed font-light">
                            宋锦的华丽，源于单一纹样在经纬网格上的绝对理性平铺。进入矩阵实验室，设计您的基础织造单元，利用 GPU 硬加速见证大尺度分形之美。
                        </p>
                        <button onClick={() => setStep(1)} className="mx-auto px-12 py-5 bg-white text-black rounded-[32px] font-black italic hover:scale-105 transition-all flex items-center gap-3 shadow-2xl shadow-white/5">
                            启动矩阵引擎 <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                    {/* 左侧：单体设计工作台 */}
                    <div className="w-[480px] bg-slate-900 border-r border-white/10 flex flex-col p-8 shadow-2xl z-10 relative">
                        <div className="mb-0 flex justify-between items-end pb-8 border-b border-white/5">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                                     <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                     Unit Lab
                                </p>
                                <h3 className="font-black italic text-2xl text-white uppercase tracking-tighter">单元绘制区</h3>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setSymmetryMode(!symmetryMode)} 
                                    className={`p-3 rounded-2xl transition-all border ${symmetryMode ? 'bg-orange-600 border-orange-400 text-white shadow-lg shadow-orange-600/30' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'}`} 
                                    title="四象限对称模式"
                                >
                                    <Spline className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={clearCanvas} 
                                    className="p-3 bg-white/5 border border-white/10 text-white/40 rounded-2xl hover:bg-white/10 hover:text-white transition-all" 
                                    title="清空画板"
                                >
                                    <Eraser className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* 精确网格画布 */}
                        <div className="my-10 space-y-6">
                            <div 
                                className="relative w-[400px] h-[400px] rounded-[40px] overflow-hidden shadow-2xl mx-auto cursor-crosshair group"
                                style={{ backgroundColor: baseColor }}
                            >
                                {symmetryMode && (
                                    <>
                                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-orange-500/10 pointer-events-none" />
                                        <div className="absolute top-0 left-1/2 w-[1px] h-full bg-orange-500/10 pointer-events-none" />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-orange-500/20 pointer-events-none" />
                                    </>
                                )}
                                <canvas
                                    ref={canvasRef}
                                    width={400}
                                    height={400}
                                    className="touch-none"
                                    onPointerDown={(e) => {
                                        setIsDrawing(true);
                                        lastPos.current = null;
                                        draw(e);
                                        e.currentTarget.setPointerCapture(e.pointerId);
                                    }}
                                    onPointerMove={draw}
                                    onPointerUp={(e) => {
                                        setIsDrawing(false);
                                        lastPos.current = null;
                                        updatePattern();
                                        e.currentTarget.releasePointerCapture(e.pointerId);
                                    }}
                                />
                            </div>

                            <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                                <div className="flex justify-between items-end">
                                    <label className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none">平铺映射缩放 (Matrix Scale)</label>
                                    <span className="text-xs font-black italic text-orange-400">{matrixScale} PIXELS</span>
                                </div>
                                <input 
                                    type="range" min="40" max="250" step="5" 
                                    value={matrixScale} 
                                    onChange={(e) => setMatrixScale(Number(e.target.value))}
                                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500" 
                                />
                            </div>

                            <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                                <div className="flex justify-between items-end">
                                    <label className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none">织物底色 (Base Color)</label>
                                    <span className="text-xs font-black italic text-orange-400 uppercase">{baseColor}</span>
                                </div>
                                <div className="flex gap-2 p-1 bg-white/5 rounded-[18px] border border-white/10 overflow-hidden">
                                    <input 
                                        type="color" 
                                        value={baseColor} 
                                        onChange={(e) => {
                                            setBaseColor(e.target.value);
                                            setTimeout(updatePattern, 0); 
                                        }}
                                        className="w-full h-10 border-0 bg-transparent cursor-pointer rounded-lg overflow-hidden accent-orange-500" 
                                    />
                                </div>
                            </div>
                        </div>

                        <button onClick={handleExport} className="mt-auto py-5 bg-white text-black rounded-[24px] font-black italic text-xs flex justify-center items-center gap-3 transition-transform active:scale-95 shadow-xl">
                            <Download className="w-5 h-5" /> 导出矩阵效果图 (PNG)
                        </button>
                    </div>

                    {/* 右侧：GPU 硬件加速矩阵预览区 */}
                    <div className="flex-1 relative bg-slate-950 overflow-hidden">
                        {/* 装饰层 */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none z-10" />
                        
                        {/* 核心：利用 CSS background-image 实现的低算力平铺 */}
                        <div 
                            className="absolute inset-0 transition-opacity duration-300"
                            style={{
                                backgroundColor: baseColor,
                                backgroundImage: `url(${patternUrl})`,
                                backgroundRepeat: 'repeat',
                                backgroundSize: `${matrixScale}px ${matrixScale}px`,
                                backgroundPosition: 'center center',
                                opacity: patternUrl ? 1 : 0
                            }}
                        />
                        
                        {!patternUrl && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center gap-6 opacity-40">
                                <div className="w-16 h-16 rounded-full border border-orange-500/30 flex items-center justify-center animate-pulse">
                                    <Spline className="w-8 h-8 text-orange-500" />
                                </div>
                                <p className="text-xs font-black italic tracking-widest text-white/20 uppercase">Waiting for input to start matrix evolution...</p>
                            </div>
                        )}

                        <div className="absolute top-8 right-8 z-30 flex flex-col items-end gap-1">
                            <span className="text-[10px] font-black italic text-orange-500 uppercase tracking-tighter">GPU ACCELERATED</span>
                            <h2 className="text-2xl font-black italic text-white uppercase tracking-widest leading-none">Matrix Viewport</h2>
                        </div>
                        
                        <div className="absolute bottom-8 right-8 bg-black/80 backdrop-blur-xl px-8 py-5 rounded-[32px] border border-white/5 flex items-center gap-6 shadow-2xl z-20">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-orange-500 tracking-widest uppercase">织造演算</p>
                                <p className="text-[14px] font-black text-white italic uppercase tracking-tighter leading-none">Infinite Fabric Simulation</p>
                            </div>
                            <div className="h-10 w-[1px] bg-white/10" />
                            <p className="text-[10px] text-white/40 leading-none">基于 CSS 硬件加速渲染管线<br/>零算力多维平铺算法已生效</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
