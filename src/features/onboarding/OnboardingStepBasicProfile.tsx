import React from 'react';
import type { TrainingExperience } from './types';

interface OnboardingStepBasicProfileProps {
  age: number | null;
  heightFeet: number | null;
  heightInches: number | null;
  weightLbs: number | null;
  gender: 'male' | 'female' | 'other' | null;
  trainingExperience: TrainingExperience | null;
  city?: string;
  zipCode?: string;
  onChange: (field: string, value: number | string | null) => void;
  onNext: () => void;
  onBack: () => void;
}

const OnboardingStepBasicProfile: React.FC<OnboardingStepBasicProfileProps> = ({
  age,
  heightFeet,
  heightInches,
  weightLbs,
  gender,
  trainingExperience,
  city,
  zipCode,
  onChange,
  onNext,
  onBack,
}) => {
  const isValid =
    age !== null && age >= 13 && age <= 90 &&
    heightFeet !== null && heightFeet >= 3 && heightFeet <= 8 &&
    heightInches !== null && heightInches >= 0 && heightInches <= 11 &&
    weightLbs !== null && weightLbs > 0 &&
    weightLbs !== null && weightLbs > 0 &&
    gender !== null &&
    trainingExperience !== null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Basic Profile</h2>
      <p className="text-gray-600 mb-8">Tell us a bit about yourself</p>

      <div className="space-y-6">
        {/* Age */}
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
            Age
          </label>
          <input
            type="number"
            id="age"
            value={age ?? ''}
            onChange={(e) => onChange('age', e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 28"
            min="13"
            max="90"
          />
        </div>

        {/* Height */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Height
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="heightFeet" className="block text-xs text-gray-600 mb-1">
                Feet
              </label>
              <input
                type="number"
                id="heightFeet"
                value={heightFeet ?? ''}
                onChange={(e) => onChange('heightFeet', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="5"
                min="3"
                max="8"
              />
            </div>
            <div>
              <label htmlFor="heightInches" className="block text-xs text-gray-600 mb-1">
                Inches
              </label>
              <input
                type="number"
                id="heightInches"
                value={heightInches ?? ''}
                onChange={(e) => onChange('heightInches', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="9"
                min="0"
                max="11"
              />
            </div>
          </div>
        </div>

        {/* Weight */}
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
            Weight (lbs)
          </label>
          <input
            type="number"
            id="weight"
            value={weightLbs ?? ''}
            onChange={(e) => onChange('weightLbs', e.target.value ? parseFloat(e.target.value) : null)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 155"
            min="1"
            step="0.5"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <div className="flex gap-4">
            {['male', 'female', 'other'].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value={option}
                  checked={gender === option}
                  onChange={(e) => onChange('gender', e.target.value)}
                  className="mr-2"
                />
                <span className="capitalize">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Training Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Training Experience
          </label>
          <div className="space-y-3">
            {[
              { value: 'beginner', label: 'Beginner', desc: 'New to strength training' },
              { value: 'intermediate', label: 'Intermediate', desc: 'Training for 6+ months' },
              { value: 'advanced', label: 'Advanced', desc: 'Training for 2+ years' },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${trainingExperience === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
                  }`}
              >
                <input
                  type="radio"
                  name="experience"
                  value={option.value}
                  checked={trainingExperience === option.value}
                  onChange={(e) => onChange('trainingExperience', e.target.value as TrainingExperience)}
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

        {/* Location (Optional) */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Location <span className="text-sm font-normal text-gray-500">(Optional)</span>
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Help us provide better nutrition recommendations (e.g., local restaurant options)
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                id="city"
                value={city ?? ''}
                onChange={(e) => onChange('city', e.target.value || null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Austin"
              />
            </div>
            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                id="zipCode"
                value={zipCode ?? ''}
                onChange={(e) => onChange('zipCode', e.target.value || null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 78701"
                maxLength={10}
              />
            </div>
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
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${isValid
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

export default OnboardingStepBasicProfile;
