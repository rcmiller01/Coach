/**
 * Nutrition API Client
 * 
 * Frontend interface to the AI-assisted nutrition backend.
 * All AI-related work (LLM calls, MCP nutrition server, etc.) happens server-side.
 * 
 * For now, these functions use stubbed responses for development.
 * Eventually they will call real backend endpoints.
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

// Backend base URL - in production this would come from environment config
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

// Helper to get headers with auth
function getHeaders() {
  const userId = localStorage.getItem('coach_user_id');
  return {
    'Content-Type': 'application/json',
    'X-User-Id': userId || '',
  };
}

// ... (update fetch calls to use getHeaders())

// ============================================================================
// MEAL PLAN ENDPOINTS (Nutrition Page)
// ============================================================================

/**
 * Fetch the weekly meal plan for a given week.
 * @param weekStartDate - Monday of the week (YYYY-MM-DD)
 */
export async function fetchWeeklyPlan(weekStartDate: string): Promise<WeeklyPlan> {
  const response = await fetch(`${API_BASE_URL}/nutrition/plan?weekStart=${weekStartDate}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    // If no plan exists (404), return empty plan
    if (response.status === 404) {
      return {
        weekStartDate,
        days: [],
      };
    }
    throw new Error('Failed to fetch weekly plan');
  }

  const result = await response.json();
  return result.data || { weekStartDate, days: [] };
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
  const response = await fetch(`${API_BASE_URL}/nutrition/plan/week`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ weekStartDate, targets, userContext, configProfile: planProfile }),
  });

  // Get response text first to handle empty responses
  const text = await response.text();

  if (!response.ok) {
    if (!text) {
      throw new Error(`Server error: ${response.status} (empty response)`);
    }

    try {
      const error = JSON.parse(text);
      throw new Error(error.error?.message || error.message || 'Failed to generate weekly plan');
    } catch (parseError) {
      throw new Error(`Server error: ${response.status} - ${text.substring(0, 100)}`);
    }
  }

  if (!text) {
    throw new Error('Empty response from server');
  }

  try {
    const result = JSON.parse(text);
    return result.data;
  } catch (parseError) {
    console.error('Failed to parse JSON response:', text.substring(0, 200));
    throw new Error('Invalid JSON returned from server');
  }
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
  const response = await fetch(`${API_BASE_URL}/nutrition/plan/day`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ date, targets, userContext, planProfile, preferences }),
  });

  if (!response.ok) {
    const text = await response.text();
    let error: any;
    try {
      error = JSON.parse(text);
    } catch {
      error = { message: text || 'Failed to generate daily plan' };
    }
    throw new Error(error.error?.message || error.message || 'Failed to generate daily plan');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update a day plan (after user edits like substitutions).
 * @param plan - The updated day plan
 */
export async function updateDayPlan(plan: DayPlan): Promise<DayPlan> {
  // TODO: Replace with real fetch call
  // const response = await fetch(`${API_BASE}/nutrition/plan/day/${plan.date}`, {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(plan),
  // });
  // if (!response.ok) throw new Error('Failed to update day plan');
  // return response.json();

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
  const response = await fetch(`${API_BASE_URL}/nutrition/plan/day/regenerate-meal`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ date, mealIndex, targets, currentPlan, userContext, planProfile }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || error.message || 'Failed to regenerate meal');
  }
  const result = await response.json();
  return result.data;
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
  const response = await fetch(`${API_BASE_URL}/nutrition/plan/copy`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ fromDate, toDate }),
  });

  if (!response.ok) {
    const text = await response.text();
    let error: any;
    try {
      error = JSON.parse(text);
    } catch {
      error = { message: text || 'Failed to copy day plan' };
    }
    throw new Error(error.error?.message || error.message || 'Failed to copy day plan');
  }

  const result = await response.json();
  return result.data;
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
  // const response = await fetch(`${API_BASE}/meals/log/${date}`);
  // if (!response.ok) throw new Error('Failed to fetch day log');
  // return response.json();

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
  // const response = await fetch(`${API_BASE}/meals/log/${log.date}`, {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(log),
  // });
  // if (!response.ok) throw new Error('Failed to save day log');
  // return response.json();

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
  const response = await fetch(`${API_BASE_URL}/nutrition/parse-food`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ text, ...userContext }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || error.message || 'Failed to parse food');
  }

  const result = await response.json();
  return result.data;
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
  const response = await fetch(`${API_BASE_URL}/nutrition/verify-food`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(item),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || error.message || 'Failed to verify food item');
  }

  const result = await response.json();
  return result.data;
}
