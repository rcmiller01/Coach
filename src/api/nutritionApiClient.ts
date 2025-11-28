/**
 * Nutrition API Client
 * 
 * Frontend interface to the AI-assisted nutrition backend.
 * All AI-related work (LLM calls, MCP nutrition server, etc.) happens server-side.
 */

import type {
  WeeklyPlan,
  DayPlan,
  DayLog,
  LoggedFoodItem,
  NutritionTargets,
  UserContext,
  PlanProfile,
  DietaryPreferences,
} from '../features/nutrition/nutritionTypes';

import { apiClient } from '../lib/apiClient';

// ============================================================================
// MEAL PLAN ENDPOINTS (Nutrition Page)
// ============================================================================

/**
 * Fetch the weekly meal plan for a given week.
 * @param weekStartDate - Monday of the week (YYYY-MM-DD)
 */
export async function fetchWeeklyPlan(weekStartDate: string): Promise<WeeklyPlan> {
  try {
    return await apiClient.get<WeeklyPlan>(`/nutrition/plan?weekStart=${weekStartDate}`);
  } catch (error: any) {
    // Handle 404 specifically as empty plan
    if (error.status === 404) {
      return {
        weekStartDate,
        days: [],
      };
    }
    throw error;
  }
}

/**
 * Generate a new meal plan for the entire week using AI.
 * Returns a sessionId for tracking generation progress.
 * 
 * @param weekStartDate - Monday of the week (YYYY-MM-DD)
 * @param targets - Daily nutrition targets
 * @param userContext - Optional location/locale for restaurant personalization
 * @returns Object with sessionId, weekStartDate, and optional weeklyPlan
 */
export async function generateMealPlanForWeek(
  weekStartDate: string,
  targets: NutritionTargets,
  userContext?: UserContext,
  planProfile?: PlanProfile
): Promise<{ sessionId: string; weekStartDate: string; weeklyPlan?: WeeklyPlan; qualitySummary?: string }> {
  return apiClient.post<{ sessionId: string; weekStartDate: string; weeklyPlan?: WeeklyPlan; qualitySummary?: string }>(
    '/nutrition/plan/week',
    { weekStartDate, targets, userContext, configProfile: planProfile }
  );
}

/**
 * Generate a meal plan for a single day using AI.
 * @param date - Date to generate plan for (YYYY-MM-DD)
 * @param targets - Daily nutrition targets
 * @param userContext - Optional location/locale for restaurant personalization
 */
export async function generateMealPlanForDay(
  date: string,
  targets: NutritionTargets,
  userContext?: UserContext,
  planProfile?: PlanProfile,
  preferences?: DietaryPreferences
): Promise<DayPlan> {
  return apiClient.post<DayPlan>(
    '/nutrition/plan/day',
    { date, targets, userContext, planProfile, preferences }
  );
}

/**
 * Update a day plan (after user edits like substitutions).
 * @param plan - The updated day plan
 */
export async function updateDayPlan(plan: DayPlan): Promise<DayPlan> {
  // TODO: Replace with real fetch call
  // return apiClient.put<DayPlan>(`/nutrition/plan/day/${plan.date}`, plan);

  // Stub: Return the plan as-is
  return plan;
}

/**
 * Regenerate a specific meal in a day plan using AI.
 * @param date - Date of the plan (YYYY-MM-DD)
 * @param mealIndex - Index of the meal to regenerate (0-based)
 * @param targets - Daily nutrition targets
 * @param currentPlan - Current day plan
 * @param userContext - Optional location/locale and dietary preferences
 */
export async function regenerateMeal(
  date: string,
  mealIndex: number,
  targets: NutritionTargets,
  currentPlan: DayPlan,
  userContext?: UserContext,
  planProfile?: PlanProfile
): Promise<DayPlan> {
  return apiClient.post<DayPlan>(
    '/nutrition/plan/day/regenerate-meal',
    { date, mealIndex, targets, currentPlan, userContext, planProfile }
  );
}

/**
 * Copy a meal plan from one day to another.
 * @param fromDate - Source date (YYYY-MM-DD)
 * @param toDate - Destination date (YYYY-MM-DD)
 */
export async function copyDayPlan(
  fromDate: string,
  toDate: string
): Promise<DayPlan> {
  return apiClient.post<DayPlan>(
    '/nutrition/plan/copy',
    { fromDate, toDate }
  );
}

// ============================================================================
// MEAL LOG ENDPOINTS (Meals Page)
// ============================================================================

/**
 * Fetch the food log for a specific day.
 * @param date - Date to fetch log for (YYYY-MM-DD)
 */
export async function fetchDayLog(date: string): Promise<DayLog> {
  // TODO: Replace with real fetch call
  // return apiClient.get<DayLog>(`/meals/log/${date}`);

  // Stub: Return empty log
  return {
    date,
    items: [],
    totalCalories: 0,
    totalProteinGrams: 0,
    totalCarbsGrams: 0,
    totalFatsGrams: 0,
  };
}

/**
 * Save/update the food log for a specific day.
 * @param log - The updated day log
 */
export async function saveDayLog(log: DayLog): Promise<DayLog> {
  // TODO: Replace with real fetch call
  // return apiClient.put<DayLog>(`/meals/log/${log.date}`, log);

  // Stub: Return the log as-is
  return log;
}

/**
 * Parse a food description using AI-assisted lookup.
 * Returns a LoggedFoodItem with calories, macros, explanation, sources, and confidence.
 * 
 * @param text - Free-text food description (e.g., "6-inch Italian BMT, no cheese")
 * @param userContext - Optional location/locale for restaurant context
 */
export async function parseFood(
  text: string,
  userContext?: UserContext
): Promise<LoggedFoodItem> {
  return apiClient.post<LoggedFoodItem>(
    '/nutrition/parse-food',
    { text, ...userContext }
  );
}

/**
 * Verify and update a food item's macros based on its quantity/unit.
 * @param item - The food item to verify
 */
export async function verifyFoodItem(item: {
  name: string;
  quantity: number;
  unit: string;
  foodId?: string;
}): Promise<{
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
}> {
  return apiClient.post<{
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatsGrams: number;
  }>(
    '/nutrition/verify-food',
    item
  );
}
