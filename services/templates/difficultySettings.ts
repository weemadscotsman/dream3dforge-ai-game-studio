/**
 * DIFFICULTY SYSTEM
 * Simple slider that maps to game generation parameters.
 * Users don't need to understand internals - just "easier" or "harder".
 */

export interface DifficultySettings {
  level: number; // 1-10 scale
  name: string;
  description: string;
  
  // These get injected into game generation
  modifiers: {
    spawnRateMultiplier: number;    // Enemy spawn speed
    enemySpeedMultiplier: number;   // How fast enemies move
    enemyHealthMultiplier: number;  // Enemy durability
    damageMultiplier: number;       // Damage dealt to player
    scoreMultiplier: number;        // Points earned
    startingResources: number;      // Starting health/ammo/etc (percentage)
    escalationRate: number;         // How fast difficulty ramps
  };
  
  // Hints for AI generation
  hints: string[];
}

export const DIFFICULTY_LEVELS: DifficultySettings[] = [
  {
    level: 1,
    name: 'Chill',
    description: 'Relaxed pace. Good for learning.',
    modifiers: {
      spawnRateMultiplier: 0.5,
      enemySpeedMultiplier: 0.6,
      enemyHealthMultiplier: 0.7,
      damageMultiplier: 0.5,
      scoreMultiplier: 0.5,
      startingResources: 150,
      escalationRate: 0.5
    },
    hints: [
      'Slow enemy spawns',
      'Generous health pickups',
      'Long grace period at start',
      'Forgiving collision boxes'
    ]
  },
  {
    level: 3,
    name: 'Easy',
    description: 'Gentle challenge. Room to breathe.',
    modifiers: {
      spawnRateMultiplier: 0.7,
      enemySpeedMultiplier: 0.8,
      enemyHealthMultiplier: 0.85,
      damageMultiplier: 0.7,
      scoreMultiplier: 0.75,
      startingResources: 125,
      escalationRate: 0.7
    },
    hints: [
      'Moderate enemy density',
      'Regular health drops',
      'Clear attack telegraphs',
      'Reasonable reaction windows'
    ]
  },
  {
    level: 5,
    name: 'Normal',
    description: 'Balanced. The intended experience.',
    modifiers: {
      spawnRateMultiplier: 1.0,
      enemySpeedMultiplier: 1.0,
      enemyHealthMultiplier: 1.0,
      damageMultiplier: 1.0,
      scoreMultiplier: 1.0,
      startingResources: 100,
      escalationRate: 1.0
    },
    hints: [
      'Standard spawn rates',
      'Fair but challenging',
      'Tension curve as designed',
      'Skill rewarded'
    ]
  },
  {
    level: 7,
    name: 'Hard',
    description: 'Punishing. For experienced players.',
    modifiers: {
      spawnRateMultiplier: 1.3,
      enemySpeedMultiplier: 1.2,
      enemyHealthMultiplier: 1.2,
      damageMultiplier: 1.5,
      scoreMultiplier: 1.5,
      startingResources: 80,
      escalationRate: 1.4
    },
    hints: [
      'Dense enemy spawns',
      'Fast enemies',
      'Scarce resources',
      'Quick escalation'
    ]
  },
  {
    level: 10,
    name: 'Nightmare',
    description: 'Brutal. You will die. A lot.',
    modifiers: {
      spawnRateMultiplier: 1.8,
      enemySpeedMultiplier: 1.5,
      enemyHealthMultiplier: 1.5,
      damageMultiplier: 2.0,
      scoreMultiplier: 2.5,
      startingResources: 50,
      escalationRate: 2.0
    },
    hints: [
      'Overwhelming enemy count',
      'Aggressive AI',
      'Minimal resources',
      'Instant escalation',
      'One mistake = death'
    ]
  }
];

/**
 * Get difficulty by level (1-10)
 * Interpolates between defined levels for fine control
 */
export function getDifficulty(level: number): DifficultySettings {
  // Clamp to valid range
  level = Math.max(1, Math.min(10, level));
  
  // Find surrounding defined levels
  const lower = DIFFICULTY_LEVELS.filter(d => d.level <= level).pop()!;
  const upper = DIFFICULTY_LEVELS.find(d => d.level >= level) || lower;
  
  // If exact match, return it
  if (lower.level === level) return lower;
  if (upper.level === level) return upper;
  
  // Interpolate
  const t = (level - lower.level) / (upper.level - lower.level);
  
  return {
    level,
    name: level <= 2 ? 'Chill+' : level <= 4 ? 'Easy+' : level <= 6 ? 'Normal+' : level <= 8 ? 'Hard+' : 'Nightmare-',
    description: `Custom difficulty level ${level}`,
    modifiers: {
      spawnRateMultiplier: lerp(lower.modifiers.spawnRateMultiplier, upper.modifiers.spawnRateMultiplier, t),
      enemySpeedMultiplier: lerp(lower.modifiers.enemySpeedMultiplier, upper.modifiers.enemySpeedMultiplier, t),
      enemyHealthMultiplier: lerp(lower.modifiers.enemyHealthMultiplier, upper.modifiers.enemyHealthMultiplier, t),
      damageMultiplier: lerp(lower.modifiers.damageMultiplier, upper.modifiers.damageMultiplier, t),
      scoreMultiplier: lerp(lower.modifiers.scoreMultiplier, upper.modifiers.scoreMultiplier, t),
      startingResources: lerp(lower.modifiers.startingResources, upper.modifiers.startingResources, t),
      escalationRate: lerp(lower.modifiers.escalationRate, upper.modifiers.escalationRate, t)
    },
    hints: lower.hints // Use lower level hints
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Get difficulty modifier string for AI prompt injection
 */
export function getDifficultyPrompt(level: number): string {
  const diff = getDifficulty(level);
  
  return `
DIFFICULTY: ${diff.name} (Level ${diff.level}/10)

MODIFIERS TO APPLY:
- Spawn rate: ${(diff.modifiers.spawnRateMultiplier * 100).toFixed(0)}% of base
- Enemy speed: ${(diff.modifiers.enemySpeedMultiplier * 100).toFixed(0)}% of base  
- Enemy health: ${(diff.modifiers.enemyHealthMultiplier * 100).toFixed(0)}% of base
- Damage to player: ${(diff.modifiers.damageMultiplier * 100).toFixed(0)}% of base
- Starting resources: ${(diff.modifiers.startingResources).toFixed(0)}% of base
- Escalation rate: ${(diff.modifiers.escalationRate * 100).toFixed(0)}% of base

IMPLEMENTATION HINTS:
${diff.hints.map(h => `- ${h}`).join('\n')}

Apply these multipliers to your base values in the game code.
`;
}

/**
 * Named difficulty presets for quick selection
 */
export const DIFFICULTY_PRESETS = {
  chill: 1,
  easy: 3,
  normal: 5,
  hard: 7,
  nightmare: 10
} as const;

export type DifficultyPreset = keyof typeof DIFFICULTY_PRESETS;
