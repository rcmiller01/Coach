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
 * @throws NutritionApiError with retryable=true if AI timeout/quota exceeded
 */
export async function generateMealPlanForWeek(
  weekStartDate: string,
  targets: NutritionTargets,
  userContext?: UserContext
): Promise<WeeklyPlan> {
  // TODO: Replace with real fetch call
  // const response = await fetch(`${API_BASE}/plan/week`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ weekStartDate, targets, userContext }),
  // });
  // return handleResponse<WeeklyPlan>(response);

  // Stub: Return a minimal 7-day plan
  console.log('[API Stub] generateMealPlanForWeek', { weekStartDate, targets, userContext });
  
  const days: DayPlan[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + i);
    days.push({
      date: date.toISOString().split('T')[0],
      meals: [
        {
          id: `breakfast-${i}`,
          type: 'breakfast',
          items: [
            {
              id: `item-${i}-1`,
              name: 'Oatmeal with berries',
              quantity: 1,
              unit: 'serving',
              calories: 300,
              proteinGrams: 10,
              carbsGrams: 50,
              fatsGrams: 5,
            },
          ],
        },
      ],
    });
  }

  return { weekStartDate, days };
}

/**
 * Generate a new meal plan for a single day using AI.
 * @param date - Target date (YYYY-MM-DD)
 * @param targets - Daily nutrition targets
 * @param userContext - Optional location/locale for restaurant personalization
 * @throws NutritionApiError with retryable=true if AI timeout/quota exceeded
 */
export async function generateMealPlanForDay(
  date: string,
  targets: NutritionTargets,
  userContext?: UserContext
): Promise<DayPlan> {
  // TODO: Replace with real fetch call
  // const response = await fetch(`${API_BASE}/plan/day`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ date, targets, userContext }),
  // });
  // return handleResponse<DayPlan>(response);

  // Stub: Return a minimal day plan
  console.log('[API Stub] generateMealPlanForDay', { date, targets, userContext });
  
  return {
    date,
    meals: [
      {
        id: `breakfast-${date}`,
        type: 'breakfast',
        items: [
          {
            id: `item-${date}-1`,
            name: 'Greek yogurt with granola',
            quantity: 1,
            unit: 'serving',
            calories: 250,
            proteinGrams: 15,
            carbsGrams: 30,
            fatsGrams: 8,
          },
        ],
      },
    ],
  };
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
  // TODO: Replace with real fetch call
  // const response = await fetch(`${API_BASE}/parse-food`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ description, userContext }),
  // });
  // return handleResponse<LoggedFoodItem>(response);

  // Stub: Return a simple parsed item
  console.log('[API Stub] parseFood', { description, userContext });

  // Simulate basic parsing
  const name = description.trim() || 'Unknown food';
  
  return {
    id: `food-${Date.now()}`,
    name,
    foodId: undefined,
    quantity: 1,
    unit: 'serving',
    calories: 200,
    proteinGrams: 10,
    carbsGrams: 25,
    fatsGrams: 8,
    sourceType: 'search',
    userAdjusted: false,
    dataSource: 'estimated',
    aiExplanation: {
      reasoning: `Estimated nutrition values for "${name}". This is stub data.`,
      sources: [
        { label: 'Stub Database', url: undefined },
      ],
      confidence: 'low',
    },
  };
}
