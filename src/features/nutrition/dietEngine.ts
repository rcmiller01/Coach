/**
 * Diet Engine
 * 
 * Computes daily calorie and macro targets based on:
 * - User stats (age, sex, height, weight, activity level)
 * - Current training block goal (strength, hypertrophy, general, return_to_training)
 * 
 * Uses Mifflin-St Jeor equation for BMR and simple activity multipliers.
 */

import type { BlockGoal } from '../program/types';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high';

export interface UserStats {
  age: number;
  sex: 'male' | 'female' | 'other';
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
}

export interface DietTargets {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  label: string; // e.g. "mild deficit", "maintenance", "small surplus"
}

/**
 * Calculate BMR using Mifflin-St Jeor equation
 * 
 * Male: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
 * Female: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
 * Other: Use average of male/female formulas
 */
function calculateBMR(user: UserStats): number {
  const { weightKg, heightCm, age, sex } = user;
  
  const baseBMR = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  
  switch (sex) {
    case 'male':
      return baseBMR + 5;
    case 'female':
      return baseBMR - 161;
    case 'other':
      // Average of male and female formulas
      return baseBMR - 78;
  }
}

/**
 * Activity multipliers to convert BMR to TDEE
 */
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,    // Little to no exercise
  light: 1.375,      // Light exercise 1-3 days/week
  moderate: 1.55,    // Moderate exercise 3-5 days/week
  high: 1.725,       // Heavy exercise 6-7 days/week
};

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 */
function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

/**
 * Adjust TDEE based on training block goal
 */
function adjustCaloriesForGoal(tdee: number, blockGoal: BlockGoal): { calories: number; label: string } {
  switch (blockGoal) {
    case 'strength':
      // Small surplus for strength gains without excess fat
      return {
        calories: Math.round(tdee * 1.05),
        label: 'Small surplus for strength-focused training',
      };
    
    case 'hypertrophy':
      // Moderate surplus for muscle growth
      return {
        calories: Math.round(tdee * 1.10),
        label: 'Moderate surplus for muscle building',
      };
    
    case 'general':
      // Maintenance for general fitness
      return {
        calories: Math.round(tdee),
        label: 'Maintenance for general fitness',
      };
    
    case 'return_to_training':
      // Maintenance to support recovery and consistency
      return {
        calories: Math.round(tdee),
        label: 'Maintenance to support recovery',
      };
  }
}

/**
 * Calculate macronutrient targets from calorie goal
 * 
 * Protein: 1.8 g/kg body weight (optimal for muscle retention/growth)
 * Fats: 25% of total calories
 * Carbs: Remaining calories
 */
function calculateMacros(
  calories: number,
  weightKg: number
): { proteinGrams: number; carbsGrams: number; fatsGrams: number } {
  // Protein: 1.8 g/kg (4 calories per gram)
  const proteinGrams = Math.round(weightKg * 1.8);
  const proteinCalories = proteinGrams * 4;
  
  // Fats: 25% of total calories (9 calories per gram)
  const fatCalories = calories * 0.25;
  const fatsGrams = Math.round(fatCalories / 9);
  
  // Carbs: Remaining calories (4 calories per gram)
  const remainingCalories = calories - proteinCalories - fatCalories;
  const carbsGrams = Math.round(remainingCalories / 4);
  
  return {
    proteinGrams,
    carbsGrams,
    fatsGrams,
  };
}

/**
 * Calculate daily diet targets based on user stats and training goal
 */
export function calculateDietTargets(
  user: UserStats,
  blockGoal: BlockGoal
): DietTargets {
  // Step 1: Calculate BMR
  const bmr = calculateBMR(user);
  
  // Step 2: Calculate TDEE
  const tdee = calculateTDEE(bmr, user.activityLevel);
  
  // Step 3: Adjust for training goal
  const { calories, label } = adjustCaloriesForGoal(tdee, blockGoal);
  
  // Step 4: Calculate macros
  const { proteinGrams, carbsGrams, fatsGrams } = calculateMacros(calories, user.weightKg);
  
  return {
    calories,
    proteinGrams,
    carbsGrams,
    fatsGrams,
    label,
  };
}
