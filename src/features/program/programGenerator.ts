import type { OnboardingState } from '../onboarding/types';
import { mapPrimaryGoalToBlockGoal } from '../onboarding/types';
import type { ProgramWeek, ProgramDay, ProgramExercise, ProgramMultiWeek, TrainingBlock, BlockGoal } from './types';

import { calculateWarmupBudget, buildWarmupForSession } from './warmupService';

/**
 * Generate initial multi-week program from onboarding state.
 * Creates first week and initial training block.
 */
export function generateInitialProgram(
  onboarding: OnboardingState
): ProgramMultiWeek {
  const blockGoal = mapPrimaryGoalToBlockGoal(onboarding.primaryGoal);
  const firstWeek = generateProgramWeekFromOnboarding(onboarding, blockGoal);

  // Create initial training block with goal from onboarding
  const initialBlock: TrainingBlock = {
    id: `block-0-${Date.now()}`,
    startWeekIndex: 0,
    endWeekIndex: null, // Active block
    goal: blockGoal,
    createdAt: new Date().toISOString(),
  };

  return {
    currentWeekIndex: 0,
    weeks: [firstWeek],
    blocks: [initialBlock],
  };
}

/**
 * Generate a ProgramWeek from OnboardingState using deterministic rules.
 * No LLM or backend calls - pure frontend logic.
 */
export function generateProgramWeekFromOnboarding(
  onboarding: OnboardingState,
  blockGoal?: BlockGoal
): ProgramWeek {
  // If blockGoal not provided, derive it from onboarding's primaryGoal
  const goal = blockGoal || mapPrimaryGoalToBlockGoal(onboarding.primaryGoal);
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



  // ... (keep existing imports)

  // Inside generateProgramWeekFromOnboarding:

  // Calculate warmup budget based on session duration (default to 45 mins if not set)
  const sessionMinutes = onboarding.minutesPerSession || 45;
  const warmupMinutes = calculateWarmupBudget(sessionMinutes);

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

    const programDay: ProgramDay = {
      id: `week1-${dayOfWeek}-${index}`,
      dayOfWeek,
      focus,
      description,
      warmup: [], // Placeholder, populated below
      exercises: pickExercisesForDay(focus, onboarding.equipment || [], goal, onboarding.planProfile),
    };

    // Generate warmup
    programDay.warmup = buildWarmupForSession(onboarding, programDay, warmupMinutes);

    return programDay;
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
  blockGoal: BlockGoal,
  planProfile: 'standard' | 'glp1' = 'standard'
): ProgramExercise[] {
  const hasBarbell = equipment.includes('barbell');
  const hasDumbbells = equipment.includes('dumbbell');

  // Determine sets and reps based on block goal and profile
  const { compoundSets, compoundReps, accessorySets, accessoryReps } = getSetsRepsForGoal(blockGoal, planProfile);

  const exercises: ProgramExercise[] = [];
  let exerciseCounter = 0;

  if (focus === 'full' || focus === 'lower') {
    // Add lower body exercises (compounds)
    if (hasBarbell) {
      exercises.push({
        id: 'barbell-back-squat',
        name: 'Barbell Back Squat',
        sets: compoundSets,
        reps: compoundReps,
        notes: 'Keep chest up, knees tracking over toes',
      });
      exercises.push({
        id: 'deadlift',
        name: 'Conventional Deadlift',
        sets: compoundSets,
        reps: compoundReps,
        notes: 'Maintain neutral spine, drive through heels',
      });
    } else if (hasDumbbells) {
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'Goblet Squat',
        sets: compoundSets,
        reps: compoundReps,
        notes: 'Hold dumbbell at chest, squat deep',
      });
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'DB Romanian Deadlift',
        sets: compoundSets,
        reps: compoundReps,
        notes: 'Slight knee bend, hinge at hips',
      });
    } else {
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'Bodyweight Squat',
        sets: compoundSets,
        reps: compoundReps,
        notes: 'Control the descent, full range of motion',
      });
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'Split Squat',
        sets: compoundSets,
        reps: compoundReps,
        notes: 'Rear foot elevated if possible',
      });
    }
  }

  if (focus === 'full' || focus === 'upper') {
    // Add upper body exercises (compounds)
    if (hasBarbell) {
      exercises.push({
        id: 'barbell-bench-press',
        name: 'Barbell Bench Press',
        sets: compoundSets,
        reps: compoundReps,
        notes: 'Lower to chest, press explosively',
      });
      exercises.push({
        id: 'barbell-row',
        name: 'Barbell Row',
        sets: compoundSets,
        reps: compoundReps,
        notes: 'Pull to lower chest, squeeze shoulder blades',
      });
      exercises.push({
        id: 'overhead-press',
        name: 'Overhead Press',
        sets: compoundSets,
        reps: compoundReps,
        notes: 'Press straight overhead, core tight',
      });
    } else if (hasDumbbells) {
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'DB Bench Press',
        sets: compoundSets,
        reps: compoundReps,
        notes: 'Lower dumbbells to chest level',
      });
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'DB Row',
        sets: compoundSets,
        reps: compoundReps,
        notes: 'Single arm or bent-over, pull to hip',
      });
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'DB Shoulder Press',
        sets: compoundSets,
        reps: compoundReps,
        notes: 'Press dumbbells overhead, controlled',
      });
    } else {
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'Push-up',
        sets: compoundSets,
        reps: compoundReps,
        notes: 'Hands shoulder-width, full range',
      });
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'Inverted Row',
        sets: compoundSets,
        reps: compoundReps,
        notes: 'Use table edge or rings if available',
      });
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'Pike Push-up',
        sets: compoundSets,
        reps: compoundReps,
        notes: 'Hips high, press shoulders overhead',
      });
    }
  }

  // For full body, also add a glute/posterior exercise (accessory) if we have room
  if (focus === 'full' && exercises.length < 5) {
    if (hasBarbell || hasDumbbells) {
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: hasDumbbells ? 'DB Lunge' : 'Walking Lunge',
        sets: accessorySets,
        reps: accessoryReps,
        notes: 'Step forward, lower back knee to floor',
      });
    } else {
      exercises.push({
        id: `ex-${exerciseCounter++}`,
        name: 'Glute Bridge',
        sets: accessorySets,
        reps: accessoryReps,
        notes: 'Drive through heels, squeeze glutes at top',
      });
    }
  }

  return exercises;
}

