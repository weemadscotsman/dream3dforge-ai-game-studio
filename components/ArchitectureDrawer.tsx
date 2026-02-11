import React from 'react';
import { GeneratedGame } from '../types';
import { Icons } from './Icons';

interface ArchitectureDrawerProps {
    game: GeneratedGame;
}

export const ArchitectureDrawer: React.FC<ArchitectureDrawerProps> = ({ game }) => {
    if (!game.architecture.reasoning) return null;

    const { reasoning } = game.architecture;

    return (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <Icons.Cpu className="w-5 h-5" />
                <h3 className="font-bold text-sm tracking-widest uppercase">Authoritative Architecture</h3>
            </div>

            {/* Chosen Decision */}
            <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-green-400 uppercase">Selected Pattern</span>
                    <span className="text-xs font-mono text-green-300 bg-green-900/30 px-2 py-0.5 rounded">
                        {reasoning.chosen}
                    </span>
                </div>
                <ul className="space-y-1">
                    {reasoning.because.map((reason, i) => (
                        <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">✓</span>
                            {reason}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Rejected Alternatives */}
            <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Rejected Alternatives</span>
                {reasoning.rejected.map((item, i) => (
                    <div key={i} className="bg-red-900/5 border border-red-700/10 rounded-lg p-2 flex justify-between items-center group hover:bg-red-900/10 transition-colors">
                        <span className="text-xs font-medium text-zinc-400 group-hover:text-red-300 transition-colors">
                            {item.model}
                        </span>
                        <span className="text-[10px] text-zinc-500 italic max-w-[60%] text-right group-hover:text-red-400/80 transition-colors">
                            {item.reason}
                        </span>
                    </div>
                ))}
            </div>

            <div className="text-[10px] text-zinc-600 italic text-center pt-2 border-t border-zinc-800">
                Architectural authority established at compile time.
            </div>
        </div>
    );
};
