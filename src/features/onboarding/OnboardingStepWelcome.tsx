import React from 'react';

interface OnboardingStepWelcomeProps {
  onNext: () => void;
}

const OnboardingStepWelcome: React.FC<OnboardingStepWelcomeProps> = ({ onNext }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
        Welcome to AI Workout Coach
      </h1>
      <p className="text-lg md:text-xl text-gray-600 mb-4 max-w-2xl">
        Get a personalized strength training program tailored to your goals, experience, and equipment.
      </p>
      <p className="text-base text-gray-500 mb-8">
        This will take about 60 seconds.
      </p>
      <button
        onClick={onNext}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors"
      >
        Let's start
      </button>
    </div>
  );
};

export default OnboardingStepWelcome;