/**
 * Determine sets and reps based on block goal (training focus).
 * Adjusts volume for GLP-1 / reduced recovery profiles.
 */
function getSetsRepsForGoal(
  blockGoal: BlockGoal,
  planProfile: 'standard' | 'glp1' = 'standard'
): {
  compoundSets: number;
  compoundReps: string;
  accessorySets: number;
  accessoryReps: string;
} {
  // Base volume
  let volume = {
    compoundSets: 3,
    compoundReps: '6-10',
    accessorySets: 3,
    accessoryReps: '8-12',
  };

  switch (blockGoal) {
    case 'strength':
      volume = {
        compoundSets: 4,
        compoundReps: '3-5',
        accessorySets: 3,
        accessoryReps: '6-8',
      };
      break;

    case 'hypertrophy':
      volume = {
        compoundSets: 4,
        compoundReps: '6-10',
        accessorySets: 3,
        accessoryReps: '8-12',
      };
      break;

    case 'return_to_training':
      volume = {
        compoundSets: 2,
        compoundReps: '8-10',
        accessorySets: 2,
        accessoryReps: '10-12',
      };
      break;

    case 'general':
    default:
      volume = {
        compoundSets: 3,
        compoundReps: '6-10',
        accessorySets: 3,
        accessoryReps: '8-12',
      };
      break;
  }

  // Apply GLP-1 / Reduced Recovery adjustments
  // Reduce volume by ~30-50% to manage fatigue
  if (planProfile === 'glp1') {
    return {
      compoundSets: Math.max(2, volume.compoundSets - 1), // Reduce sets, min 2
      compoundReps: volume.compoundReps, // Keep intensity/reps similar
      accessorySets: Math.max(2, volume.accessorySets - 1),
      accessoryReps: volume.accessoryReps,
    };
  }

  return volume;
}
