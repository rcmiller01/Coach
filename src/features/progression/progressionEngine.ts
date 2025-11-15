/**
 * Progressive Overload Engine (v0)
 * 
 * Suggests next-session loads per exercise based on:
 * - Recent workout history
 * - RPE (Rate of Perceived Exertion)
 * - Training phase (build vs deload)
 * 
 * Uses simple deterministic rules:
 * 
 * For BUILD phase:
 * - RPE <= 6: Increase load by 5% (sets were easy)
 * - RPE 6-8: Keep same load (effort on target)
 * - RPE >= 9: Decrease load by 5% (sets too hard)
 * - No RPE data: Maintain last load (conservative default)
 * 
 * For DELOAD phase:
 * - Reduce load by ~10% from previous week's average
 * - Ignore RPE; focus is on recovery
 */

import type { WorkoutHistoryEntry } from '../history/types';
import type { ExerciseLoadSuggestion } from './progressionTypes';

/**
 * Get load suggestion for a specific exercise based on workout history
 * 
 * @param history - Workout history entries
 * @param exerciseId - Exercise identifier
 * @param exerciseName - Exercise name
 * @param trainingPhase - Current training phase ('build' or 'deload')
 * @returns Load suggestion with rationale
 */
export function getLoadSuggestionForExercise(
  history: WorkoutHistoryEntry[],
  exerciseId: string,
  exerciseName: string,
  trainingPhase: 'build' | 'deload' = 'build'
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

  // Apply progression rules based on training phase
  let suggestedLoad: number;
  let rationale: string;

  if (trainingPhase === 'deload') {
    // Deload week: reduce by ~10% from recent average
    suggestedLoad = latestLoad * 0.9;
    rationale = 'Deload week: reducing load by ~10% to promote recovery.';
  } else if (avgRpe === undefined) {
    // No RPE data - maintain last load (conservative default)
    // This handles skipped logging or users who don't track RPE
    suggestedLoad = latestLoad;
    rationale = 'No RPE data available. Maintaining your last completed load.';
  } else if (avgRpe <= 6) {
    // Easy sets - increase by 5%
    suggestedLoad = latestLoad * 1.05;
    rationale = 'You reported these sets as relatively easy. Increasing by ~5%.';
  } else if (avgRpe >= 9) {
    // Very hard sets - decrease by 5%
    suggestedLoad = latestLoad * 0.95;
    rationale = 'These sets were very hard. Reducing load slightly for better quality reps.';
  } else {
    // RPE between 6-8 - maintain load
    suggestedLoad = latestLoad;
    rationale = 'Effort level is on target. Keeping the same load.';
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
 * Get load suggestions for multiple exercises
 * 
 * @param history - Workout history entries
 * @param exercises - Array of exercises to get suggestions for
 * @param trainingPhase - Current training phase ('build' or 'deload')
 * @returns Array of load suggestions
 */
export function getLoadSuggestionsForExercises(
  history: WorkoutHistoryEntry[],
  exercises: Array<{ id: string; name: string }>,
  trainingPhase: 'build' | 'deload' = 'build'
): ExerciseLoadSuggestion[] {
  return exercises.map((ex) =>
    getLoadSuggestionForExercise(history, ex.id, ex.name, trainingPhase)
  );
}
