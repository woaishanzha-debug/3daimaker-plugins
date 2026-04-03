import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronRight, Trophy, Download, Scissors, Undo2, RotateCw, Origami } from 'lucide-react';
// @ts-ignore
import paper from 'paper/dist/paper-core';

// ==========================================
// 内部引擎组件：真实剪纸物理工坊
// ==========================================
function PaperCuttingCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [foldCount, setFoldCount] = useState(4); // 4折, 6折, 8折
    const [isFolded, setIsFolded] = useState(true); // true: 折叠状态(可裁剪), false: 展开状态(预览)
    
    const paperProjectRef = useRef<any>(null);
    const currentWedgeRef = useRef<any>(null);
    const fullPaperRef = useRef<any>(null);
    const wedgeTipRef = useRef<any>(null);
    const historyRef = useRef<any[]>([]);

    // 引擎初始化与折纸生成
    useEffect(() => {
        if (!canvasRef.current) return;
        if (!paperProjectRef.current) {
            paper.setup(canvasRef.current);
            paperProjectRef.current = paper.project;
        }
        
        const project = paperProjectRef.current;
        project.clear();

        // 设定画布中心偏下一点为折点（模拟手持尖端）
        const tip = new paper.Point(project.view.center.x, project.view.center.y + 150);
        wedgeTipRef.current = tip;
        const radius = Math.min(project.view.size.width, project.view.size.height) * 0.45;
        const angle = 360 / (foldCount * 2);

        // 生成初始折叠扇区 (Base Wedge)
        const wedge = new paper.Path();
        wedge.add(tip);
        wedge.add(tip.add(new paper.Point({ angle: -90, length: radius }))); // 直直往上
        const through = tip.add(new paper.Point({ angle: -90 + angle/2, length: radius }));
        const to = tip.add(new paper.Point({ angle: -90 + angle, length: radius }));
        wedge.arcTo(through, to);
        wedge.closed = true;
        wedge.fillColor = '#b91c1c' as any; // 剪纸经典红
        wedge.data = { isBase: true };

        currentWedgeRef.current = wedge;
        historyRef.current = []; // 清空历史
        setIsFolded(true);

        // 交互工具：真实裁剪逻辑
        const cutTool = new paper.Tool();
        let cutPath: any = null;

        cutTool.onMouseDown = (event: any) => {
            if (!isFolded) return; // 展开状态禁止裁剪
            cutPath = new paper.Path({
                segments: [event.point],
                strokeColor: '#f59e0b', // 琥珀色描边 (刀痕)
                strokeWidth: 2,
                fillColor: 'rgba(251, 191, 36, 0.3)', // 半透明黄色填充
            });
        };

        cutTool.onMouseDrag = (event: any) => {
            if (!isFolded || !cutPath) return;
            cutPath.add(event.point);
        };

        cutTool.onMouseUp = () => {
            if (!isFolded || !cutPath) return;
            cutPath.closePath();
            
            // 忽略太小的误触
            if (cutPath.bounds.area < 10) {
                if (cutPath) cutPath.remove();
                return;
            }

            // 核心布尔运算：从纸上减去画出的区域
            const newWedge = currentWedgeRef.current.subtract(cutPath);
            cutPath.remove();

            // 防御：如果整张纸被剪没了，拒绝操作
            if (newWedge.isEmpty()) {
                newWedge.remove();
                return;
            }

            // 保存历史以供撤销
            const oldClone = currentWedgeRef.current.clone({insert: false});
            historyRef.current.push(oldClone);
            if (historyRef.current.length > 15) historyRef.current.shift(); // 最多存 15 步

            // 替换实体
            currentWedgeRef.current.remove();
            currentWedgeRef.current = newWedge;
            currentWedgeRef.current.fillColor = '#b91c1c' as any;
        };

        return () => {
            cutTool.remove();
        };
    }, [foldCount]);

    // 展开 / 折叠 状态切换逻辑
    useEffect(() => {
        if (!paperProjectRef.current || !currentWedgeRef.current) return;
        const project = paperProjectRef.current;
        const W = currentWedgeRef.current;
        const tip = wedgeTipRef.current;
        const angle = 360 / (foldCount * 2);

        if (isFolded) {
            // 切换回折叠态：显示原件，销毁展开组
            W.visible = true;
            if (fullPaperRef.current) {
                fullPaperRef.current.remove();
                fullPaperRef.current = null;
            }
        } else {
            // 切换到展开态：隐藏原件，生成多轴镜像组
            W.visible = false;
            const group = new paper.Group();

            for(let i = 0; i < foldCount; i++) {
                // 1. 正向切片
                const slice1 = W.clone({insert: false}) as any;
                slice1.visible = true;
                slice1.rotate(i * 2 * angle, tip);
                group.addChild(slice1);

                // 2. 镜像切片 (沿左侧直边反转)
                const slice2 = W.clone({insert: false}) as any;
                slice2.visible = true;
                slice2.scale(-1, 1, tip); // 沿 Y 轴镜像翻转
                slice2.rotate(i * 2 * angle, tip);
                group.addChild(slice2);
            }

            // 将展开后的完整剪纸移到画布正中央居中展示
            group.position = project.view.center;
            fullPaperRef.current = group;
        }
    }, [isFolded, foldCount]);

    const handleUndo = () => {
        if (!isFolded || historyRef.current.length === 0) return;
        const previous = historyRef.current.pop();
        currentWedgeRef.current.remove();
        currentWedgeRef.current = previous;
        paperProjectRef.current.activeLayer.addChild(previous);
    };

    const handleReset = () => {
        setFoldCount(prev => prev); // 触发重载
    };

    const exportSVG = () => {
        if (!paperProjectRef.current) return;
        // 如果在折叠状态，强制在后台展开一次再导出
        let targetItem = fullPaperRef.current;
        let tempGroup = null as any;
        
        if (isFolded) {
            const W = currentWedgeRef.current;
            const tip = wedgeTipRef.current;
            const angle = 360 / (foldCount * 2);
            tempGroup = new paper.Group();
            for(let i = 0; i < foldCount; i++) {
                const s1 = W.clone({insert: false}) as any;
                s1.rotate(i * 2 * angle, tip);
                tempGroup.addChild(s1);
                const s2 = W.clone({insert: false}) as any;
                s2.scale(-1, 1, tip);
                s2.rotate(i * 2 * angle, tip);
                tempGroup.addChild(s2);
            }
            tempGroup.position = paperProjectRef.current.view.center;
            paperProjectRef.current.activeLayer.addChild(tempGroup);
            targetItem = tempGroup;
        }

        const svgElement = targetItem.exportSVG({ asString: false }) as SVGElement;
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; 
        a.download = `paper_cut_real_${foldCount}folds.svg`;
        document.body.appendChild(a); 
        a.click(); 
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (tempGroup) tempGroup.remove();
    };

    return (
        <div className="w-full h-full min-h-[600px] flex flex-col md:flex-row gap-6 bg-slate-800 rounded-3xl p-4 overflow-hidden border border-slate-700 shadow-2xl">
            {/* 左侧画布区：米色底色，贴合真实剪纸场景 */}
            <div className="flex-1 relative bg-[#fdfbf7] rounded-2xl overflow-hidden border border-[#e5e5e5] shadow-inner">
                <canvas ref={canvasRef} className={`w-full h-full relative z-10 touch-none ${isFolded ? 'cursor-crosshair' : 'cursor-default'}`} />
            </div>

            {/* 右侧交互面板 */}
            <div className="w-full md:w-72 bg-slate-900 rounded-2xl p-6 flex flex-col gap-6 border border-slate-700 shrink-0 shadow-sm overflow-y-auto">
                <div>
                    <h3 className="text-xl font-black italic text-white flex items-center gap-2"><Scissors className="text-blue-500" /> 剪纸工坊</h3>
                    <p className="text-[10px] uppercase font-black text-slate-500 mt-1">Real Boolean Subtraction</p>
                </div>
                
                <div className="space-y-3">
                    <p className="text-[10px] uppercase font-black text-slate-400">折叠规格 (Folds)</p>
                    <div className="grid grid-cols-3 gap-2">
                        {[4, 6, 8].map(n => (
                            <button 
                                key={n}
                                onClick={() => { setFoldCount(n); }}
                                disabled={!isFolded}
                                className={`py-3 rounded-xl font-black text-xs transition-all ${foldCount === n ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'} disabled:opacity-50`}
                            >
                                {n} 折
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-[10px] uppercase font-black text-slate-400">工艺动作 (Actions)</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={handleUndo} disabled={!isFolded} className="p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-50 transition-all">
                            <Undo2 size={16} /> 撤销一刀
                        </button>
                        <button onClick={handleReset} disabled={!isFolded} className="p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black bg-slate-800 text-slate-400 hover:bg-red-900/30 hover:text-red-400 disabled:opacity-50 transition-all">
                            <RotateCw size={16} /> 重新折纸
                        </button>
                    </div>
                </div>

                {/* 核心展开/折叠按钮 */}
                <div className="mt-4">
                    <button 
                        onClick={() => setIsFolded(!isFolded)} 
                        className={`w-full py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${isFolded ? 'bg-amber-500 text-white hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                    >
                        <Origami size={20} />
                        {isFolded ? '展开剪纸预览' : '返回折叠继续剪'}
                    </button>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-800">
                    <button onClick={exportSVG} className="w-full py-4 rounded-xl bg-white text-black font-black italic hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-xl">
                        <Download size={18} /> 导出激光切割 SVG
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

    return (
        <div className="w-full h-screen overflow-y-auto bg-[#020617] text-white selection:bg-blue-500/30 font-sans">
            <div className="fixed top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-8">
                <div className="flex items-center gap-6">
                    <button onClick={() => window.parent.postMessage({ type: 'EXIT_PLUGIN' }, '*')} className="text-white/40 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-tighter">L1-12</span>
                        <h1 className="font-black text-sm italic tracking-widest uppercase">巧手冰心：窗花剪纸</h1>
                    </div>
                </div>
            </div>

            <div className="pt-24 pb-12 px-6 max-w-[1400px] mx-auto min-h-[calc(100vh-4rem)] flex flex-col">
                {step === 0 && (
                    <div className="flex-1 relative rounded-[48px] overflow-hidden bg-slate-900 border border-white/5 shadow-2xl flex flex-col p-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-amber-600/10 opacity-30" />
                        <div className="relative z-10 flex-1 flex flex-col justify-center gap-8">
                            <h2 className="text-5xl md:text-6xl font-black italic leading-[1.2]">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-300">真实物理切割：</span><br />
                                巧手冰心窗花
                            </h2>
                            <p className="text-xl text-red-100/60 max-w-2xl leading-relaxed font-light">
                                体验最原汁原味的非遗工艺。折叠纸张，用鼠标化作剪刀，通过真正的“减法”布尔运算，创造出千变万化的对称奇观。
                            </p>
                            <button onClick={() => setStep(1)} className="w-fit px-12 py-5 bg-white text-black rounded-3xl font-black italic hover:scale-105 transition-transform flex items-center gap-3 shadow-2xl">
                                进入真实剪纸工坊 <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="flex-1 rounded-[48px] overflow-hidden shadow-2xl border border-white/5 bg-slate-900 flex flex-col relative animate-in fade-in zoom-in-95 duration-500 min-h-[600px]">
                        <PaperCuttingCanvas />
                        <div className="absolute bottom-8 left-8 z-30 flex gap-4">
                            <button onClick={() => setStep(2)} className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-xl active:scale-95">
                                完成作品验证 <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="flex-1 rounded-[48px] bg-slate-900 border border-white/5 flex flex-col items-center justify-center p-20 text-center gap-10 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 min-h-[600px]">
                        <div className="w-32 h-32 bg-red-500 rounded-[40px] flex items-center justify-center shadow-[0_0_80px_rgba(239,68,68,0.4)] relative z-10">
                            <Trophy className="w-16 h-16 text-white" />
                        </div>
                        <div className="space-y-4 relative z-10">
                            <h2 className="text-6xl font-black italic tracking-tighter text-white">READY TO CUT</h2>
                            <p className="text-red-200/60 font-medium max-w-lg mx-auto leading-relaxed">
                                完美的对称构造！导出的 SVG 文件不仅是数字艺术品，更是真实的工业生产图纸。
                            </p>
                        </div>
                        <div className="flex gap-4 relative z-10">
                            <button onClick={() => setStep(1)} className="px-8 py-4 bg-white/5 rounded-2xl font-black text-sm text-white/60 hover:text-white transition-colors">
                                返回继续优化
                            </button>
                            <button onClick={() => window.parent.postMessage({ type: 'LESSON_COMPLETE', slug: config?.slug, nextLesson: 'l1_13_qinqiang_mask' }, '*')} className="px-10 py-4 bg-red-600 rounded-2xl font-black text-sm text-white shadow-xl hover:bg-red-500 transition-all">
                                提交并进入下一关卡 <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
