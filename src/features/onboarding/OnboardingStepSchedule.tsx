import React from 'react';
import type { TimeOfDay } from './types';

interface OnboardingStepScheduleProps {
  sessionsPerWeek: number | null;
  preferredDays: string[];
  preferredTimeOfDay: TimeOfDay | null;
  onChange: (field: string, value: unknown) => void;
  onNext: () => void;
  onBack: () => void;
}

const OnboardingStepSchedule: React.FC<OnboardingStepScheduleProps> = ({
  sessionsPerWeek,
  preferredDays,
  preferredTimeOfDay,
  onChange,
  onNext,
  onBack,
}) => {
  const isValid =
    sessionsPerWeek !== null &&
    sessionsPerWeek >= 2 &&
    sessionsPerWeek <= 6 &&
    preferredDays.length > 0 &&
    preferredTimeOfDay !== null;

  const toggleDay = (day: string) => {
    if (preferredDays.includes(day)) {
      onChange('preferredDays', preferredDays.filter((d) => d !== day));
    } else {
      onChange('preferredDays', [...preferredDays, day]);
    }
  };

  const weekdays = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
    { value: 'sunday', label: 'Sun' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Training Schedule</h2>
      <p className="text-gray-600 mb-8">When can you realistically train?</p>

      <div className="space-y-8">
        {/* Sessions per week */}
        <div>
          <label htmlFor="sessions" className="block text-base font-medium text-gray-900 mb-4">
            How many days per week can you train?
          </label>
          <div className="flex gap-3">
            {[2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={() => onChange('sessionsPerWeek', num)}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                  sessionsPerWeek === num
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred days */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-4">
            Which days work best for you?
            <span className="text-sm font-normal text-gray-500 ml-2">(select all that apply)</span>
          </label>
          <div className="grid grid-cols-7 gap-2">
            {weekdays.map((day) => {
              const isSelected = preferredDays.includes(day.value);
              return (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={`py-3 px-2 rounded-lg font-medium text-sm transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time of day */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-4">
            Preferred time of day
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'morning', label: 'Morning' },
              { value: 'midday', label: 'Midday' },
              { value: 'evening', label: 'Evening' },
              { value: 'varies', label: 'Varies' },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex items-center justify-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  preferredTimeOfDay === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="timeOfDay"
                  value={option.value}
                  checked={preferredTimeOfDay === option.value}
                  onChange={(e) => onChange('preferredTimeOfDay', e.target.value as TimeOfDay)}
                  className="sr-only"
                />
                <span className="font-medium text-gray-900">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            isValid
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default OnboardingStepSchedule;
