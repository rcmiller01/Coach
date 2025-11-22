import type { OnboardingState, JointIssue } from '../onboarding/types';
import type { ProgramDay, WarmupStep } from './types';
import { WARMUP_CATALOG, type WarmupExercise } from '../../assets/warmup_exercises';

/**
 * Calculate warmup duration based on total session minutes.
 */
export function calculateWarmupBudget(sessionMinutes: number): number {
    if (sessionMinutes < 20) return 3; // Micro warmup for very short sessions
    if (sessionMinutes <= 30) return 5;
    if (sessionMinutes <= 45) return 8;
    if (sessionMinutes <= 60) return 10;
    return 12;
}

/**
 * Build a personalized warmup sequence for a given session.
 */
export function buildWarmupForSession(
    profile: OnboardingState,
    programDay: ProgramDay,
    warmupMinutes: number
): WarmupStep[] {
    const targetSeconds = warmupMinutes * 60;
    const availableExercises = filterExercises(WARMUP_CATALOG, profile);

    // RAMP Protocol: Raise, Activate, Mobilize, Potentiate
    const sequence: WarmupExercise[] = [];
    let currentSeconds = 0;

    const isConditioning = programDay.focus === 'conditioning';
    const isStrength = ['upper', 'lower', 'full'].includes(programDay.focus);

    // 1. Raise (Cardio)
    // Conditioning: Short raise, get to main work. Strength: Longer raise to heat up.
    const cardio = availableExercises.filter(e => e.type === 'cardio');
    if (cardio.length > 0) {
        sequence.push(cardio[0]);
        currentSeconds += cardio[0].durationSeconds;

        // Extended raise for longer strength sessions
        if (isStrength && targetSeconds > 480 && cardio.length > 1) {
            sequence.push(cardio[1]);
            currentSeconds += cardio[1].durationSeconds;
        }
    } else {
        // Fallback: If no cardio found (e.g. equipment limits), try to find *any* full body movement
        const fallback = WARMUP_CATALOG.find(e => e.bodyRegions.includes('full') && e.type === 'cardio');
        if (fallback) {
            sequence.push(fallback);
            currentSeconds += fallback.durationSeconds;
        }
    }

    // 2. Activate & Mobilize
    // Prioritize body regions relevant to the session
    const mobility = availableExercises.filter(e =>
        (e.type === 'mobility' || e.type === 'activation') &&
        !sequence.includes(e)
    );

    // Sort by relevance to focus
    const focus = programDay.focus;
    mobility.sort((a, b) => {
        const aRel = isRelevant(a, focus) ? 1 : 0;
        const bRel = isRelevant(b, focus) ? 1 : 0;
        return bRel - aRel;
    });

    // Allocation: Conditioning gets more mobility/activation, Strength leaves room for potentiation
    const mobilityBudgetRatio = isConditioning ? 0.9 : 0.7;

    for (const ex of mobility) {
        if (currentSeconds + ex.durationSeconds > targetSeconds * mobilityBudgetRatio) break;
        sequence.push(ex);
        currentSeconds += ex.durationSeconds;
    }

    // 3. Potentiate
    // Skip if high injury risk or conditioning focus
    const hasSevereInjury = profile.jointIssues?.some(i => i.severity === 'severe');
    const skipPotentiation = hasSevereInjury || isConditioning;

    if (!skipPotentiation) {
        const potentiation = availableExercises.filter(e =>
            e.type === 'potentiation' &&
            !sequence.includes(e) &&
            isRelevant(e, focus)
        );

        for (const ex of potentiation) {
            if (currentSeconds + ex.durationSeconds > targetSeconds) break;
            sequence.push(ex);
            currentSeconds += ex.durationSeconds;
        }
    }

    // Convert to WarmupStep
    return sequence.map((ex, index) => ({
        id: `warmup-${index}-${Date.now()}`,
        exerciseId: ex.id,
        name: ex.name,
        durationSeconds: ex.durationSeconds,
        order: index,
        alternatives: getAlternatives(ex, availableExercises),
    }));
}

function isRelevant(ex: WarmupExercise, focus: string): boolean {
    if (focus === 'full') return true;
    if (focus === 'conditioning') return true; // Everything is relevant for conditioning
    if (focus === 'upper') return ex.bodyRegions.includes('upper') || ex.bodyRegions.includes('full');
    if (focus === 'lower') return ex.bodyRegions.includes('lower') || ex.bodyRegions.includes('full');
    return true;
}

function filterExercises(
    catalog: WarmupExercise[],
    profile: OnboardingState
): WarmupExercise[] {
    const userAge = profile.age || 30; // Default if null
    const userEquipment = new Set(profile.equipment || []);
    userEquipment.add('bodyweight'); // Everyone has bodyweight

    return catalog.filter(ex => {
        // 1. Age constraints
        if (ex.minAge && userAge < ex.minAge) return false;
        if (ex.maxAge && userAge > ex.maxAge) return false;

        // 2. Equipment
        const hasEquipment = ex.equipment.every(req => userEquipment.has(req));
        if (!hasEquipment) return false;

        // 3. Contraindications
        if (ex.contraindications && profile.jointIssues) {
            if (ex.contraindications.kneeOsteoarthritis && hasJointIssue(profile.jointIssues, 'knee')) return false;
            if (ex.contraindications.lowBackPain && hasJointIssue(profile.jointIssues, 'lower_back')) return false;
            if (ex.contraindications.shoulderImpingement && hasJointIssue(profile.jointIssues, 'shoulder')) return false;
        }

        return true;
    });
}

function hasJointIssue(issues: JointIssue[], area: string): boolean {
    return issues.some(i => i.area === area);
}

function getAlternatives(target: WarmupExercise, available: WarmupExercise[]): string[] {
    return available
        .filter(ex =>
            ex.id !== target.id &&
            ex.type === target.type &&
            Math.abs(ex.durationSeconds - target.durationSeconds) <= 30 // Similar duration
        )
        .slice(0, 3) // Limit to 3 alternatives
        .map(ex => ex.id);
}
