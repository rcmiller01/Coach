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
} from '../features/nutrition/nutritionTypes';

// Backend base URL - in production this would come from environment config
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const API_BASE = '/api';

// ============================================================================
// MEAL PLAN ENDPOINTS (Nutrition Page)
// ============================================================================

/**
 * Fetch the weekly meal plan for a given week.
 * @param weekStartDate - Monday of the week (YYYY-MM-DD)
 */
export async function fetchWeeklyPlan(weekStartDate: string): Promise<WeeklyPlan> {
  // TODO: Replace with real fetch call
  // const response = await fetch(`${API_BASE}/nutrition/plan?weekStart=${weekStartDate}`);
  // if (!response.ok) throw new Error('Failed to fetch weekly plan');
  // return response.json();

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
 */
export async function generateMealPlanForWeek(
  weekStartDate: string,
  // @ts-expect-error - Stub function, will use targets in real implementation
  targets: NutritionTargets,
  // @ts-expect-error - Stub function, will use userContext in real implementation
  userContext?: UserContext
): Promise<WeeklyPlan> {
  // TODO: Replace with real fetch call
  // const response = await fetch(`${API_BASE}/nutrition/plan/week`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ weekStartDate, targets, userContext }),
  // });
  // if (!response.ok) throw new Error('Failed to generate weekly plan');
  // return response.json();

  // Stub: Return a dummy 7-day plan
  const days: DayPlan[] = [];
  const startDate = new Date(weekStartDate);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    days.push({
      date: dateStr,
      meals: [
        {
          id: `breakfast-${dateStr}`,
          type: 'breakfast',
          items: [
            {
              id: `food-1-${dateStr}`,
              name: 'Oatmeal with berries',
              quantity: 1,
              unit: 'serving',
              calories: 320,
              proteinGrams: 10,
              carbsGrams: 54,
              fatsGrams: 8,
            },
          ],
        },
        {
          id: `lunch-${dateStr}`,
          type: 'lunch',
          items: [
            {
              id: `food-2-${dateStr}`,
              name: 'Grilled chicken salad',
              quantity: 1,
              unit: 'serving',
              calories: 450,
              proteinGrams: 40,
              carbsGrams: 20,
              fatsGrams: 18,
            },
          ],
        },
        {
          id: `dinner-${dateStr}`,
          type: 'dinner',
          items: [
            {
              id: `food-3-${dateStr}`,
              name: 'Salmon with vegetables',
              quantity: 1,
              unit: 'serving',
              calories: 520,
              proteinGrams: 45,
              carbsGrams: 30,
              fatsGrams: 22,
            },
          ],
        },
      ],
    });
  }

  return {
    weekStartDate,
    days,
  };
}

/**
 * Generate a meal plan for a single day using AI.
 * @param date - Date to generate plan for (YYYY-MM-DD)
 * @param targets - Daily nutrition targets
 * @param userContext - Optional location/locale for restaurant personalization
 */
export async function generateMealPlanForDay(
  date: string,
  // @ts-expect-error - Stub function, will use targets in real implementation
  targets: NutritionTargets,
  // @ts-expect-error - Stub function, will use userContext in real implementation
  userContext?: UserContext
): Promise<DayPlan> {
  // TODO: Replace with real fetch call
  // const response = await fetch(`${API_BASE}/nutrition/plan/day`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ date, targets, userContext }),
  // });
  // if (!response.ok) throw new Error('Failed to generate day plan');
  // return response.json();

  // Stub: Return dummy plan for one day
  return {
    date,
    meals: [
      {
        id: `breakfast-${date}`,
        type: 'breakfast',
        items: [
          {
            id: `food-1-${date}`,
            name: 'Greek yogurt with granola',
            quantity: 1,
            unit: 'serving',
            calories: 280,
            proteinGrams: 15,
            carbsGrams: 35,
            fatsGrams: 8,
          },
        ],
      },
      {
        id: `lunch-${date}`,
        type: 'lunch',
        items: [
          {
            id: `food-2-${date}`,
            name: 'Turkey sandwich',
            quantity: 1,
            unit: 'serving',
            calories: 420,
            proteinGrams: 30,
            carbsGrams: 45,
            fatsGrams: 12,
          },
        ],
      },
      {
        id: `dinner-${date}`,
        type: 'dinner',
        items: [
          {
            id: `food-3-${date}`,
            name: 'Steak with sweet potato',
            quantity: 1,
            unit: 'serving',
            calories: 580,
            proteinGrams: 48,
            carbsGrams: 40,
            fatsGrams: 24,
          },
        ],
      },
    ],
  };
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
 * Copy a meal plan from one day to another.
 * @param fromDate - Source date (YYYY-MM-DD)
 * @param toDate - Destination date (YYYY-MM-DD)
 */
export async function copyDayPlan(
  // @ts-expect-error - Stub function, will use fromDate in real implementation
  fromDate: string,
  toDate: string
): Promise<DayPlan> {
  // TODO: Replace with real fetch call
  // const response = await fetch(`${API_BASE}/nutrition/plan/copy`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ fromDate, toDate }),
  // });
  // if (!response.ok) throw new Error('Failed to copy day plan');
  // return response.json();

  // Stub: Return empty plan for destination date
  return {
    date: toDate,
    meals: [],
  };
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
  // @ts-expect-error - Stub function, will use userContext in real implementation
  userContext?: UserContext
): Promise<LoggedFoodItem> {
  // TODO: Replace with real fetch call
  // const response = await fetch(`${API_BASE}/nutrition/parse-food`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ text, ...userContext }),
  // });
  // if (!response.ok) throw new Error('Failed to parse food');
  // return response.json();

  // Stub: Return a plausible dummy result
  return {
    id: `parsed-${Date.now()}`,
    name: text,
    quantity: 1,
    unit: 'serving',
    calories: 400,
    proteinGrams: 25,
    carbsGrams: 40,
    fatsGrams: 12,
    sourceType: 'search',
    userAdjusted: false,
    dataSource: 'estimated',
    aiExplanation: {
      reasoning: `Based on your description "${text}", I identified this as a typical portion. The nutrition values are estimated from similar foods in the database.`,
      sources: [
        { label: 'USDA FoodData Central', url: 'https://fdc.nal.usda.gov/' },
        { label: 'Internal food database' },
      ],
      confidence: 'medium',
    },
  };
}
