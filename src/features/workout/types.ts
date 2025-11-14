import type { ProgramDay } from '../program/types';

// Set completion status
export type SetStatus = 'pending' | 'completed' | 'skipped';

// State for a single set within a workout session
export interface WorkoutSetState {
  id: string;
  exerciseId: string;
  setIndex: number;
  targetReps: string;
  targetLoadKg?: number;
  performedReps?: number;
  performedLoadKg?: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  status: SetStatus;
}

// Overall workout session state
export interface WorkoutSessionState {
  id: string;
  programDay: ProgramDay;
  startedAt: string;
  endedAt?: string;
  status: 'in_progress' | 'completed';
  sets: WorkoutSetState[];
}
