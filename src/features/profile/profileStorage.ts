import type { OnboardingState } from '../onboarding/types';

const LOCAL_STORAGE_KEY_PROFILE = 'ai_coach_profile_v1';

export function saveProfile(onboarding: OnboardingState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(onboarding));
}

export function loadProfile(): OnboardingState | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY_PROFILE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OnboardingState;
  } catch {
    return null;
  }
}

export function clearProfile(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LOCAL_STORAGE_KEY_PROFILE);
}
