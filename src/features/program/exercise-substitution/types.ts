// Exercise metadata types for substitution logic

export interface ExerciseMetadata {
  id: string;
  name: string;
  primaryMuscle: 'legs' | 'chest' | 'back' | 'shoulders' | 'arms' | 'core';
  equipment: 'barbell' | 'dumbbell' | 'kettlebell' | 'machine' | 'bodyweight';
  movement: 'squat' | 'hinge' | 'push' | 'pull' | 'carry' | 'isolation';
}
