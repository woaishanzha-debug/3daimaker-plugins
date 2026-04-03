import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronRight, Trophy, RotateCw, PenTool, Award } from 'lucide-react';
// @ts-ignore
import paper from 'paper/dist/paper-core';

// ==========================================
// 诊断话术库 (CCPT 标准)
// ==========================================
const DIAGNOSIS = {
    structure: (s: number) => s > 40 
        ? "优: 重心平稳，落位精准，深得“中宫收紧”之妙。" 
        : "劣: 字形重心略有偏移，建议注意主笔画在米字格中的参照位置。",
    brush: (s: number) => s > 25 
        ? "优: 提按分明，墨韵饱满，线条具备物理动感与骨力。" 
        : "劣: 运笔速度过于均匀，缺乏起笔与收笔的粗细过渡。",
    composition: (s: number) => s > 15 
        ? "优: 气韵连贯，大小适配，完美占据宫格核心区域。" 
        : "劣: 字形过大溢出或过小，建议注意书写的整体节奏。"
};

// ==========================================
// 核心引擎：动力学毛笔与评分计算器
// ==========================================
function CalligraphyCanvas({ onScoreComputed }: { onScoreComputed: (scores: any) => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const paperProjectRef = useRef<any>(null);
    const [, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(1.0); // 默认 1.0 倍率
    const brushSizeRef = useRef(1.0);

    // 同步 Ref 以在 Tool 闭包中使用最新值，同时避免重建 Tool 导致画布清空
    useEffect(() => {
        brushSizeRef.current = brushSize;
    }, [brushSize]);

    useEffect(() => {
        if (!canvasRef.current) return;
        if (!paperProjectRef.current) {
            paper.setup(canvasRef.current);
            paperProjectRef.current = paper.project;
        }
        
        const project = paperProjectRef.current;
        project.clear();

        // 核心：创建独立的墨迹层，确保导出时没有背景和边框干扰
        const inkLayer = new paper.Layer();
        inkLayer.name = 'inkLayer';
        inkLayer.activate();

        const drawTool = new paper.Tool();
        let path: any;
        let lastWidth = 12;
        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

        // 水墨毛笔动力学算法 (Velocity-based Dynamics)
        drawTool.onMouseDown = (event: any) => {
            setIsDrawing(true);
            lastWidth = 12; // Reset on new stroke
            path = new paper.Path();
            path.fillColor = '#171717' as any; // 浓墨
            path.add(event.point);
        };

        drawTool.onMouseDrag = (event: any) => {
            const step = event.delta;
            if (step.length < 1) return; // 忽略微小抖动

            // 核心：基于速度的非线性宽度映射 (V2.1 动能优化 + V2.2 倍率适配)
            const currentSize = brushSizeRef.current;
            const baseMaxWidth = 22 * currentSize;
            const baseMinWidth = 3 * currentSize;
            const targetWidth = Math.max(baseMinWidth, baseMaxWidth - Math.pow(step.length, 0.8) * 1.5);
            
            // 引入物理惯性：当前宽度由上一帧宽度平滑过渡而来 (0.15 为衰减因子)
            const currentWidth = lerp(lastWidth, targetWidth, 0.15);
            lastWidth = currentWidth;

            step.angle += 90;
            const top = event.middlePoint.add(step.normalize(currentWidth));
            const bottom = event.middlePoint.subtract(step.normalize(currentWidth));
            
            path.add(top);
            path.insert(0, bottom);
            
            // 每 5 帧执行一次局部简化，保证实时性能与曲线平滑的平衡
            if (event.count % 5 === 0) {
                path.smooth({ type: 'continuous' });
            }
        };

        drawTool.onMouseUp = (event: any) => {
            path.add(event.point);
            path.closed = true;
            // 最终平滑与简化
            path.simplify(2);
            path.smooth({ type: 'continuous' });
            setIsDrawing(false);
        };

        const handleResize = () => {
            if (canvasRef.current && project.view) {
                const rect = canvasRef.current.parentElement?.getBoundingClientRect();
                if (rect) project.view.viewSize = new paper.Size(rect.width, rect.height);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            drawTool.remove();
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const clearCanvas = () => {
        if (paperProjectRef.current) {
            const inkLayer = paperProjectRef.current.layers['inkLayer'];
            if (inkLayer) inkLayer.removeChildren();
        }
    };

    const exportSVG = () => {
        if (!paperProjectRef.current) return;
        const project = paperProjectRef.current;
        const inkLayer = project.layers['inkLayer'];
        if (!inkLayer || inkLayer.children.length === 0) {
            alert("请先挥毫落纸！");
            return;
        }

        // 核心：仅导出内容层，不带 ViewBox 边框，适配 3D 打印切片软件
        const svgElement = inkLayer.exportSVG({ asString: false, bounds: 'content' }) as SVGElement;
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pure_ink_work_${Date.now()}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // CCPT 标准评分算法模拟
    const computeScore = () => {
        if (!paperProjectRef.current) return;
        const project = paperProjectRef.current;
        const inkLayer = project.layers['inkLayer'];
        const items = inkLayer?.children || [];
        
        if (items.length === 0) {
            alert("请先挥毫落纸！");
            return;
        }

        let totalArea = 0;
        let bounds = items[0].bounds.clone();
        
        items.forEach((item: any) => {
            totalArea += item.area;
            bounds = bounds.include(item.bounds);
        });

        const canvasCenter = project.view.center;
        const textCenter = bounds.center;

        // 1. 结体结构 (Structure 50%): 偏离中宫的距离
        const offset = canvasCenter.getDistance(textCenter);
        const maxOffset = project.view.size.width / 4;
        const structureScore = Math.max(0, 50 - (offset / maxOffset) * 25);

        // 2. 笔法线条 (Brushwork 30%): 面积与外接矩形的比例 (检测是否是干瘪的一根线)
        const boundingArea = bounds.width * bounds.height;
        const fillRatio = totalArea / boundingArea; 
        let brushScore = 15; // 基础分
        if (fillRatio > 0.1 && fillRatio < 0.4) brushScore += 15; // 粗细有致
        else if (fillRatio >= 0.4) brushScore += 5; // 墨太重 (墨猪)
        
        // 3. 章法流畅 (Composition 20%): 占位比例 (理想占格 70%-80%)
        const canvasArea = project.view.size.width * project.view.size.height;
        const occupyRatio = boundingArea / canvasArea;
        let compScore = 10;
        if (occupyRatio > 0.3 && occupyRatio < 0.6) compScore += 10; // 大小适中
        else if (occupyRatio >= 0.6) compScore += 5; // 涨格

        onScoreComputed({
            structure: Math.round(structureScore),
            brush: Math.round(brushScore),
            composition: Math.round(compScore),
            total: Math.round(structureScore + brushScore + compScore),
            diagnosis: {
                structure: DIAGNOSIS.structure(Math.round(structureScore)),
                brush: DIAGNOSIS.brush(Math.round(brushScore)),
                composition: DIAGNOSIS.composition(Math.round(compScore))
            },
            exportAction: exportSVG
        });
    };

    return (
        <div className="w-full h-full flex flex-col md:flex-row gap-6 bg-slate-800 rounded-3xl p-4 overflow-hidden border border-slate-700 shadow-2xl">
            {/* 左侧画布区：宣纸底色与米字格 */}
            <div className="flex-1 relative bg-[#f4f1ea] rounded-2xl overflow-hidden shadow-inner border-[12px] border-[#d4cfc1]">
                {/* 米字格 SVG 背景 */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" width="100%" height="100%">
                    <line x1="0" y1="0" x2="100%" y2="100%" stroke="#dc2626" strokeWidth="2" strokeDasharray="10 10" />
                    <line x1="100%" y1="0" x2="0" y2="100%" stroke="#dc2626" strokeWidth="2" strokeDasharray="10 10" />
                    <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#dc2626" strokeWidth="2" strokeDasharray="10 10" />
                    <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#dc2626" strokeWidth="2" strokeDasharray="10 10" />
                    <rect x="2%" y="2%" width="96%" height="96%" fill="none" stroke="#dc2626" strokeWidth="4" />
                </svg>
                <canvas ref={canvasRef} className="w-full h-full relative z-10 touch-none cursor-crosshair mix-blend-multiply" />
            </div>

            {/* 右侧交互面板 */}
            <div className="w-full md:w-72 bg-slate-900 rounded-2xl p-6 flex flex-col gap-6 border border-slate-700 shrink-0 shadow-sm overflow-y-auto">
                <div>
                    <h3 className="text-xl font-black italic text-white flex items-center gap-2"><PenTool className="text-amber-500" /> 数字砚台</h3>
                    <p className="text-[10px] uppercase font-black text-slate-500 mt-1">Dynamic Ink Engine</p>
                </div>
                
                <div className="space-y-3 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                    <p className="text-xs text-amber-200/80 leading-relaxed font-medium">
                        请在左侧米字格中尝试书写“永”字。注意运笔的速度变化，体验提按的物理晕染感。
                    </p>
                </div>

                {/* 笔尖规格调节 */}
                <div className="space-y-3 px-1">
                    <div className="flex justify-between items-end text-amber-500 font-black italic">
                        <span className="text-[10px] uppercase tracking-wider">笔尖规格</span>
                        <span className="text-xl">{brushSize.toFixed(1)}</span>
                    </div>
                    <input 
                        type="range" min="0.5" max="2.5" step="0.1" 
                        value={brushSize} 
                        onChange={(e) => setBrushSize(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 opacity-80 hover:opacity-100 transition-opacity"
                    />
                    <div className="flex justify-between text-[8px] text-slate-500 font-black uppercase tracking-tighter">
                        <span>小楷 (Thin)</span>
                        <span>大楷 (Bold)</span>
                    </div>
                </div>

                <div className="mt-auto space-y-4">
                    <button onClick={clearCanvas} className="w-full p-3 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 text-xs font-black transition-all flex items-center justify-center gap-2">
                        <RotateCw size={16} /> 更换宣纸 (清空)
                    </button>
                    <button onClick={computeScore} className="w-full py-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black italic transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(217,119,6,0.4)]">
                        <Award size={18} /> 提交智能评卷
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 核心插件出口
// ==========================================
export default function Plugin({ config }: { config: any }) {
    const [step, setStep] = useState(0);
    const [scores, setScores] = useState<any>(null);

    return (
        <div className="w-full h-screen overflow-y-auto bg-[#020617] text-white selection:bg-amber-500/30 font-sans">
            <div className="fixed top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-8">
                <div className="flex items-center gap-6">
                    <button onClick={() => window.parent.postMessage({ type: 'EXIT_PLUGIN' }, '*')} className="text-white/40 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-600/20 text-amber-500 text-[10px] font-black uppercase tracking-tighter">L1-10</span>
                        <h1 className="font-black text-sm italic tracking-widest uppercase">墨韵流芳：数字书法</h1>
                    </div>
                </div>
            </div>

            <div className="pt-24 pb-12 px-6 max-w-[1400px] mx-auto min-h-[calc(100vh-4rem)] flex flex-col">
                {step === 0 && (
                    <div className="flex-1 relative rounded-[48px] overflow-hidden bg-slate-900 border border-white/5 shadow-2xl flex flex-col p-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-transparent to-stone-800/20 opacity-30" />
                        <div className="relative z-10 flex-1 flex flex-col justify-center gap-8">
                            <h2 className="text-5xl md:text-6xl font-black italic leading-[1.2]">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">水墨引擎解析：</span><br />
                                墨韵流芳
                            </h2>
                            <p className="text-xl text-amber-100/60 max-w-2xl leading-relaxed font-light">
                                抛弃死板的线条，体验基于物理动力学的数字水墨。你的每一次提按、快慢，都会真实反映在笔画的骨肉之中。
                            </p>
                            <button onClick={() => setStep(1)} className="w-fit px-12 py-5 bg-white text-black rounded-3xl font-black italic hover:scale-105 transition-transform flex items-center gap-3 shadow-2xl">
                                研墨展纸 <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="flex-1 rounded-[48px] overflow-hidden shadow-2xl border border-white/5 bg-slate-900 flex flex-col relative animate-in fade-in zoom-in-95 duration-500 min-h-[600px]">
                        <CalligraphyCanvas onScoreComputed={(s) => { setScores(s); setStep(2); }} />
                    </div>
                )}

                {step === 2 && scores && (
                    <div className="flex-1 rounded-[48px] bg-slate-900 border border-white/5 flex flex-col items-center justify-center p-20 text-center gap-10 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 min-h-[600px]">
                        <div className="w-32 h-32 bg-amber-500 rounded-[40px] flex items-center justify-center shadow-[0_0_80px_rgba(245,158,11,0.4)] relative z-10">
                            <Trophy className="w-16 h-16 text-white" />
                        </div>
                        <div className="relative z-10 w-full max-w-2xl">
                            <h2 className="text-6xl font-black italic tracking-tighter text-white mb-8">
                                综合得分 <span className="text-amber-400">{scores.total}</span>
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-12">
                                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col gap-3">
                                    <div>
                                        <div className="text-xs text-white/40 font-black uppercase mb-1">结体结构 (50%)</div>
                                        <div className="text-3xl font-black text-white">{scores.structure}<span className="text-sm text-white/20">/50</span></div>
                                    </div>
                                    <p className="text-[10px] text-amber-200/60 leading-relaxed font-medium">{scores.diagnosis.structure}</p>
                                </div>
                                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col gap-3">
                                    <div>
                                        <div className="text-xs text-white/40 font-black uppercase mb-1">笔法线条 (30%)</div>
                                        <div className="text-3xl font-black text-white">{scores.brush}<span className="text-sm text-white/20">/30</span></div>
                                    </div>
                                    <p className="text-[10px] text-amber-200/60 leading-relaxed font-medium">{scores.diagnosis.brush}</p>
                                </div>
                                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col gap-3">
                                    <div>
                                        <div className="text-xs text-white/40 font-black uppercase mb-1">章法流畅 (20%)</div>
                                        <div className="text-3xl font-black text-white">{scores.composition}<span className="text-sm text-white/20">/20</span></div>
                                    </div>
                                    <p className="text-[10px] text-amber-200/60 leading-relaxed font-medium">{scores.diagnosis.composition}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center gap-4 relative z-10 px-6">
                            <button onClick={() => setStep(1)} className="px-8 py-4 bg-white/5 rounded-2xl font-black text-sm text-white/60 hover:text-white transition-colors">
                                重新书写
                            </button>
                            <button onClick={() => scores.exportAction()} className="px-8 py-4 border border-amber-500/30 rounded-2xl font-black text-sm text-amber-500 hover:bg-amber-500 hover:text-white transition-all">
                                导出 SVG 墨迹
                            </button>
                            <button onClick={() => window.parent.postMessage({ type: 'LESSON_COMPLETE', slug: config?.slug, nextLesson: 'l1_11_embroidery' }, '*')} className="px-10 py-4 bg-amber-600 rounded-2xl font-black text-sm text-white shadow-xl hover:bg-amber-500 transition-all flex items-center gap-2">
                                提交并进入下一关卡 <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
