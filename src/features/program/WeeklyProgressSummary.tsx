/**
 * Weekly Progress Summary
 * 
 * Displays week-over-week progression for each exercise,
 * showing load changes with visual indicators (↑ ↓ →).
 * 
 * Uses ACTUAL PERFORMED LOADS from workout history,
 * not suggestions. This ensures honest, retroactive-proof
 * progress tracking based on what was actually lifted.
 * 
 * Tolerance bands:
 * - < -3%: Decrease (↓)
 * - -3% to +3%: Maintain (→)
 * - > +3%: Increase (↑)
 * 
 * Bodyweight exercises (no load data) are shown separately.
 */

import React from 'react';
import type { ActualExerciseLoad } from '../progression/actualLoads';

interface ProgressChange {
  exerciseName: string;
  prevLoadKg: number | null;
  currentLoadKg: number | null;
  changePercent: number;
  changeType: 'increase' | 'decrease' | 'maintain' | 'new' | 'no_data' | 'bodyweight';
  isBodyweight: boolean;
  setCount?: number; // For bodyweight exercises, track completed sets
}

interface WeeklyProgressSummaryProps {
  currentWeekIndex: number;
  currentWeekActualLoads: ActualExerciseLoad[];
  previousWeekActualLoads: ActualExerciseLoad[];
  currentWeekPhase?: 'build' | 'deload'; // Current week's training phase
}

