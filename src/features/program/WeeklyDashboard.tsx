/**
 * Weekly Dashboard
 * 
 * Displays a bird's-eye view of the current week's training:
 * - Adherence (sessions and sets completed)
 * - Weekly stress indicators (volume change, avg RPE)
 * - Key lifts summary
 */

import React from 'react';
import type { ProgramWeek } from './types';
import type { WorkoutHistoryEntry } from '../history/types';
import {
  calculateWeeklyAdherence,
  calculateWeeklyStress,
  summarizeKeyLifts,
} from './weeklyAdherence';

interface WeeklyDashboardProps {
  currentWeek: ProgramWeek;
  currentWeekIndex: number;
  previousWeek: ProgramWeek | null;
  history: WorkoutHistoryEntry[];
}

const WeeklyDashboard: React.FC<WeeklyDashboardProps> = ({
  currentWeek,
  currentWeekIndex,
  previousWeek,
  history,
}) => {
  // Calculate adherence metrics
  const adherence = calculateWeeklyAdherence(currentWeek, history);
  
  // Calculate stress metrics
  const stress = calculateWeeklyStress(currentWeek, previousWeek, history);
  
  // Get key lifts summary
  const keyLifts = summarizeKeyLifts(currentWeek, previousWeek, history, 5);

  // If no training data yet this week, show a friendly message
  if (adherence.completedSessions === 0 && adherence.completedSets === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          📊 Week {currentWeekIndex + 1} Overview
        </h3>
        <p className="text-sm text-gray-600">
          No training recorded yet this week. Your first completed session will appear here.
        </p>
      </div>
    );
  }

  // Helper to format adherence label color
  const getAdherenceColor = (label: typeof adherence.adherenceLabel) => {
    switch (label) {
      case 'On track':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'Good, but room for improvement':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Under target this week':
        return 'text-orange-700 bg-orange-50 border-orange-200';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        📊 Week {currentWeekIndex + 1} Overview
      </h3>

      {/* Adherence Summary */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm mb-2">
          <span className="font-medium text-gray-700">Adherence:</span>
          <span className="text-gray-600">
            Sessions: {adherence.completedSessions} / {adherence.plannedSessions} completed
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">
            Sets: {adherence.completedSets} / {adherence.plannedSets} completed
          </span>
        </div>
        <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getAdherenceColor(adherence.adherenceLabel)}`}>
          {adherence.adherenceLabel}
        </div>
      </div>

      {/* Stress Summary */}
      {stress.stressLabel && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Weekly Stress:</span> {stress.stressLabel}
          </p>
        </div>
      )}

      {/* Key Lifts Summary */}
      {keyLifts.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Lifts This Week</h4>
          <div className="space-y-1">
            {keyLifts.map((lift) => {
              const lastWeekLbs = lift.lastWeekLoadKg ? Math.round(lift.lastWeekLoadKg * 2.20462) : null;
              const thisWeekLbs = lift.thisWeekLoadKg ? Math.round(lift.thisWeekLoadKg * 2.20462) : null;

              return (
                <div key={lift.exerciseName} className="text-sm text-gray-700 flex items-center gap-2">
                  <span className="font-medium text-gray-900 min-w-[120px]">{lift.exerciseName}:</span>
                  
                  {lastWeekLbs && thisWeekLbs ? (
                    <>
                      <span className="text-gray-600">
                        {lastWeekLbs} → {thisWeekLbs} lbs
                      </span>
                      {lift.changePercent !== null && (
                        <span className={`font-medium ${
                          lift.changePercent > 3 ? 'text-green-600' :
                          lift.changePercent < -3 ? 'text-orange-600' :
                          'text-blue-600'
                        }`}>
                          ({lift.changePercent > 0 ? '+' : ''}{lift.changePercent.toFixed(1)}%)
                        </span>
                      )}
                    </>
                  ) : thisWeekLbs ? (
                    <span className="text-gray-600">{thisWeekLbs} lbs</span>
                  ) : (
                    <span className="text-gray-500 italic">No load data</span>
                  )}
                  
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{lift.totalSets} sets</span>
                  
                  {lift.avgRpe !== null && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">avg RPE {lift.avgRpe.toFixed(1)}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyDashboard;
