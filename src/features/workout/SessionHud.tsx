import React from 'react';
import type { BlockGoal } from '../program/types';

interface SessionHudProps {
  currentExerciseIndex: number;
  totalExercises: number;
  currentExerciseName: string;
  completedSets: number;
  totalSets: number;
  blockGoal?: BlockGoal;
  trainingPhase?: 'build' | 'deload';
  weekNumber?: number;
  nextExerciseName?: string;
}

/**
 * SessionHud - Compact status bar showing workout progress
 * 
 * Purpose:
 * - Show current position in workout (exercise X of Y)
 * - Display overall progress (sets completed)
 * - Provide context (block goal, week number)
 * - Preview next exercise
 */
const SessionHud: React.FC<SessionHudProps> = ({
  currentExerciseIndex,
  totalExercises,
  currentExerciseName,
  completedSets,
  totalSets,
  blockGoal,
  trainingPhase,
  weekNumber,
  nextExerciseName,
}) => {
  const progressPercent = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  const formatBlockGoal = (goal: BlockGoal): string => {
    const goalMap: Record<BlockGoal, string> = {
      strength: 'Strength',
      hypertrophy: 'Hypertrophy',
      general: 'General',
      return_to_training: 'RTT',
    };
    return goalMap[goal];
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4 mb-6 shadow-lg">
      {/* Top row: Context badges */}
      <div className="flex items-center gap-2 mb-3">
        {weekNumber && (
          <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">
            Week {weekNumber}
          </span>
        )}
        {trainingPhase && (
          <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">
            {trainingPhase === 'deload' ? 'Deload' : 'Build'}
          </span>
        )}
        {blockGoal && (
          <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">
            {formatBlockGoal(blockGoal)}
          </span>
        )}
      </div>

      {/* Main status */}
      <div className="mb-3">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-2xl font-bold">
            Exercise {currentExerciseIndex + 1}/{totalExercises}
          </span>
          <span className="text-sm text-white/80">
            · {completedSets}/{totalSets} sets
          </span>
        </div>
        <div className="text-sm font-medium text-white/90">
          {currentExerciseName}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-xs text-white/80 mt-1">
          {Math.round(progressPercent)}% complete
        </div>
      </div>

      {/* Next up */}
      {nextExerciseName && (
        <div className="text-xs text-white/70 pt-2 border-t border-white/20">
          Next: <span className="text-white/90 font-medium">{nextExerciseName}</span>
        </div>
      )}
    </div>
  );
};

export default SessionHud;
