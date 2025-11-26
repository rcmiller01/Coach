import type { OnboardingState } from '../onboarding/types';
import type { NutritionTargets, NutritionProfile } from './nutritionTypes';

/**
 * Derive a NutritionProfile from OnboardingState.
 * Uses sensible defaults for missing values.
 */
export function deriveNutritionProfileFromOnboarding(onboarding: OnboardingState): NutritionProfile {
  // Convert height from feet+inches to cm
  const heightFeet = onboarding.heightFeet ?? 5;
  const heightInches = onboarding.heightInches ?? 9;
  const heightCm = Math.round((heightFeet * 12 + heightInches) * 2.54);

  // Convert weight from lbs to kg
  const weightLbs = onboarding.weightLbs ?? 175;
  const weightKg = Math.round(weightLbs * 0.453592);

  // Determine activity level based on sessions per week
  let activityLevel: 'low' | 'moderate' | 'high';
  const sessionsPerWeek = onboarding.sessionsPerWeek ?? 3;
  if (sessionsPerWeek <= 2) {
    activityLevel = 'low';
  } else if (sessionsPerWeek <= 4) {
    activityLevel = 'moderate';
  } else {
    activityLevel = 'high';
  }

  return {
    weightKg,
    heightCm,
    age: onboarding.age ?? 35,
    sex: 'other', // Default since not collected in onboarding
    activityLevel,
    primaryGoal: onboarding.primaryGoal ?? 'stay_fit',
  };
}

/**
 * Calculate nutrition targets using Mifflin-St Jeor equation and macro distribution.
 */
export function calculateNutritionTargets(profile: NutritionProfile): NutritionTargets {
  // Step 1: Calculate BMR (Basal Metabolic Rate)
  let bmr: number;
  if (profile.sex === 'male') {
    bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + 5;
  } else if (profile.sex === 'female') {
    bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age - 161;
  } else {
    // For 'other' or unknown, use average of male and female formulas
    const maleBmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + 5;
    const femaleBmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age - 161;
    bmr = (maleBmr + femaleBmr) / 2;
  }

  // Step 2: Apply activity multiplier
  const activityMultipliers = {
    low: 1.2,
    moderate: 1.45,
    high: 1.7,
  };
  const maintenanceCalories = bmr * activityMultipliers[profile.activityLevel];

  // Step 3: Adjust for goal
  let targetCalories: number;
  switch (profile.primaryGoal) {
    case 'lose_fat':
      targetCalories = maintenanceCalories * 0.8; // 20% deficit
      break;
    case 'build_muscle':
      targetCalories = maintenanceCalories * 1.1; // 10% surplus
      break;
    case 'improve_endurance':
      targetCalories = maintenanceCalories; // Maintenance (was 5% surplus)
      break;
    case 'get_stronger':
    case 'stay_fit':
    default:
      targetCalories = maintenanceCalories;
      break;
  }

  // Step 4: Calculate protein target
  let proteinGramsPerKg: number;
  if (profile.primaryGoal === 'build_muscle' || profile.primaryGoal === 'get_stronger') {
    proteinGramsPerKg = 1.8;
  } else if (profile.primaryGoal === 'lose_fat') {
    proteinGramsPerKg = 1.6;
  } else {
    proteinGramsPerKg = 1.4;
  }
  const proteinGrams = profile.weightKg * proteinGramsPerKg;
  const proteinCalories = proteinGrams * 4;

  // Step 5: Calculate fat target (25% of total calories)
  const fatCalories = targetCalories * 0.25;
  const fatGrams = fatCalories / 9;

  // Step 6: Calculate carbs (remaining calories)
  const carbsCalories = targetCalories - proteinCalories - fatCalories;
  const carbsGrams = carbsCalories / 4;

  return {
    caloriesPerDay: Math.round(targetCalories),
    proteinGrams: Math.round(proteinGrams),
    carbsGrams: Math.round(carbsGrams),
    fatGrams: Math.round(fatGrams),
  };
}
