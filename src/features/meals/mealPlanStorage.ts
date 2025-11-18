import type { DailyMealPlan } from './mealTypes';

const MEAL_PLAN_KEY = 'ai_coach_meal_plan_v1';

interface MealPlanStorage {
  [date: string]: DailyMealPlan;
}

/**
 * Load meal plan for a specific date.
 */
export function loadMealPlan(date: string): DailyMealPlan | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(MEAL_PLAN_KEY);
    if (!raw) return null;

    const storage: MealPlanStorage = JSON.parse(raw);
    return storage[date] || null;
  } catch {
    return null;
  }
}

/**
 * Save a meal plan for its date.
 */
export function saveMealPlan(plan: DailyMealPlan): void {
  if (typeof window === 'undefined') return;

  try {
    const raw = window.localStorage.getItem(MEAL_PLAN_KEY);
    const storage: MealPlanStorage = raw ? JSON.parse(raw) : {};

    storage[plan.date] = plan;

    window.localStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error('Failed to save meal plan:', error);
  }
}

/**
 * Copy meal plan from one date to another.
 * Creates new IDs for meals and items to keep them distinct.
 */
export function copyMealPlan(fromDate: string, toDate: string): DailyMealPlan | null {
  if (typeof window === 'undefined') return null;

  const sourcePlan = loadMealPlan(fromDate);
  if (!sourcePlan) return null;

  // Deep clone and update IDs
  const newPlan: DailyMealPlan = {
    ...sourcePlan,
    date: toDate,
    meals: sourcePlan.meals.map((meal) => ({
      ...meal,
      id: `${meal.name.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      foods: meal.foods.map((food) => ({
        ...food,
        id: `${food.id}-copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      })),
    })),
  };

  saveMealPlan(newPlan);
  return newPlan;
}

/**
 * Get all meal plans from storage (for calendar views, etc.).
 */
export function loadAllMealPlans(): MealPlanStorage {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(MEAL_PLAN_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
