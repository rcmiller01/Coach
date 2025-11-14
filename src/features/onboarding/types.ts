// Enums and types for Phase 1 onboarding

export type TrainingExperience = 'beginner' | 'intermediate' | 'advanced';

export type PrimaryGoal =
  | 'lose_fat'
  | 'build_muscle'
  | 'get_stronger'
  | 'improve_endurance'
  | 'stay_fit';

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
  trainingExperience: TrainingExperience | null;
  primaryGoal: PrimaryGoal | null;
  motivation: {
    text: string; // must be <= 140 chars
  };
  jointIssues: JointIssue[];
  trainingEnvironment: TrainingEnvironment | null;
  equipment: string[];
  sessionsPerWeek: number | null;
  preferredDays: string[]; // ['monday', 'wednesday']
  preferredTimeOfDay: TimeOfDay | null;
}

export const initialOnboardingState: OnboardingState = {
  age: null,
  heightFeet: null,
  heightInches: null,
  weightLbs: null,
  trainingExperience: null,
  primaryGoal: null,
  motivation: {
    text: '',
  },
  jointIssues: [],
  trainingEnvironment: null,
  equipment: [],
  sessionsPerWeek: null,
  preferredDays: [],
  preferredTimeOfDay: null,
};
