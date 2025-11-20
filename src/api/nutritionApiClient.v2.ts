/**
 * Nutrition API Client (Contract-Hardened Version)
 * 
 * Frontend interface to the AI-assisted nutrition backend.
 * All AI-related work (LLM calls, MCP nutrition server, etc.) happens server-side.
 * 
 * Features:
 * - Typed error handling with retryable semantics
 * - User correction tracking
 * - Official vs estimated data provenance
 * 
 * Current state: Returns stub responses for development.
 * Ready for real backend once contracts are validated.
 */

import type {
  WeeklyPlan,
  DayPlan,
  DayLog,
  LoggedFoodItem,
  NutritionTargets,
  UserContext,
  ApiErrorResponse,
  ErrorCode,
  PlanProfile,
  RegenerateMealRequest,
} from '../features/nutrition/nutritionTypes';
import { NutritionApiError } from '../features/nutrition/nutritionTypes';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE = '/api/nutrition';

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Create a typed nutrition API error
 */
function createError(
  code: ErrorCode,
  message: string,
  retryable: boolean,
  details?: Record<string, unknown>
): NutritionApiError {
  return new NutritionApiError(code, message, retryable, details);
}

/**
 * Handle fetch response with proper error parsing
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorBody: ApiErrorResponse;
    try {
      errorBody = await response.json();
    } catch {
      // Network error or malformed error response
      throw createError(
        'NETWORK_ERROR',
        `HTTP ${response.status}: ${response.statusText}`,
        response.status >= 500 // 5xx errors are retryable
      );
    }

    throw createError(
      errorBody.error.code,
      errorBody.error.message,
      errorBody.error.retryable,
      errorBody.error.details
    );
  }

  return response.json();
}

// ============================================================================
// MEAL PLAN ENDPOINTS (Nutrition Page)
// ============================================================================

/**
 * Fetch the weekly meal plan for a given week.
 * @param weekStartDate - Monday of the week (YYYY-MM-DD)
 * @throws NutritionApiError if request fails
 */
export async function fetchWeeklyPlan(weekStartDate: string): Promise<WeeklyPlan> {
  // TODO: Replace with real fetch call
  // const response = await fetch(`${API_BASE}/plan?weekStart=${weekStartDate}`);
  // return handleResponse<WeeklyPlan>(response);

  // Stub: Return empty plan for now
  return {
    weekStartDate,
    days: [],
  };
}

/**
 * Generate a new meal plan for the entire week using AI.
 * @param weekStartDate - Monday of the week (YYYY-MM-DD)
 * @param targets - Daily nutrition targets
 * @param userContext - Optional location/locale for restaurant personalization
 * @param planProfile - Optional meal plan profile ('standard' or 'glp1')
 * @throws NutritionApiError with retryable=true if AI timeout/quota exceeded
 */
export async function generateMealPlanForWeek(
  weekStartDate: string,
  targets: NutritionTargets,
  userContext?: UserContext,
  planProfile?: PlanProfile
): Promise<WeeklyPlan> {
  const response = await fetch(`${API_BASE}/plan/week`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weekStartDate, targets, userContext, planProfile }),
  });
  
  const result = await handleResponse<{ data: WeeklyPlan }>(response);
  return result.data;
}

/**
 * Generate a new meal plan for a single day using AI.
 * @param date - Target date (YYYY-MM-DD)
 * @param targets - Daily nutrition targets
 * @param userContext - Optional location/locale for restaurant personalization
 * @param planProfile - Optional meal plan profile ('standard' or 'glp1')
 * @throws NutritionApiError with retryable=true if AI timeout/quota exceeded
 */
export async function generateMealPlanForDay(
  date: string,
  targets: NutritionTargets,
  userContext?: UserContext,
  planProfile?: PlanProfile
): Promise<DayPlan> {
  const response = await fetch(`${API_BASE}/plan/day`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, targets, userContext, planProfile }),
  });
  
  const result = await handleResponse<{ data: DayPlan }>(response);
  return result.data;
}

