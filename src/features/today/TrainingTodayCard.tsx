interface TrainingTodayCardProps {
  sessionName: string;
  weekNumber: number;
  phase: 'build' | 'deload';
  goal: string;
  status: 'not_started' | 'completed';
  completedSets?: number;
  totalSets?: number;
  avgRPE?: string;
  onStartSession: () => void;
  isRestDay?: boolean;
}

/**
 * TrainingTodayCard - Compact mobile-first training summary for today
 */
export function TrainingTodayCard({
  sessionName,
  weekNumber,
  phase,
  goal,
  status,
  completedSets,
  totalSets,
  avgRPE,
  onStartSession,
  isRestDay,
}: TrainingTodayCardProps) {
  const formatBlockGoal = (g: string): string => {
    const goalMap: Record<string, string> = {
      strength: 'Strength',
      hypertrophy: 'Hypertrophy',
      general: 'General',
      return_to_training: 'RTT',
    };
    return goalMap[g] || g;
  };

  if (isRestDay) {
    return (
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
        <div className="text-center py-6">
          <div className="text-4xl mb-2">😴</div>
          <h3 className="text-lg font-semibold text-white mb-1">Rest Day</h3>
          <p className="text-sm text-slate-400">No training scheduled today</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h3 className="text-xl font-bold text-white mb-2">{sessionName}</h3>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Week {weekNumber}</span>
          <span>•</span>
          <span>{phase === 'deload' ? 'Deload' : 'Build'}</span>
          <span>•</span>
          <span>{formatBlockGoal(goal)}</span>
        </div>
      </div>

      {/* Status */}
      <div className="p-4">
        {status === 'completed' && completedSets && totalSets ? (
          <div className="bg-green-950 border border-green-800 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-400 font-medium">✓ Completed</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-300">
              <span>{completedSets} / {totalSets} sets</span>
              {avgRPE && (
                <>
                  <span>•</span>
                  <span>RPE {avgRPE}</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="bg-blue-950 border border-blue-800 rounded-lg p-3 mb-4">
              <span className="text-sm text-blue-300">Not started</span>
            </div>

            {/* Start button */}
            <button
              onClick={onStartSession}
              className="w-full py-4 bg-blue-600 active:bg-blue-700 text-white font-semibold rounded-lg text-lg transition-colors"
            >
              Start Workout
            </button>
          </>
        )}
      </div>
    </div>
  );
}
