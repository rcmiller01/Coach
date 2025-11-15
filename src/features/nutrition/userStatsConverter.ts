/**
 * User Stats Converter
 * 
 * Converts onboarding data to UserStats for diet engine
 */

import type { OnboardingState } from '../onboarding/types';
import type { UserStats, ActivityLevel } from './dietEngine';

/**
 * Map sessionsPerWeek to activity level
 */
function inferActivityLevel(sessionsPerWeek: number | null): ActivityLevel {
  if (!sessionsPerWeek) return 'moderate';
  
  if (sessionsPerWeek <= 1) return 'sedentary';
  if (sessionsPerWeek <= 3) return 'light';
  if (sessionsPerWeek <= 5) return 'moderate';
  return 'high';
}

/**
 * Convert feet/inches to cm
 */
function convertHeightToCm(feet: number | null, inches: number | null): number {
  const totalInches = (feet || 0) * 12 + (inches || 0);
  return totalInches * 2.54;
}

/**
 * Convert lbs to kg
 */
function convertWeightToKg(lbs: number | null): number {
  return (lbs || 0) * 0.453592;
}

/**
 * Extract UserStats from onboarding data
 * 
 * Note: Sex is inferred as 'other' by default since we don't collect it in onboarding yet.
 * Activity level is inferred from sessionsPerWeek.
 */
export function extractUserStats(onboarding: OnboardingState): UserStats {
  const heightCm = convertHeightToCm(onboarding.heightFeet, onboarding.heightInches);
  const weightKg = convertWeightToKg(onboarding.weightLbs);
  const activityLevel = inferActivityLevel(onboarding.sessionsPerWeek);
  
  return {
    age: onboarding.age || 30, // Default to 30 if not provided
    sex: 'other', // Default to 'other' (uses average formula)
    heightCm,
    weightKg,
    activityLevel,
  };
}
