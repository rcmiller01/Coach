import type { ProgramDay } from '../program/types';
import type { DietTargets } from '../nutrition/dietEngine';
import type { WorkoutHistoryEntry } from '../history/types';
import { DietTodayPanel } from '../nutrition/DietTodayPanel';
import { getTodayISODate } from '../nutrition/foodLog';

interface TodayHubProps {
  todaysSession: {
    day: ProgramDay;
    weekIndex: number;
    weekPhase: 'build' | 'deload';
    blockGoal: 'strength' | 'hypertrophy' | 'general' | 'return_to_training';
  } | null;
  dietTargets: DietTargets | null;
  history?: WorkoutHistoryEntry[];
  onStartSession?: (day: ProgramDay) => void;
}

/**
 * TodayHub - Daily dashboard showing training and diet for today
 * 
 * Purpose:
 * - Quick overview of today's scheduled training session
 * - Diet tracking with targets vs. logged food
 * - Single screen for daily check-in and logging
 * 
 * Design: Two main cards - Training Today and Diet Today
 */
export function TodayHub({
  todaysSession,
  dietTargets,
  history = [],
  onStartSession,
}: TodayHubProps) {
  const todayISO = getTodayISODate();

  // Format block goal for display
  const formatBlockGoal = (goal: string): string => {
    const goalMap: Record<string, string> = {
      strength: 'Strength',
      hypertrophy: 'Hypertrophy',
      general: 'General',
      return_to_training: 'Return to Training',
    };
    return goalMap[goal] || goal;
  };

  // Check if today's session has been completed
  const isSessionCompleted = () => {
    if (!todaysSession) return false;
    
    // Find history entry for today's session
    const todayEntry = history.find(
      (entry) =>
        entry.programDayId === todaysSession.day.id &&
        entry.completedAt.startsWith(todayISO)
    );
    
    return !!todayEntry;
  };

  // Calculate session completion stats
  const getSessionStats = () => {
    if (!todaysSession) return null;
    
    const todayEntry = history.find(
      (entry) =>
        entry.programDayId === todaysSession.day.id &&
        entry.completedAt.startsWith(todayISO)
    );
    
    if (!todayEntry) return null;
    
    // Count total sets across all exercises
    const completedSets = todayEntry.exercises.reduce(
      (sum, ex) => sum + ex.sets.length,
      0
    );
    const totalSets = todaysSession.day.exercises.reduce(
      (sum, ex) => sum + ex.sets,
      0
    );
    
    // Calculate average RPE across all sets
    const allSets = todayEntry.exercises.flatMap(ex => ex.sets);
    const avgRPE = allSets.length > 0
      ? allSets.reduce((sum: number, set) => sum + (set.rpe || 0), 0) / allSets.length
      : 0;
    
    return {
      completedSets,
      totalSets,
      avgRPE: avgRPE.toFixed(1),
    };
  };

  const sessionCompleted = isSessionCompleted();
  const sessionStats = getSessionStats();

  // Format day name from focus
  const formatDayName = (focus: string): string => {
    const focusMap: Record<string, string> = {
      upper: 'Upper Body',
      lower: 'Lower Body',
      full: 'Full Body',
      conditioning: 'Conditioning',
      other: 'Training',
    };
    return focusMap[focus] || 'Training';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Today
          </h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Training Today Card */}
        <div className="mb-6">
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Training Today
            </h3>

            {todaysSession ? (
              <div>
                {/* Session info */}
                <div className="mb-3">
                  <h4 className="text-xl font-bold text-gray-800 mb-1">
                    {formatDayName(todaysSession.day.focus)}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-600">
                      Week {todaysSession.weekIndex + 1}
                    </span>
                    <span className="text-gray-400">·</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        todaysSession.weekPhase === 'deload'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {todaysSession.weekPhase === 'deload' ? 'Deload' : 'Build'}
                    </span>
                    <span className="text-gray-400">·</span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                      {formatBlockGoal(todaysSession.blockGoal)}
                    </span>
                  </div>
                </div>

                {/* Session status */}
                {sessionCompleted && sessionStats ? (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-green-700 font-medium">✓ Completed</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-green-700">
                      <span>
                        {sessionStats.completedSets} / {sessionStats.totalSets} sets
                      </span>
                      <span className="text-green-400">·</span>
                      <span>avg RPE {sessionStats.avgRPE}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-sm text-blue-700">Not started yet</span>
                  </div>
                )}

                {/* Exercise preview */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Exercises ({todaysSession.day.exercises.length})
                  </h5>
                  <ul className="space-y-1">
                    {todaysSession.day.exercises.slice(0, 4).map((ex) => (
                      <li key={ex.id} className="text-sm text-gray-600">
                        {ex.sets} × {ex.reps} {ex.name}
                      </li>
                    ))}
                    {todaysSession.day.exercises.length > 4 && (
                      <li className="text-sm text-gray-500 italic">
                        +{todaysSession.day.exercises.length - 4} more...
                      </li>
                    )}
                  </ul>
                </div>

                {/* Start session button */}
                {!sessionCompleted && onStartSession && (
                  <button
                    onClick={() => onStartSession(todaysSession.day)}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Start Session
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-2">No training scheduled for today</p>
                <p className="text-sm text-gray-400">Rest day or off-schedule day</p>
              </div>
            )}
          </div>
        </div>

        {/* Diet Today Card */}
        {dietTargets && (
          <div className="mb-6">
            <DietTodayPanel dietTargets={dietTargets} date={todayISO} />
          </div>
        )}
      </div>
    </div>
  );
}
