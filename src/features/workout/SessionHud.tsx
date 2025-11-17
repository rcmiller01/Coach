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
  sessionName?: string;
  onBack?: () => void;
}

/**
 * SessionHud - Mobile-first compact status bar
 * Shows session context and progress at a glance
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
  sessionName,
  onBack,
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
    <div className="bg-slate-900 rounded-lg border border-slate-800">
      {/* Header row */}
      <div className="p-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="text-slate-400 active:text-slate-300 -ml-1"
              aria-label="Go back"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <div className="text-sm font-semibold text-white">
              {sessionName || 'Workout Session'}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {weekNumber && <span>Week {weekNumber}</span>}
              {trainingPhase && (
                <>
                  {weekNumber && <span>•</span>}
                  <span>{trainingPhase === 'deload' ? 'Deload' : 'Build'}</span>
                </>
              )}
              {blockGoal && (
                <>
                  {(weekNumber || trainingPhase) && <span>•</span>}
                  <span>{formatBlockGoal(blockGoal)}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm font-bold text-white">
            {currentExerciseIndex + 1}/{totalExercises}
          </div>
          <div className="text-xs text-slate-400">exercises</div>
        </div>
      </div>

      {/* Progress section */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-white truncate flex-1 pr-2">
            {currentExerciseName}
          </div>
          <div className="text-xs text-slate-400 whitespace-nowrap">
            {completedSets}/{totalSets} sets
          </div>
        </div>
        
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SessionHud;
