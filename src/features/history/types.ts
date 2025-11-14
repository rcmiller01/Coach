import type { ProgramDay } from '../program/types';
import type { WorkoutSetState } from '../workout/types';

export interface WorkoutHistoryEntry {
  id: string;
  completedAt: string; // ISO string
  programDayId: string;
  dayOfWeek: ProgramDay['dayOfWeek'];
  focus: ProgramDay['focus'];
  exercises: {
    exerciseId: string;
    name: string;
    sets: WorkoutSetState[];
  }[];
}
