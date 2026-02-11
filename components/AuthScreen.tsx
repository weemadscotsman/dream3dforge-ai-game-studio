import React, { useState } from 'react';
import { Icons } from './Icons';

interface AuthScreenProps {
  onLogin: (user: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0 opacity-20">
         <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-900/30 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-900/30 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
         <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 mb-4 border border-zinc-700 shadow-lg">
                <Icons.Box className="w-8 h-8 text-indigo-500" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">
                CANN.ON.AI <span className="text-indigo-500">3DREAMFORGE</span>
            </h1>
            <p className="text-zinc-500 text-sm">Authorized Access Only</p>
         </div>

         <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Operator Identity</label>
                <div className="relative">
                    <Icons.Atom className="absolute left-3 top-3 w-5 h-5 text-zinc-600" />
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="ENTER CALLSIGN"
                        className="w-full bg-black/50 border border-zinc-700 rounded-lg py-3 pl-10 pr-4 text-white font-mono placeholder-zinc-700 focus:border-indigo-500 outline-none transition-colors"
                        autoFocus
                    />
                </div>
            </div>

            <button 
                type="submit"
                disabled={!username.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
            >
                Initialize Session <Icons.Zap className="w-4 h-4" />
            </button>
         </form>

         <div className="mt-6 text-center">
            <div className="text-[10px] text-zinc-600 font-mono">
                SECURE CONNECTION • GEMINI-3-PRO ACTIVE
            </div>
         </div>
      </div>
    </div>
  );
};

export default AuthScreen;
