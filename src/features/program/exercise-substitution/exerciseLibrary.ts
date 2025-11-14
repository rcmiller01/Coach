import type { ExerciseMetadata } from './types';

export const exerciseLibrary: ExerciseMetadata[] = [
  // Squat variations
  {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    primaryMuscle: 'legs',
    equipment: 'barbell',
    movement: 'squat',
  },
  {
    id: 'front-squat',
    name: 'Front Squat',
    primaryMuscle: 'legs',
    equipment: 'barbell',
    movement: 'squat',
  },
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    primaryMuscle: 'legs',
    equipment: 'dumbbell',
    movement: 'squat',
  },
  {
    id: 'bodyweight-squat',
    name: 'Bodyweight Squat',
    primaryMuscle: 'legs',
    equipment: 'bodyweight',
    movement: 'squat',
  },

  // Hinge variations
  {
    id: 'conventional-deadlift',
    name: 'Conventional Deadlift',
    primaryMuscle: 'back',
    equipment: 'barbell',
    movement: 'hinge',
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    primaryMuscle: 'legs',
    equipment: 'barbell',
    movement: 'hinge',
  },
  {
    id: 'dumbbell-rdl',
    name: 'Dumbbell Romanian Deadlift',
    primaryMuscle: 'legs',
    equipment: 'dumbbell',
    movement: 'hinge',
  },
  {
    id: 'kettlebell-swing',
    name: 'Kettlebell Swing',
    primaryMuscle: 'legs',
    equipment: 'kettlebell',
    movement: 'hinge',
  },
  {
    id: 'hip-thrust',
    name: 'Hip Thrust',
    primaryMuscle: 'legs',
    equipment: 'barbell',
    movement: 'hinge',
  },

  // Push variations
  {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    primaryMuscle: 'chest',
    equipment: 'barbell',
    movement: 'push',
  },
  {
    id: 'dumbbell-bench-press',
    name: 'Dumbbell Bench Press',
    primaryMuscle: 'chest',
    equipment: 'dumbbell',
    movement: 'push',
  },
  {
    id: 'push-up',
    name: 'Push-Up',
    primaryMuscle: 'chest',
    equipment: 'bodyweight',
    movement: 'push',
  },
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    primaryMuscle: 'shoulders',
    equipment: 'barbell',
    movement: 'push',
  },
  {
    id: 'dumbbell-shoulder-press',
    name: 'Dumbbell Shoulder Press',
    primaryMuscle: 'shoulders',
    equipment: 'dumbbell',
    movement: 'push',
  },
  {
    id: 'dips',
    name: 'Dips',
    primaryMuscle: 'chest',
    equipment: 'bodyweight',
    movement: 'push',
  },

  // Pull variations
  {
    id: 'bent-over-row',
    name: 'Bent-Over Row',
    primaryMuscle: 'back',
    equipment: 'barbell',
    movement: 'pull',
  },
  {
    id: 'dumbbell-row',
    name: 'Dumbbell Row',
    primaryMuscle: 'back',
    equipment: 'dumbbell',
    movement: 'pull',
  },
  {
    id: 'pull-up',
    name: 'Pull-Up',
    primaryMuscle: 'back',
    equipment: 'bodyweight',
    movement: 'pull',
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    primaryMuscle: 'back',
    equipment: 'machine',
    movement: 'pull',
  },

  // Isolation
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    primaryMuscle: 'legs',
    equipment: 'dumbbell',
    movement: 'isolation',
  },
  {
    id: 'walking-lunge',
    name: 'Walking Lunge',
    primaryMuscle: 'legs',
    equipment: 'dumbbell',
    movement: 'isolation',
  },
];
