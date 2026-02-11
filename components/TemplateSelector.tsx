import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GAME_TEMPLATES, GameTemplate } from '../services/templates/gameTemplates';
import { Genre } from '../types';

interface TemplateSelectorProps {
  onSelect: (template: GameTemplate) => void;
  onClose: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect, onClose }) => {
  const [filter, setFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filteredTemplates = filter === 'all' 
    ? GAME_TEMPLATES 
    : GAME_TEMPLATES.filter(t => t.difficulty === filter);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Quick Start Templates</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Pick a template to start with. You can customize everything after.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Difficulty Filter */}
          <div className="flex gap-2">
            {(['all', 'easy', 'medium', 'hard'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => (
              <motion.div
                key={template.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ scale: 1.02 }}
                onMouseEnter={() => setHoveredId(template.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelect(template)}
                className="relative cursor-pointer group"
              >
                {/* Card */}
                <div className={`
                  relative overflow-hidden rounded-xl border border-zinc-700 
                  hover:border-indigo-500/50 transition-all duration-300
                  bg-gradient-to-br ${template.previewColor}
                `}>
                  {/* Glow effect on hover */}
                  <div className={`
                    absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity
                    bg-gradient-to-br from-white/10 to-transparent
                  `} />
                  
                  {/* Content */}
                  <div className="relative p-5">
                    {/* Icon & Title */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-3xl mb-2 block">{template.icon}</span>
                        <h3 className="text-lg font-bold text-white">{template.name}</h3>
                        <p className="text-white/70 text-sm">{template.tagline}</p>
                      </div>
                      <span className={`
                        px-2 py-1 rounded text-xs font-medium
                        ${template.difficulty === 'easy' ? 'bg-green-500/20 text-green-300' :
                          template.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-red-500/20 text-red-300'}
                      `}>
                        {template.difficulty}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-white/60 text-sm mb-3 line-clamp-2">
                      {template.description}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-white/50">
                      <span>⏱ {template.estimatedPlaytime}</span>
                      <span>•</span>
                      <span>{template.genre}</span>
                    </div>

                    {/* Inspirations on hover */}
                    <AnimatePresence>
                      {hoveredId === template.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pt-3 border-t border-white/10"
                        >
                          <p className="text-xs text-white/40">
                            Inspired by: {template.inspirations.join(', ')}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          <p className="text-center text-zinc-500 text-sm">
            Or start from scratch with your own idea →{' '}
            <button onClick={onClose} className="text-indigo-400 hover:text-indigo-300">
              Custom Game
            </button>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TemplateSelector;
