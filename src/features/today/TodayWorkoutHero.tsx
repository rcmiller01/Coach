interface TodayWorkoutHeroProps {
  sessionName: string;
  weekNumber: number;
  phase: 'build' | 'deload';
  goal: string;
  status: 'not_started' | 'completed';
  completedSets?: number;
  totalSets?: number;
  onStartSession: () => void;
  isRestDay?: boolean;
}

/**
 * TodayWorkoutHero - Large prominent hero card for today's workout
 */
export function TodayWorkoutHero({
  sessionName,
  weekNumber,
  phase,
  goal,
  status,
  completedSets,
  totalSets,
  onStartSession,
  isRestDay,
}: TodayWorkoutHeroProps) {
  if (isRestDay) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-8 text-center">
        <div className="text-6xl mb-4">😴</div>
        <h2 className="text-2xl font-bold text-white mb-2">Rest Day</h2>
        <p className="text-slate-400">Recovery is part of the process</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 shadow-lg">
      {/* Badge row */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-medium bg-white/20 text-white px-2 py-1 rounded">
          Week {weekNumber}
        </span>
        <span className="text-xs font-medium bg-white/20 text-white px-2 py-1 rounded">
          {phase === 'deload' ? 'Deload' : 'Build'}
        </span>
        <span className="text-xs font-medium bg-white/20 text-white px-2 py-1 rounded">
          {goal}
        </span>
      </div>

      {/* Session name */}
      <h2 className="text-3xl font-bold text-white mb-6">{sessionName}</h2>

      {/* Status or Action */}
      {status === 'completed' && completedSets && totalSets ? (
        <div className="bg-white/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-white">
            <span className="text-2xl">✓</span>
            <div>
              <div className="font-semibold">Completed</div>
              <div className="text-sm text-white/80">
                {completedSets}/{totalSets} sets
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={onStartSession}
          className="w-full py-4 bg-white text-blue-600 font-bold rounded-lg text-lg active:bg-gray-100 transition-colors shadow-lg"
        >
          Start Workout →
        </button>
      )}
    </div>
  );
}
