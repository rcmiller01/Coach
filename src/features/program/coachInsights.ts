/**
 * Coach Insights Engine
 * 
 * Converts weekly metrics into human-readable coaching messages
 * using deterministic rule-based logic.
 */

import type {
  WeeklyAdherenceMetrics,
  WeeklyStressMetrics,
  KeyLiftSummary,
} from './weeklyAdherence';

export type InsightSeverity = 'info' | 'success' | 'warning' | 'critical';

export interface CoachInsight {
  id: string;
  severity: InsightSeverity;
  title: string;
  message: string;
}

export interface CoachInsightInputs {
  weekNumber: number;
  phase: 'build' | 'deload';
  adherence: WeeklyAdherenceMetrics;
  stress: WeeklyStressMetrics;
  keyLifts: KeyLiftSummary[];
}

/**
 * Generate coaching insights based on weekly metrics
 */
export function generateCoachInsights(inputs: CoachInsightInputs): CoachInsight[] {
  const insights: CoachInsight[] = [];

  // Rule 1: High adherence (≥90% sessions)
  if (inputs.adherence.sessionAdherence >= 0.9) {
    insights.push({
      id: 'high-adherence',
      severity: 'success',
      title: '🎯 Excellent Consistency',
      message: `You completed ${inputs.adherence.completedSessions} of ${inputs.adherence.plannedSessions} planned sessions. This kind of consistency builds real results.`,
    });
  }

  // Rule 2: Low adherence (<70% sessions)
  else if (inputs.adherence.sessionAdherence < 0.7 && inputs.adherence.plannedSessions > 0) {
    insights.push({
      id: 'low-adherence',
      severity: 'warning',
      title: '⚠️ Consistency Below Target',
      message: `Only ${inputs.adherence.completedSessions} of ${inputs.adherence.plannedSessions} sessions completed. Consider stabilizing your schedule before increasing training volume.`,
    });
  }

  // Rule 3: Deload phase explanation
  if (inputs.phase === 'deload') {
    insights.push({
      id: 'deload-phase',
      severity: 'info',
      title: '🔄 Deload Week Active',
      message: 'Reduced loads this week are intentional. Focus on movement quality and recovery. You should feel refreshed and ready to push harder next week.',
    });
  }

  // Rule 4: High stress (volume increase >10% AND high RPE ≥8.5)
  if (
    inputs.stress.volumeChangePercent !== null &&
    inputs.stress.volumeChangePercent > 10 &&
    inputs.stress.avgRpe !== null &&
    inputs.stress.avgRpe >= 8.5
  ) {
    insights.push({
      id: 'high-stress',
      severity: 'critical',
      title: '🚨 High Training Stress',
      message: `Volume increased ${inputs.stress.volumeChangePercent.toFixed(1)}% with average RPE ${inputs.stress.avgRpe.toFixed(1)}. Watch for signs of fatigue. A deload may be approaching.`,
    });
  }

  // Rule 5: High volume increase but manageable RPE (>10% volume, RPE 7-8.5)
  else if (
    inputs.stress.volumeChangePercent !== null &&
    inputs.stress.volumeChangePercent > 10 &&
    inputs.stress.avgRpe !== null &&
    inputs.stress.avgRpe >= 7 &&
    inputs.stress.avgRpe < 8.5
  ) {
    insights.push({
      id: 'volume-increase',
      severity: 'warning',
      title: '📈 Significant Volume Increase',
      message: `Training volume up ${inputs.stress.volumeChangePercent.toFixed(1)}% from last week. RPE is manageable (${inputs.stress.avgRpe.toFixed(1)}), but monitor recovery closely.`,
    });
  }

  // Rule 6: Moderate stress with stable volume (good productive training)
  else if (
    inputs.stress.volumeChangePercent !== null &&
    Math.abs(inputs.stress.volumeChangePercent) <= 10 &&
    inputs.stress.avgRpe !== null &&
    inputs.stress.avgRpe >= 6.5 &&
    inputs.stress.avgRpe <= 8
  ) {
    insights.push({
      id: 'productive-stress',
      severity: 'success',
      title: '✅ Productive Training Zone',
      message: `Training stress is well-balanced: volume ${inputs.stress.volumeChangePercent > 0 ? '+' : ''}${inputs.stress.volumeChangePercent.toFixed(1)}% with RPE ${inputs.stress.avgRpe.toFixed(1)}. This is sustainable progress.`,
    });
  }

  // Rule 7: Volume drop with low RPE (might be undertraining or recovering)
  else if (
    inputs.stress.volumeChangePercent !== null &&
    inputs.stress.volumeChangePercent < -15 &&
    inputs.stress.avgRpe !== null &&
    inputs.stress.avgRpe < 7 &&
    inputs.phase !== 'deload'
  ) {
    insights.push({
      id: 'low-stress',
      severity: 'info',
      title: '📉 Lower Training Load',
      message: `Volume decreased ${Math.abs(inputs.stress.volumeChangePercent).toFixed(1)}% with easy RPE (${inputs.stress.avgRpe.toFixed(1)}). This might be intentional recovery, or there's room to push harder next week.`,
    });
  }

  // Rule 8: Standout lift progression (one lift significantly higher than others)
  if (inputs.keyLifts.length >= 3) {
    const liftsWithChange = inputs.keyLifts.filter(
      (lift) => lift.changePercent !== null
    );

    if (liftsWithChange.length >= 3) {
      // Find the lift with the highest positive change
      const maxChange = Math.max(
        ...liftsWithChange.map((lift) => lift.changePercent || 0)
      );
      const standoutLift = liftsWithChange.find(
        (lift) => lift.changePercent === maxChange
      );

      // Only highlight if it's significantly higher than average and substantial
      if (standoutLift && maxChange >= 7) {
        const avgChange =
          liftsWithChange.reduce((sum, lift) => sum + (lift.changePercent || 0), 0) /
          liftsWithChange.length;

        if (maxChange > avgChange + 3) {
          insights.push({
            id: 'standout-lift',
            severity: 'info',
            title: '🌟 Standout Progress',
            message: `${standoutLift.exerciseName} jumped ${maxChange.toFixed(1)}% this week—notably higher than other lifts. Great progress on this movement!`,
          });
        }
      }
    }
  }

  // Rule 9: All key lifts stagnant or decreasing (potential plateau)
  if (inputs.keyLifts.length >= 3 && inputs.phase === 'build') {
    const liftsWithChange = inputs.keyLifts.filter(
      (lift) => lift.changePercent !== null
    );

    if (liftsWithChange.length >= 3) {
      const allStagnantOrDecreasing = liftsWithChange.every(
        (lift) => (lift.changePercent || 0) <= 1
      );

      if (allStagnantOrDecreasing) {
        insights.push({
          id: 'plateau-warning',
          severity: 'warning',
          title: '🔄 Potential Plateau',
          message: 'Most key lifts stayed flat or decreased this week. Consider adjusting programming, recovery, or nutrition to break through.',
        });
      }
    }
  }

  // Rule 10: First week encouragement
  if (inputs.weekNumber === 1 && inputs.adherence.completedSessions > 0) {
    insights.push({
      id: 'week-1-start',
      severity: 'success',
      title: '🚀 Strong Start',
      message: "Week 1 is complete! You've established baseline data. Focus on consistency and progressive overload as you move forward.",
    });
  }

  return insights;
}

/**
 * Sort insights by priority: critical, warning, success, info
 */
export function sortInsightsByPriority(insights: CoachInsight[]): CoachInsight[] {
  const severityOrder: Record<InsightSeverity, number> = {
    critical: 0,
    warning: 1,
    success: 2,
    info: 3,
  };

  return [...insights].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}
