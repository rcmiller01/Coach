import type { ExerciseMetadata } from './types';

/**
 * Scores how good a candidate exercise is as a substitute for the base exercise.
 * Higher score = better substitute.
 */
export function scoreSubstitution(
  base: ExerciseMetadata,
  candidate: ExerciseMetadata,
  userEquipment: string[]
): number {
  let score = 0;

  // +3 if primary muscle matches
  if (base.primaryMuscle === candidate.primaryMuscle) {
    score += 3;
  }

  // +2 if movement pattern matches
  if (base.movement === candidate.movement) {
    score += 2;
  }

  // +1 if equipment is available to the user
  if (userEquipment.includes(candidate.equipment)) {
    score += 1;
  }

  return score;
}
