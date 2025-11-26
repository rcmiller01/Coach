/* eslint-disable @stylistic/no-inline-styles */
import React, { useState } from 'react';
import { initialOnboardingState } from './types';
import type { OnboardingState } from './types';
import OnboardingStepWelcome from './OnboardingStepWelcome';
import OnboardingStepBasicProfile from './OnboardingStepBasicProfile';
import OnboardingStepGoalMotivation from './OnboardingStepGoalMotivation';
import OnboardingStepConstraints from './OnboardingStepConstraints';
import OnboardingStepEnvironment from './OnboardingStepEnvironment';
import OnboardingStepSchedule from './OnboardingStepSchedule';
import OnboardingStepSummary from './OnboardingStepSummary';
import { submitOnboarding } from '../../lib/submitOnboarding';

type Step = 'welcome' | 'profile' | 'goals' | 'constraints' | 'environment' | 'schedule' | 'summary' | 'complete';

interface OnboardingWizardProps {
  onComplete: (state: OnboardingState) => void;
}

const ProgressBar: React.FC<{ percent: number }> = ({ percent }) => {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-blue-600 h-2 rounded-full progress-bar"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [state, setState] = useState<OnboardingState>(initialOnboardingState);

  const updateState = (field: string, value: unknown) => {
    setState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNext = () => {
    const stepOrder: Step[] = ['welcome', 'profile', 'goals', 'constraints', 'environment', 'schedule', 'summary'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepOrder: Step[] = ['welcome', 'profile', 'goals', 'constraints', 'environment', 'schedule', 'summary'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    await submitOnboarding(state);
    onComplete(state);
    setCurrentStep('complete');
  };

  // Step indicator
  const steps = [
    { id: 'welcome', label: 'Welcome' },
    { id: 'profile', label: 'Profile' },
    { id: 'goals', label: 'Goals' },
    { id: 'constraints', label: 'Constraints' },
    { id: 'environment', label: 'Environment' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'summary', label: 'Summary' },
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex((s) => s.id === currentStep);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress indicator */}
      {currentStep !== 'welcome' && currentStep !== 'complete' && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {getCurrentStepIndex() + 1} of {steps.length}
              </span>
              <span className="text-sm text-gray-500">{steps[getCurrentStepIndex()]?.label}</span>
            </div>
            <ProgressBar percent={((getCurrentStepIndex() + 1) / steps.length) * 100} />
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="py-8">
        {currentStep === 'welcome' && <OnboardingStepWelcome onNext={handleNext} />}

        {currentStep === 'profile' && (
          <OnboardingStepBasicProfile
            age={state.age}
            heightFeet={state.heightFeet}
            heightInches={state.heightInches}
            weightLbs={state.weightLbs}
            trainingExperience={state.trainingExperience}
            city={state.city}
            zipCode={state.zipCode}
            gender={state.gender}
            dietType={state.dietType}
            onChange={updateState}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 'goals' && (
          <OnboardingStepGoalMotivation
            primaryGoal={state.primaryGoal}
            motivationText={state.motivation.text}
            onChange={updateState}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 'constraints' && (
          <OnboardingStepConstraints
            jointIssues={state.jointIssues}
            onChange={updateState}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 'environment' && (
          <OnboardingStepEnvironment
            trainingEnvironment={state.trainingEnvironment}
            equipment={state.equipment}
            onChange={updateState}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 'schedule' && (
          <OnboardingStepSchedule
            sessionsPerWeek={state.sessionsPerWeek}
            preferredDays={state.preferredDays}
            preferredTimeOfDay={state.preferredTimeOfDay}
            onChange={updateState}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 'summary' && (
          <OnboardingStepSummary
            state={state}
            onSubmit={handleSubmit}
            onBack={handleBack}
          />
        )}

        {currentStep === 'complete' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="mb-6 text-6xl">✅</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Plan Created!</h1>
            <p className="text-lg text-gray-600 max-w-md">
              Your personalized training program is ready. We'll start with your first week.
            </p>
            <button
              onClick={() => {
                console.log('Navigate to workout view');
                alert('Workout program view coming soon! For now, you can restart the onboarding.');
                window.location.reload();
              }}
              className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              View My Program
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;
