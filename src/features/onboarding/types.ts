// Enums and types for Phase 1 onboarding

import type { BlockGoal } from '../program/types';

export type TrainingExperience = 'beginner' | 'intermediate' | 'advanced';

export type PrimaryGoal =
  | 'lose_fat'
  | 'build_muscle'
  | 'get_stronger'
  | 'improve_endurance'
  | 'stay_fit';

/**
 * Map user's primary goal from onboarding to a training block goal
 */
export function mapPrimaryGoalToBlockGoal(primaryGoal: PrimaryGoal | null): BlockGoal {
  switch (primaryGoal) {
    case 'get_stronger':
      return 'strength';
    case 'build_muscle':
      return 'hypertrophy';
    case 'lose_fat':
    case 'improve_endurance':
    case 'stay_fit':
    default:
      return 'general';
  }
}

export type JointArea =
  | 'knee'
  | 'hip'
  | 'lower_back'
  | 'shoulder'
  | 'elbow_wrist'
  | 'other';

export type JointSeverity = 'mild' | 'moderate' | 'severe';

export type JointIssue = {
  area: JointArea;
  severity: JointSeverity;
  notes?: string;
};

export type TrainingEnvironment = 'gym' | 'home' | 'outdoors' | 'mix';

export type TimeOfDay = 'morning' | 'midday' | 'evening' | 'varies';

export interface OnboardingState {
  age: number | null;
  heightFeet: number | null;
  heightInches: number | null;
  weightLbs: number | null;
  gender: 'male' | 'female' | 'other' | null;
  trainingExperience: TrainingExperience | null;
  primaryGoal: PrimaryGoal | null;
  motivation: {
    text: string; // must be <= 140 chars
  };
  jointIssues: JointIssue[];
  trainingEnvironment: TrainingEnvironment | null;
  equipment: string[];
  sessionsPerWeek: number | null;
  minutesPerSession: number | null;
  preferredDays: string[]; // ['monday', 'wednesday']
  preferredTimeOfDay: TimeOfDay | null;
  // Optional location info for AI-assisted nutrition (restaurant context, etc.)
  city?: string;
  zipCode?: string;
  // Medical/Lifestyle profile
  planProfile?: 'standard' | 'glp1';
}

export const initialOnboardingState: OnboardingState = {
  age: null,
  heightFeet: null,
  heightInches: null,
  weightLbs: null,
  gender: null,
  trainingExperience: null,
  primaryGoal: null,
  motivation: {
    text: '',
  },
  jointIssues: [],
  trainingEnvironment: null,
  equipment: [],
  sessionsPerWeek: null,
  minutesPerSession: null,
  preferredDays: [],
  preferredTimeOfDay: null,
  city: undefined,
  zipCode: undefined,
  planProfile: 'standard',
};
