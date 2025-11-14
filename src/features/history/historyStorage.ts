import type { WorkoutHistoryEntry } from './types';

const LOCAL_STORAGE_KEY = 'ai_coach_workout_history_v1';

/**
 * Load all workout history entries from localStorage.
 * Returns an empty array if no history is found or if parsing fails.
 */
export function loadHistory(): WorkoutHistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('Invalid history data in localStorage, expected array');
      return [];
    }
    return parsed as WorkoutHistoryEntry[];
  } catch (error) {
    console.error('Failed to load workout history:', error);
    return [];
  }
}

/**
 * Save the entire history array to localStorage.
 * Overwrites any existing data.
 */
export function saveHistory(entries: WorkoutHistoryEntry[]): void {
  try {
    const serialized = JSON.stringify(entries);
    window.localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save workout history:', error);
  }
}

/**
 * Append a single workout entry to the existing history.
 * Automatically loads, appends, and saves.
 */
export function appendHistoryEntry(entry: WorkoutHistoryEntry): void {
  const existing = loadHistory();
  existing.push(entry);
  saveHistory(existing);
}
