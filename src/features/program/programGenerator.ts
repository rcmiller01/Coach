import type { OnboardingState } from '../onboarding/types';
import type { ProgramWeek, ProgramDay, ProgramExercise } from './types';

/**
 * Generate a ProgramWeek from OnboardingState using deterministic rules.
 * No LLM or backend calls - pure frontend logic.
 */
export function generateProgramWeekFromOnboarding(
  onboarding: OnboardingState
): ProgramWeek {
  // Determine sessions per week
  const sessionsPerWeek =
    onboarding.sessionsPerWeek && 
    onboarding.sessionsPerWeek >= 2 && 
    onboarding.sessionsPerWeek <= 6
      ? onboarding.sessionsPerWeek
      : 3;

  // Build list of training days
  let trainingDays: string[];
  if (onboarding.preferredDays && onboarding.preferredDays.length > 0) {
    trainingDays = onboarding.preferredDays.slice(0, sessionsPerWeek);
  } else {
    // Default schedules
    const defaultSchedules: Record<number, string[]> = {
      2: ['monday', 'thursday'],
      3: ['monday', 'wednesday', 'friday'],
      4: ['monday', 'tuesday', 'thursday', 'friday'],
      5: ['monday', 'tuesday', 'wednesday', 'friday', 'saturday'],
      6: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    };
    trainingDays = defaultSchedules[sessionsPerWeek] || defaultSchedules[3];
  }

  // Decide day focus pattern
  const dayFocusPattern = sessionsPerWeek <= 3 ? 'full' : 'split';

  // Generate program days
  const days: ProgramDay[] = trainingDays.map((day, index) => {
    const dayOfWeek = day as ProgramDay['dayOfWeek'];
    let focus: 'upper' | 'lower' | 'full';
    let description: string;

    if (dayFocusPattern === 'full') {
      focus = 'full';
      description = 'Full body strength focus';
    } else {
      // Alternate upper/lower for 4+ days per week
      focus = index % 2 === 0 ? 'upper' : 'lower';
      if (focus === 'upper') {
        description = 'Upper body push/pull focus';
      } else {
        description = 'Lower body squat/hinge focus';
      }
    }

    return {
      id: `week1-${dayOfWeek}-${index}`,
      dayOfWeek,
      focus,
      description,
      exercises: pickExercisesForDay(focus, onboarding.equipment || [], onboarding.primaryGoal),
    };
  });

  // Generate week-level focus description
  const goalDescriptions: Record<string, string> = {
    lose_fat: 'Fat loss and conditioning',
    build_muscle: 'Muscle building and hypertrophy',
    get_stronger: 'Strength and power',
    improve_endurance: 'Endurance and stamina',
    stay_fit: 'General fitness and health',
  };
  
  const weekFocus = onboarding.primaryGoal 
    ? goalDescriptions[onboarding.primaryGoal] 
    : 'Strength and muscle';

  return {
    id: 'week1',
    weekStartDate: new Date().toISOString().slice(0, 10),
    focus: weekFocus,
    days,
    trainingPhase: 'build', // Start with build phase
  };
}

/**
 * Pick exercises for a given day based on focus and available equipment.
 */
function pickExercisesForDay(
  focus: 'upper' | 'lower' | 'full',
  equipment: string[],
  primaryGoal: string | null
): ProgramExercise[] {
  const hasBarbell = equipment.includes('barbell');
  const hasDumbbells = equipment.includes('dumbbell');
  
  // Determine sets and reps based on goal
  const { sets, reps } = getSetsRepsForGoal(primaryGoal);

  const exercises: ProgramExercise[] = [];
  let exerciseCounter = 0;

  if (focus === 'full' || focus === 'lower') {
    // Add lower body exercises
    if (hasBarbell) {
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'Barbell Back Squat',
        sets,
        reps,
        notes: 'Keep chest up, knees tracking over toes',
      });
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'Conventional Deadlift',
        sets,
        reps,
        notes: 'Maintain neutral spine, drive through heels',
      });
    } else if (hasDumbbells) {
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'Goblet Squat',
        sets,
        reps,
        notes: 'Hold dumbbell at chest, squat deep',
      });
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'DB Romanian Deadlift',
        sets,
        reps,
        notes: 'Slight knee bend, hinge at hips',
      });
    } else {
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'Bodyweight Squat',
        sets,
        reps,
        notes: 'Control the descent, full range of motion',
      });
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'Split Squat',
        sets,
        reps,
        notes: 'Rear foot elevated if possible',
      });
    }
  }

  if (focus === 'full' || focus === 'upper') {
    // Add upper body exercises
    if (hasBarbell) {
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'Barbell Bench Press',
        sets,
        reps,
        notes: 'Lower to chest, press explosively',
      });
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'Barbell Row',
        sets,
        reps,
        notes: 'Pull to lower chest, squeeze shoulder blades',
      });
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'Overhead Press',
        sets,
        reps,
        notes: 'Press straight overhead, core tight',
      });
    } else if (hasDumbbells) {
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'DB Bench Press',
        sets,
        reps,
        notes: 'Lower dumbbells to chest level',
      });
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'DB Row',
        sets,
        reps,
        notes: 'Single arm or bent-over, pull to hip',
      });
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'DB Shoulder Press',
        sets,
        reps,
        notes: 'Press dumbbells overhead, controlled',
      });
    } else {
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'Push-up',
        sets,
        reps,
        notes: 'Hands shoulder-width, full range',
      });
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'Inverted Row',
        sets,
        reps,
        notes: 'Use table edge or rings if available',
      });
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'Pike Push-up',
        sets,
        reps,
        notes: 'Hips high, press shoulders overhead',
      });
    }
  }

  // For full body, also add a glute/posterior exercise if we have room
  if (focus === 'full' && exercises.length < 5) {
    if (hasBarbell || hasDumbbells) {
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: hasDumbbells ? 'DB Lunge' : 'Walking Lunge',
        sets: Math.max(2, sets - 1),
        reps,
        notes: 'Step forward, lower back knee to floor',
      });
    } else {
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'Glute Bridge',
        sets: Math.max(2, sets - 1),
        reps,
        notes: 'Drive through heels, squeeze glutes at top',
      });
    }
  }

  return exercises;
}

/**
 * Determine sets and reps based on primary goal.
 */
function getSetsRepsForGoal(primaryGoal: string | null): { sets: number; reps: string } {
  switch (primaryGoal) {
    case 'lose_fat':
      return { sets: 3, reps: '10-15' };
    case 'build_muscle':
      return { sets: 4, reps: '8-12' };
    case 'get_stronger':
      return { sets: 4, reps: '3-6' };
    case 'improve_endurance':
      return { sets: 3, reps: '12-20' };
    default:
      return { sets: 3, reps: '8-10' };
  }
}
