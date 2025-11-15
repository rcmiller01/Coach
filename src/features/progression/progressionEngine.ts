/**
 * Progressive Overload Engine (v1 - Goal-Aware)
 * 
 * Suggests next-session loads per exercise based on:
 * - Recent workout history
 * - RPE (Rate of Perceived Exertion)
 * - Training phase (build vs deload)
 * - Block goal (strength, hypertrophy, general, return_to_training)
 * 
 * Uses simple deterministic rules:
 * 
 * For BUILD phase (goal-aware):
 * 
 * STRENGTH goal:
 * - RPE <= 6: Increase by 2.5% (conservative, prioritize quality)
 * - RPE 6-8: Maintain (intensity is key, not rushing)
 * - RPE >= 9: Decrease by 5%
 * 
 * HYPERTROPHY goal:
 * - RPE <= 6: Maintain load, suggest adding reps/sets in rationale
 * - RPE 6-8: Maintain (volume over intensity)
 * - RPE >= 9: Decrease by 5%
 * 
 * RETURN_TO_TRAINING goal:
 * - Cap suggestions at RPE 7 equivalent
 * - RPE <= 5: Increase by 2.5% (very gentle)
 * - RPE 5-7: Maintain
 * - RPE > 7: Decrease by 5%
 * 
 * GENERAL goal:
 * - RPE <= 6: Increase by 5%
 * - RPE 6-8: Maintain
 * - RPE >= 9: Decrease by 5%
 * 
 * For DELOAD phase:
 * - Reduce load by ~10% from previous week's average (all goals)
 * - Ignore RPE; focus is on recovery
 */

import type { WorkoutHistoryEntry } from '../history/types';
import type { ExerciseLoadSuggestion } from './progressionTypes';
import type { BlockGoal } from '../program/types';

/**
 * Get load suggestion for a specific exercise based on workout history
 * 
 * @param history - Workout history entries
 * @param exerciseId - Exercise identifier
 * @param exerciseName - Exercise name
 * @param trainingPhase - Current training phase ('build' or 'deload')
 * @param blockGoal - Current block goal (strength, hypertrophy, etc.)
 * @returns Load suggestion with rationale
 */
export function getLoadSuggestionForExercise(
  history: WorkoutHistoryEntry[],
  exerciseId: string,
  exerciseName: string,
  trainingPhase: 'build' | 'deload' = 'build',
  blockGoal: BlockGoal = 'general'
): ExerciseLoadSuggestion {
  // Collect all completed sets for this exercise from history
  const relevantSets = history
    .flatMap((entry) =>
      entry.exercises
        .filter((ex) => ex.exerciseId === exerciseId)
        .flatMap((ex) => ex.sets)
    )
    .filter((set) => set.status === 'completed' && set.performedLoadKg !== undefined)
    .slice(-5); // Last 5 completed sets

  // No history? Provide generic guidance
  if (relevantSets.length === 0) {
    return {
      exerciseId,
      exerciseName,
      suggestedLoadKg: null,
      rationale: 'No prior data. Start with a comfortable weight you can control.',
    };
  }

  // Calculate average load and RPE from recent sets
  const totalLoad = relevantSets.reduce(
    (sum, set) => sum + (set.performedLoadKg || 0),
    0
  );
  const latestLoad = totalLoad / relevantSets.length;

  const setsWithRpe = relevantSets.filter((set) => set.rpe !== undefined);
  const avgRpe =
    setsWithRpe.length > 0
      ? setsWithRpe.reduce((sum, set) => sum + (set.rpe || 0), 0) / setsWithRpe.length
      : undefined;

  // Apply progression rules based on training phase and block goal
  let suggestedLoad: number;
  let rationale: string;

  if (trainingPhase === 'deload') {
    // Deload week: reduce by ~10% from recent average (all goals)
    suggestedLoad = latestLoad * 0.9;
    rationale = 'Deload week: reducing load by ~10% to promote recovery.';
  } else if (avgRpe === undefined) {
    // No RPE data - maintain last load (conservative default)
    suggestedLoad = latestLoad;
    rationale = 'No RPE data available. Maintaining your last completed load.';
  } else {
    // Build phase: apply goal-specific progression rules
    const progression = calculateGoalAwareProgression(latestLoad, avgRpe, blockGoal);
    suggestedLoad = progression.load;
    rationale = progression.rationale;
  }

  // Round to sensible plate increments (2.5 kg / 5 lbs)
  const roundedLoad = Math.round(suggestedLoad / 2.5) * 2.5;

  return {
    exerciseId,
    exerciseName,
    suggestedLoadKg: roundedLoad,
    rationale,
  };
}

