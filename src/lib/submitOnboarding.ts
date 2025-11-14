import type { OnboardingState } from '../features/onboarding/types';

/**
 * Placeholder function for submitting onboarding data.
 * In production, this will POST to /api/onboarding/phase1
 */
export const submitOnboarding = async (state: OnboardingState): Promise<void> => {
  console.log('Onboarding payload:', state);
  
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('✅ Onboarding submitted successfully!');
      resolve();
    }, 1500);
  });
};
