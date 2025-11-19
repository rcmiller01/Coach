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
  | 'AI_PLAN_FAILED'
  | 'AI_PLAN_INFEASIBLE'
  | 'AI_RATE_LIMITED'
  | 'AI_DISABLED_FOR_USER'
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

export type PlanProfile = 'standard' | 'glp1';

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
  planProfile?: PlanProfile; // 'standard' (default) or 'glp1' (smaller, more frequent meals)
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
  locked?: boolean; // If true, this meal should be reused in subsequent plan generations
}

export interface AiPlanExplanation {
  summary: string; // e.g., "~2300 kcal (target 2300) · 165g protein (target 160) · 3 meals + 1 snack"
  details?: string; // Optional longer explanation for accordion UI
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  meals: PlannedMeal[];
  aiExplanation?: AiPlanExplanation; // Optional AI-generated explanation
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

export type DietType = 
  | 'none'
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'keto'
  | 'paleo'
  | 'low_carb'
  | 'mediterranean'
  | 'halal'
  | 'kosher';

export interface DietaryPreferences {
  dietType?: DietType;
  avoidIngredients?: string[]; // e.g., ["dairy", "soy", "shellfish"]
  dislikedFoods?: string[]; // e.g., ["mushrooms", "olives"]
}

export interface UserContext {
  city?: string;
  zipCode?: string;
  locale?: string; // e.g., "en-US"
  preferences?: DietaryPreferences;
}

// ============================================================================
// MEAL REMINDERS (stub for future push notifications)
// ============================================================================

export type MealReminderCount = 0 | 1 | 2 | 3;

export interface MealReminderSettings {
  timesPerDay: MealReminderCount;
  preferredTimes?: string[]; // e.g., ["09:00", "13:00", "18:00"]
}

// ============================================================================
// MEAL PLAN REQUESTS
// ============================================================================

export interface MealPlanRequest {
  weekStartDate?: string; // For weekly plans (YYYY-MM-DD Monday)
  date?: string; // For single day plans (YYYY-MM-DD)
  targets: NutritionTargets;
  userContext?: UserContext;
  planProfile?: PlanProfile;
  preferences?: DietaryPreferences;
  previousWeek?: WeeklyPlan; // Optional: reuse locked meals from previous week
}

export interface RegenerateMealRequest {
  date: string; // YYYY-MM-DD
  dayPlan: DayPlan; // Current day plan with all meals
  mealIndex: number; // Which meal to regenerate (0-based index into dayPlan.meals)
  targets: NutritionTargets;
  planProfile?: PlanProfile;
  preferences?: DietaryPreferences;
}

export interface RegenerateMealResponse {
  updatedDayPlan: DayPlan;
}
