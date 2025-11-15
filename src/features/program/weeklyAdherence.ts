/**
 * Weekly Adherence Calculations
 * 
 * Computes adherence metrics for a training week:
 * - Session completion rate
 * - Set completion rate
 * - Weekly stress indicators (volume, RPE)
 * - Key lift summaries
 */

import type { ProgramWeek } from './types';
import type { WorkoutHistoryEntry } from '../history/types';
import { getActualLoadsForWeek } from '../progression/actualLoads';

export interface WeeklyAdherenceMetrics {
  // Session adherence
  plannedSessions: number;
  completedSessions: number;
  sessionAdherence: number; // 0-1
  
  // Set adherence
  plannedSets: number;
  completedSets: number;
  setAdherence: number; // 0-1
  
  // Adherence label
  adherenceLabel: 'On track' | 'Good, but room for improvement' | 'Under target this week';
}

export interface WeeklyStressMetrics {
  avgRpe: number | null;
  totalVolume: number;
  volumeChangePercent: number | null; // null if no previous week
  stressLabel: string; // Human-readable summary
}

export interface KeyLiftSummary {
  exerciseName: string;
  lastWeekLoadKg: number | null;
  thisWeekLoadKg: number | null;
  changePercent: number | null;
  totalSets: number;
  avgRpe: number | null;
}

/**
 * Calculate adherence metrics for a training week
 */