/**
 * Update an existing day plan (e.g., after manual editing or food swaps).
 * @param date - Target date (YYYY-MM-DD)
 * @param dayPlan - Updated plan
 * @throws NutritionApiError if validation fails or date not found
 */
export async function updateDayPlan(date: string, dayPlan: DayPlan): Promise<void> {
  // TODO: Replace with real fetch call
  // const response = await fetch(`${API_BASE}/plan/day/${date}`, {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(dayPlan),
  // });
  // await handleResponse<void>(response);

  console.log('[API Stub] updateDayPlan', { date, dayPlan });
}

/**
 * Copy a meal plan from one day to another.
 * @param fromDate - Source date (YYYY-MM-DD)
 * @param toDate - Target date (YYYY-MM-DD)
 * @throws NutritionApiError if source date not found
 */
export async function copyDayPlan(fromDate: string, toDate: string): Promise<DayPlan> {
  // TODO: Replace with real fetch call
  // const response = await fetch(`${API_BASE}/plan/copy`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ fromDate, toDate }),
  // });
  // return handleResponse<DayPlan>(response);

  console.log('[API Stub] copyDayPlan', { fromDate, toDate });
  
  return {
    date: toDate,
    meals: [],
  };
}

/**
 * Regenerate a single meal within a day plan while keeping other meals intact.
 * @param request - Regeneration parameters (date, day plan, meal index, targets, etc.)
 * @throws NutritionApiError if validation fails or AI request fails
 */
export async function regenerateMeal(request: RegenerateMealRequest): Promise<DayPlan> {
  const response = await fetch(`${API_BASE}/plan/day/regenerate-meal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  const result = await handleResponse<{ data: DayPlan }>(response);
  return result.data;
}

// ============================================================================
// FOOD LOGGING ENDPOINTS (Meals Page)
// ============================================================================

/**
 * Fetch the food log for a specific day.
 * @param date - Target date (YYYY-MM-DD)
 * @throws NutritionApiError if date invalid
 */
export async function fetchDayLog(date: string): Promise<DayLog> {
  // TODO: Replace with real fetch call
  // const response = await fetch(`${API_BASE}/../meals/log/${date}`);
  // return handleResponse<DayLog>(response);

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
 * Save the food log for a specific day.
 * @param date - Target date (YYYY-MM-DD)
 * @param log - Complete day log with user corrections tracked
 * @throws NutritionApiError if validation fails
 */
export async function saveDayLog(date: string, log: DayLog): Promise<void> {
  // TODO: Replace with real fetch call
  // const response = await fetch(`${API_BASE}/../meals/log/${date}`, {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(log),
  // });
  // await handleResponse<void>(response);

  console.log('[API Stub] saveDayLog', { date, log });
}

// ============================================================================
// AI-ASSISTED FOOD PARSING (Priority for real implementation)
// ============================================================================

/**
 * Parse natural language food description into structured nutrition data.
 * 
 * This is the PRIMARY CANDIDATE for first real AI implementation.
 * 
 * Examples:
 * - "1 apple" → official USDA data
 * - "2 eggs and a slice of toast" → multi-item parsing
 * - "my usual from Subway" → ambiguous, requires user context
 * 
 * @param description - Natural language food description
 * @param userContext - Optional location/locale for restaurant personalization
 * @throws NutritionApiError with code AI_PARSE_FAILED if unable to parse
 * @throws NutritionApiError with code AI_TIMEOUT if LLM times out (retryable=true)
 * @throws NutritionApiError with code AI_QUOTA_EXCEEDED if rate limited (retryable=true)
 */
export async function parseFood(
  description: string,
  userContext?: UserContext
): Promise<LoggedFoodItem> {
  const response = await fetch(`${API_BASE}/parse-food`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: description, ...userContext }),
  });
  
  const result = await handleResponse<{ data: LoggedFoodItem }>(response);
  return result.data;
}
