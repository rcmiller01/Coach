/**
 * Week Renewal Logic
 * 
 * Generates the next week in a training program by:
 * 1. Copying the structure of the previous week
 * 2. Determining training phase (build vs deload)
 * 3. Applying progressive overload suggestions to target loads
 * 4. Maintaining exercise selection, sets, and reps
 */

import type { ProgramWeek, ProgramDay, ProgramExercise } from './types';
import type { ExerciseLoadSuggestion } from '../progression/progressionTypes';
import { getActualLoadsForWeek } from '../progression/actualLoads';
import type { WorkoutHistoryEntry } from '../history/types';

/**
 * Determine if Week N+1 should be a deload week based on recent training stress.
 * 
 * Simple heuristic:
 * - Look back at last up to 3 weeks (current + 2 previous)
 * - Calculate total volume for each week from major compound exercises
 * - If we see 3 consecutive build weeks with increasing or high volume, prescribe deload
 * - Otherwise, default to build
 * 
 * @param recentWeeks - Array of recent weeks (newest first), max 3
 * @param history - Workout history for volume calculation
 * @returns 'build' or 'deload'
 */
function determineNextPhase(
  recentWeeks: ProgramWeek[],
  history: WorkoutHistoryEntry[]
): 'build' | 'deload' {
  // Need at least 3 consecutive build weeks to trigger a deload
  if (recentWeeks.length < 3) {
    return 'build';
  }

  // Check if all recent weeks were build phases
  const allBuildWeeks = recentWeeks.every((week) => week.trainingPhase === 'build');
  if (!allBuildWeeks) {
    return 'build'; // Already had a deload recently
  }

  // Calculate total volume for each week
  const weekVolumes = recentWeeks.map((week) => {
    const actualLoads = getActualLoadsForWeek(history, week);
    // Sum total volume across all exercises
    return actualLoads.reduce((sum, ex) => sum + ex.totalVolume, 0);
  });

  // Check for increasing volume trend
  // If volume increased or stayed high over 3 weeks, prescribe deload
  const [week1Vol, week2Vol, week3Vol] = weekVolumes;
  
  // Simple heuristic: if the most recent 2 weeks both show >= 95% of their predecessor's volume
  // (indicating sustained high volume), trigger deload
  const highVolumeTrend = 
    week1Vol > 0 && 
    week2Vol >= week1Vol * 0.95 && 
    week3Vol >= week2Vol * 0.95;

  return highVolumeTrend ? 'deload' : 'build';
}

/**
 * Generate the next training week based on the previous week
 * and progressive overload suggestions.
 * 
 * @param prevWeek - The previous week's program
 * @param _suggestions - Load suggestions for each exercise (applied at session init, not week generation)
 * @param allWeeks - All previous weeks for phase detection (optional)
 * @param history - Workout history for phase detection (optional)
 * @returns A new ProgramWeek for the next training cycle
 */
export function generateNextWeek(
  prevWeek: ProgramWeek,
  _suggestions: ExerciseLoadSuggestion[], // Prefixed with _ to indicate intentionally unused
  allWeeks?: ProgramWeek[],
  history?: WorkoutHistoryEntry[]
): ProgramWeek {
  // Extract week number from previous week's ID (e.g., "week-1" -> 1)
  const prevWeekMatch = prevWeek.id.match(/week-(\d+)/);
  const prevWeekNumber = prevWeekMatch ? parseInt(prevWeekMatch[1]) : 1;
  const nextWeekNumber = prevWeekNumber + 1;

  // Get today's date as the start date for the new week
  const today = new Date().toISOString().slice(0, 10);

  // Determine training phase for next week
  let nextPhase: 'build' | 'deload' = 'build';
  if (allWeeks && allWeeks.length >= 3 && history) {
    // Get last 3 weeks (including current)
    const recentWeeks = allWeeks.slice(-3);
    nextPhase = determineNextPhase(recentWeeks, history);
  }

  // Copy days - exercises remain the same structure
  // Progressive overload is applied at workout session initialization
  const newDays: ProgramDay[] = prevWeek.days.map((day) => {
    const newExercises: ProgramExercise[] = day.exercises.map((exercise) => {
      // Create new exercise with same structure
      // Note: We don't store targetLoadKg at the ProgramExercise level,
      // but the WorkoutSessionView will initialize sets with suggestions
      // from the current week's suggestions array when the session starts
      return {
        ...exercise,
        // Keep everything the same - the load will be applied during session init
      };
    });

    return {
      ...day,
      id: `${day.id}-week${nextWeekNumber}`,
      exercises: newExercises,
    };
  });

  return {
    id: `week-${nextWeekNumber}`,
    weekStartDate: today,
    focus: prevWeek.focus,
    days: newDays,
    trainingPhase: nextPhase,
  };
}
