import type { NutritionTargets } from './nutritionTypes';

const NUTRITION_KEY = 'ai_coach_nutrition_targets_v1';

export function loadNutritionTargets(): NutritionTargets | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(NUTRITION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as NutritionTargets;
  } catch {
    return null;
  }
}

export function saveNutritionTargets(targets: NutritionTargets): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(NUTRITION_KEY, JSON.stringify(targets));
}
