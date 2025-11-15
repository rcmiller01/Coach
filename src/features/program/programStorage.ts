/**
 * LocalStorage persistence for multi-week training programs
 */

import type { ProgramMultiWeek } from './types';

const STORAGE_KEY = 'ai_coach_multiweek_program_v1';

/**
 * Load the multi-week program from localStorage.
 * Returns null if no program exists or if parsing fails.
 */
export function loadMultiWeekProgram(): ProgramMultiWeek | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    
    // Basic validation
    if (!parsed || typeof parsed.currentWeekIndex !== 'number' || !Array.isArray(parsed.weeks)) {
      console.warn('Invalid multi-week program data in localStorage');
      return null;
    }
    
    return parsed as ProgramMultiWeek;
  } catch (error) {
    console.error('Failed to load multi-week program:', error);
    return null;
  }
}

/**
 * Save the multi-week program to localStorage.
 * Overwrites any existing data.
 */
export function saveMultiWeekProgram(program: ProgramMultiWeek): void {
  try {
    const serialized = JSON.stringify(program);
    window.localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save multi-week program:', error);
  }
}

/**
 * Clear the multi-week program from localStorage.
 */
export function clearMultiWeekProgram(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
