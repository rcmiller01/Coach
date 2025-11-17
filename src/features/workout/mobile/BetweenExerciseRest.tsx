import React from 'react';

interface BetweenExerciseRestProps {
  restTimeRemaining: number;
  nextExerciseName: string;
  nextExerciseSets: number;
  nextExerciseReps: number;
  onSkipRest: () => void;
}

/**
 * BetweenExerciseRest - Full-screen overlay during rest between exercises
 * Large countdown, clear next exercise preview, prominent CTA
 */
const BetweenExerciseRest: React.FC<BetweenExerciseRestProps> = ({
  restTimeRemaining,
  nextExerciseName,
  nextExerciseSets,
  nextExerciseReps,
  onSkipRest,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Celebration */}
        <div className="text-6xl mb-4">🎉</div>
        
        <h2 className="text-2xl font-bold text-white">Exercise Complete!</h2>
        <p className="text-slate-400">Take a quick breather</p>

        {/* Countdown timer */}
        <div className="bg-slate-900 border-2 border-blue-500 rounded-2xl p-8">
          <div className="text-7xl font-bold text-blue-400 mb-2">
            {restTimeRemaining}s
          </div>
          <div className="text-sm text-slate-400">rest remaining</div>
        </div>

        {/* Next exercise preview */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">
            Up Next
          </div>
          <div className="text-lg font-semibold text-white mb-1">
            {nextExerciseName}
          </div>
          <div className="text-sm text-slate-400">
            {nextExerciseSets} sets × {nextExerciseReps} reps
          </div>
        </div>

        {/* Skip button */}
        <button
          onClick={onSkipRest}
          className="w-full py-4 bg-blue-600 active:bg-blue-700 text-white font-semibold rounded-lg text-lg transition-colors"
        >
          Start Next Exercise
        </button>

        <p className="text-xs text-slate-500">
          Or wait for the timer to finish
        </p>
      </div>
    </div>
  );
};

export default BetweenExerciseRest;
