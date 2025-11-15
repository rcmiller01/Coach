/**
 * diagnostics.ts - Developer diagnostics for app state integrity
 * 
 * Purpose:
 * - Run pure, deterministic checks on stored data
 * - Detect common integrity issues (out-of-bounds indices, missing data, etc.)
 * - Surface issues with appropriate severity levels
 * - No side effects, mutations, or network calls
 */

import type { ProgramMultiWeek } from '../program/types';
import type { WorkoutHistoryEntry } from '../history/types';
import type { DietTargets } from '../nutrition/dietEngine';
import type { DailyFoodTotals } from '../nutrition/foodLog';

export type DiagnosticSeverity = 'info' | 'warning' | 'error';

export interface DiagnosticIssue {
  id: string;
  severity: DiagnosticSeverity;
  message: string;
}

/**
 * Run all diagnostic checks on current app state
 * Returns array of issues found (empty if everything is valid)
 */
export function runDiagnostics(
  program: ProgramMultiWeek | null,
  history: WorkoutHistoryEntry[],
  dietTargets: DietTargets | null,
  foodLog: Record<string, DailyFoodTotals>
): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];

  // Check program integrity
  if (program) {
    issues.push(...checkProgramIntegrity(program));
    issues.push(...checkBlockIntegrity(program));
    issues.push(...checkWeekPhases(program));
    
    // Check diet targets exist if program exists
    if (!dietTargets) {
      issues.push({
        id: 'missing-diet-targets',
        severity: 'warning',
        message: 'Program exists but no diet targets calculated. Consider recalculating diet targets from your profile.',
      });
    }
  }

  // Check history integrity
  if (history.length > 0 && program) {
    issues.push(...checkHistoryDates(history, program));
  }

  // Check food log
  const foodLogDays = Object.keys(foodLog).length;
  if (foodLogDays > 0 && !dietTargets) {
    issues.push({
      id: 'food-log-no-targets',
      severity: 'info',
      message: `You have ${foodLogDays} days of food logs but no diet targets. Consider setting up diet targets to track progress.`,
    });
  }

  return issues;
}

/**
 * Check basic program structure integrity
 */
function checkProgramIntegrity(program: ProgramMultiWeek): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];

  // Check currentWeekIndex is valid
  if (program.currentWeekIndex < 0 || program.currentWeekIndex >= program.weeks.length) {
    issues.push({
      id: 'invalid-current-week-index',
      severity: 'error',
      message: `Current week index (${program.currentWeekIndex}) is out of bounds. Valid range: 0-${program.weeks.length - 1}`,
    });
  }

  // Check that we have at least one week
  if (program.weeks.length === 0) {
    issues.push({
      id: 'no-weeks',
      severity: 'error',
      message: 'Program has no weeks defined. A valid program must have at least one week.',
    });
  }

  // Check each week has at least one day
  program.weeks.forEach((week, idx) => {
    if (week.days.length === 0) {
      issues.push({
        id: `week-${idx}-no-days`,
        severity: 'warning',
        message: `Week ${idx + 1} has no training days defined.`,
      });
    }

    // Check each day has at least one exercise
    week.days.forEach((day, dayIdx) => {
      if (day.exercises.length === 0) {
        issues.push({
          id: `week-${idx}-day-${dayIdx}-no-exercises`,
          severity: 'warning',
          message: `Week ${idx + 1}, Day ${dayIdx + 1} (${day.dayOfWeek}) has no exercises.`,
        });
      }
    });
  });

  return issues;
}

/**
 * Check training blocks integrity
 */