const WeeklyProgressSummary: React.FC<WeeklyProgressSummaryProps> = ({
  currentWeekIndex,
  currentWeekActualLoads,
  previousWeekActualLoads,
  currentWeekPhase = 'build',
}) => {
  // If this is Week 1, show a welcome message
  if (currentWeekIndex === 0) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🚀 Week 1 — Getting Started
        </h3>
        <p className="text-sm text-gray-700">
          This is your first week. Focus on learning the movements and finding appropriate starting loads.
          Your progress tracking will begin next week!
        </p>
      </div>
    );
  }

  // Compute changes for each exercise based on ACTUAL performed loads
  const changes: ProgressChange[] = currentWeekActualLoads
    .map((current) => {
      const prev = previousWeekActualLoads.find((p) => p.exerciseId === current.exerciseId);

      // Detect bodyweight exercises (no load in either week, but sets were completed)
      const isBodyweight = !current.averageLoadKg && current.setCount > 0;

      // If no previous week data, mark as new
      if (!prev) {
        return {
          exerciseName: current.exerciseName,
          prevLoadKg: null,
          currentLoadKg: current.averageLoadKg,
          changePercent: 0,
          changeType: isBodyweight ? ('bodyweight' as const) : ('new' as const),
          isBodyweight,
          setCount: isBodyweight ? current.setCount : undefined,
        };
      }

      const prevLoad = prev.averageLoadKg;
      const currentLoad = current.averageLoadKg;

      // Handle cases where exercise wasn't performed
      if (!prevLoad && !currentLoad) {
        // Check if either week had sets completed (bodyweight case)
        const hadSets = prev.setCount > 0 || current.setCount > 0;
        if (hadSets) {
          return {
            exerciseName: current.exerciseName,
            prevLoadKg: null,
            currentLoadKg: null,
            changePercent: 0,
            changeType: 'bodyweight' as const,
            isBodyweight: true,
            setCount: current.setCount,
          };
        }
        // No sets at all - skip
        return {
          exerciseName: current.exerciseName,
          prevLoadKg: null,
          currentLoadKg: null,
          changePercent: 0,
          changeType: 'no_data' as const,
          isBodyweight: false,
        };
      }

      // If current week has no data but previous did
      if (!currentLoad) {
        // Check if current week had sets (bodyweight)
        if (current.setCount > 0) {
          return {
            exerciseName: current.exerciseName,
            prevLoadKg: prevLoad,
            currentLoadKg: null,
            changePercent: 0,
            changeType: 'bodyweight' as const,
            isBodyweight: true,
            setCount: current.setCount,
          };
        }
        return {
          exerciseName: current.exerciseName,
          prevLoadKg: prevLoad,
          currentLoadKg: null,
          changePercent: 0,
          changeType: 'no_data' as const,
          isBodyweight: false,
        };
      }

      // If previous week has no data but current does
      if (!prevLoad) {
        return {
          exerciseName: current.exerciseName,
          prevLoadKg: null,
          currentLoadKg: currentLoad,
          changePercent: 0,
          changeType: 'new' as const,
          isBodyweight: false,
        };
      }

      // Both weeks have data - calculate change
      const changePercent = ((currentLoad - prevLoad) / prevLoad) * 100;

      // Apply tolerance bands: -3% to +3% is "maintain"
      let changeType: ProgressChange['changeType'];
      if (changePercent > 3) {
        changeType = 'increase';
      } else if (changePercent < -3) {
        changeType = 'decrease';
      } else {
        changeType = 'maintain';
      }

      return {
        exerciseName: current.exerciseName,
        prevLoadKg: prevLoad,
        currentLoadKg: currentLoad,
        changePercent,
        changeType,
        isBodyweight: false,
      };
    })
    .filter((change) => change.changeType !== 'no_data'); // Don't show exercises with no data

  // Count changes by type (exclude bodyweight from main counts)
  const loadedExercises = changes.filter((c) => !c.isBodyweight);
  const bodyweightExercises = changes.filter((c) => c.isBodyweight);
  
  const counts = {
    increase: loadedExercises.filter((c) => c.changeType === 'increase').length,
    maintain: loadedExercises.filter((c) => c.changeType === 'maintain').length,
    decrease: loadedExercises.filter((c) => c.changeType === 'decrease').length,
  };

  // Helper to get arrow and color
  const getIndicator = (type: ProgressChange['changeType']) => {
    switch (type) {
      case 'increase':
        return { arrow: '↑', color: 'text-green-600', bg: 'bg-green-50' };
      case 'decrease':
        return { arrow: '↓', color: 'text-orange-600', bg: 'bg-orange-50' };
      case 'maintain':
        return { arrow: '→', color: 'text-blue-600', bg: 'bg-blue-50' };
      default:
        return { arrow: '✓', color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        📈 Weekly Progress — Week {currentWeekIndex + 1} vs Week {currentWeekIndex}
      </h3>

      {/* Deload week message */}
      {currentWeekPhase === 'deload' && (
        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-purple-800">
            <span className="font-semibold">Deload Week:</span> Reduced loads are intentional to allow recovery before the next build phase. Focus on quality movement and let your body adapt.
          </p>
        </div>
      )}

      {/* Summary counts */}
      <div className="flex gap-4 mb-4 text-sm">
        {counts.increase > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-green-600 font-bold">↑</span>
            <span className="text-gray-700">
              {counts.increase} {counts.increase === 1 ? 'exercise' : 'exercises'} progressing
            </span>
          </div>
        )}
        {counts.maintain > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-blue-600 font-bold">→</span>
            <span className="text-gray-700">
              {counts.maintain} maintaining
            </span>
          </div>
        )}
        {counts.decrease > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-orange-600 font-bold">↓</span>
            <span className="text-gray-700">
              {counts.decrease} adjusting
            </span>
          </div>
        )}
      </div>

      {/* Individual exercise changes (loaded exercises only) */}
      <div className="space-y-2">
        {changes.map((change) => {
          const indicator = getIndicator(change.changeType);
          const prevLbs = change.prevLoadKg ? Math.round(change.prevLoadKg * 2.20462) : null;
          const currentLbs = change.currentLoadKg ? Math.round(change.currentLoadKg * 2.20462) : null;

          return (
            <div
              key={change.exerciseName}
              className={`flex items-center justify-between px-3 py-2 ${indicator.bg} rounded`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${indicator.color}`}>
                  {indicator.arrow}
                </span>
                <span className="font-medium text-gray-900 text-sm">
                  {change.exerciseName}
                </span>
              </div>
              <div className="text-sm text-gray-700">
                {prevLbs && currentLbs ? (
                  <>
                    {prevLbs} lbs → <span className="font-semibold">{currentLbs} lbs</span>
                    {change.changeType !== 'maintain' && (
                      <span className={`ml-2 ${indicator.color} font-medium`}>
                        ({change.changePercent > 0 ? '+' : ''}
                        {change.changePercent.toFixed(0)}%)
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-gray-500 italic">New exercise</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bodyweight exercises (separate section, no load progression) */}
      {bodyweightExercises.length > 0 && (
        <div className="mt-4 pt-4 border-t border-green-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Bodyweight Exercises</h4>
          <div className="space-y-1">
            {bodyweightExercises.map((ex) => (
              <div
                key={ex.exerciseName}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded text-sm"
              >
                <span className="font-medium text-gray-900">{ex.exerciseName}</span>
                <span className="text-gray-600">
                  {ex.setCount} {ex.setCount === 1 ? 'set' : 'sets'} completed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {changes.length === 0 && bodyweightExercises.length === 0 && (
        <p className="text-sm text-gray-600 italic">
          No progression data available yet. Complete some workouts to see your progress!
        </p>
      )}
    </div>
  );
};

export default WeeklyProgressSummary;
