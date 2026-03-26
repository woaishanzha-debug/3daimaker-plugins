export default function Plugin({ config }: { config: any }) {
  return (
    <div className="flex items-center justify-center w-full h-full bg-slate-950 text-slate-200">
      <div className="text-center space-y-4 p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="text-3xl">🚧</div>
        <h2 className="text-lg font-bold">景泰蓝点蓝</h2>
        <p className="text-xs text-slate-500 tracking-widest uppercase">Plugin Pending Migration</p>
        <p className="text-[10px] text-slate-600 font-mono">{config?.lessonId || 'no-config'}</p>
      </div>
    </div>
  );
}
