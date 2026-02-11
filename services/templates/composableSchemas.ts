import { Genre } from '../../types';

export interface DesignIntent {
    primary: string; // e.g. "time_pressure"
    secondary?: string[]; // e.g. ["cognitive_load", "precision"]
    intensity: number; // 1-10
}

export type ModuleType = 'MECHANIC' | 'PACING' | 'CAMERA' | 'ENVIRONMENT' | 'VISUAL';

export interface GameplayModule {
    id: string;
    type: ModuleType;
    name: string;
    description: string;
    intent: DesignIntent;
    // Directives for the AI to enforce this module
    directives: string[];
}

// LIBRARY OF COMPOSABLE INTENTS

export const PACING_MODULES: Record<string, GameplayModule> = {
    PANIC: {
        id: 'panic_pacing',
        type: 'PACING',
        name: 'Panic Pacing',
        description: 'Systems degrade over time, forcing faster decisions.',
        intent: {
            primary: 'time_pressure',
            secondary: ['cognitive_overload', 'anxiety'],
            intensity: 9
        },
        directives: [
            "Game speed must increase linearly with time",
            "Safe zones must shrink or disappear",
            "Failure penalty must be immediate"
        ]
    },
    TACTICAL: {
        id: 'tactical_pacing',
        type: 'PACING',
        name: 'Tactical Pause',
        description: 'Action waits for player input, but consequences are severe.',
        intent: {
            primary: 'strategic_planning',
            secondary: ['precision', 'foresight'],
            intensity: 6
        },
        directives: [
            "Wait for input before advancing state",
            "Show enemy intent indicators",
            " punish positioning mistakes heavily"
        ]
    }
};

export const MECHANIC_MODULES: Record<string, GameplayModule> = {
    SWARM: {
        id: 'swarm_mechanic',
        type: 'MECHANIC',
        name: 'Swarm Survival',
        description: 'Hundreds of weak enemies vs one powerful player.',
        intent: {
            primary: 'power_fantasy',
            secondary: ['crowd_control', 'spatial_awareness'],
            intensity: 7
        },
        directives: [
            "Enemy count > 50 active entities",
            "Enemies die in 1 hit",
            "Player has area-of-effect attacks"
        ]
    },
    ONE_HIT: {
        id: 'one_hit_mechanic',
        type: 'MECHANIC',
        name: 'Fragile Existence',
        description: 'Player dies in a single hit. High stakes.',
        intent: {
            primary: 'perfectionism',
            secondary: ['high_stakes', 'tension'],
            intensity: 10
        },
        directives: [
            "Player HP = 1",
            "Restart must be instant (<200ms)",
            "Hitboxes must be precise"
        ]
    }
};

export const CAMERA_MODULES: Record<string, GameplayModule> = {
    ISOMETRIC_LOCKED: {
        id: 'iso_locked',
        type: 'CAMERA',
        name: 'Tactical Isometric',
        description: 'Fixed angle, consistent depth perception.',
        intent: {
            primary: 'spatial_clarity',
            intensity: 5
        },
        directives: [
            "Camera angle 45 degrees",
            "No rotation allowed",
            "Orthographic projection preferred"
        ]
    }
};

/**
 * Composite Template Schema
 * Describes a game as a sum of its parts rather than a monolith.
 */
export interface CompositeTemplate {
    id: string;
    modules: GameplayModule[];
    baseGenre: Genre;
    // The "Soul" of the game - derived from combined intents
    derivedSoul?: string;
}

export const composeTemplate = (id: string, genre: Genre, modules: GameplayModule[]): CompositeTemplate => {
    return {
        id,
        baseGenre: genre,
        modules,
        derivedSoul: modules.map(m => m.intent.primary).join(' + ')
    };
};
