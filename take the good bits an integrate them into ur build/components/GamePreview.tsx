
import React, { useRef, useEffect, useState } from 'react';
import { Icons } from './Icons';

interface Props {
  html: string;
  title: string;
}

interface TelemetryData {
    fps: number;
    entities: number;
    frameTime?: number;
}

export const GamePreview: React.FC<Props> = ({ html, title }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCrashed, setIsCrashed] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryData>({ fps: 0, entities: 0 });
  const [mountKey, setMountKey] = useState(0); 

  useEffect(() => {
    setIsPlaying(false);
    setIsCrashed(false);
    setTelemetry({ fps: 0, entities: 0 });
    setMountKey(prev => prev + 1);
  }, [html]);

  useEffect(() => {
      const handleMessage = (e: MessageEvent) => {
          if (e.data && e.data.type === 'forge-telemetry') {
              setTelemetry({
                  fps: e.data.fps || 0,
                  entities: e.data.entities || 0,
                  frameTime: e.data.frameTime
              });
          }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleStartGame = () => {
    setIsPlaying(true);
    if (iframeRef.current && iframeRef.current.contentDocument) {
        // Safer click dispatch
        const doc = iframeRef.current.contentDocument;
        try {
            const internalStartBtn = doc.getElementById('start-btn');
            const internalOverlay = doc.getElementById('overlay');
            
            if (internalStartBtn) {
                internalStartBtn.click();
            } else if (internalOverlay) {
                internalOverlay.click();
            } else {
                // Fallback: try to focus which often triggers click-to-play handlers on document
                iframeRef.current.contentWindow?.focus();
                doc.body.click();
            }
            iframeRef.current.focus();
        } catch (e) {
            console.warn("Autostart failed, manual interaction required.");
        }
    }
  };

  const handleReload = () => {
     setIsPlaying(false);
     setIsCrashed(false);
     setTelemetry({ fps: 0, entities: 0 });
     setMountKey(prev => prev + 1);
  };

  const handlePanicStop = () => {
      setIsPlaying(false);
      setIsCrashed(true);
      if (iframeRef.current) {
          // Force clear to stop any infinite loops consuming CPU
          // We intentionally break the srcdoc here
          iframeRef.current.srcdoc = "<html><body><h1>TERMINATED</h1></body></html>"; 
      }
  };

  if (isCrashed) {
      return (
        <div className="w-full h-full flex flex-col bg-zinc-900 items-center justify-center p-8 text-center border-t border-zinc-800">
             <Icons.Warning className="w-12 h-12 text-red-500 mb-4 animate-pulse" />
             <h3 className="text-xl font-bold text-red-400 mb-2">RUNTIME HALTED</h3>
             <p className="text-zinc-500 text-sm mb-4">The game process was terminated by user request or instability.</p>
             <button onClick={handleReload} className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-mono text-xs uppercase tracking-wider flex items-center gap-2 border border-zinc-700">
                 <Icons.Zap className="w-3 h-3" /> Reboot System
             </button>
        </div>
      );
  }

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900 relative">
      {/* Header - Made slimmer */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-950 border-b border-zinc-800 z-10 shrink-0">
        <div className="flex items-center gap-2">
            <Icons.Monitor className="w-3 h-3 text-green-400" />
            <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[200px] uppercase">{title}</span>
        </div>
        <div className="flex gap-1">
            <button onClick={handleReload} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white" title="Soft Reset">
                <Icons.Zap className="w-3 h-3" />
            </button>
             <button onClick={handlePanicStop} className="p-1 hover:bg-red-900/20 rounded text-zinc-400 hover:text-red-400" title="Force Kill (Panic)">
                <Icons.Warning className="w-3 h-3" />
            </button>
        </div>
      </div>
      
      {/* Game Container - Takes FULL remaining height */}
      <div className="relative flex-1 w-full bg-black group overflow-hidden">
        {/* Transparent checkerboard background to visualize rendering issues */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: `linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)`,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }} />

        <iframe
          key={mountKey}
          ref={iframeRef}
          srcDoc={html} 
          title="Game Preview"
          className="absolute inset-0 w-full h-full border-0"
          // Removed 'allow-same-origin' to prevent some class of CSP issues if the host is strict, 
          // but added it back if the game needs it for canvas/blobs.
          // IMPORTANT: If CSP errors persist, 'allow-same-origin' might need to be toggled depending on environment.
          sandbox="allow-scripts allow-pointer-lock allow-forms allow-same-origin"
        />

        {/* Telemetry HUD - Compacted */}
        {isPlaying && (
            <div className="absolute top-2 left-2 pointer-events-none z-30 select-none">
                 <div className="bg-black/50 backdrop-blur-sm p-1.5 rounded border border-white/10 flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-mono font-bold ${telemetry.fps < 30 ? "text-red-400" : "text-green-400"}`}>{Math.round(telemetry.fps)}</span>
                        <span className="text-[9px] text-zinc-500 uppercase">FPS</span>
                    </div>
                    <div className="w-px h-3 bg-white/10" />
                    <div className="flex items-center gap-1">
                         <span className="text-[10px] font-mono text-blue-400">{telemetry.entities}</span>
                         <span className="text-[9px] text-zinc-500 uppercase">Ents</span>
                    </div>
                 </div>
            </div>
        )}

        {/* Start Game Overlay */}
        {!isPlaying && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 transition-all duration-300">
                <button 
                    onClick={handleStartGame}
                    className="group relative px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-2xl transition-all flex items-center gap-2"
                >
                    <Icons.Gamepad className="w-5 h-5" />
                    <span className="uppercase text-xs tracking-widest">Initialise Runtime</span>
                </button>
            </div>
        )}
      </div>
      
      <div className="px-2 py-1 bg-zinc-950 border-t border-zinc-800 text-[9px] text-zinc-600 font-mono text-center z-10 shrink-0">
        {isPlaying ? "ESC TO UNLOCK MOUSE" : "READY"}
      </div>
    </div>
  );
};
