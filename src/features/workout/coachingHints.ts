import type { WorkoutSetState } from './types';

/**
 * Returns a simple coaching hint based on the set's status and RPE.
 * Returns null if no hint is applicable.
 */
export function getSetHint(set: WorkoutSetState): string | null {
  if (set.status === 'completed' && set.rpe !== undefined) {
    if (set.rpe >= 9) {
      return "That was very hard. Consider reducing the weight slightly next time.";
    }
    if (set.rpe <= 6) {
      return "You had more in the tank. You might be able to increase weight a bit next time.";
    }
  }

  if (set.status === 'skipped') {
    return "If pain or discomfort caused this, try a lighter variation or fewer sets next time.";
  }

  return null;
}
