import { GeneratedGame } from '../types';

export interface PreflightResult {
    passed: boolean; // True if no HARD failures
    checks: CheckResult[];
}

export interface CheckResult {
    id: string;
    name: string;
    status: 'pass' | 'soft-fail' | 'hard-fail';
    message: string;
    value?: string | number;
}

export const runPreflightChecks = (game: GeneratedGame): PreflightResult => {
    const checks: CheckResult[] = [];

    // 1. Entity Count Sanity (HARD FAIL)
    // Heuristic: Check if blueprint mentions "hordes", "swarms" without architectural support (e.g. ECS)
    const mentionsSwarm = game.summary.toLowerCase().includes('swarm') ||
        game.summary.toLowerCase().includes('horde') ||
        game.summary.toLowerCase().includes('massive');

    const isPerformanceArchitecture = game.recommendedEngine === 'Three.js (ECS)' ||
        game.architecture.style.includes('ECS');

    if (mentionsSwarm && !isPerformanceArchitecture) {
        checks.push({
            id: 'entity-budget',
            name: 'Entity Budget Analysis',
            status: 'hard-fail',
            message: 'High entity count detected (Swarm/Horde) but architecture is not ECS/Performance optimized. Frame drop imminent.',
            value: 'Mismatch'
        });
    } else {
        checks.push({
            id: 'entity-budget',
            name: 'Entity Budget Analysis',
            status: 'pass',
            message: 'Architecture supports projected entity count.',
            value: 'Optimal'
        });
    }

    // 2. Reaction Window / Pacing Consistency (Real Analysis)
    const summaryLower = game.summary.toLowerCase();
    const mechLower = (game.coreMechanics || []).join(' ').toLowerCase();

    const impliesTurnBased = summaryLower.includes('turn') || mechLower.includes('turn-based') || mechLower.includes('card');
    const impliesRealTime = summaryLower.includes('action') || summaryLower.includes('fast') || mechLower.includes('reflex') || summaryLower.includes('shooter');

    if (impliesTurnBased && impliesRealTime) {
        checks.push({
            id: 'pacing-check',
            name: 'Pacing Validation',
            status: 'soft-fail',
            message: 'Conflict detected: "Turn-based" and "Action/Fast" terms found together. Gameplay may be muddled.',
            value: 'Mismatch'
        });
    } else {
        checks.push({
            id: 'pacing-check',
            name: 'Pacing Validation',
            status: 'pass',
            message: impliesTurnBased ? 'Confirms Turn-Based pacing.' : 'Confirms Real-Time pacing.',
            value: impliesTurnBased ? 'Static' : 'Dynamic'
        });
    }

    // 3. Loop Starvation (HARD FAIL)
    // Check for "simulation" heavy logic in JS Main Thread
    const isSimulation = game.summary.toLowerCase().includes('simulation') ||
        game.summary.toLowerCase().includes('physics heavy');

    if (isSimulation && game.language !== 'WebAssembly' && !isPerformanceArchitecture) {
        checks.push({
            id: 'loop-starvation',
            name: 'Update Loop Analysis',
            status: 'hard-fail',
            message: 'Heavy physics/simulation detected on JS Main Thread. Risk of spiral of death.',
            value: 'Critical'
        });
    } else {
        checks.push({
            id: 'loop-starvation',
            name: 'Update Loop Analysis',
            status: 'pass',
            message: 'Main thread budget appears sufficient.',
            value: 'Stable'
        });
    }

    // 4. Feature Bloat Analysis (DOCTRINE CHECK)
    const mechCount = (game.coreMechanics || []).length;
    if (mechCount > 5) {
        checks.push({
            id: 'feature-bloat',
            name: 'Scope Verification',
            status: 'soft-fail',
            message: `Detected ${mechCount} core mechanics. Doctrine Limit is 5. Risk of diluted focus.`,
            value: 'Bloated'
        });
    } else {
        checks.push({
            id: 'feature-bloat',
            name: 'Scope Verification',
            status: 'pass',
            message: 'Scope within arcade constraints.',
            value: 'Focused'
        });
    }

    const hasHardFails = checks.some(c => c.status === 'hard-fail');

    return {
        passed: !hasHardFails,
        checks
    };
};
