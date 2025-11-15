/**
 * Types for progressive overload and load suggestions
 */

export interface ExerciseLoadSuggestion {
  exerciseId: string;
  exerciseName: string;
  suggestedLoadKg: number | null; // null if bodyweight or no data
  rationale: string;              // short explanation for the UI
}
