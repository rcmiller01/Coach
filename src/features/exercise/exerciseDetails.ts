import type { ExerciseMetadata } from '../program/exercise-substitution/types';

export interface ExerciseDetail {
  metadata: ExerciseMetadata;
  cues: string[];
  commonMistakes: string[];
  rom: {
    joints: string[];
    notes: string;
  };
  videoUrl?: string;
}

export const exerciseDetails: Record<string, ExerciseDetail> = {
  'barbell-back-squat': {
    metadata: {
      id: 'barbell-back-squat',
      name: 'Barbell Back Squat',
      primaryMuscle: 'legs',
      equipment: 'barbell',
      movement: 'squat',
    },
    cues: [
      'Bar rests on upper traps, not neck',
      'Feet shoulder-width apart, toes slightly out',
      'Break at hips and knees simultaneously',
      'Keep chest up and core braced',
      'Drive through heels to stand',
    ],
    commonMistakes: [
      'Knees caving inward',
      'Heels lifting off the ground',
      'Excessive forward lean',
      'Not reaching parallel depth',
    ],
    rom: {
      joints: ['hip', 'knee', 'ankle'],
      notes: 'Descend until hip crease is below top of knee (parallel or deeper). Maintain neutral spine throughout.',
    },
    videoUrl: 'https://www.youtube.com/embed/ultWZbUMPL8',
  },
  'barbell-bench-press': {
    metadata: {
      id: 'barbell-bench-press',
      name: 'Barbell Bench Press',
      primaryMuscle: 'chest',
      equipment: 'barbell',
      movement: 'push',
    },
    cues: [
      'Retract and depress shoulder blades',
      'Grip slightly wider than shoulder width',
      'Lower bar to mid-chest with control',
      'Elbows at ~45° angle from torso',
      'Press bar in slight arc back to start',
    ],
    commonMistakes: [
      'Flaring elbows too wide',
      'Bouncing bar off chest',
      'Lifting hips off bench',
      'Shoulders rolling forward',
    ],
    rom: {
      joints: ['shoulder', 'elbow'],
      notes: 'Bar touches chest lightly, then press until elbows are fully extended. Keep shoulder blades retracted.',
    },
    videoUrl: 'https://www.youtube.com/embed/rT7DgCr-3pg',
  },
  'barbell-row': {
    metadata: {
      id: 'barbell-row',
      name: 'Barbell Row',
      primaryMuscle: 'back',
      equipment: 'barbell',
      movement: 'pull',
    },
    cues: [
      'Hinge at hips, torso ~45° angle',
      'Neutral spine, core braced',
      'Pull bar to lower ribcage/upper abdomen',
      'Lead with elbows, squeeze shoulder blades',
      'Control the descent',
    ],
    commonMistakes: [
      'Using momentum/jerking motion',
      'Rounding lower back',
      'Standing too upright',
      'Not achieving full scapular retraction',
    ],
    rom: {
      joints: ['shoulder', 'elbow', 'scapula'],
      notes: 'Pull until bar touches torso, elbows past ribcage. Fully extend arms at bottom while maintaining tension.',
    },
    videoUrl: 'https://www.youtube.com/embed/T3N-TO4reLQ',
  },
  'overhead-press': {
    metadata: {
      id: 'overhead-press',
      name: 'Overhead Press',
      primaryMuscle: 'shoulders',
      equipment: 'barbell',
      movement: 'push',
    },
    cues: [
      'Bar rests on front delts/upper chest',
      'Hands slightly wider than shoulders',
      'Brace core and squeeze glutes',
      'Press bar straight up, move head back slightly',
      'Lock out overhead, bar over midfoot',
    ],
    commonMistakes: [
      'Excessive lower back arch',
      'Pressing bar forward instead of vertical',
      'Not achieving full lockout',
      'Lack of core tension',
    ],
    rom: {
      joints: ['shoulder', 'elbow'],
      notes: 'Press from upper chest to full lockout overhead. Bar path should be vertical; head moves back to clear the bar.',
    },
    videoUrl: 'https://www.youtube.com/embed/2yjwXTZQDDI',
  },
  'deadlift': {
    metadata: {
      id: 'deadlift',
      name: 'Deadlift',
      primaryMuscle: 'back',
      equipment: 'barbell',
      movement: 'hinge',
    },
    cues: [
      'Feet hip-width, bar over midfoot',
      'Hinge down, grip bar just outside legs',
      'Neutral spine, chest up, lats engaged',
      'Push floor away with legs',
      'Extend hips and knees simultaneously',
    ],
    commonMistakes: [
      'Rounding lower back',
      'Bar drifting away from body',
      'Squatting instead of hinging',
      'Hyperextending at lockout',
    ],
    rom: {
      joints: ['hip', 'knee', 'ankle'],
      notes: 'Lift from floor to standing with hips and knees fully extended. Keep bar close to body throughout entire movement.',
    },
    videoUrl: 'https://www.youtube.com/embed/op9kVnSso6Q',
  },
};