export function calculateWeeklyAdherence(
  week: ProgramWeek,
  history: WorkoutHistoryEntry[]
): WeeklyAdherenceMetrics {
  // Get the week's date range
  const weekStart = new Date(week.weekStartDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Planned sessions = number of training days
  const plannedSessions = week.days.length;

  // Completed sessions = unique days with at least one completed set in history
  const weekHistory = history.filter((entry) => {
    const entryDate = new Date(entry.completedAt);
    return entryDate >= weekStart && entryDate < weekEnd;
  });
  const completedSessions = weekHistory.length;

  // Planned sets = total sets across all exercises for all days
  const plannedSets = week.days.reduce((sum, day) => {
    return sum + day.exercises.reduce((exSum, ex) => exSum + ex.sets, 0);
  }, 0);

  // Completed sets = count of completed sets in history for this week
  const completedSets = weekHistory.reduce((sum, entry) => {
    return sum + entry.exercises.reduce((exSum, ex) => {
      return exSum + ex.sets.filter((s) => s.status === 'completed').length;
    }, 0);
  }, 0);

  // Calculate adherence percentages
  const sessionAdherence = plannedSessions > 0 ? completedSessions / plannedSessions : 0;
  const setAdherence = plannedSets > 0 ? completedSets / plannedSets : 0;

  // Overall adherence (average of session and set adherence)
  const overallAdherence = (sessionAdherence + setAdherence) / 2;

  // Adherence label
  let adherenceLabel: WeeklyAdherenceMetrics['adherenceLabel'];
  if (overallAdherence >= 0.9) {
    adherenceLabel = 'On track';
  } else if (overallAdherence >= 0.7) {
    adherenceLabel = 'Good, but room for improvement';
  } else {
    adherenceLabel = 'Under target this week';
  }

  return {
    plannedSessions,
    completedSessions,
    sessionAdherence,
    plannedSets,
    completedSets,
    setAdherence,
    adherenceLabel,
  };
}

/**
 * Calculate weekly stress metrics
 */
export function calculateWeeklyStress(
  currentWeek: ProgramWeek,
  previousWeek: ProgramWeek | null,
  history: WorkoutHistoryEntry[]
): WeeklyStressMetrics {
  // Get actual loads for current and previous weeks
  const currentLoads = getActualLoadsForWeek(history, currentWeek);
  const previousLoads = previousWeek ? getActualLoadsForWeek(history, previousWeek) : [];

  // Calculate total volume for current week
  const totalVolume = currentLoads.reduce((sum, ex) => sum + ex.totalVolume, 0);

  // Calculate volume change vs previous week
  const previousVolume = previousLoads.reduce((sum, ex) => sum + ex.totalVolume, 0);
  const volumeChangePercent = previousVolume > 0 
    ? ((totalVolume - previousVolume) / previousVolume) * 100 
    : null;

  // Calculate average RPE from all completed sets in current week
  const weekStart = new Date(currentWeek.weekStartDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const weekHistory = history.filter((entry) => {
    const entryDate = new Date(entry.completedAt);
    return entryDate >= weekStart && entryDate < weekEnd;
  });

  const allSets = weekHistory.flatMap((entry) =>
    entry.exercises.flatMap((ex) => ex.sets)
  );

  const setsWithRpe = allSets.filter((s) => s.status === 'completed' && s.rpe !== undefined);
  const avgRpe = setsWithRpe.length > 0
    ? setsWithRpe.reduce((sum, s) => sum + (s.rpe || 0), 0) / setsWithRpe.length
    : null;

  // Generate stress label
  let stressLabel = '';
  
  if (totalVolume === 0) {
    stressLabel = 'No training data yet this week';
  } else if (volumeChangePercent !== null) {
    const volumeText = volumeChangePercent > 0 
      ? `+${volumeChangePercent.toFixed(1)}%` 
      : `${volumeChangePercent.toFixed(1)}%`;
    
    if (avgRpe !== null) {
      if (avgRpe >= 8.5 && volumeChangePercent > 0) {
        stressLabel = `Volume ${volumeText} vs last week · Avg RPE ${avgRpe.toFixed(1)} (high stress — deload may be close)`;
      } else if (avgRpe >= 7 && avgRpe < 8.5) {
        stressLabel = `Volume ${volumeText} vs last week · Avg RPE ${avgRpe.toFixed(1)} (good training stress)`;
      } else if (avgRpe < 7) {
        stressLabel = `Volume ${volumeText} vs last week · Avg RPE ${avgRpe.toFixed(1)} (manageable stress)`;
      } else {
        stressLabel = `Volume ${volumeText} vs last week · Avg RPE ${avgRpe.toFixed(1)}`;
      }
    } else {
      stressLabel = `Volume ${volumeText} vs last week`;
    }
  } else if (avgRpe !== null) {
    stressLabel = `Avg RPE ${avgRpe.toFixed(1)} this week`;
  }

  return {
    avgRpe,
    totalVolume,
    volumeChangePercent,
    stressLabel,
  };
}

/**
 * Identify and summarize key lifts (top exercises by volume)
 */
export function summarizeKeyLifts(
  currentWeek: ProgramWeek,
  previousWeek: ProgramWeek | null,
  history: WorkoutHistoryEntry[],
  topN: number = 5
): KeyLiftSummary[] {
  const currentLoads = getActualLoadsForWeek(history, currentWeek);
  const previousLoads = previousWeek ? getActualLoadsForWeek(history, previousWeek) : [];

  // Sort by total volume and take top N
  const topLifts = [...currentLoads]
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .slice(0, topN);

  // Get week date range for RPE calculation
  const weekStart = new Date(currentWeek.weekStartDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const weekHistory = history.filter((entry) => {
    const entryDate = new Date(entry.completedAt);
    return entryDate >= weekStart && entryDate < weekEnd;
  });

  return topLifts.map((currentEx) => {
    const previousEx = previousLoads.find((p) => p.exerciseId === currentEx.exerciseId);

    // Calculate change percentage
    const lastWeekLoadKg = previousEx?.averageLoadKg || null;
    const thisWeekLoadKg = currentEx.averageLoadKg;
    const changePercent = lastWeekLoadKg && thisWeekLoadKg
      ? ((thisWeekLoadKg - lastWeekLoadKg) / lastWeekLoadKg) * 100
      : null;

    // Calculate average RPE for this exercise
    const exerciseSets = weekHistory.flatMap((entry) =>
      entry.exercises
        .filter((ex) => ex.exerciseId === currentEx.exerciseId)
        .flatMap((ex) => ex.sets)
    );

    const setsWithRpe = exerciseSets.filter((s) => s.status === 'completed' && s.rpe !== undefined);
    const avgRpe = setsWithRpe.length > 0
      ? setsWithRpe.reduce((sum, s) => sum + (s.rpe || 0), 0) / setsWithRpe.length
      : null;

    return {
      exerciseName: currentEx.exerciseName,
      lastWeekLoadKg,
      thisWeekLoadKg,
      changePercent,
      totalSets: currentEx.setCount,
      avgRpe,
    };
  });
}
