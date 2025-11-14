// Types for training program

export type ProgramDayFocus = 'upper' | 'lower' | 'full' | 'conditioning' | 'other';

export interface ProgramExercise {
  id: string;
  name: string;
  sets: number;
  reps: string; // e.g., "5", "5–8"
  notes?: string;
}

export interface ProgramDay {
  id: string;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  focus: ProgramDayFocus;
  description?: string;
  exercises: ProgramExercise[];
}

export interface ProgramWeek {
  id: string;
  weekStartDate: string; // ISO date string
  focus: string;
  days: ProgramDay[];
}
