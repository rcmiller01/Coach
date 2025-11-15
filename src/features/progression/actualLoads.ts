/**
 * Extract actual performed loads from workout history
 * 
 * This module analyzes logged workout data to determine what loads
 * were actually lifted, as opposed to what was suggested or planned.
 * 
 * Used for honest progress tracking that reflects real performance.
 */

import type { WorkoutHistoryEntry } from '../history/types';
import type { ProgramWeek } from '../program/types';

export interface ActualExerciseLoad {
  exerciseId: string;
  exerciseName: string;
  averageLoadKg: number | null;  // Average of working sets, or null if bodyweight/no data
  topSetLoadKg: number | null;   // Heaviest set completed
  totalVolume: number;            // reps × load summed across all sets
  setCount: number;               // Number of completed sets
}

/**
 * Extract actual performed loads for exercises in a given week
 * from workout history.
 * 
 * @param history - All workout history entries
 * @param week - The week to analyze
 * @returns Array of actual loads per exercise
 */
export function getActualLoadsForWeek(
  history: WorkoutHistoryEntry[],
  week: ProgramWeek
): ActualExerciseLoad[] {
  // Get the week's date range (week start to 7 days later)
  const weekStart = new Date(week.weekStartDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Filter history entries that fall within this week
  const weekHistory = history.filter((entry) => {
    const entryDate = new Date(entry.completedAt);
    return entryDate >= weekStart && entryDate < weekEnd;
  });

  // Collect all unique exercises from the week's program
  const exerciseMap = new Map<string, string>(); // exerciseId -> exerciseName
  week.days.forEach((day) => {
    day.exercises.forEach((ex) => {
      exerciseMap.set(ex.id, ex.name);
    });
  });

  // Compute actual loads for each exercise
  const actualLoads: ActualExerciseLoad[] = [];

  exerciseMap.forEach((exerciseName, exerciseId) => {
    // Find all completed sets for this exercise in this week
    const completedSets = weekHistory
      .flatMap((entry) =>
        entry.exercises
          .filter((ex) => ex.exerciseId === exerciseId)
          .flatMap((ex) => ex.sets)
      )
      .filter((set) => set.status === 'completed' && set.performedLoadKg !== undefined);

    if (completedSets.length === 0) {
      // No data for this exercise this week
      actualLoads.push({
        exerciseId,
        exerciseName,
        averageLoadKg: null,
        topSetLoadKg: null,
        totalVolume: 0,
        setCount: 0,
      });
      return;
    }

    // Calculate metrics
    const loads = completedSets.map((set) => set.performedLoadKg!);
    const averageLoadKg = loads.reduce((sum, load) => sum + load, 0) / loads.length;
    const topSetLoadKg = Math.max(...loads);
    
    const totalVolume = completedSets.reduce((sum, set) => {
      const reps = set.performedReps ?? 0;
      const load = set.performedLoadKg ?? 0;
      return sum + (reps * load);
    }, 0);

    actualLoads.push({
      exerciseId,
      exerciseName,
      averageLoadKg,
      topSetLoadKg,
      totalVolume,
      setCount: completedSets.length,
    });
  });

  return actualLoads;
}
