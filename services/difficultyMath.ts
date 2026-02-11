import { DifficultySignature } from '../types';

/**
 * AUTHORITATIVE DIFFICULTY DERIVATION
 * 
 * This is the source of truth for "Difficulty".
 * It converts a scalar (1-10) into concrete gameplay physics/logic constraints.
 * 
 * DESIGN PHILOSOPHY:
 * - Low difficulty = High forgiveness, slow propagation, predictable enemies
 * - High difficulty = Low forgiveness, cascade failure, chaos
 */

export const deriveDifficultySignature = (level: number): DifficultySignature => {
    // Clamp 1-10
    const d = Math.max(1, Math.min(10, level));
    const normalized = (d - 1) / 9; // 0.0 to 1.0

    return {
        // REACTION WINDOW: 500ms (Easy) -> 150ms (Nightmare)
        // Logarithmic decay - drops fast then plateaus
        reactionWindowMs: Math.round(500 - (350 * Math.pow(normalized, 0.7))),

        // FAILURE PROPAGATION: 1.0 (Linear) -> 3.0 (Exponential)
        // How fast one mistake turns into a game over
        failurePropagation: parseFloat((1.0 + (2.0 * normalized)).toFixed(2)),

        // FORGIVENESS FACTOR: 0.9 (Very forgiving) -> 0.1 (Brutal)
        // Hitbox padding, coyote time, health drops
        forgivenessFactor: parseFloat((0.9 - (0.8 * normalized)).toFixed(2)),

        // ENEMY VARIANCE: 0.1 (Robotic) -> 0.9 (Unpredicatable)
        // Random usage of abilities, pathing jitter
        enemyVariance: parseFloat((0.1 + (0.8 * normalized)).toFixed(2)),

        // AI DIRECTOR AGGRESSION: 0.2 (Chill) -> 1.0 (Relentless)
        // Spawn rate ramp-up speed
        aiDirectorAggression: parseFloat((0.2 + (0.8 * Math.pow(normalized, 1.2))).toFixed(2))
    };
};

export const getDifficultyLabel = (level: number): { name: string; description: string } => {
    if (level <= 2) return { name: "Narrative", description: "Impossible to fail unless intended. For story tourists." };
    if (level <= 4) return { name: "Easy", description: "Mistakes are forgiven. Relaxed pacing." };
    if (level <= 6) return { name: "Normal", description: "The intended experience. Fair challenge." };
    if (level <= 8) return { name: "Hard", description: "Requires system mastery. Mistakes hurt." };
    return { name: "Nightmare", description: "Mathematically unfair. Frame-perfect execution required." };
};
