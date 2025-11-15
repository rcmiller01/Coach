/**
 * Block Recommendation Engine
 * 
 * Provides deterministic recommendations for the next training block
 * based on adherence, volume progression, RPE, and lift performance.
 */

export interface BlockRecommendation {
  title: string;
  message: string;
  recommendedAction: 'advance' | 'repeat' | 'adjust';
}

export interface BlockMetrics {
  sessionAdherence: number;      // 0-1
  setAdherence: number;           // 0-1
  volumeChangePercent: number | null;  // % change from first to last week
  avgRpe: number | null;          // Average RPE across block
  liftProgressCount: number;      // Number of key lifts that improved
  totalKeyLifts: number;          // Total number of key lifts tracked
}

/**
 * Generate next-block recommendation based on block performance metrics
 */
export function getNextBlockRecommendation(metrics: BlockMetrics): BlockRecommendation {
  const {
    sessionAdherence,
    setAdherence,
    volumeChangePercent,
    avgRpe,
    liftProgressCount,
    totalKeyLifts,
  } = metrics;

  // Calculate lift progress ratio
  const liftProgressRatio = totalKeyLifts > 0 ? liftProgressCount / totalKeyLifts : 0;

  // Rule 1: Low adherence - recommend repeat with same structure
  if (sessionAdherence < 0.7) {
    return {
      title: 'Repeat Block with Consistency Focus',
      message: `Session attendance was ${Math.round(sessionAdherence * 100)}%. Before progressing, focus on consistent training. Consider repeating this block's structure with similar loads to build the habit.`,
      recommendedAction: 'repeat',
    };
  }

  // Rule 2: Poor set completion despite good session attendance
  if (sessionAdherence >= 0.7 && setAdherence < 0.7) {
    return {
      title: 'Adjust Volume or Intensity',
      message: `You showed up (${Math.round(sessionAdherence * 100)}% of sessions), but only completed ${Math.round(setAdherence * 100)}% of planned sets. Consider reducing volume by 10-15% or lowering intensity in the next block.`,
      recommendedAction: 'adjust',
    };
  }

  // Rule 3: High stress with minimal progress - recommend adjustment
  if (
    avgRpe !== null &&
    avgRpe >= 8.5 &&
    volumeChangePercent !== null &&
    volumeChangePercent > 15 &&
    liftProgressRatio < 0.5
  ) {
    return {
      title: 'High Stress, Limited Progress',
      message: `Average RPE was ${avgRpe.toFixed(1)} with ${volumeChangePercent.toFixed(0)}% volume increase, but fewer than half your key lifts improved. Consider swapping 1-2 main exercises or adjusting rep ranges to manage fatigue better.`,
      recommendedAction: 'adjust',
    };
  }

  // Rule 4: Excellent performance - recommend advancement
  if (
    sessionAdherence >= 0.9 &&
    setAdherence >= 0.85 &&
    volumeChangePercent !== null &&
    volumeChangePercent >= 5 &&
    volumeChangePercent <= 20 &&
    liftProgressRatio >= 0.6
  ) {
    return {
      title: 'Strong Block - Advance Programming',
      message: `Excellent adherence (${Math.round(sessionAdherence * 100)}% sessions), sustainable volume increase (${volumeChangePercent.toFixed(0)}%), and ${liftProgressCount} of ${totalKeyLifts} key lifts improved. You're ready to increase volume or intensity by 5-10% in the next block.`,
      recommendedAction: 'advance',
    };
  }

  // Rule 5: Good adherence, moderate progress - advance cautiously
  if (
    sessionAdherence >= 0.8 &&
    setAdherence >= 0.75 &&
    liftProgressRatio >= 0.4
  ) {
    return {
      title: 'Solid Progress - Continue Forward',
      message: `Good adherence (${Math.round(sessionAdherence * 100)}% sessions) and ${liftProgressCount} of ${totalKeyLifts} lifts improved. Maintain current structure with small progressive overload (2-5%) in the next block.`,
      recommendedAction: 'advance',
    };
  }

  // Rule 6: Moderate adherence with some progress - repeat or slight adjustment
  if (
    sessionAdherence >= 0.7 &&
    sessionAdherence < 0.8 &&
    liftProgressRatio >= 0.3
  ) {
    return {
      title: 'Repeat with Minor Adjustments',
      message: `Attendance was ${Math.round(sessionAdherence * 100)}% with ${liftProgressCount} lifts improving. Consider repeating this block's structure but adjusting 1-2 exercises that felt less effective.`,
      recommendedAction: 'repeat',
    };
  }

  // Rule 7: High volume but no progress - definitely adjust
  if (
    volumeChangePercent !== null &&
    volumeChangePercent > 20 &&
    liftProgressRatio < 0.3
  ) {
    return {
      title: 'Reduce Volume or Change Exercises',
      message: `Volume increased ${volumeChangePercent.toFixed(0)}% but only ${liftProgressCount} of ${totalKeyLifts} lifts improved. High volume without progress suggests poor recovery or exercise mismatch. Reduce volume by 15-20% or swap struggling movements.`,
      recommendedAction: 'adjust',
    };
  }

  // Rule 8: Very high RPE regardless of other factors
  if (avgRpe !== null && avgRpe >= 9.0) {
    return {
      title: 'Manage Fatigue and RPE',
      message: `Average RPE was ${avgRpe.toFixed(1)}—extremely high. Even if you made progress, this level of fatigue is unsustainable. Reduce intensity by working at RPE 7-8 in the next block and prioritize recovery.`,
      recommendedAction: 'adjust',
    };
  }

  // Default: moderate recommendation
  return {
    title: 'Maintain Current Approach',
    message: `Block completed with ${Math.round(sessionAdherence * 100)}% session adherence and ${liftProgressCount} of ${totalKeyLifts} lifts improving. Continue with similar structure and modest progression (2-5%) in the next block.`,
    recommendedAction: 'advance',
  };
}
