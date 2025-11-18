/**
 * ReminderSettingsSection - Meal Reminder Configuration (Stub)
 * 
 * Allows user to set up 0-3 meal reminders per day.
 * TODO: Implement actual push notifications when backend is ready.
 */

import type { MealReminderSettings } from '../nutrition/nutritionTypes';

interface ReminderSettingsSectionProps {
  settings: MealReminderSettings;
  onChange: (settings: MealReminderSettings) => void;
}

export default function ReminderSettingsSection({
  settings,
  onChange,
}: ReminderSettingsSectionProps) {
  const handleTimesPerDayChange = (count: 0 | 1 | 2 | 3) => {
    // Generate default times based on count
    let preferredTimes: string[] = [];
    if (count === 1) {
      preferredTimes = ['12:00'];
    } else if (count === 2) {
      preferredTimes = ['09:00', '18:00'];
    } else if (count === 3) {
      preferredTimes = ['09:00', '13:00', '18:00'];
    }

    onChange({
      timesPerDay: count,
      preferredTimes: count > 0 ? preferredTimes : undefined,
    });
  };

  return (
    <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
      <h3 className="text-lg font-semibold text-slate-100 mb-2">
        Meal Reminders
      </h3>
      <p className="text-sm text-slate-400 mb-4">
        Get gentle reminders to log your meals throughout the day.
        <span className="block mt-1 text-amber-400">
          🚧 Coming soon - Push notifications not yet implemented
        </span>
      </p>

      <div className="space-y-2">
        {[0, 1, 2, 3].map((count) => {
          const labels = {
            0: 'Off - No reminders',
            1: '1 reminder per day',
            2: '2 reminders per day',
            3: '3 reminders per day',
          };

          return (
            <label
              key={count}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                settings.timesPerDay === count
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="reminderCount"
                value={count}
                checked={settings.timesPerDay === count}
                onChange={() => handleTimesPerDayChange(count as 0 | 1 | 2 | 3)}
                className="mr-3"
              />
              <span className="text-slate-200">
                {labels[count as keyof typeof labels]}
              </span>
            </label>
          );
        })}
      </div>

      {/* Show preferred times if reminders are enabled */}
      {settings.timesPerDay > 0 && settings.preferredTimes && (
        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="text-sm font-medium text-slate-300 mb-2">
            Default Times
          </div>
          <div className="flex gap-2 flex-wrap">
            {settings.preferredTimes.map((time, idx) => (
              <div
                key={idx}
                className="px-3 py-1 bg-blue-900/30 border border-blue-800 text-blue-300 rounded text-sm"
              >
                {time}
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Time customization will be available when notifications are enabled.
          </div>
        </div>
      )}

      {/* TODO Note */}
      <div className="mt-4 p-3 bg-amber-900/10 border border-amber-800/30 rounded-lg">
        <div className="text-xs text-amber-400">
          <strong>TODO:</strong> Implement push notification service integration.
          This will require:
          <ul className="mt-1 ml-4 list-disc space-y-1">
            <li>Service worker registration for PWA push</li>
            <li>Backend endpoint to schedule notifications</li>
            <li>Permission request UI flow</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
