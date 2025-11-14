// ROM (Range of Motion) type definitions

export interface AngleRange {
  name: string;
  expectedMinDeg: number;
  expectedMaxDeg: number;
  softMinDeg?: number;
  softMaxDeg?: number;
}

export interface ExerciseRomProfile {
  exerciseId: string;
  angles: AngleRange[];
}

export type RomStatus = 'ok' | 'warn';

export interface AngleEvaluation {
  name: string;
  valueDeg: number;
  status: RomStatus;
  message?: string;
}

export interface RomEvaluationResult {
  overallStatus: RomStatus;
  angles: AngleEvaluation[];
}
