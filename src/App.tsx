import { useState, useEffect } from 'react';
import CloisonneEngine from './plugins/cloisonne/CloisonneEngine';
import './App.css';

interface PluginConfig {
  lessonId: string;
  studentName?: string;
  theme?: 'dark' | 'light';
  settings?: Record<string, any>;
}

function App() {
  const [config, setConfig] = useState<PluginConfig | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security check: verify origin if needed
      // if (event.origin !== 'https://mothership-domain.com') return;

      if (event.data && event.data.type === 'INIT_PLUGIN') {
        console.log('Plugin Initialized with config:', event.data.config);
        setConfig(event.data.config);
      }
    };

    window.addEventListener('message', handleMessage);

    // Initial handshake to let parent know we are ready
    window.parent.postMessage({ type: 'PLUGIN_READY' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!config) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-blue-400 font-black text-xs uppercase tracking-[0.5em] animate-pulse">
            Waiting for Mothership Connection...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden">
      <CloisonneEngine config={config} />
    </div>
  );
}

export default App;
