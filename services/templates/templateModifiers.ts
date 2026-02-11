/**
 * Template Modifiers - Gameplay modifiers that can be applied to templates
 */

export type ModifierCategory = 'difficulty' | 'visual' | 'mechanic' | 'bonus' | 'penalty' | 'audio' | 'meta';

export interface TemplateModifier {
  id: string;
  name: string;
  description: string;
  category: ModifierCategory;
  incompatibleWith?: string[];
  requires?: string[];
}

// All available modifiers
export const TEMPLATE_MODIFIERS: TemplateModifier[] = [
  // Difficulty modifiers
  { id: 'hardcore', name: 'Hardcore', description: 'One life, no continues', category: 'difficulty' },
  { id: 'permadeath', name: 'Permadeath', description: 'Death is final', category: 'difficulty' },
  { id: 'no_healing', name: 'No Healing', description: 'Health does not regenerate', category: 'difficulty' },
  
  // Visual modifiers
  { id: 'retro_filter', name: 'Retro Filter', description: 'CRT scanlines and chromatic aberration', category: 'visual' },
  { id: 'monochrome', name: 'Monochrome', description: 'Black and white visuals', category: 'visual' },
  { id: 'neon_glow', name: 'Neon Glow', description: 'Enhanced bloom and glow effects', category: 'visual' },
  
  // Mechanic modifiers
  { id: 'double_jump', name: 'Double Jump', description: 'Can jump twice in mid-air', category: 'mechanic' },
  { id: 'dash', name: 'Dash', description: 'Quick burst movement ability', category: 'mechanic' },
  { id: 'time_slow', name: 'Time Slow', description: 'Slow down time on command', category: 'mechanic' },
  
  // Bonus modifiers
  { id: 'extra_lives', name: 'Extra Lives', description: 'Start with 3 extra lives', category: 'bonus' },
  { id: 'score_multiplier', name: '2x Score', description: 'Double all points earned', category: 'bonus' },
  
  // Penalty modifiers
  { id: 'speed_up', name: 'Speed Up', description: 'Everything moves 50% faster', category: 'penalty' },
  { id: 'timer', name: 'Countdown Timer', description: 'Complete before time runs out', category: 'penalty' },
  
  // Audio modifiers
  { id: 'synthwave', name: 'Synthwave Audio', description: '80s-style synth music', category: 'audio' },
  { id: 'chiptune', name: 'Chiptune Audio', description: '8-bit retro sound effects', category: 'audio' },
  { id: 'spatial_audio', name: 'Spatial Audio', description: '3D positional audio', category: 'audio' },
  
  // Meta modifiers
  { id: 'daily_run', name: 'Daily Run', description: 'Same seed for everyone today', category: 'meta' },
  { id: 'leaderboards', name: 'Leaderboards', description: 'Compete for high scores', category: 'meta' },
  { id: 'achievements', name: 'Achievements', description: 'Unlock badges and trophies', category: 'meta' },
];

// Preset combinations
export const MODIFIER_PRESETS = {
  classic: ['retro_filter'],
  hardcore: ['permadeath', 'no_healing'],
  arcade: ['extra_lives', 'score_multiplier'],
  speedrun: ['timer', 'speed_up'],
};

// Get modifiers by category
export function getModifiersByCategory(category: ModifierCategory): TemplateModifier[] {
  return TEMPLATE_MODIFIERS.filter(m => m.category === category);
}

// Check if modifiers are compatible
export function checkCompatibility(modifierIds: string[]): { compatible: boolean; conflicts: string[] } {
  const conflicts: string[] = [];
  
  for (const id of modifierIds) {
    const modifier = TEMPLATE_MODIFIERS.find(m => m.id === id);
    if (modifier?.incompatibleWith) {
      for (const incompatible of modifier.incompatibleWith) {
        if (modifierIds.includes(incompatible)) {
          conflicts.push(`${modifier.name} conflicts with ${incompatible}`);
        }
      }
    }
  }
  
  return { compatible: conflicts.length === 0, conflicts };
}
