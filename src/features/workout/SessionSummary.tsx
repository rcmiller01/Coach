import React from 'react';
import type { WorkoutSessionState } from './types';
import type { ProgramDay } from '../program/types';

interface SessionSummaryProps {
  session: WorkoutSessionState;
  programDay: ProgramDay;
  onFinish: () => void;
}

/**
 * SessionSummary - Post-workout completion screen
 * 
 * Purpose:
 * - Summarize workout performance
 * - Show per-exercise stats
 * - Provide simple coach feedback
 * - Return to main view
 */
const SessionSummary: React.FC<SessionSummaryProps> = ({
  session,
  programDay,
  onFinish,
}) => {
  // Calculate overall stats
  const completedSets = session.sets.filter(s => s.status === 'completed');
  const skippedSets = session.sets.filter(s => s.status === 'skipped');
  const totalSets = session.sets.length;
  
  const setsWithRpe = completedSets.filter(s => s.rpe);
  const avgRpe = setsWithRpe.length > 0
    ? setsWithRpe.reduce((sum, s) => sum + (s.rpe || 0), 0) / setsWithRpe.length
    : null;

  const totalVolume = completedSets.reduce((sum, s) => {
    const reps = s.performedReps || 0;
    const load = s.performedLoadKg || 0;
    return sum + (reps * load);
  }, 0);

  // Per-exercise summary
  const exerciseSummaries = programDay.exercises.map(exercise => {
    const exerciseSets = completedSets.filter(s => s.exerciseId === exercise.id);
    const exerciseVolume = exerciseSets.reduce((sum, s) => {
      const reps = s.performedReps || 0;
      const load = s.performedLoadKg || 0;
      return sum + (reps * load);
    }, 0);

    const avgLoad = exerciseSets.length > 0
      ? exerciseSets.reduce((sum, s) => sum + (s.performedLoadKg || 0), 0) / exerciseSets.length
      : 0;

    const totalReps = exerciseSets.reduce((sum, s) => sum + (s.performedReps || 0), 0);

    return {
      name: exercise.name,
      setsCompleted: exerciseSets.length,
      targetSets: exercise.sets,
      totalReps,
      avgLoad: Math.round(avgLoad * 10) / 10,
      volume: Math.round(exerciseVolume),
    };
  });

  // Simple coach feedback based on thresholds
  const getCoachFeedback = (): string[] => {
    const feedback: string[] = [];

    const completionRate = (completedSets.length / totalSets) * 100;
    
    if (completionRate === 100) {
      feedback.push("💪 Perfect! You completed every set.");
    } else if (completionRate >= 90) {
      feedback.push("✅ Great work! You hit nearly all your sets.");
    } else if (completionRate >= 75) {
      feedback.push("👍 Solid session. You completed most of your planned work.");
    } else if (completionRate >= 50) {
      feedback.push("⚠️ Moderate completion. Consider whether the loads or volume were too high.");
    } else {
      feedback.push("⚠️ Low completion rate. Next time, try reducing loads or taking longer rest.");
    }

    if (avgRpe !== null) {
      if (avgRpe >= 9) {
        feedback.push("🔥 High intensity session (RPE 9+). Make sure you're recovering well.");
      } else if (avgRpe >= 7 && avgRpe < 9) {
        feedback.push("💯 Good intensity (RPE 7-9). Right in the sweet spot for growth.");
      } else if (avgRpe < 6) {
        feedback.push("💡 Lower intensity today (RPE <6). Good for recovery or technique work.");
      }
    }

    if (skippedSets.length > 0) {
      feedback.push(`ℹ️ ${skippedSets.length} set(s) skipped. That's okay—listen to your body.`);
    }

    return feedback;
  };

  const coachFeedback = getCoachFeedback();

  // Format duration
  const getDuration = (): string => {
    if (!session.startedAt || !session.endedAt) return 'N/A';
    const start = new Date(session.startedAt);
    const end = new Date(session.endedAt);
    const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
    return `${durationMin} min`;
  };

  return (
    <div className="max-w-2xl mx-auto p-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Workout Complete!</h1>
        <p className="text-gray-600">Great job finishing your session</p>
      </div>

      {/* Overall Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Session Stats</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedSets.length}</div>
            <div className="text-xs text-gray-600">Sets Completed</div>
          </div>
          
          {avgRpe && (
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{avgRpe.toFixed(1)}</div>
              <div className="text-xs text-gray-600">Avg RPE</div>
            </div>
          )}
          
          {totalVolume > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{totalVolume.toLocaleString()}</div>
              <div className="text-xs text-gray-600">Total Volume (kg)</div>
            </div>
          )}
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{getDuration()}</div>
            <div className="text-xs text-gray-600">Duration</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Completion Rate</span>
            <span>{Math.round((completedSets.length / totalSets) * 100)}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${(completedSets.length / totalSets) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Coach Feedback */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Coach Feedback</h3>
        <div className="space-y-1">
          {coachFeedback.map((line, idx) => (
            <p key={idx} className="text-sm text-blue-800">{line}</p>
          ))}
        </div>
      </div>

      {/* Per-Exercise Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Exercise Breakdown</h2>
        
        <div className="space-y-3">
          {exerciseSummaries.map((ex, idx) => (
            <div key={idx} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
              <div className="font-medium text-gray-900 mb-1">{ex.name}</div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{ex.setsCompleted}/{ex.targetSets} sets</span>
                {ex.totalReps > 0 && <span>· {ex.totalReps} total reps</span>}
                {ex.avgLoad > 0 && <span>· {ex.avgLoad} kg avg</span>}
                {ex.volume > 0 && <span>· {ex.volume} kg volume</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onFinish}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg transition-colors text-lg"
      >
        Back to Program
      </button>
    </div>
  );
};

export default SessionSummary;