/**
 * Calculate goal-aware progression for build phase
 */
function calculateGoalAwareProgression(
  currentLoad: number,
  avgRpe: number,
  blockGoal: BlockGoal
): { load: number; rationale: string } {
  switch (blockGoal) {
    case 'strength':
      // Conservative progression, prioritize quality and technique
      if (avgRpe <= 6) {
        return {
          load: currentLoad * 1.025, // +2.5% increase
          rationale: 'Strength focus: Sets were manageable. Conservative +2.5% increase to maintain quality.',
        };
      } else if (avgRpe >= 9) {
        return {
          load: currentLoad * 0.95,
          rationale: 'Strength focus: Sets were very hard. Reducing load to protect technique.',
        };
      } else {
        return {
          load: currentLoad,
          rationale: 'Strength focus: Effort on target (RPE 6-8). Maintaining load for quality reps.',
        };
      }

    case 'hypertrophy':
      // Prefer volume accumulation over load increases
      if (avgRpe <= 6) {
        return {
          load: currentLoad,
          rationale: 'Hypertrophy focus: Sets felt easy. Maintain load and consider adding 1-2 reps per set.',
        };
      } else if (avgRpe >= 9) {
        return {
          load: currentLoad * 0.95,
          rationale: 'Hypertrophy focus: Sets too hard. Reducing load to maintain volume quality.',
        };
      } else {
        return {
          load: currentLoad,
          rationale: 'Hypertrophy focus: Effort in sweet spot (RPE 6-8). Keep load stable, maximize volume.',
        };
      }

    case 'return_to_training':
      // Very conservative, cap intensity, gentle progressions
      if (avgRpe > 7) {
        return {
          load: currentLoad * 0.95,
          rationale: 'Return-to-training: RPE above 7. Reducing load to stay in safe zone.',
        };
      } else if (avgRpe <= 5) {
        return {
          load: currentLoad * 1.025,
          rationale: 'Return-to-training: Sets very easy. Gentle +2.5% increase.',
        };
      } else {
        return {
          load: currentLoad,
          rationale: 'Return-to-training: Effort appropriate (RPE 5-7). Maintaining load.',
        };
      }

    case 'general':
    default:
      // Balanced approach
      if (avgRpe <= 6) {
        return {
          load: currentLoad * 1.05,
          rationale: 'Sets were relatively easy. Increasing by ~5%.',
        };
      } else if (avgRpe >= 9) {
        return {
          load: currentLoad * 0.95,
          rationale: 'Sets were very hard. Reducing load slightly for better quality reps.',
        };
      } else {
        return {
          load: currentLoad,
          rationale: 'Effort level is on target. Keeping the same load.',
        };
      }
  }
}

/**
 * Get load suggestions for multiple exercises
 * 
 * @param history - Workout history entries
 * @param exercises - Array of exercises to get suggestions for
 * @param trainingPhase - Current training phase ('build' or 'deload')
 * @param blockGoal - Current block goal (strength, hypertrophy, etc.)
 * @returns Array of load suggestions
 */
export function getLoadSuggestionsForExercises(
  history: WorkoutHistoryEntry[],
  exercises: Array<{ id: string; name: string }>,
  trainingPhase: 'build' | 'deload' = 'build',
  blockGoal: BlockGoal = 'general'
): ExerciseLoadSuggestion[] {
  return exercises.map((ex) =>
    getLoadSuggestionForExercise(history, ex.id, ex.name, trainingPhase, blockGoal)
  );
}
