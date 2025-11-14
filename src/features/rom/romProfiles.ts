import type { ExerciseRomProfile } from './romTypes';

// ROM profiles for common exercises
// Values are heuristics based on typical safe ranges of motion

export const romProfiles: ExerciseRomProfile[] = [
  {
    exerciseId: 'barbell-back-squat',
    angles: [
      {
        name: 'left_knee_flexion',
        expectedMinDeg: 90,
        expectedMaxDeg: 130,
        softMinDeg: 80,
        softMaxDeg: 140,
      },
      {
        name: 'hip_hinge',
        expectedMinDeg: 10,
        expectedMaxDeg: 45,
        softMinDeg: 0,
        softMaxDeg: 60,
      },
    ],
  },
  {
    exerciseId: 'barbell-bench-press',
    angles: [
      {
        name: 'shoulder_abduction',
        expectedMinDeg: 30,
        expectedMaxDeg: 70,
        softMinDeg: 20,
        softMaxDeg: 80,
      },
    ],
  },
];
