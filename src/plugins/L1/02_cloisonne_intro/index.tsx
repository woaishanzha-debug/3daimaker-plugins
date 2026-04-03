import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, BookOpen, MessageCircle, Trophy, Wand2, Box, ChevronRight, Download, Share2, Sparkles, GraduationCap, Lightbulb, Trash2, CheckCircle } from 'lucide-react';

// --- Internal Component: CloisonneCanvas ---
// ... (omitted for brevity in replacement chunk)
const CloisonneCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [status, setStatus] = useState<string>('请绘制闭合的金线 (掐丝)');
    const paperRef = useRef<any>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const initDrawingEngine = async () => {
            try {
                // Ensure paper.js is loaded
                const paperDist = await import('paper/dist/paper-core');
                const paper = paperDist.default || paperDist;

                if (!paperRef.current && canvasRef.current) {
                    paper.setup(canvasRef.current);
                    paperRef.current = paper;

                    const p = paper;
                    const tool = new p.Tool();
                    let path: any;

                    tool.onMouseDown = (event: { point: { x: number, y: number } }) => {
                        path = new p.Path({
                            strokeColor: '#D4AF37', // Gold filament
                            strokeWidth: 4,
                            strokeCap: 'round',
                            strokeJoin: 'round',
                        });
                        path.add(event.point);
                        setStatus('正在勾勒金线...');
                    };

                    tool.onMouseDrag = (event: { point: { x: number, y: number } }) => {
                        path.add(event.point);
                    };

                    tool.onMouseUp = () => {
                        path.simplify(10);
                        let isClosed = false;
                        if (path.firstSegment && path.lastSegment) {
                            const distance = path.firstSegment.point.getDistance(path.lastSegment.point);
                            if (distance < 40) {
                                path.closed = true;
                                isClosed = true;
                            }
                        }

                        const crossings = path.getCrossings(path);
                        if (crossings && crossings.length > 0) {
                            isClosed = true;
                        }

                        if (isClosed) {
                            path.fillColor = new p.Color(59/255, 130/255, 246/255, 0.8);
                            setStatus('检测到闭合区域交集，已完成填色映射');
                        } else {
                            setStatus('未检测到闭合交点，请继续完善线条');
                        }
                    };

                    tool.activate();
                    setIsInitialized(true);
                }
            } catch (err) {
                console.error('Drawing Engine Error:', err);
            }
        };

        initDrawingEngine();

        return () => {
            if (paperRef.current?.project) {
                paperRef.current.project.clear();
                paperRef.current.project.remove();
                paperRef.current = null;
            }
        };
    }, []);

    const clearCanvas = () => {
        if (paperRef.current?.project) {
            paperRef.current.project.activeLayer.removeChildren();
            paperRef.current.view.update();
            setStatus('请绘制闭合的金线 (掐丝)');
        }
    };

    const exportSVG = () => {
        if (!paperRef.current?.project) return;
        const svgElement = paperRef.current.project.exportSVG() as SVGElement;
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cloisonne_design_${Date.now()}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="relative w-full h-[600px] bg-[#0f172a] rounded-[48px] overflow-hidden border border-[#D4AF37]/30 shadow-2xl flex flex-col items-center justify-center">
            <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'radial-gradient(#D4AF37 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
                <div className="flex items-center gap-3 px-6 py-2.5 bg-[#D4AF37]/10 backdrop-blur-xl rounded-full border border-[#D4AF37]/30 shadow-xl">
                    <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-[11px] text-[#D4AF37] font-black uppercase tracking-[0.2em]">{status}</span>
                </div>
            </div>
            <canvas ref={canvasRef} className="w-full h-full touch-none cursor-crosshair relative z-10" />
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/90 backdrop-blur-2xl p-4 rounded-[32px] border border-white/10 shadow-xl z-20">
                <button onClick={clearCanvas} className="p-3.5 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-2xl transition-all">
                    <Trash2 className="w-5 h-5" />
                </button>
                <button onClick={exportSVG} className="flex items-center gap-3 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[11px] tracking-widest uppercase transition-all shadow-lg shadow-blue-900/40">
                    <Download className="w-5 h-5" /> 导出 SVG 用于打印
                </button>
            </div>
            {!isInitialized && (
                <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="w-12 h-12 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
};

// --- Main Plugin Component ---
export default function Plugin({ config }: { config: any }) {
    const [step, setStep] = useState(0); // 0: Intro, 1: Culture, 2: Interactive Lab, 3: Success
    const [showTeacherGuide, setShowTeacherGuide] = useState(false);

    const teacherGuides = [
        "【导入语】同学们，今天我们要跨入乾隆皇帝的造办处，去探寻一件‘点石成金’的艺术——景泰蓝。请大家闭上眼，想象一条细如发丝的金线，如何在你的指尖跳舞？",
        "【工艺讲解】‘掐丝’的核心在于‘力度的均衡’。在 3D 打印的世界里，这对应着‘向量路径的闭合’。观察这些图案，它们往往是对称的，这不仅是为了美学，更是为了结构稳定。",
        "【实操引导】现在，请开启实验。在数字画板上，尝试勾勒封闭的色块。观察 AI 是如何识别并为你点蓝的？这一步生成的 SVG 将直接化为 3D 打印的物理底板。",
        "【总结】恭喜完成！你们不仅是在画画，而是在通过算法复刻千年非遗。点击导出，我们将把这份‘数字金线’转化为实物底稿。"
    ];

    const exitPlugin = () => {
        window.parent.postMessage({ type: 'EXIT_PLUGIN' }, '*');
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30 overflow-hidden font-sans">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-8">
                <div className="flex items-center gap-6">
                    <button onClick={exitPlugin} className="text-white/40 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-tighter">{config?.lessonId || 'L1-02'}</span>
                        <h1 className="font-black text-sm italic tracking-widest uppercase">景泰蓝工艺：点蓝与掐丝 (V2)</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-1">
                        {[0, 1, 2, 3].map((s) => (
                            <div key={s} className={`h-1.5 w-8 rounded-full transition-all duration-300 ${s <= step ? 'bg-blue-500' : 'bg-white/10'}`} />
                        ))}
                    </div>
                    <button
                        onClick={() => setShowTeacherGuide(!showTeacherGuide)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${showTeacherGuide ? 'bg-white text-black' : 'bg-blue-600/20 text-blue-400 border border-blue-500/20'}`}
                    >
                        <GraduationCap className="w-4 h-4" /> 教师引导助手
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="pt-24 pb-12 px-6 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[calc(100vh-4rem)]">
                {/* Left Side */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Step 0: Intro */}
                    {step === 0 && (
                        <div className="animate-in fade-in zoom-in-95 duration-500 relative aspect-video rounded-[48px] overflow-hidden bg-slate-900 border border-white/5 shadow-2xl flex flex-col p-16">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10 opacity-30" />
                            <div className="relative z-10 flex-1 flex flex-col justify-center gap-8">
                                <div className="flex items-center gap-4">
                                    <div className="px-4 py-1.5 bg-blue-600/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-blue-500/20">Phase 01</div>
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-blue-500/30 to-transparent" />
                                </div>
                                <h2 className="text-5xl font-black italic leading-[1.2]">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">智驭文明：</span><br />
                                    景泰蓝点蓝实验室
                                </h2>
                                <p className="text-xl text-blue-100/60 max-w-2xl leading-relaxed font-light">
                                    探索景泰蓝的底层物理逻辑。我们要挑战的，是让古老的“铜胎金丝”在 3D 实验室里焕发数字新生。
                                </p>
                                <button onClick={() => setStep(1)} className="w-fit px-12 py-5 bg-white text-black rounded-3xl font-black italic hover:scale-105 transition-transform flex items-center gap-3 shadow-2xl">
                                    开启数字化溯源之旅 <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Presentation Placeholder */}
                    {step === 1 && (
                        <div className="animate-in fade-in zoom-in-95 duration-500 relative h-full rounded-[48px] overflow-hidden shadow-2xl border border-white/5 bg-slate-900 flex flex-col items-center justify-center p-10">
                            <div className="absolute top-8 left-8 z-30 flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg text-white">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-black text-white/40 uppercase tracking-widest">Interactive Courseware</span>
                            </div>
                            
                            {/* STATIC PLACEHOLDER FOR PRESENTATION */}
                            <div className="text-center space-y-4">
                                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Sparkles className="w-12 h-12 text-blue-500" />
                                </div>
                                <h3 className="text-2xl font-black italic">景泰蓝工艺：点蓝与掐丝</h3>
                                <p className="text-slate-500 text-sm max-w-md">本章节课件内容已在 V2 降维方案中设为静态预览，请点击下方按钮进入实验室环节。</p>
                            </div>

                            <div className="absolute top-8 right-8 z-30 flex gap-4">
                                <button onClick={() => setStep(2)} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-blue-500 transition-all shadow-2xl active:scale-95">
                                    进入设计实验室 <Wand2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Interactive Lab */}
                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col gap-4">
                            <CloisonneCanvas />
                            <div className="flex justify-end">
                                <button onClick={() => setStep(3)} className="px-10 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-black text-xs tracking-widest uppercase transition-all">
                                    完成闭合填色验证并确认
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Success */}
                    {step === 3 && (
                        <div className="animate-in fade-in zoom-in-95 duration-500 flex-1 rounded-[48px] bg-slate-900 border border-white/5 flex flex-col items-center justify-center p-20 text-center gap-10 shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none" />
                            <div className="w-32 h-32 bg-green-500 rounded-[40px] flex items-center justify-center shadow-[0_0_80px_rgba(34,197,94,0.4)] relative z-10 text-white">
                                <Trophy className="w-16 h-16" />
                            </div>
                            <div className="space-y-4 relative z-10">
                                <h2 className="text-6xl font-black italic tracking-tighter text-white">READY FOR PRINT</h2>
                                <p className="text-green-200/60 font-medium max-w-lg mx-auto leading-relaxed">
                                    你已成功掌握景泰蓝点蓝逻辑。导出的 SVG 底稿现在可以转化为 3D 模型进行打印了。
                                </p>
                            </div>
                            <div className="flex gap-4 relative z-10">
                                <button onClick={() => setStep(2)} className="px-8 py-4 bg-white/5 rounded-2xl font-black text-sm text-white/60 hover:text-white transition-colors">
                                    继续优化设计
                                </button>
                                <button onClick={exitPlugin} className="px-10 py-4 bg-blue-600 rounded-2xl font-black text-sm text-white shadow-xl hover:bg-blue-500 transition-all">
                                    返回课程列表 <ChevronRight className="w-5 h-5 inline ml-1" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Knowledge Card */}
                    {step === 1 && (
                        <div className="animate-in fade-in duration-500 p-8 rounded-[40px] bg-blue-600 shadow-[0_20px_50px_rgba(59,130,246,0.3)] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-white">
                                <Sparkles className="w-24 h-24" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                                        <Lightbulb className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-[10px] text-white font-black uppercase tracking-widest">关键知识：点蓝逻辑</span>
                                </div>
                                <h3 className="text-xl font-black italic mb-3 text-white">什么是点蓝？</h3>
                                <p className="text-sm text-blue-50 leading-relaxed font-medium font-sans">
                                    在金属丝围成的区域内填入彩色釉料。在数字实验室中，这意味着识别闭合路径并填充颜色。
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Teacher Guide */}
                    {showTeacherGuide && (
                        <div className="animate-in slide-in-from-right-4 fade-in duration-500 p-10 rounded-[48px] bg-white text-black flex flex-col gap-8 shadow-2xl relative overflow-hidden">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                                    <MessageCircle className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <div className="font-black text-sm uppercase tracking-widest opacity-40">Teacher Script</div>
                                    <div className="font-black text-xl italic tracking-tighter">实时引导话术</div>
                                </div>
                            </div>
                            <div className="text-lg font-bold leading-relaxed border-l-4 border-blue-600 pl-6 py-2 italic font-sans text-slate-800">
                                “{teacherGuides[step]}”
                            </div>
                        </div>
                    )}

                    {/* Quest Board */}
                    <div className="p-10 rounded-[48px] bg-white/5 border border-white/10 flex flex-col gap-8 flex-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                                    <Box className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="font-black text-[10px] opacity-40 uppercase tracking-widest">Quest Progress</div>
                                    <div className="font-black text-lg italic">任务进度</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {[
                                { t: '完成景泰蓝工艺背景扫描', icon: BookOpen, s: step >= 1 },
                                { t: '在实验室绘制出闭合的填色区域', icon: Wand2, s: step >= 3 },
                                { t: '成功导出 SVG 格式底板线稿', icon: Share2, s: step >= 3 }
                            ].map((o, i) => (
                                <div key={i} className={`flex items-center gap-4 p-4 rounded-3xl transition-all ${o.s ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/5 text-white/40'}`}>
                                    <div className={`p-2 rounded-xl ${o.s ? 'bg-green-500/20' : 'bg-white/10'}`}>
                                        <o.icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold font-sans">{o.t}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
