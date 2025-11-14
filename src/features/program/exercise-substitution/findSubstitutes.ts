import type { ExerciseMetadata } from './types';
import { exerciseLibrary } from './exerciseLibrary';
import { scoreSubstitution } from './substituteRules';

/**
 * Finds the best substitute exercises for a given base exercise.
 * Returns top 3-5 candidates sorted by score (highest first).
 */
export function findSubstitutes(
  baseExercise: ExerciseMetadata,
  userEquipment: string[]
): ExerciseMetadata[] {
  // Find the base exercise metadata from the library
  const baseMetadata = exerciseLibrary.find(
    (ex) => ex.name.toLowerCase() === baseExercise.name.toLowerCase()
  );

  if (!baseMetadata) {
    // If we can't find metadata, return exercises with matching equipment
    return exerciseLibrary
      .filter((ex) => userEquipment.includes(ex.equipment))
      .slice(0, 5);
  }

  // Score all exercises and filter out the base exercise itself
  const scoredCandidates = exerciseLibrary
    .filter((candidate) => candidate.id !== baseMetadata.id)
    .map((candidate) => ({
      exercise: candidate,
      score: scoreSubstitution(baseMetadata, candidate, userEquipment),
    }))
    .filter((item) => item.score > 0) // Only include exercises with some compatibility
    .sort((a, b) => b.score - a.score); // Sort by score descending

  // Return top 5 candidates
  return scoredCandidates.slice(0, 5).map((item) => item.exercise);
}
