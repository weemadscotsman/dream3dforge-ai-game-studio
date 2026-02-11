import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TEMPLATE_MODIFIERS,
  getModifiersByCategory,
  MODIFIER_PRESETS,
  ModifierCategory,
  TemplateModifier,
} from '../services/templates/templateModifiers';
import { GameTemplate } from '../services/templates/gameTemplates';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ModifierPickerProps {
  selectedModifiers: string[];
  onChange: (modifiers: string[]) => void;
  baseTemplate?: GameTemplate;
  maxModifiers?: number;
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
}

interface Incompatibility {
  modifierId: string;
  reason: string;
}

interface Synergy {
  modifierIds: string[];
  bonus: string;
  emoji: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CATEGORY_CONFIG: Record<
  ModifierCategory,
  { label: string; color: string; bgColor: string; borderColor: string; icon: string }
> = {
  mechanic: {
    label: 'Mechanics',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50',
    icon: '⚙️',
  },
  visual: {
    label: 'Visual',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/50',
    icon: '👁️',
  },
  audio: {
    label: 'Audio',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/50',
    icon: '🔊',
  },
  difficulty: {
    label: 'Difficulty',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/50',
    icon: '🔥',
  },
  meta: {
    label: 'Meta',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/50',
    icon: '🏆',
  },
  bonus: {
    label: 'Bonus',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/50',
    icon: '✨',
  },
  penalty: {
    label: 'Penalty',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/50',
    icon: '⚠️',
  },
};

const PRESET_CONFIG: Record<string, { name: string; emoji: string; description: string; color: string }> = {
  roguelike: {
    name: 'Rogue-like',
    emoji: '🎲',
    description: 'Permadeath, procedural levels, and meta-progression',
    color: 'from-blue-600 to-cyan-600',
  },
  spectacle: {
    name: 'Spectacle',
    emoji: '✨',
    description: 'Maximum visual effects and screen shake',
    color: 'from-purple-600 to-pink-600',
  },
  nightmare: {
    name: 'Nightmare',
    emoji: '💀',
    description: 'Extreme difficulty for hardcore players',
    color: 'from-red-700 to-orange-700',
  },
  completionist: {
    name: 'Completionist',
    emoji: '📋',
    description: 'Achievements, unlockables, and daily challenges',
    color: 'from-amber-600 to-yellow-600',
  },
  audiophile: {
    name: 'Audiophile',
    emoji: '🎧',
    description: 'Dynamic music and spatial audio',
    color: 'from-green-600 to-emerald-600',
  },
  arcade: {
    name: 'Arcade',
    emoji: '🕹️',
    description: 'Time attack and endless modes',
    color: 'from-indigo-600 to-violet-600',
  },
  bossHunter: {
    name: 'Boss Hunter',
    emoji: '🐉',
    description: 'Boss rush with abilities and boosts',
    color: 'from-rose-600 to-red-600',
  },
};

// Known incompatibilities between modifiers
const MODIFIER_INCOMPATIBILITIES: Incompatibility[] = [
  { modifierId: 'minimalist-mode', reason: 'Cannot have visual effects in minimalist mode' },
  { modifierId: 'one-hit-death', reason: 'Hardcore mode already includes extreme difficulty' },
];

// Synergy bonuses when certain combinations are selected
const MODIFIER_SYNERGIES: Synergy[] = [
  { modifierIds: ['permadeath', 'procedural-levels', 'random-upgrades'], bonus: 'True Roguelike Experience!', emoji: '🎲' },
  { modifierIds: ['permadeath', 'boss-rush'], bonus: 'Epic Runs!', emoji: '⚔️' },
  { modifierIds: ['screen-shake', 'particle-effects', 'neon-glow'], bonus: 'Visual Overload!', emoji: '✨' },
  { modifierIds: ['hardcore-mode', 'ironman-mode', 'one-hit-death'], bonus: 'Ultimate Challenge!', emoji: '💀' },
  { modifierIds: ['dynamic-music', 'reactive-audio'], bonus: 'Audio Symphony!', emoji: '🎵' },
  { modifierIds: ['ability-system', 'consumable-boosts'], bonus: 'Power User!', emoji: '⚡' },
  { modifierIds: ['meta-currency', 'unlockables'], bonus: 'Progression Master!', emoji: '📈' },
  { modifierIds: ['time-attack', 'endless-mode'], bonus: 'Speed Demon!', emoji: '🏃' },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getIncompatibleModifiers = (selectedIds: string[]): Set<string> => {
  const incompatible = new Set<string>();

  // Minimalist mode disables visual modifiers
  if (selectedIds.includes('minimalist-mode')) {
    const visualModifiers = getModifiersByCategory('visual').map(m => m.id);
    visualModifiers.forEach(id => {
      if (id !== 'minimalist-mode') incompatible.add(id);
    });
  }

  // One-hit death conflicts with hardcore
  if (selectedIds.includes('one-hit-death') && selectedIds.includes('hardcore-mode')) {
    incompatible.add('hardcore-mode');
  }

  // Ironman mode conflicts with endless (can't complete endless)
  if (selectedIds.includes('ironman-mode') && selectedIds.includes('endless-mode')) {
    incompatible.add('endless-mode');
  }

  return incompatible;
};

const getActiveSynergies = (selectedIds: string[]): Synergy[] => {
  return MODIFIER_SYNERGIES.filter(synergy =>
    synergy.modifierIds.every(id => selectedIds.includes(id))
  );
};

const getModifierIcon = (modifier: TemplateModifier): string => {
  const iconMap: Record<string, string> = {
    'permadeath': '☠️',
    'procedural-levels': '🔄',
    'random-upgrades': '🎲',
    'starting-bonuses': '🎁',
    'weapon-upgrades': '🔫',
    'ability-system': '✨',
    'passive-items': '📦',
    'consumable-boosts': '🧪',
    'screen-shake': '📳',
    'particle-effects': '💥',
    'chromatic-aberration': '🌈',
    'slow-motion': '⏱️',
    'neon-glow': '💡',
    'dynamic-music': '🎵',
    'spatial-audio': '🔊',
    'reactive-audio': '🎶',
    'heartbeat-audio': '💓',
    'hardcore-mode': '🔥',
    'ironman-mode': '🛡️',
    'enemy-rush': '👥',
    'one-hit-death': '💀',
    'unlockables': '🔓',
    'achievement-system': '🏆',
    'daily-challenges': '📅',
    'meta-currency': '💎',
    'run-history': '📊',
    'time-attack': '⏰',
    'endless-mode': '♾️',
    'boss-rush': '🐉',
    'minimalist-mode': '◼️',
    'mirror-world': '🪞',
  };
  return iconMap[modifier.id] || '⚡';
};

// ============================================================================
// COMPONENT
// ============================================================================

export const ModifierPicker: React.FC<ModifierPickerProps> = ({
  selectedModifiers,
  onChange,
  baseTemplate,
  maxModifiers = 5,
  isOpen,
  onClose,
  title = 'Select Modifiers'
}) => {
  // If isOpen is provided, render as modal
  if (isOpen !== undefined) {
    return (
      <ModifierPickerModal
        isOpen={isOpen}
        onClose={onClose || (() => {})}
        title={title}
        selectedModifiers={selectedModifiers}
        onChange={onChange}
        baseTemplate={baseTemplate}
        maxModifiers={maxModifiers}
      />
    );
  }
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ModifierCategory | 'all'>('all');
  const [hoveredModifier, setHoveredModifier] = useState<string | null>(null);
  const [showSynergies, setShowSynergies] = useState(true);

  // Filter modifiers based on search and category
  const filteredModifiers = useMemo(() => {
    let modifiers = TEMPLATE_MODIFIERS;

    if (activeCategory !== 'all') {
      modifiers = getModifiersByCategory(activeCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      modifiers = modifiers.filter(
        m =>
          m.name.toLowerCase().includes(query) ||
          m.description.toLowerCase().includes(query)
      );
    }

    return modifiers;
  }, [activeCategory, searchQuery]);

  // Get incompatible modifiers
  const incompatibleModifiers = useMemo(
    () => getIncompatibleModifiers(selectedModifiers),
    [selectedModifiers]
  );

  // Get active synergies
  const activeSynergies = useMemo(
    () => getActiveSynergies(selectedModifiers),
    [selectedModifiers]
  );

  // Check if at limit
  const isAtLimit = selectedModifiers.length >= maxModifiers;
  const isNearLimit = selectedModifiers.length >= maxModifiers - 1;

  // Toggle modifier selection
  const toggleModifier = useCallback(
    (modifierId: string) => {
      if (incompatibleModifiers.has(modifierId)) return;

      if (selectedModifiers.includes(modifierId)) {
        onChange(selectedModifiers.filter(id => id !== modifierId));
      } else if (!isAtLimit) {
        onChange([...selectedModifiers, modifierId]);
      }
    },
    [selectedModifiers, onChange, incompatibleModifiers, isAtLimit]
  );

  // Apply preset
  const applyPreset = useCallback(
    (presetKey: keyof typeof MODIFIER_PRESETS) => {
      const presetIds = MODIFIER_PRESETS[presetKey];
      const validIds = presetIds.filter(id => !incompatibleModifiers.has(id));
      const combined = [...new Set([...selectedModifiers, ...validIds])];
      onChange(combined.slice(0, maxModifiers));
    },
    [selectedModifiers, onChange, incompatibleModifiers, maxModifiers]
  );

  // Reset to empty
  const handleReset = useCallback(() => {
    onChange([]);
  }, [onChange]);

  // Get category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: TEMPLATE_MODIFIERS.length };
    (Object.keys(CATEGORY_CONFIG) as ModifierCategory[]).forEach(cat => {
      counts[cat] = getModifiersByCategory(cat).length;
    });
    return counts;
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-3xl">🎮</span>
              Game Modifiers
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              Customize your experience with powerful modifiers
            </p>
          </div>
          
          {/* Counter Badge */}
          <div className={`px-4 py-2 rounded-xl font-bold text-lg transition-colors ${
            isAtLimit
              ? 'bg-red-500/20 text-red-400 border border-red-500/50'
              : isNearLimit
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
              : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
          }`}>
            <span className={isAtLimit ? 'animate-pulse' : ''}>
              {selectedModifiers.length}
            </span>
            <span className="text-zinc-500 mx-1">/</span>
            <span className="text-zinc-500">{maxModifiers}</span>
            <span className="ml-2 text-sm font-normal">
              {isAtLimit ? '(Max reached)' : isNearLimit ? '(Almost full)' : 'modifiers'}
            </span>
          </div>
        </div>

        {/* Warning Banner */}
        <AnimatePresence>
          {isAtLimit && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-center gap-3"
            >
              <span className="text-2xl">⚠️</span>
              <p className="text-red-300 text-sm">
                Maximum modifiers selected! Deselect one to add another.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Bar */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search modifiers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-700 rounded-xl px-4 py-3 pl-12 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg">
            🔍
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeCategory === 'all'
                ? 'bg-zinc-700 text-white'
                : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            All ({categoryCounts.all})
          </button>
          {(Object.keys(CATEGORY_CONFIG) as ModifierCategory[]).map(cat => {
            const config = CATEGORY_CONFIG[cat];
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeCategory === cat
                    ? `${config.bgColor} ${config.color} border ${config.borderColor}`
                    : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <span>{config.icon}</span>
                <span>{config.label}</span>
                <span className="text-xs opacity-60">({categoryCounts[cat]})</span>
              </button>
            );
          })}
        </div>

        {/* Preset Bundles */}
        <div className="mb-6">
          <p className="text-zinc-400 text-sm mb-2">Quick Select Presets:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESET_CONFIG).map(([key, config]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => applyPreset(key as keyof typeof MODIFIER_PRESETS)}
                className={`px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r ${config.color} text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group`}
                title={config.description}
              >
                <span className="text-lg">{config.emoji}</span>
                <span>{config.name}</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                  +{MODIFIER_PRESETS[key as keyof typeof MODIFIER_PRESETS].length}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Synergy Notifications */}
      <AnimatePresence>
        {showSynergies && activeSynergies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-zinc-400 text-sm">Active Synergies:</p>
              <button
                onClick={() => setShowSynergies(false)}
                className="text-zinc-500 hover:text-white text-xs"
              >
                Hide
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeSynergies.map((synergy, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 rounded-lg px-4 py-2 flex items-center gap-2"
                >
                  <span className="text-xl">{synergy.emoji}</span>
                  <span className="text-indigo-300 font-medium text-sm">{synergy.bonus}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modifier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <AnimatePresence mode="popLayout">
          {filteredModifiers.map((modifier, index) => {
            const isSelected = selectedModifiers.includes(modifier.id);
            const isIncompatible = incompatibleModifiers.has(modifier.id);
            const categoryConfig = CATEGORY_CONFIG[modifier.category];
            const icon = getModifierIcon(modifier);

            return (
              <motion.div
                key={modifier.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => toggleModifier(modifier.id)}
                onMouseEnter={() => setHoveredModifier(modifier.id)}
                onMouseLeave={() => setHoveredModifier(null)}
                className={`
                  relative cursor-pointer group rounded-xl border-2 transition-all duration-300 overflow-hidden
                  ${isSelected
                    ? `${categoryConfig.bgColor} ${categoryConfig.borderColor} shadow-lg shadow-${modifier.category}-500/20`
                    : isIncompatible
                    ? 'bg-zinc-900/30 border-zinc-800 opacity-50 cursor-not-allowed'
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/50'
                  }
                  ${isAtLimit && !isSelected && !isIncompatible ? 'opacity-70' : ''}
                `}
              >
                {/* Selection Checkmark */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-3 right-3 z-10"
                    >
                      <div className={`w-6 h-6 rounded-full ${categoryConfig.bgColor} flex items-center justify-center`}>
                        <svg className={`w-4 h-4 ${categoryConfig.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Glow Effect on Selection */}
                {isSelected && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${categoryConfig.color.replace('text-', 'from-').replace('400', '500')}/10 to-transparent pointer-events-none`} />
                )}

                {/* Card Content */}
                <div className="p-4 relative">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <motion.div
                      whileHover={!isIncompatible ? { scale: 1.1, rotate: 5 } : {}}
                      className={`
                        w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                        ${isSelected ? categoryConfig.bgColor : 'bg-zinc-800'}
                        transition-colors
                      `}
                    >
                      {icon}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-white truncate ${isSelected ? categoryConfig.color : ''}`}>
                        {modifier.name}
                      </h3>
                      <span className={`
                        inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1
                        ${categoryConfig.bgColor} ${categoryConfig.color}
                      `}>
                        {categoryConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className={`text-sm ${isIncompatible ? 'text-zinc-600' : 'text-zinc-400'} line-clamp-2`}>
                    {modifier.description}
                  </p>

                  {/* Incompatibility Tooltip */}
                  <AnimatePresence>
                    {isIncompatible && hoveredModifier === modifier.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute inset-x-4 bottom-4 bg-zinc-950 border border-red-500/30 rounded-lg p-3 shadow-xl"
                      >
                        <div className="flex items-center gap-2 text-red-400 text-sm">
                          <span>⚠️</span>
                          <span>Incompatible with current selection</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Hover Details */}
                  <AnimatePresence>
                    {!isIncompatible && hoveredModifier === modifier.id && !isSelected && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-zinc-900/95 flex items-center justify-center p-4"
                      >
                        <div className="text-center">
                          <p className="text-indigo-400 text-sm font-medium mb-1">Click to select</p>
                          <p className="text-zinc-500 text-xs">Adds to your game experience</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredModifiers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <span className="text-4xl mb-4 block">🔍</span>
          <p className="text-zinc-400">No modifiers found matching your search.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
            }}
            className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm"
          >
            Clear filters
          </button>
        </motion.div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
        <div className="flex items-center gap-4">
          <button
            onClick={handleReset}
            disabled={selectedModifiers.length === 0}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${selectedModifiers.length === 0
                ? 'text-zinc-600 cursor-not-allowed'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }
            `}
          >
            Reset to Default
          </button>
          
          {/* Selected Summary */}
          {selectedModifiers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-sm">Selected:</span>
              <div className="flex -space-x-1">
                {selectedModifiers.slice(0, 5).map(id => {
                  const mod = TEMPLATE_MODIFIERS.find(m => m.id === id);
                  return mod ? (
                    <div
                      key={id}
                      className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs border border-zinc-800"
                      title={mod.name}
                    >
                      {getModifierIcon(mod)}
                    </div>
                  ) : null;
                })}
                {selectedModifiers.length > 5 && (
                  <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs border border-zinc-800 text-zinc-400">
                    +{selectedModifiers.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {baseTemplate && (
            <p className="text-zinc-500 text-sm hidden md:block">
              Compatible with <span className="text-zinc-300">{baseTemplate.name}</span>
            </p>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
          >
            Apply {selectedModifiers.length > 0 && `(${selectedModifiers.length})`}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL WRAPPER (Optional)
// ============================================================================

interface ModifierPickerModalProps extends ModifierPickerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const ModifierPickerModal: React.FC<ModifierPickerModalProps> = ({
  isOpen,
  onClose,
  title = 'Select Modifiers',
  ...pickerProps
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
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
            className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <ModifierPicker {...pickerProps} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModifierPicker;
