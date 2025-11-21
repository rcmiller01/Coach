/**
 * Progress Tracking Types
 * 
 * Shared types for progress tracking, suitable for web and future mobile/offline implementations.
 */

/**
 * Weekly Progress Summary DTO
 * 
 * Aggregates workout, nutrition, and weight data for a week with computed insights.
 * All dates use ISO YYYY-MM-DD format.
 */
export interface ProgressSummary {
    // Week metadata (ISO YYYY-MM-DD format)
    userId: string;
    weekStart: string;
    weekEnd: string;

    // Workout metrics
    workouts: {
        sessionsCompleted: number;
        sessionsPlanned?: number;
        setsCompleted?: number;
        setsPlanned?: number;
        completionRate?: number; // 0-1 across sets or sessions
    };

    // Nutrition metrics with deltas
    nutrition: {
        daysLogged: number;

        avgCaloriesActual: number;
        avgCaloriesTarget?: number;
        avgCaloriesDelta?: number; // actual - target

        avgProteinActual: number;
        avgProteinTarget?: number;
        avgProteinDelta?: number; // actual - target

        adherenceScore?: number; // 0-1 overall adherence
    };

    // Weight tracking with data quality
    weight: {
        hasEnoughData: boolean; // >= 3 points in window
        latest?: number;
        startOfPeriod?: number;
        change?: number; // latest - startOfPeriod (signed)
        changePerWeek?: number; // normalized slope
        trend: 'increasing' | 'decreasing' | 'stable' | 'unknown';
    };

    // Rule-based insights
    insights: string[];
}

/**
 * Insight thresholds and constants
 */
export const INSIGHT_THRESHOLDS = {
    // Workouts
    MIN_SESSIONS_FOR_CONSISTENCY: 3,
    MIN_COMPLETION_RATE_STRONG: 0.75,
    MIN_COMPLETION_RATE_WEAK: 0.5,

    // Nutrition
    MIN_DAYS_FOR_PATTERNS: 3,
    GOOD_LOGGING_DAYS: 5,

    // Calories (in kcal)
    CALORIE_DELTA_PERFECT: 100,
    CALORIE_DELTA_GOOD: 250,

    // Protein (in grams)
    PROTEIN_DELTA_CONCERN: -15,

    // Weight (in lbs/week)
    WEIGHT_SIGNIFICANT_CHANGE: 0.3,
    MIN_WEIGHT_POINTS: 3,

    // Combination
    HIGH_ENGAGEMENT_SESSIONS: 3,
    HIGH_ENGAGEMENT_DAYS: 5,
    HIGH_ENGAGEMENT_CALORIE_DELTA: 150,
} as const;
