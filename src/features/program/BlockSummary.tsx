/**
 * Block Summary Component
 * 
 * Displays aggregated metrics for a training block (mesocycle)
 * and provides next-block recommendations.
 */

import type { TrainingBlock, ProgramWeek } from './types';
import type { WorkoutHistoryEntry } from '../history/types';
import { calculateWeeklyAdherence, calculateWeeklyStress, summarizeKeyLifts } from './weeklyAdherence';
import { getNextBlockRecommendation, type BlockMetrics } from './blockRecommendations';

interface BlockSummaryProps {
  block: TrainingBlock;
  allWeeks: ProgramWeek[];
  history: WorkoutHistoryEntry[];
  onClose: () => void;
}

export function BlockSummary({ block, allWeeks, history, onClose }: BlockSummaryProps) {
  // Get weeks belonging to this block
  const blockWeeks = allWeeks.filter((_, index) => {
    if (block.endWeekIndex === null) {
      // Active block
      return index >= block.startWeekIndex;
    }
    return index >= block.startWeekIndex && index <= block.endWeekIndex;
  });

  if (blockWeeks.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Block Summary</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600">No weeks found for this block.</p>
        </div>
      </div>
    );
  }

  // Aggregate metrics across all weeks in the block
  const blockMetrics = calculateBlockMetrics(blockWeeks, history);
  const recommendation = getNextBlockRecommendation(blockMetrics);

  const firstWeekIndex = block.startWeekIndex;
  const lastWeekIndex = block.endWeekIndex ?? allWeeks.length - 1;
  const isActiveBlock = block.endWeekIndex === null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-xl p-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Block {block.startWeekIndex + 1}
              </h2>
              {isActiveBlock && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  Active
                </span>
              )}
            </div>
            <p className="text-gray-600">
              Weeks {firstWeekIndex + 1}–{lastWeekIndex + 1} · Goal:{' '}
              {formatBlockGoal(block.goal)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Adherence Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Adherence</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Session Completion</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(blockMetrics.sessionAdherence * 100)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {blockMetrics.completedSessions} of {blockMetrics.plannedSessions} sessions
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Set Completion</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(blockMetrics.setAdherence * 100)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {blockMetrics.completedSets} of {blockMetrics.plannedSets} sets
              </p>
            </div>
          </div>
        </div>

        {/* Volume & Stress Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Training Load</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Volume Trend</p>
              {blockMetrics.volumeChangePercent !== null ? (
                <>
                  <p className="text-2xl font-bold text-gray-900">
                    {blockMetrics.volumeChangePercent > 0 ? '+' : ''}
                    {blockMetrics.volumeChangePercent.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">First week → Last week</p>
                </>
              ) : (
                <p className="text-sm text-gray-500">No data</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Average RPE</p>
              {blockMetrics.avgRpe !== null ? (
                <>
                  <p className="text-2xl font-bold text-gray-900">
                    {blockMetrics.avgRpe.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Across all sets</p>
                </>
              ) : (
                <p className="text-sm text-gray-500">No data</p>
              )}
            </div>
          </div>
        </div>

        {/* Key Lifts Summary */}
        {blockMetrics.keyLifts.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Lifts</h3>
            <div className="space-y-3">
              {blockMetrics.keyLifts.map((lift) => (
                <div
                  key={lift.exerciseName}
                  className="flex items-center justify-between p-3 bg-white rounded border border-gray-200"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{lift.exerciseName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {lift.firstWeekLoad !== null
                        ? `First: ${lift.firstWeekLoad.toFixed(1)} kg`
                        : 'First: —'}{' '}
                      →{' '}
                      {lift.lastWeekLoad !== null
                        ? `Last: ${lift.lastWeekLoad.toFixed(1)} kg`
                        : 'Last: —'}
                    </p>
                  </div>
                  <div className="text-right">
                    {lift.changePercent !== null ? (
                      <span
                        className={`text-lg font-bold ${
                          lift.changePercent > 0
                            ? 'text-green-600'
                            : lift.changePercent < 0
                            ? 'text-red-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {lift.changePercent > 0 ? '+' : ''}
                        {lift.changePercent.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Block Recommendation */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            💡 {recommendation.title}
          </h3>
          <p className="text-sm text-blue-800">{recommendation.message}</p>
          <div className="mt-3">
            <span
              className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                recommendation.recommendedAction === 'advance'
                  ? 'bg-green-100 text-green-700'
                  : recommendation.recommendedAction === 'repeat'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-orange-100 text-orange-700'
              }`}
            >
              {recommendation.recommendedAction === 'advance'
                ? 'Ready to Advance'
                : recommendation.recommendedAction === 'repeat'
                ? 'Repeat Block'
                : 'Adjust Programming'}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate aggregated metrics for a training block
 */
function calculateBlockMetrics(
  blockWeeks: ProgramWeek[],
  history: WorkoutHistoryEntry[]
): BlockMetrics & {
  completedSessions: number;
  plannedSessions: number;
  completedSets: number;
  plannedSets: number;
  keyLifts: Array<{
    exerciseName: string;
    firstWeekLoad: number | null;
    lastWeekLoad: number | null;
    changePercent: number | null;
  }>;
} {
  // Aggregate adherence across all weeks
  let totalCompletedSessions = 0;
  let totalPlannedSessions = 0;
  let totalCompletedSets = 0;
  let totalPlannedSets = 0;
  let totalRpe = 0;
  let totalRpeCount = 0;

  blockWeeks.forEach((week) => {
    const adherence = calculateWeeklyAdherence(week, history);
    totalCompletedSessions += adherence.completedSessions;
    totalPlannedSessions += adherence.plannedSessions;
    totalCompletedSets += adherence.completedSets;
    totalPlannedSets += adherence.plannedSets;

    // Aggregate RPE from history for this week
    const weekStart = new Date(week.weekStartDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekHistory = history.filter((entry) => {
      const entryDate = new Date(entry.completedAt);
      return entryDate >= weekStart && entryDate < weekEnd;
    });

    weekHistory.forEach((entry) => {
      entry.exercises.forEach((ex) => {
        ex.sets.forEach((set) => {
          if (set.status === 'completed' && set.rpe !== undefined) {
            totalRpe += set.rpe;
            totalRpeCount++;
          }
        });
      });
    });
  });

  const sessionAdherence = totalPlannedSessions > 0 ? totalCompletedSessions / totalPlannedSessions : 0;
  const setAdherence = totalPlannedSets > 0 ? totalCompletedSets / totalPlannedSets : 0;
  const avgRpe = totalRpeCount > 0 ? totalRpe / totalRpeCount : null;

  // Calculate volume change from first to last week
  let volumeChangePercent: number | null = null;
  if (blockWeeks.length >= 2) {
    const firstWeek = blockWeeks[0];
    const lastWeek = blockWeeks[blockWeeks.length - 1];
    const firstStress = calculateWeeklyStress(firstWeek, null, history);
    const lastStress = calculateWeeklyStress(lastWeek, null, history);

    if (firstStress.totalVolume > 0 && lastStress.totalVolume > 0) {
      volumeChangePercent =
        ((lastStress.totalVolume - firstStress.totalVolume) / firstStress.totalVolume) * 100;
    }
  }

  // Get key lifts comparison (first week vs last week)
  let keyLifts: Array<{
    exerciseName: string;
    firstWeekLoad: number | null;
    lastWeekLoad: number | null;
    changePercent: number | null;
  }> = [];
  let liftProgressCount = 0;

  if (blockWeeks.length >= 2) {
    const firstWeek = blockWeeks[0];
    const lastWeek = blockWeeks[blockWeeks.length - 1];
    const firstWeekLifts = summarizeKeyLifts(firstWeek, null, history);
    const lastWeekLifts = summarizeKeyLifts(lastWeek, null, history);

    // Match lifts by name
    const liftMap = new Map<string, { first: number | null; last: number | null }>();

    firstWeekLifts.forEach((lift) => {
      liftMap.set(lift.exerciseName, { first: lift.thisWeekLoadKg, last: null });
    });

    lastWeekLifts.forEach((lift) => {
      const existing = liftMap.get(lift.exerciseName);
      if (existing) {
        existing.last = lift.thisWeekLoadKg;
      } else {
        liftMap.set(lift.exerciseName, { first: null, last: lift.thisWeekLoadKg });
      }
    });

    // Calculate changes
    keyLifts = Array.from(liftMap.entries())
      .map(([exerciseName, loads]) => {
        let changePercent: number | null = null;
        if (loads.first !== null && loads.last !== null && loads.first > 0) {
          changePercent = ((loads.last - loads.first) / loads.first) * 100;
          if (changePercent > 0) {
            liftProgressCount++;
          }
        }

        return {
          exerciseName,
          firstWeekLoad: loads.first,
          lastWeekLoad: loads.last,
          changePercent,
        };
      })
      .sort((a, b) => {
        // Sort by change percent descending
        if (a.changePercent === null) return 1;
        if (b.changePercent === null) return -1;
        return b.changePercent - a.changePercent;
      })
      .slice(0, 5); // Top 5
  }

  return {
    sessionAdherence,
    setAdherence,
    volumeChangePercent,
    avgRpe,
    liftProgressCount,
    totalKeyLifts: keyLifts.length,
    completedSessions: totalCompletedSessions,
    plannedSessions: totalPlannedSessions,
    completedSets: totalCompletedSets,
    plannedSets: totalPlannedSets,
    keyLifts,
  };
}

function formatBlockGoal(goal: string): string {
  const goalMap: Record<string, string> = {
    strength: 'Strength',
    hypertrophy: 'Hypertrophy',
    general: 'General Fitness',
    return_to_training: 'Return to Training',
  };
  return goalMap[goal] || goal;
}
