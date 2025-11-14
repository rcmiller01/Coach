import React, { useState } from 'react';
import type { OnboardingState } from './types';

interface OnboardingStepSummaryProps {
  state: OnboardingState;
  onSubmit: () => void;
  onBack: () => void;
}

const OnboardingStepSummary: React.FC<OnboardingStepSummaryProps> = ({
  state,
  onSubmit,
  onBack,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit();
    // Keep submitting state - the parent will handle navigation
  };

  const goalLabels: Record<string, string> = {
    lose_fat: 'Lose Fat',
    build_muscle: 'Build Muscle',
    get_stronger: 'Get Stronger',
    improve_endurance: 'Improve Endurance',
    stay_fit: 'Stay Fit',
  };

  const experienceLabels: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  };

  const environmentLabels: Record<string, string> = {
    gym: 'Gym',
    home: 'Home',
    outdoors: 'Outdoors',
    mix: 'Mix of locations',
  };

  const timeLabels: Record<string, string> = {
    morning: 'Morning',
    midday: 'Midday',
    evening: 'Evening',
    varies: 'Varies',
  };

  const formatDays = (days: string[]) => {
    const dayMap: Record<string, string> = {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun',
    };
    return days.map((d) => dayMap[d] || d).join(', ');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Summary</h2>
      <p className="text-gray-600 mb-8">
        Review your profile before we create your personalized program
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        {/* Basic Profile */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Profile</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Age:</span>{' '}
              <span className="font-medium text-gray-900">{state.age} years</span>
            </div>
            <div>
              <span className="text-gray-600">Height:</span>{' '}
              <span className="font-medium text-gray-900">{state.heightFeet}' {state.heightInches}"</span>
            </div>
            <div>
              <span className="text-gray-600">Weight:</span>{' '}
              <span className="font-medium text-gray-900">{state.weightLbs} lbs</span>
            </div>
            <div>
              <span className="text-gray-600">Experience:</span>{' '}
              <span className="font-medium text-gray-900">
                {state.trainingExperience ? experienceLabels[state.trainingExperience] : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Goals */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Goals & Motivation</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Primary Goal:</span>{' '}
              <span className="font-medium text-gray-900">
                {state.primaryGoal ? goalLabels[state.primaryGoal] : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Your Why:</span>{' '}
              <span className="font-medium text-gray-900 italic">
                "{state.motivation.text}"
              </span>
            </div>
          </div>
        </div>

        {/* Constraints */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Constraints</h3>
          {state.jointIssues.length === 0 ? (
            <p className="text-sm text-gray-600">No joint issues reported</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {state.jointIssues.map((issue, index) => (
                <li key={index} className="text-gray-900">
                  <span className="font-medium capitalize">{issue.area.replace('_', ' ')}</span>
                  {' - '}
                  <span className="text-gray-600 capitalize">{issue.severity}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Environment */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Training Environment</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Location:</span>{' '}
              <span className="font-medium text-gray-900">
                {state.trainingEnvironment ? environmentLabels[state.trainingEnvironment] : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Equipment:</span>{' '}
              <span className="font-medium text-gray-900">
                {state.equipment.length > 0
                  ? state.equipment.map((e) => e.replace('_', ' ')).join(', ')
                  : 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Training Schedule</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Frequency:</span>{' '}
              <span className="font-medium text-gray-900">
                {state.sessionsPerWeek} days per week
              </span>
            </div>
            <div>
              <span className="text-gray-600">Preferred Days:</span>{' '}
              <span className="font-medium text-gray-900">
                {formatDays(state.preferredDays)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Time of Day:</span>{' '}
              <span className="font-medium text-gray-900">
                {state.preferredTimeOfDay ? timeLabels[state.preferredTimeOfDay] : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating your plan...' : 'Create my first week'}
        </button>
      </div>
    </div>
  );
};

export default OnboardingStepSummary;
