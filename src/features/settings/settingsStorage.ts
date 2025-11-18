import type { MealReminderSettings } from '../nutrition/nutritionTypes';

const SETTINGS_KEY = 'ai_coach_settings_v1';

export interface CoachSettings {
  defaultFormCheckEnabled: boolean;
  mealReminders?: MealReminderSettings;
}

export function loadSettings(): CoachSettings {
  if (typeof window === 'undefined') {
    return {
      defaultFormCheckEnabled: false,
      mealReminders: { timesPerDay: 0 },
    };
  }

  const raw = window.localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    return {
      defaultFormCheckEnabled: false,
      mealReminders: { timesPerDay: 0 },
    };
  }

  try {
    const parsed = JSON.parse(raw) as CoachSettings;
    // Ensure mealReminders exists
    if (!parsed.mealReminders) {
      parsed.mealReminders = { timesPerDay: 0 };
    }
    return parsed;
  } catch {
    return {
      defaultFormCheckEnabled: false,
      mealReminders: { timesPerDay: 0 },
    };
  }
}

export function saveSettings(settings: CoachSettings): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
