import React from 'react';
import { motion } from 'framer-motion';
import { VISUAL_PRESETS, VisualPreset } from '../services/templates/visualPresets';

interface VisualPresetPickerProps {
  selected: string | null;
  onSelect: (preset: VisualPreset) => void;
  compact?: boolean;
}

export const VisualPresetPicker: React.FC<VisualPresetPickerProps> = ({ 
  selected, 
  onSelect,
  compact = false 
}) => {
  if (compact) {
    // Horizontal scrollable strip for mobile/compact view
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Visual Style</label>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 custom-scrollbar">
          {VISUAL_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => onSelect(preset)}
              className={`
                flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg
                border transition-all
                ${selected === preset.id
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'}
              `}
            >
              <span className="text-lg">{preset.icon}</span>
              <span className="text-sm text-zinc-300 whitespace-nowrap">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Full grid view
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-zinc-300">Visual Style</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {VISUAL_PRESETS.map(preset => (
          <motion.button
            key={preset.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(preset)}
            className={`
              relative overflow-hidden rounded-xl p-4 text-left
              border-2 transition-all
              ${selected === preset.id
                ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                : 'border-zinc-700 hover:border-zinc-600'}
            `}
          >
            {/* Background gradient preview */}
            <div className={`
              absolute inset-0 opacity-30 bg-gradient-to-br ${preset.preview.gradient}
            `} />
            
            {/* Content */}
            <div className="relative">
              <span className="text-2xl mb-2 block">{preset.icon}</span>
              <h4 className="font-medium text-white text-sm">{preset.name}</h4>
              <p className="text-zinc-400 text-xs mt-1 line-clamp-2">
                {preset.description}
              </p>
              
              {/* Color palette preview */}
              <div className="flex gap-1 mt-2">
                {Object.values(preset.colorPalette).slice(0, 4).map((color, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Selected indicator */}
            {selected === preset.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center"
              >
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default VisualPresetPicker;
