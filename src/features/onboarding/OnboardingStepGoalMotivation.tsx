import React from 'react';
import type { PrimaryGoal } from './types';

interface OnboardingStepGoalMotivationProps {
  primaryGoal: PrimaryGoal | null;
  motivationText: string;
  onChange: (field: string, value: unknown) => void;
  onNext: () => void;
  onBack: () => void;
}

const OnboardingStepGoalMotivation: React.FC<OnboardingStepGoalMotivationProps> = ({
  primaryGoal,
  motivationText,
  onChange,
  onNext,
  onBack,
}) => {
  const isValid = primaryGoal !== null && motivationText.trim().length > 0;

  const handleMotivationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    // Hard limit to 140 characters
    if (text.length <= 140) {
      onChange('motivation', { text });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Goals</h2>
      <p className="text-gray-600 mb-8">What drives you to train?</p>

      <div className="space-y-8">
        {/* Primary Goal */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-4">
            What's your main goal right now?
          </label>
          <div className="space-y-3">
            {[
              { value: 'lose_fat', label: 'Lose Fat', desc: 'Reduce body fat percentage' },
              { value: 'build_muscle', label: 'Build Muscle', desc: 'Increase muscle mass and size' },
              { value: 'get_stronger', label: 'Get Stronger', desc: 'Improve overall strength' },
              { value: 'improve_endurance', label: 'Improve Endurance', desc: 'Build stamina and conditioning' },
              { value: 'stay_fit', label: 'Stay Fit', desc: 'Maintain general fitness and health' },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                  primaryGoal === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="goal"
                  value={option.value}
                  checked={primaryGoal === option.value}
                  onChange={(e) => onChange('primaryGoal', e.target.value as PrimaryGoal)}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Motivation */}
        <div>
          <label htmlFor="motivation" className="block text-base font-medium text-gray-900 mb-2">
            Tell me more about your why
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Describe it in about a tweet – max 140 characters
          </p>
          <textarea
            id="motivation"
            value={motivationText}
            onChange={handleMotivationChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="e.g., Want to feel strong and confident when playing with my kids"
            maxLength={140}
          />
          <div className="mt-2 text-sm text-right text-gray-500">
            {motivationText.length} / 140
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

export default OnboardingStepGoalMotivation;
