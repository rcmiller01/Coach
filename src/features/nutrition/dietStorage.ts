/**
 * Diet Storage
 * 
 * Persists diet targets to localStorage
 */

import type { DietTargets } from './dietEngine';

const DIET_TARGETS_KEY = 'coach-diet-targets';

export function saveDietTargets(targets: DietTargets): void {
  try {
    localStorage.setItem(DIET_TARGETS_KEY, JSON.stringify(targets));
  } catch (error) {
    console.error('Failed to save diet targets:', error);
  }
}

export function loadDietTargets(): DietTargets | null {
  try {
    const saved = localStorage.getItem(DIET_TARGETS_KEY);
    if (!saved) return null;
    return JSON.parse(saved) as DietTargets;
  } catch (error) {
    console.error('Failed to load diet targets:', error);
    return null;
  }
}

export function clearDietTargets(): void {
  try {
    localStorage.removeItem(DIET_TARGETS_KEY);
  } catch (error) {
    console.error('Failed to clear diet targets:', error);
  }
}
