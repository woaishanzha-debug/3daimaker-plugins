import { useState, useEffect, lazy, Suspense } from 'react';
import './App.css';

// --- L1 Plugin Lazy Imports (Code-Split Each Course) ---
const L1_01 = lazy(() => import('./plugins/L1/01_cloisonne/index'));
const L1_02 = lazy(() => import('./plugins/L1/02_cloisonne_intro/index'));
const L1_03 = lazy(() => import('./plugins/L1/03_lantern/index'));
const L1_04 = lazy(() => import('./plugins/L1/04_song_brocade/index'));
const L1_05 = lazy(() => import('./plugins/L1/05_shadow_play/index'));
const ShadowPlay = lazy(() => import('./plugins/L1/06_shadow_play/index'));
const BlueWhitePorcelain = lazy(() => import('./plugins/L1/06_blue_white_porcelain/index'));
const L1_07 = lazy(() => import('./plugins/L1/07_tiger_tally/index'));
const L1_08 = lazy(() => import('./plugins/L1/08_tang_sancai/index'));
const L1_09 = lazy(() => import('./plugins/L1/09_terracotta_warriors/index'));
const L1_10 = lazy(() => import('./plugins/L1/10_calligraphy/index'));
const Calligraphy = L1_10;
const L1_11 = lazy(() => import('./plugins/L1/11_embroidery/index'));
const L1_12 = lazy(() => import('./plugins/L1/12_paper_cut/index'));
const PaperCut = L1_12;
const L1_13 = lazy(() => import('./plugins/L1/13_qinqiang_mask/index'));
const L1_14 = lazy(() => import('./plugins/L1/14_mashao_mask/index'));
const L1_15 = lazy(() => import('./plugins/L1/15_raden/index'));
const L1_16 = lazy(() => import('./plugins/L1/16_coal_seal/index'));

// --- Route Table ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PLUGIN_MAP: Record<string, React.LazyExoticComponent<React.ComponentType<{ config: any }>>> = {
  'l1_01_cloisonne': L1_01,
  'l1_02_cloisonne_intro': L1_02,
  'l1_03_lantern': L1_03,
  'l1_04_song_brocade': L1_04,
  'l1_05_shadow_play': L1_05,
  'l1_06_shadow_play': ShadowPlay,
  'l1_06_blue_white_porcelain': BlueWhitePorcelain,
  'l1_07_tiger_tally': L1_07,
  'l1_08_tang_sancai': L1_08,
  'l1_09_terracotta_warriors': L1_09,
  'l1_10_calligraphy': L1_10,
  'l1_11_embroidery': L1_11,
  'l1_12_paper_cut': L1_12,
  'l1_13_qinqiang_mask': L1_13,
  'l1_14_mashao_mask': L1_14,
  'l1_15_raden': L1_15,
  'l1_16_coal_seal': L1_16,
};

interface PluginConfig {
  lessonId: string;
  slug?: string; // --- ANTI-HIJACK: Priority Routing ID ---
  studentName?: string;
  theme?: 'dark' | 'light';
  settings?: Record<string, any>;
}

// --- Loading Spinner ---
const LoadingFallback = () => (
  <div className="min-h-screen bg-[#020617] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-blue-400 font-bold text-xs uppercase tracking-widest animate-pulse">加载插件模块...</p>
    </div>
  </div>
);

// --- 404 Unknown Route ---
const UnknownPlugin = ({ targetRoute }: { targetRoute: string }) => (
  <div className="min-h-screen bg-[#020617] flex items-center justify-center text-slate-200">
    <div className="text-center space-y-4 p-10 rounded-2xl border border-red-500/20 bg-red-950/20">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-lg font-bold text-red-400">无效的课程互动载荷 (Route: {targetRoute})</h2>
      <p className="text-xs text-slate-500 font-mono">Payload mismatch detected at Stargate Dispatcher.</p>
      <p className="text-xs text-slate-600 font-mono">Target: "{targetRoute}"</p>
      <p className="text-xs text-slate-700">请检查母舰发送的 JSON 配置中的 slug 或 lessonId 字段。</p>
    </div>
  </div>
);

function App() {
  const [config, setConfig] = useState<PluginConfig | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'INIT_PLUGIN') {
        const payload = event.data.config;
        const targetRoute = payload?.slug || payload?.lessonId;
        
        // --- High-visibility Debugging ---
        console.log("🚀 [Stargate Dispatcher] 路由解析:", targetRoute, "完整配置:", payload);
        
        setConfig(payload);
      }
    };

    window.addEventListener('message', handleMessage);
    window.parent.postMessage({ type: 'PLUGIN_READY' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // --- Waiting for Mothership ---
  if (!config) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-blue-400 font-black text-xs uppercase tracking-[0.5em] animate-pulse">
            等待母舰星门连接...
          </p>
        </div>
      </div>
    );
  }

  // --- Route Dispatch ---
  // --- ANTI-HIJACK: Prioritize 'slug' over hijacked 'lessonId' ---
  const targetRoute = config.slug || config.lessonId;
  const PluginComponent = PLUGIN_MAP[targetRoute];

  if (!PluginComponent) {
    return <UnknownPlugin targetRoute={targetRoute} />;
  }

  return (
    <div className="w-full h-screen overflow-hidden">
      <Suspense fallback={<LoadingFallback />}>
        {/* Explicit Route Override for V2 Legacy Migration Verification */}
        {targetRoute === 'l1_02_cloisonne_intro' ? (
          <L1_02 config={config} />
        ) : targetRoute === 'l1_03_lantern' ? (
          <L1_03 config={config} />
        ) : targetRoute === 'l1_04_song_brocade' ? (
          <L1_04 config={config} />
        ) : targetRoute === 'l1_06_shadow_play' ? (
          <ShadowPlay config={config} />
        ) : targetRoute === 'l1_06_blue_white_porcelain' ? (
          <BlueWhitePorcelain config={config} />
        ) : targetRoute === 'l1_07_tiger_tally' ? (
          <L1_07 config={config} />
        ) : targetRoute === 'l1_09_terracotta_warriors' ? (
          <L1_09 config={config} />
        ) : targetRoute === 'l1_10_calligraphy' ? (
          <Calligraphy config={config} />
        ) : targetRoute === 'l1_12_paper_cut' ? (
          <PaperCut config={config} />
        ) : (
          <PluginComponent config={config} />
        )}
      </Suspense>
    </div>
  );
}

export default App;
