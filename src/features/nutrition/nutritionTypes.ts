/**
 * Nutrition Types - AI-Assisted Meal Planning & Logging
 * 
 * This module defines types for:
 * - Nutrition targets (calories + macros)
 * - Planned meals (AI-generated weekly/daily plans)
 * - Logged meals (actual consumption with AI-assisted lookup)
 * - AI explanations and confidence scoring
 */

// ============================================================================
// ERROR HANDLING
// ============================================================================

export type ErrorCode =
  | 'AI_TIMEOUT'
  | 'AI_QUOTA_EXCEEDED'
  | 'AI_PARSE_FAILED'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNKNOWN_ERROR';

export interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    retryable: boolean;
    details?: Record<string, unknown>;
  };
}

export class NutritionApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public retryable: boolean,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'NutritionApiError';
  }
}

// ============================================================================
// NUTRITION TARGETS
// ============================================================================

export interface NutritionTargets {
  caloriesPerDay: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface NutritionProfile {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: 'male' | 'female' | 'other';
  activityLevel: 'low' | 'moderate' | 'high';
  primaryGoal: 'lose_fat' | 'build_muscle' | 'get_stronger' | 'improve_endurance' | 'stay_fit';
}

// ============================================================================
// PLANNED MEALS (AI-Generated)
// ============================================================================

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface PlannedFoodItem {
  id: string;
  name: string;
  foodId?: string; // Optional link to database item
  quantity: number;
  unit: 'g' | 'oz' | 'cup' | 'tbsp' | 'tsp' | 'piece' | 'serving';
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
}

export interface PlannedMeal {
  id: string;
  type: MealType;
  items: PlannedFoodItem[];
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  meals: PlannedMeal[];
}

export interface WeeklyPlan {
  weekStartDate: string; // YYYY-MM-DD (Monday)
  days: DayPlan[];
}

// ============================================================================
// LOGGED MEALS (Actual Consumption)
// ============================================================================

export type FoodSourceType = 'plan' | 'search' | 'manual';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface AiFoodExplanation {
  reasoning: string; // How the AI determined the nutrition values
  sources: Array<{
    label: string; // e.g., "USDA FoodData Central", "MyFitnessPal"
    url?: string; // Optional link to source
  }>;
  confidence: ConfidenceLevel;
}

export interface LoggedFoodItem extends PlannedFoodItem {
  sourceType: FoodSourceType;
  aiExplanation?: AiFoodExplanation;
  
  // User correction tracking
  originalCalories?: number;
  originalProteinGrams?: number;
  originalCarbsGrams?: number;
  originalFatsGrams?: number;
  userAdjusted: boolean;

  // Data provenance
  dataSource: 'official' | 'estimated';

  // User can override any macro value
  userOverrides?: {
    calories?: number;
    proteinGrams?: number;
    carbsGrams?: number;
    fatsGrams?: number;
  };
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  items: LoggedFoodItem[];
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatsGrams: number;
}

// ============================================================================
// USER CONTEXT (for AI personalization)
// ============================================================================

export interface UserContext {
  city?: string;
  zipCode?: string;
  locale?: string; // e.g., "en-US"
}

// ============================================================================
// MEAL REMINDERS (stub for future push notifications)
// ============================================================================

export type MealReminderCount = 0 | 1 | 2 | 3;

export interface MealReminderSettings {
  timesPerDay: MealReminderCount;
  preferredTimes?: string[]; // e.g., ["09:00", "13:00", "18:00"]
}