function checkBlockIntegrity(program: ProgramMultiWeek): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];
  const blocks = program.blocks || [];

  if (blocks.length === 0) {
    issues.push({
      id: 'no-blocks',
      severity: 'info',
      message: 'No training blocks defined. Blocks help organize mesocycles and progression.',
    });
    return issues;
  }

  // Check each block's week indices are valid
  blocks.forEach((block, idx) => {
    if (block.startWeekIndex < 0 || block.startWeekIndex >= program.weeks.length) {
      issues.push({
        id: `block-${idx}-invalid-start`,
        severity: 'error',
        message: `Block ${idx + 1} start index (${block.startWeekIndex}) is out of bounds. Valid range: 0-${program.weeks.length - 1}`,
      });
    }

    // endWeekIndex can be null for active blocks, which is valid
    if (block.endWeekIndex !== null) {
      if (block.endWeekIndex < 0 || block.endWeekIndex >= program.weeks.length) {
        issues.push({
          id: `block-${idx}-invalid-end`,
          severity: 'error',
          message: `Block ${idx + 1} end index (${block.endWeekIndex}) is out of bounds. Valid range: 0-${program.weeks.length - 1}`,
        });
      }

      if (block.startWeekIndex > block.endWeekIndex) {
        issues.push({
          id: `block-${idx}-inverted`,
          severity: 'error',
          message: `Block ${idx + 1} has start index (${block.startWeekIndex}) greater than end index (${block.endWeekIndex})`,
        });
      }
    }
  });

  // Check for overlapping blocks
  const weekToBlock = new Map<number, number>();
  blocks.forEach((block, blockIdx) => {
    // Skip blocks with null endWeekIndex (active blocks)
    if (block.endWeekIndex === null) return;
    
    for (let weekIdx = block.startWeekIndex; weekIdx <= block.endWeekIndex; weekIdx++) {
      if (weekToBlock.has(weekIdx)) {
        const otherBlockIdx = weekToBlock.get(weekIdx)!;
        issues.push({
          id: `overlapping-blocks-${blockIdx}-${otherBlockIdx}`,
          severity: 'error',
          message: `Week ${weekIdx + 1} belongs to both Block ${blockIdx + 1} and Block ${otherBlockIdx + 1}. Blocks must not overlap.`,
        });
      }
      weekToBlock.set(weekIdx, blockIdx);
    }
  });

  return issues;
}

/**
 * Check that all weeks have training phases
 */
function checkWeekPhases(program: ProgramMultiWeek): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];

  program.weeks.forEach((week, idx) => {
    if (!week.trainingPhase) {
      issues.push({
        id: `week-${idx}-no-phase`,
        severity: 'warning',
        message: `Week ${idx + 1} has no training phase defined (should be 'build' or 'deload')`,
      });
    }
  });

  return issues;
}

/**
 * Check history entries have reasonable dates relative to program weeks
 */
function checkHistoryDates(
  history: WorkoutHistoryEntry[],
  program: ProgramMultiWeek
): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];

  if (program.weeks.length === 0) return issues;

  // Get date range of all weeks
  const firstWeekDate = new Date(program.weeks[0].weekStartDate);
  const lastWeekDate = new Date(program.weeks[program.weeks.length - 1].weekStartDate);
  // Add 2 weeks buffer to account for completion times
  const maxDate = new Date(lastWeekDate);
  maxDate.setDate(maxDate.getDate() + 14);

  // Check for sessions way outside program date range
  const outliers = history.filter(entry => {
    const entryDate = new Date(entry.completedAt);
    return entryDate < firstWeekDate || entryDate > maxDate;
  });

  if (outliers.length > 0) {
    issues.push({
      id: 'history-date-outliers',
      severity: 'warning',
      message: `${outliers.length} workout session(s) have dates outside the program's week range. This may indicate stale data or incorrect dates.`,
    });
  }

  return issues;
}

/**
 * Get summary statistics for diagnostics display
 */
export function getDiagnosticsSummary(
  program: ProgramMultiWeek | null,
  history: WorkoutHistoryEntry[],
  foodLog: Record<string, DailyFoodTotals>
): {
  weekCount: number;
  blockCount: number;
  sessionCount: number;
  foodDayCount: number;
} {
  return {
    weekCount: program?.weeks.length || 0,
    blockCount: program?.blocks?.length || 0,
    sessionCount: history.length,
    foodDayCount: Object.keys(foodLog).length,
  };
}
