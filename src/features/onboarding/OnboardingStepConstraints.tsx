import React from 'react';
import type { JointIssue, JointArea, JointSeverity } from './types';

interface OnboardingStepConstraintsProps {
  jointIssues: JointIssue[];
  onChange: (field: string, value: unknown) => void;
  onNext: () => void;
  onBack: () => void;
}

const OnboardingStepConstraints: React.FC<OnboardingStepConstraintsProps> = ({
  jointIssues,
  onChange,
  onNext,
  onBack,
}) => {
  const hasNoIssues = jointIssues.length === 0;

  const toggleJointArea = (area: JointArea) => {
    const existingIndex = jointIssues.findIndex((issue) => issue.area === area);
    
    if (existingIndex >= 0) {
      // Remove the joint issue
      const updated = jointIssues.filter((_, i) => i !== existingIndex);
      onChange('jointIssues', updated);
    } else {
      // Add a new joint issue with default severity
      const updated = [...jointIssues, { area, severity: 'mild' as JointSeverity }];
      onChange('jointIssues', updated);
    }
  };

  const handleNoneClick = () => {
    // Clear all joint issues
    onChange('jointIssues', []);
  };

  const updateSeverity = (area: JointArea, severity: JointSeverity) => {
    const updated = jointIssues.map((issue) =>
      issue.area === area ? { ...issue, severity } : issue
    );
    onChange('jointIssues', updated);
  };

  const isSelected = (area: JointArea) => jointIssues.some((issue) => issue.area === area);

  // Validation: either no issues or all selected issues have severity
  const isValid = true; // Always valid since severity defaults to 'mild'

  const jointAreas: Array<{ value: JointArea; label: string }> = [
    { value: 'knee', label: 'Knees' },
    { value: 'hip', label: 'Hips' },
    { value: 'lower_back', label: 'Lower Back' },
    { value: 'shoulder', label: 'Shoulders' },
    { value: 'elbow_wrist', label: 'Elbows/Wrists' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Joint & Injury Constraints</h2>
      <p className="text-gray-600 mb-8">
        Do you have any areas we should protect or work around?
      </p>

      <div className="space-y-6">
        {/* None option */}
        <div>
          <label
            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
              hasNoIssues
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              type="checkbox"
              checked={hasNoIssues}
              onChange={handleNoneClick}
              className="mr-3 h-5 w-5"
            />
            <span className="font-medium text-gray-900">None – I'm injury-free</span>
          </label>
        </div>

        {/* Joint areas */}
        <div className="space-y-4">
          {jointAreas.map((joint) => {
            const selected = isSelected(joint.value);
            const issue = jointIssues.find((i) => i.area === joint.value);

            return (
              <div key={joint.value} className="border border-gray-300 rounded-lg overflow-hidden">
                <label
                  className={`flex items-center p-4 cursor-pointer transition-colors ${
                    selected ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleJointArea(joint.value)}
                    className="mr-3 h-5 w-5"
                  />
                  <span className="font-medium text-gray-900">{joint.label}</span>
                </label>

                {/* Severity selector (only shown if selected) */}
                {selected && issue && (
                  <div className="px-4 pb-4 bg-gray-50">
                    <p className="text-sm font-medium text-gray-700 mb-2">Severity:</p>
                    <div className="flex gap-2">
                      {(['mild', 'moderate', 'severe'] as JointSeverity[]).map((severity) => (
                        <button
                          key={severity}
                          onClick={() => updateSeverity(joint.value, severity)}
                          className={`flex-1 py-2 px-3 rounded border text-sm font-medium transition-colors ${
                            issue.severity === severity
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {severity.charAt(0).toUpperCase() + severity.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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

export default OnboardingStepConstraints;
