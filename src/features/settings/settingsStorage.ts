const SETTINGS_KEY = 'ai_coach_settings_v1';

export interface CoachSettings {
  defaultFormCheckEnabled: boolean;
}

export function loadSettings(): CoachSettings {
  if (typeof window === 'undefined') {
    return { defaultFormCheckEnabled: false };
  }

  const raw = window.localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    return { defaultFormCheckEnabled: false };
  }

  try {
    const parsed = JSON.parse(raw) as CoachSettings;
    return parsed;
  } catch {
    return { defaultFormCheckEnabled: false };
  }
}

export function saveSettings(settings: CoachSettings): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
