import React, { useEffect, useState, useRef } from 'react';

interface BootSequenceProps {
  onComplete: () => void;
}

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const bootLogs = [
    "INITIALIZING KERNEL...",
    "LOADING 3DREAMFORGE ENGINE...",
    "MOUNTING CANN.ON.AI MODULES...",
    "CONNECTING TO GEMINI-3-PRO...",
    "VERIFYING NEURAL PATHWAYS...",
    "ALLOCATING VIRTUAL HEAP...",
    "OPTIMIZING TENSOR CORES...",
    "LOADING ASSET STUDIO...",
    "SYNCING WITH SATELLITE UPLINK...",
    "SYSTEM CHECK: PASS",
    "ESTABLISHING SECURE CONNECTION...",
    "CANN.ON.AI 3DREAMFORGE READY."
  ];

  useEffect(() => {
    let delay = 0;
    bootLogs.forEach((log, index) => {
      delay += Math.random() * 200 + 100;
      setTimeout(() => {
        setLogs(prev => [...prev, log]);
        if (index === bootLogs.length - 1) {
          setTimeout(onComplete, 1200);
        }
      }, delay);
    });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center font-mono text-indigo-500 p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="text-4xl font-bold mb-2 tracking-tighter text-white animate-pulse">
            CANN.ON.AI <span className="text-indigo-500">3DREAMFORGE</span>
          </div>
          <div className="text-xs text-zinc-600 uppercase tracking-[0.5em]">System Initialization</div>
        </div>
        
        <div 
          ref={scrollRef}
          className="h-64 border border-zinc-800 bg-zinc-900/50 rounded p-4 overflow-hidden text-xs relative shadow-[0_0_20px_rgba(99,102,241,0.1)]"
        >
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/20 z-10"></div>
          {logs.map((log, i) => (
            <div key={i} className="mb-1">
              <span className="text-zinc-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
              <span className={i === logs.length - 1 ? "text-white animate-pulse" : "text-indigo-400 opacity-80"}>
                {log}
              </span>
            </div>
          ))}
          <div className="w-2 h-4 bg-indigo-500 animate-pulse inline-block mt-1"></div>
        </div>

        <div className="mt-4 w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
           <div 
             className="h-full bg-indigo-500 transition-all duration-300 ease-out"
             style={{ width: `${(logs.length / bootLogs.length) * 100}%` }}
           ></div>
        </div>
      </div>
    </div>
  );
};