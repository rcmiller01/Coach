/**
 * backupExport.ts - Export and reset functionality for training data
 * 
 * Purpose:
 * - Export all app data to a portable JSON backup
 * - Reset program/history/diet while preserving onboarding
 * - Provide safety mechanism for data recovery
 */

import { loadMultiWeekProgram } from '../program/programStorage';
import { loadAllHistory } from '../history/historyStorage';
import { loadDietTargets } from '../nutrition/dietStorage';
import { loadNutritionTargets } from '../nutrition/nutritionStorage';
import type { ProgramMultiWeek } from '../program/types';
import type { WorkoutHistoryEntry } from '../history/types';
import type { DietTargets } from '../nutrition/dietEngine';
import type { NutritionTargets } from '../nutrition/nutritionTypes';

/**
 * Complete backup of all training and nutrition data
 */
export interface AppBackup {
  version: string;
  exportedAt: string; // ISO timestamp
  program: ProgramMultiWeek | null;
  history: WorkoutHistoryEntry[];
  dietTargets: DietTargets | null;
  nutritionTargets: NutritionTargets | null;
  foodLog: Record<string, {
    date: string;
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatsGrams: number;
  }>;
}

/**
 * Load food log from localStorage
 */
function loadFoodLog(): AppBackup['foodLog'] {
  try {
    const raw = localStorage.getItem('ai_coach_food_log_v1');
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Export all training data to a JSON backup
 * Returns a formatted JSON string ready to save/copy
 */
export function exportTrainingData(): string {
  const backup: AppBackup = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    program: loadMultiWeekProgram(),
    history: loadAllHistory(),
    dietTargets: loadDietTargets(),
    nutritionTargets: loadNutritionTargets(),
    foodLog: loadFoodLog(),
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * Download backup as a file
 * Creates a downloadable .json file with timestamp
 */
export function downloadBackup(): void {
  const backup = exportTrainingData();
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `coach-backup-${timestamp}.json`;

  const blob = new Blob([backup], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy backup to clipboard
 * Returns true if successful, false otherwise
 */
export async function copyBackupToClipboard(): Promise<boolean> {
  try {
    const backup = exportTrainingData();
    await navigator.clipboard.writeText(backup);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reset program data while preserving onboarding
 * Clears:
 * - Multi-week program and blocks
 * - Workout history
 * - Food log
 * - Diet targets
 * - Nutrition targets
 * 
 * Preserves:
 * - Onboarding profile data
 * - Settings
 */
export function resetProgramData(): void {
  // Clear program and blocks
  localStorage.removeItem('coach-multi-week-program');
  
  // Clear history
  localStorage.removeItem('ai_coach_workout_history');
  
  // Clear food log
  localStorage.removeItem('ai_coach_food_log_v1');
  
  // Clear diet targets
  localStorage.removeItem('coach-diet-targets');
  
  // Clear nutrition targets
  localStorage.removeItem('coach-nutrition-targets');
  
  // Clear meal plans
  localStorage.removeItem('coach-meal-plan');
  
  // NOTE: We intentionally preserve:
  // - 'coach-profile' (onboarding data)
  // - 'coach-settings' (user preferences)
}

/**
 * Get summary of what will be reset
 * Useful for showing in confirmation dialog
 */
export function getResetSummary(): {
  programWeeks: number;
  historyEntries: number;
  foodLogDays: number;
  hasDietTargets: boolean;
} {
  const program = loadMultiWeekProgram();
  const history = loadAllHistory();
  const foodLog = loadFoodLog();
  const dietTargets = loadDietTargets();

  return {
    programWeeks: program?.weeks.length || 0,
    historyEntries: history.length,
    foodLogDays: Object.keys(foodLog).length,
    hasDietTargets: !!dietTargets,
  };
}
