import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ChevronRight, Trophy, Download, Scissors, Circle, Upload, Plus, MousePointer2, Trash2 } from 'lucide-react';
// @ts-ignore
import ImageTracer from 'imagetracerjs';
// @ts-ignore
import paper from 'paper/dist/paper-core';

type ToolType = 'select' | 'cut' | 'joint' | 'hole' | 'erase';

function SvgPuncher() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sourceImageRef = useRef<HTMLImageElement | null>(null);
    const paperProjectRef = useRef<any>(null);

    const [tool, setTool] = useState<ToolType>('select');
    const [threshold, setThreshold] = useState(150);
    const [jointRadius] = useState(15);
    const [holeRadius] = useState(5);
    const [isProcessing, setIsProcessing] = useState(false);

    // 1. 初始化 Paper.js 引擎
    useEffect(() => {
        if (!canvasRef.current) return;
        if (paperProjectRef.current) paperProjectRef.current.remove();
        paper.setup(canvasRef.current);
        paperProjectRef.current = paper.project;
        
        const puppetLayer = new paper.Layer();
        puppetLayer.name = 'puppetLayer';
        const toolLayer = new paper.Layer();
        toolLayer.name = 'toolLayer';
        puppetLayer.activate();

        const handleResize = () => {
            if (canvasRef.current && paper.view) {
                const rect = canvasRef.current.parentElement?.getBoundingClientRect();
                if (rect) paper.view.viewSize = new paper.Size(rect.width, rect.height);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => {
            window.removeEventListener('resize', handleResize);
            if (paperProjectRef.current) {
                paperProjectRef.current.remove();
                paperProjectRef.current = null;
            }
        };
    }, []);

    const traceGenerationRef = useRef(0);

    // 2. 图像转矢量提取逻辑
    const traceImage = useCallback(() => {
        if (!sourceImageRef.current || !canvasRef.current || !paperProjectRef.current) return;
        setIsProcessing(true);
        const currentGen = ++traceGenerationRef.current;
        const currentProject = paperProjectRef.current;
        const canvas = document.createElement('canvas');
        const img = sourceImageRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
            const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            if (data[i + 3] < 50 || lum > threshold) {
                data[i] = data[i+1] = data[i+2] = 255;
                data[i + 3] = 0;
            } else {
                data[i] = data[i+1] = data[i+2] = 0;
                data[i + 3] = 255;
            }
        }

        const options = { ltres: 1, qtres: 1, pathomit: 8, scale: 1, viewbox: true, colorsampling: 0, numberofcolors: 2, pal: [{r:0,g:0,b:0,a:255}, {r:0,g:0,b:0,a:0}], layering: 0, stroke: 0 };
        const svgStr = ImageTracer.imagedataToSVG(imgData, options);

        currentProject.importSVG(svgStr, {
            insert: false,
            onLoad: (item: any) => {
                if (currentGen !== traceGenerationRef.current) {
                    if (item) item.remove();
                    return;
                }
                currentProject.activate();
                currentProject.clear();

                const puppetLayer = new paper.Layer();
                puppetLayer.name = 'puppetLayer';
                new paper.Layer().name = 'toolLayer';
                puppetLayer.activate();

                const validPaths: paper.PathItem[] = [];
                const scanAndTag = (obj: any) => {
                    if (obj.children) {
                        [...obj.children].forEach(scanAndTag);
                    } else if (obj instanceof paper.PathItem) {
                        let keep = true;
                        if (obj.fillColor) {
                            const color = obj.fillColor as paper.Color;
                            if (color.alpha !== undefined && color.alpha < 0.1) keep = false;
                            else if (color.gray > 0.5) keep = false;
                        } else keep = false;

                        if (obj.bounds.width > item.bounds.width * 0.95 && obj.bounds.height > item.bounds.height * 0.95) keep = false;
                        if (keep && (obj as any).area > 10) {
                            (obj as any).closed = true;
                            validPaths.push(obj);
                        }
                    }
                };
                scanAndTag(item);

                let unitedPath: paper.PathItem | null = null;
                if (validPaths.length > 0) {
                    unitedPath = validPaths[0].clone({insert: false}) as paper.PathItem;
                    for (let i = 1; i < validPaths.length; i++) {
                        const next = unitedPath.unite(validPaths[i], { insert: false }) as paper.PathItem;
                        if (i > 1) unitedPath.remove();
                        unitedPath = next;
                    }
                }

                if (unitedPath) {
                    unitedPath.remove();
                    const view = currentProject.view;
                    const viewScale = Math.min((view.size.width * 0.8) / unitedPath.bounds.width, (view.size.height * 0.8) / unitedPath.bounds.height);
                    unitedPath.scale(viewScale);
                    unitedPath.position = view.center;
                    unitedPath.fillColor = new paper.Color('#1e293b');
                    unitedPath.data.isPuppetPart = true;
                    puppetLayer.addChild(unitedPath);
                }

                item.remove();
                currentProject.view.update();
                setIsProcessing(false);
            }
        });
    }, [threshold]);

    // 3. 核心物理交互引擎 (拖拽、切割、打孔、关节)
    useEffect(() => {
        if (!paperProjectRef.current) return;
        const currentProject = paperProjectRef.current;
        currentProject.activate();

        const interactTool = new paper.Tool();
        let activeItem: any = null;
        let dragLine: any = null;
        let previewItems: any[] = [];

        const clearToolGraphics = () => {
            previewItems.forEach(i => i.remove()); previewItems = [];
            if (dragLine) { dragLine.remove(); dragLine = null; }
        };

        interactTool.onMouseDown = (event: any) => {
            clearToolGraphics();
            const puppetLayer = currentProject.layers['puppetLayer'];
            const toolLayer = currentProject.layers['toolLayer'];

            if (tool === 'select') {
                const hit = currentProject.hitTest(event.point, { fill: true, tolerance: 5 });
                if (hit && hit.item && hit.item.data.isPuppetPart) {
                    activeItem = hit.item; 
                    activeItem.bringToFront();
                }
            } else if (tool === 'cut') {
                toolLayer.activate();
                dragLine = new paper.Path.Line({ from: event.point, to: event.point, strokeColor: '#ef4444', strokeWidth: 2, dashArray: [5, 5] });
                puppetLayer.activate();
            } else if (tool === 'joint') {
                const hit = currentProject.hitTest(event.point, { fill: true });
                if (hit && hit.item && hit.item.data.isPuppetPart) {
                    const ball = new paper.Path.Circle({ center: event.point, radius: jointRadius });
                    const result = (hit.item as any).unite(ball);
                    result.data.isPuppetPart = true;
                    hit.item.replaceWith(result); 
                    ball.remove();
                }
            } else if (tool === 'hole') {
                const hit = currentProject.hitTest(event.point, { fill: true });
                if (hit && hit.item && hit.item.data.isPuppetPart) {
                    const hole = new paper.Path.Circle({ center: event.point, radius: holeRadius });
                    const result = (hit.item as any).subtract(hole);
                    result.data.isPuppetPart = true;
                    hit.item.replaceWith(result); 
                    hole.remove();
                }
            } else if (tool === 'erase') {
                const hit = currentProject.hitTest(event.point, { fill: true });
                if (hit && hit.item && hit.item.data.isPuppetPart) hit.item.remove();
            }
        };

        interactTool.onMouseDrag = (event: any) => {
            if (tool === 'select' && activeItem) {
                activeItem.position = activeItem.position.add(event.delta);
            } else if (tool === 'cut' && dragLine) {
                currentProject.layers['toolLayer'].activate();
                dragLine.segments[1].point = event.point;
                previewItems.forEach(i => i.remove()); previewItems = [];
                const mid = dragLine.segments[0].point.add(event.point).divide(2);
                const p = new paper.Path.Circle({ center: mid, radius: jointRadius, fillColor: 'rgba(59, 130, 246, 0.3)' });
                previewItems.push(p);
                currentProject.layers['puppetLayer'].activate();
            }
        };

        interactTool.onMouseUp = () => {
            if (tool === 'cut' && dragLine) executeSlash(dragLine);
            clearToolGraphics(); activeItem = null;
        };

        const executeSlash = (line: paper.Path.Line) => {
            const puppetLayer = currentProject.layers['puppetLayer'];
            const items = [...puppetLayer.children];
            items.forEach(item => {
                if (item instanceof paper.PathItem && item.data.isPuppetPart) {
                    const intersections = item.getIntersections(line);
                    if (intersections.length >= 2) {
                        const p1 = intersections[0].point;
                        const p2 = intersections[intersections.length - 1].point;
                        const vector = p2.subtract(p1);
                        const normal = (vector as any).rotate(90).normalize(1); 
                        const cutter = new paper.Path({ segments: [p1, p2, p2.add(normal), p1.add(normal)], closed: true, visible: false });
                        try {
                            const partA = (item as any).intersect(cutter);
                            const partB = (item as any).subtract(cutter);
                            const mid = p1.add(p2).divide(2);
                            const joint = new paper.Path.Circle(mid, jointRadius);
                            const male = (partA as any).unite(joint);
                            const female = (partB as any).subtract(joint);
                            const color = item.fillColor ? (item.fillColor as any).clone() : new paper.Color('#1e293b');
                            item.remove(); cutter.remove(); joint.remove(); partA.remove(); partB.remove();
                            
                            const finalize = (p: any) => {
                                if (!p || p.isEmpty()) return;
                                if (p instanceof paper.CompoundPath) {
                                    [...p.children].forEach(child => { child.fillColor = color; child.data.isPuppetPart = true; puppetLayer.addChild(child); });
                                    p.remove();
                                } else { p.fillColor = color; p.data.isPuppetPart = true; puppetLayer.addChild(p); }
                            };
                            finalize(male); finalize(female);
                        } catch (e) { console.error("Cut error:", e); }
                    }
                }
            });
        };
        return () => { interactTool.remove(); };
    }, [tool, jointRadius, holeRadius]);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => { sourceImageRef.current = img; traceImage(); };
            img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const exportSVG = () => {
        if (!paperProjectRef.current) return;
        const svgElement = paperProjectRef.current.exportSVG({ asString: false }) as SVGElement;
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; 
        a.download = `puppet_parts_${Date.now()}.svg`;
        document.body.appendChild(a); // 兼容性增强：必须挂载到 DOM 树才能触发 click
        a.click(); 
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col md:flex-row h-full min-h-[600px] w-full bg-slate-100 text-slate-800 rounded-3xl overflow-hidden border border-slate-200 shadow-2xl">
            <div className="w-full md:w-72 bg-white p-6 flex flex-col gap-6 border-r border-slate-200 shrink-0 shadow-sm overflow-y-auto">
                <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Plus className="text-blue-600" /> 皮影工匠 Pro</h2>
                    <p className="text-[9px] text-slate-400 uppercase font-black">Geometric Shadow Engine</p>
                </div>
                
                <label className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl cursor-pointer transition-all font-black text-sm shadow-xl">
                    <Upload size={20} /> 上传底图组件
                    <input type="file" className="hidden" onChange={handleUpload} />
                </label>

                {/* 物理引擎工具栏 */}
                <div className="space-y-2">
                    <p className="text-xs font-black text-slate-400 uppercase">制作工具 (Tools)</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setTool('select')} className={`p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all ${tool === 'select' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}><MousePointer2 size={16}/> 拖拽移动</button>
                        <button onClick={() => setTool('cut')} className={`p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all ${tool === 'cut' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}><Scissors size={16}/> 划线分割</button>
                        <button onClick={() => setTool('joint')} className={`p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all ${tool === 'joint' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}><Plus size={16}/> 补充关节</button>
                        <button onClick={() => setTool('hole')} className={`p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all ${tool === 'hole' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}><Circle size={16}/> 关节打孔</button>
                        <button onClick={() => setTool('erase')} className={`col-span-2 p-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${tool === 'erase' ? 'bg-red-500 text-white shadow-md' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}><Trash2 size={16}/> 删除废料</button>
                    </div>
                </div>

                <div className="space-y-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <div className="flex justify-between items-end text-blue-600 font-black italic">
                        <span className="text-[10px] uppercase">识别阈值</span><span className="text-2xl">{threshold}</span>
                    </div>
                    <input type="range" min="0" max="255" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full accent-blue-600" />
                    <button onClick={traceImage} disabled={!sourceImageRef.current || isProcessing} className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50">
                        {isProcessing ? 'PROCESSING...' : '重置并更新矢量'}
                    </button>
                </div>

                <button disabled={isProcessing} onClick={exportSVG} className="w-full py-4 mt-auto rounded-xl bg-slate-900 text-white font-black italic hover:bg-black shadow-xl disabled:opacity-50">
                    <Download className="inline mr-2" /> 导出排版 SVG
                </button>
            </div>
            
            <div className="flex-1 relative bg-slate-50 overflow-hidden">
                <canvas ref={canvasRef} className="w-full h-full relative z-10 block cursor-crosshair" />
            </div>
        </div>
    );
}

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
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-tighter">L1-06</span>
                        <h1 className="font-black text-sm italic tracking-widest uppercase">影戏乾坤：皮影戏骨架</h1>
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
                                影戏乾坤
                            </h2>
                            <p className="text-xl text-blue-100/60 max-w-2xl leading-relaxed font-light">
                                探索皮影工艺的底层几何逻辑，利用算法切割与镂空，打磨每一个活动关节。
                            </p>
                            <button onClick={() => setStep(1)} className="w-fit px-12 py-5 bg-white text-black rounded-3xl font-black italic hover:scale-105 transition-transform flex items-center gap-3 shadow-2xl">
                                进入皮影数字工坊 <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="flex-1 rounded-[48px] overflow-hidden shadow-2xl border border-white/5 bg-slate-900 flex flex-col relative animate-in fade-in zoom-in-95 duration-500 min-h-[600px]">
                        <SvgPuncher />
                        <div className="absolute bottom-8 right-8 z-30 flex gap-4">
                            <button onClick={() => setStep(2)} className="px-8 py-4 bg-blue-600/90 hover:bg-blue-500 backdrop-blur-md text-white rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-2xl active:scale-95 border border-blue-400/20">
                                确认设计并锁定关节 <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="flex-1 rounded-[48px] bg-slate-900 border border-white/5 flex flex-col items-center justify-center p-20 text-center gap-10 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 min-h-[600px]">
                        <div className="w-32 h-32 bg-blue-600 rounded-[40px] flex items-center justify-center shadow-[0_0_80px_rgba(37,99,235,0.4)] relative z-10">
                            <Trophy className="w-16 h-16 text-white" />
                        </div>
                        <div className="space-y-4 relative z-10">
                            <h2 className="text-6xl font-black italic tracking-tighter text-white">MISSION COMPLETE</h2>
                            <p className="text-blue-200/60 font-medium max-w-lg mx-auto leading-relaxed">
                                恭喜！导出的 SVG 文件已准备就绪，可以发送至激光切割机或转化为 3D 模型进行打印。
                            </p>
                        </div>
                        <div className="flex gap-4 relative z-10">
                            <button onClick={() => setStep(1)} className="px-8 py-4 bg-white/5 rounded-2xl font-black text-sm text-white/60 hover:text-white transition-colors">
                                返回继续优化
                            </button>
                            <button onClick={() => window.parent.postMessage({ type: 'LESSON_COMPLETE', slug: config?.slug, nextLesson: 'l1_07_blue_white_porcelain' }, '*')} className="px-10 py-4 bg-blue-600 rounded-2xl font-black text-sm text-white shadow-xl hover:bg-blue-500 transition-all">
                                提交并进入下一关卡 <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
