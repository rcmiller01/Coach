import type { ProgramDay } from '../program/types';
import type { DietTargets } from '../nutrition/dietEngine';
import type { WorkoutHistoryEntry } from '../history/types';
import { getTodayISODate } from '../nutrition/foodLog';
import { TodayWorkoutHero } from './TodayWorkoutHero';
import { TodayStatsRow } from './TodayStatsRow';
import { DietSummaryCard } from './DietSummaryCard';

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
  onViewSummary?: () => void;
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
  onViewSummary,
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

  // Calculate stats for TodayStatsRow
  const sessionsThisWeek = history.filter(entry => {
    const entryDate = new Date(entry.completedAt);
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    return entryDate >= weekStart && entryDate <= today;
  }).length;

  const totalSessionsThisWeek = todaysSession ? 4 : 3; // Estimate based on typical program

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-md mx-auto px-3 pt-3 pb-24 flex flex-col gap-3">
        
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-white mb-1">Today</h1>
          <p className="text-sm text-slate-400">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Workout Hero Card */}
        {todaysSession ? (
          <TodayWorkoutHero
            sessionName={formatDayName(todaysSession.day.focus)}
            weekNumber={todaysSession.weekIndex + 1}
            phase={todaysSession.weekPhase}
            goal={formatBlockGoal(todaysSession.blockGoal)}
            status={sessionCompleted ? 'completed' : 'not_started'}
            completedSets={sessionStats?.completedSets}
            totalSets={sessionStats?.totalSets}
            avgRPE={sessionStats?.avgRPE}
            onStartSession={() => onStartSession?.(todaysSession.day)}
            onViewSummary={onViewSummary}
          />
        ) : (
          <TodayWorkoutHero
            sessionName="Rest Day"
            weekNumber={1}
            phase="build"
            goal="general"
            status="not_started"
            onStartSession={() => {}}
            isRestDay={true}
          />
        )}

        {/* Stats Row */}
        <TodayStatsRow
          sessionsThisWeek={sessionsThisWeek}
          totalSessions={totalSessionsThisWeek}
          weeklyVolume={undefined} // Could calculate from history
          currentStreak={undefined} // Could calculate from history
        />

        {/* Diet Summary */}
        {dietTargets && (
          <DietSummaryCard dietTargets={dietTargets} date={todayISO} />
        )}

      </div>
    </div>
  );
}
