import type { ProgramWeek } from './types';

export const mockProgramWeek: ProgramWeek = {
  id: 'week-1',
  weekStartDate: '2025-11-11', // Monday of current week
  focus: 'Building foundational strength with compound movements',
  days: [
    {
      id: 'day-1',
      dayOfWeek: 'monday',
      focus: 'lower',
      description: 'Lower body strength and posterior chain',
      exercises: [
        {
          id: 'ex-1',
          name: 'Barbell Back Squat',
          sets: 3,
          reps: '5',
          notes: 'Warm up thoroughly. Focus on depth and control.',
        },
        {
          id: 'ex-2',
          name: 'Romanian Deadlift',
          sets: 3,
          reps: '8–10',
          notes: 'Keep back neutral, feel the stretch in hamstrings.',
        },
        {
          id: 'ex-3',
          name: 'Bulgarian Split Squat',
          sets: 3,
          reps: '8–10',
          notes: 'Per leg. Use dumbbells for balance.',
        },
      ],
    },
    {
      id: 'day-2',
      dayOfWeek: 'wednesday',
      focus: 'upper',
      description: 'Upper body push and pull',
      exercises: [
        {
          id: 'ex-4',
          name: 'Barbell Bench Press',
          sets: 3,
          reps: '5',
          notes: 'Control the descent. Full range of motion.',
        },
        {
          id: 'ex-5',
          name: 'Bent-Over Row',
          sets: 3,
          reps: '8–10',
          notes: 'Pull to lower chest. Keep core tight.',
        },
        {
          id: 'ex-6',
          name: 'Overhead Press',
          sets: 3,
          reps: '6–8',
          notes: 'Strict form. Avoid excessive back arch.',
        },
        {
          id: 'ex-7',
          name: 'Pull-Ups',
          sets: 3,
          reps: '5–8',
          notes: 'Use assistance if needed. Full range.',
        },
      ],
    },
    {
      id: 'day-3',
      dayOfWeek: 'friday',
      focus: 'lower',
      description: 'Lower body and deadlift focus',
      exercises: [
        {
          id: 'ex-8',
          name: 'Conventional Deadlift',
          sets: 3,
          reps: '5',
          notes: 'Brace core. Drive through heels.',
        },
        {
          id: 'ex-9',
          name: 'Front Squat',
          sets: 3,
          reps: '6–8',
          notes: 'Keep torso upright. Elbows high.',
        },
        {
          id: 'ex-10',
          name: 'Walking Lunges',
          sets: 3,
          reps: '10–12',
          notes: 'Per leg. Maintain balance and control.',
        },
      ],
    },
  ],
};
