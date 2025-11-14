import React from 'react';
import type { TrainingEnvironment } from './types';

interface OnboardingStepEnvironmentProps {
  trainingEnvironment: TrainingEnvironment | null;
  equipment: string[];
  onChange: (field: string, value: unknown) => void;
  onNext: () => void;
  onBack: () => void;
}

const OnboardingStepEnvironment: React.FC<OnboardingStepEnvironmentProps> = ({
  trainingEnvironment,
  equipment,
  onChange,
  onNext,
  onBack,
}) => {
  const isValid = trainingEnvironment !== null && equipment.length > 0;

  const toggleEquipment = (item: string) => {
    if (equipment.includes(item)) {
      onChange('equipment', equipment.filter((e) => e !== item));
    } else {
      onChange('equipment', [...equipment, item]);
    }
  };

  const equipmentOptions = [
    'barbell',
    'dumbbells',
    'kettlebells',
    'resistance_bands',
    'pull_up_bar',
    'bench',
    'squat_rack',
    'cable_machine',
    'bodyweight_only',
  ];

  const equipmentLabels: Record<string, string> = {
    barbell: 'Barbell',
    dumbbells: 'Dumbbells',
    kettlebells: 'Kettlebells',
    resistance_bands: 'Resistance Bands',
    pull_up_bar: 'Pull-up Bar',
    bench: 'Bench',
    squat_rack: 'Squat Rack',
    cable_machine: 'Cable Machine',
    bodyweight_only: 'Bodyweight Only',
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Training Environment</h2>
      <p className="text-gray-600 mb-8">Where will you be training?</p>

      <div className="space-y-8">
        {/* Environment */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-4">
            Primary Training Location
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'gym', label: 'Gym' },
              { value: 'home', label: 'Home' },
              { value: 'outdoors', label: 'Outdoors' },
              { value: 'mix', label: 'Mix of locations' },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex items-center justify-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  trainingEnvironment === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="environment"
                  value={option.value}
                  checked={trainingEnvironment === option.value}
                  onChange={(e) => onChange('trainingEnvironment', e.target.value as TrainingEnvironment)}
                  className="sr-only"
                />
                <span className="font-medium text-gray-900">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-4">
            Available Equipment
            <span className="text-sm font-normal text-gray-500 ml-2">(select all that apply)</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {equipmentOptions.map((item) => {
              const isSelected = equipment.includes(item);
              return (
                <label
                  key={item}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleEquipment(item)}
                    className="mr-3 h-4 w-4"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {equipmentLabels[item]}
                  </span>
                </label>
              );
            })}
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

export default OnboardingStepEnvironment;
