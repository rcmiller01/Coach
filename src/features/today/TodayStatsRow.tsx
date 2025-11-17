interface TodayStatsRowProps {
  sessionsThisWeek: number;
  totalSessions: number;
  weeklyVolume?: number;
  currentStreak?: number;
}

/**
 * TodayStatsRow - Compact metrics chips showing weekly progress
 */
export function TodayStatsRow({
  sessionsThisWeek,
  totalSessions,
  weeklyVolume,
  currentStreak,
}: TodayStatsRowProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Sessions */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-white">
          {sessionsThisWeek}/{totalSessions}
        </div>
        <div className="text-xs text-slate-400 mt-1">Sessions</div>
      </div>

      {/* Volume */}
      {weeklyVolume !== undefined && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">
            {weeklyVolume > 1000 
              ? `${(weeklyVolume / 1000).toFixed(1)}k` 
              : weeklyVolume}
          </div>
          <div className="text-xs text-slate-400 mt-1">Volume (kg)</div>
        </div>
      )}

      {/* Streak */}
      {currentStreak !== undefined && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{currentStreak}</div>
          <div className="text-xs text-slate-400 mt-1">Day Streak</div>
        </div>
      )}
    </div>
  );
}
