import React from 'react';
import { getDifficultyLabel, deriveDifficultySignature } from '../services/difficultyMath';

interface DifficultySliderProps {
  value: number;
  onChange: (value: number) => void;
  showPresets?: boolean;
}

export const DifficultySlider: React.FC<DifficultySliderProps> = ({
  value,
  onChange,
  showPresets = true
}) => {
  const difficultyInfo = getDifficultyLabel(value);
  const signature = deriveDifficultySignature(value);

  // Color based on difficulty
  const getColor = (level: number) => {
    if (level <= 2) return 'text-green-400';
    if (level <= 4) return 'text-lime-400';
    if (level <= 6) return 'text-yellow-400';
    if (level <= 8) return 'text-orange-400';
    return 'text-red-400';
  };

  const getBgColor = (level: number) => {
    if (level <= 2) return 'bg-green-500';
    if (level <= 4) return 'bg-lime-500';
    if (level <= 6) return 'bg-yellow-500';
    if (level <= 8) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-300">
          Difficulty
        </label>
        <span className={`text-sm font-bold ${getColor(value)}`}>
          {difficultyInfo.name}
        </span>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          aria-label="Difficulty Level"
          type="range"
          min="1"
          max="10"
          step="1"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-5
                     [&::-webkit-slider-thumb]:h-5
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-white
                     [&::-webkit-slider-thumb]:shadow-lg
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:border-2
                     [&::-webkit-slider-thumb]:border-zinc-400
                     [&::-webkit-slider-thumb]:transition-transform
                     [&::-webkit-slider-thumb]:hover:scale-110"
          style={{
            background: `linear-gradient(to right, 
              #22c55e 0%, 
              #84cc16 25%, 
              #eab308 50%, 
              #f97316 75%, 
              #ef4444 100%)`
          }}
        />

        {/* Level markers */}
        <div className="flex justify-between mt-1 px-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
            <div
              key={level}
              className={`w-1 h-1 rounded-full ${level <= value ? getBgColor(level) : 'bg-zinc-600'
                }`}
            />
          ))}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-500">
        {difficultyInfo.description}
      </p>

      {/* Preset Buttons */}
      {showPresets && (
        <div className="flex gap-2 flex-wrap">
          {[
            ['Narrative', 1],
            ['Easy', 3],
            ['Normal', 5],
            ['Hard', 7],
            ['Nightmare', 10]
          ].map(([name, level]) => (
            <button
              key={name as string}
              onClick={() => onChange(level as number)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${value === (level as number)
                ? `${getBgColor(level as number)} text-white`
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                }`}
            >
              {name as string}
            </button>
          ))}
        </div>
      )}

      {/* Modifier Preview (collapsed by default) */}
      <details className="text-xs group">
        <summary className="text-zinc-500 cursor-pointer hover:text-zinc-300 select-none list-none flex items-center gap-2">
          <span className="group-open:rotate-90 transition-transform">▸</span>
          <span>View Authoritative Constraints</span>
        </summary>
        <div className="mt-2 p-3 bg-zinc-800/50 rounded-lg space-y-2 text-zinc-400 font-mono">
          <div className="flex justify-between">
            <span className="text-zinc-500">Reaction Window</span>
            <span className={value > 7 ? "text-red-400" : "text-green-400"}>
              {signature.reactionWindowMs}ms
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Failure Cascade</span>
            <span className={signature.failurePropagation > 1.5 ? "text-red-400" : "text-zinc-300"}>
              {signature.failurePropagation}x
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Forgiveness</span>
            <span className={signature.forgivenessFactor < 0.4 ? "text-red-400" : "text-zinc-300"}>
              {(signature.forgivenessFactor * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Enemy Variance</span>
            <span className={signature.enemyVariance > 0.6 ? "text-yellow-400" : "text-zinc-300"}>
              {(signature.enemyVariance * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">AI Aggression</span>
            <span className={signature.aiDirectorAggression > 0.7 ? "text-red-400" : "text-zinc-300"}>
              {(signature.aiDirectorAggression * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </details>
    </div>
  );
};

export default DifficultySlider;
