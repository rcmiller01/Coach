/**
 * foodLog.ts - Minimal food logging for daily calorie and macro tracking
 * 
 * Purpose:
 * - Track daily totals for calories, protein, carbs, fats
 * - Persist to localStorage with date-based keys
 * - Support incremental logging (add food entries throughout the day)
 * 
 * Storage key pattern: ai_coach_food_log_v1
 * Data structure: Map of ISO date strings to DailyFoodTotals
 */

export interface DailyFoodTotals {
  date: string; // ISO date (YYYY-MM-DD)
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
}

interface FoodLogStore {
  [date: string]: DailyFoodTotals;
}

const STORAGE_KEY = 'ai_coach_food_log_v1';

/**
 * Load all food logs from localStorage
 */
function loadFoodLogStore(): FoodLogStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as FoodLogStore;
  } catch {
    return {};
  }
}

/**
 * Save entire food log store to localStorage
 */
function saveFoodLogStore(store: FoodLogStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to save food log:', err);
  }
}

/**
 * Load daily food totals for a specific date
 * Returns null if no data exists for that date
 */
export function loadDailyFoodTotals(date: string): DailyFoodTotals | null {
  const store = loadFoodLogStore();
  return store[date] || null;
}

/**
 * Save daily food totals for a specific date
 * Overwrites existing data for that date
 */
export function saveDailyFoodTotals(totals: DailyFoodTotals): void {
  const store = loadFoodLogStore();
  store[totals.date] = totals;
  saveFoodLogStore(store);
}

/**
 * Add a food entry to a specific date
 * Increments existing totals or creates new entry if none exists
 * Returns the updated totals
 */
export function addFoodEntry(
  date: string,
  entry: {
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatsGrams: number;
  }
): DailyFoodTotals {
  const existing = loadDailyFoodTotals(date);
  
  const updated: DailyFoodTotals = existing
    ? {
        date,
        calories: existing.calories + entry.calories,
        proteinGrams: existing.proteinGrams + entry.proteinGrams,
        carbsGrams: existing.carbsGrams + entry.carbsGrams,
        fatsGrams: existing.fatsGrams + entry.fatsGrams,
      }
    : {
        date,
        calories: entry.calories,
        proteinGrams: entry.proteinGrams,
        carbsGrams: entry.carbsGrams,
        fatsGrams: entry.fatsGrams,
      };
  
  saveDailyFoodTotals(updated);
  return updated;
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 * Utility function for consistency
 */
export function getTodayISODate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}
