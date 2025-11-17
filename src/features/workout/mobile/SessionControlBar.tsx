interface SessionControlBarProps {
  currentSet: {
    exerciseName: string;
    setNumber: number;
    totalSets: number;
  } | null;
  onMarkComplete: () => void;
  onSkip: () => void;
  isDisabled?: boolean;
}

/**
 * SessionControlBar - Sticky bottom bar for primary workout actions
 */
export function SessionControlBar({
  currentSet,
  onMarkComplete,
  onSkip,
  isDisabled,
}: SessionControlBarProps) {
  if (!currentSet) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 bg-slate-900 border-t border-slate-800 p-3 safe-area-bottom z-30">
      <div className="max-w-md mx-auto">
        {/* Current set info */}
        <div className="text-center mb-2">
          <div className="text-xs text-slate-400">
            {currentSet.exerciseName}
          </div>
          <div className="text-sm font-medium text-white">
            Set {currentSet.setNumber} of {currentSet.totalSets}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onSkip}
            disabled={isDisabled}
            className="flex-1 py-3 bg-slate-800 active:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Skip
          </button>
          <button
            onClick={onMarkComplete}
            disabled={isDisabled}
            className="flex-[2] py-3 bg-green-600 active:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            Mark Complete
          </button>
        </div>
      </div>
    </div>
  );
}
