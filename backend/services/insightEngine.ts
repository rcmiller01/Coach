/**
 * Insight Engine - Rule-Based Coach Notes
 * 
 * Generates human-readable insights from progress data using deterministic rules.
 * No LLMs or external services - all logic is transparent and in-process.
 */

import { ProgressSummary, INSIGHT_THRESHOLDS } from '../../src/features/progress/types';

// Maximum insights to return (keeps UI readable)
const MAX_INSIGHTS = 5;

export type InsightCategory = 'workout' | 'nutrition' | 'weight' | 'combination';

export interface Insight {
    category: InsightCategory;
    message: string;
}

/**
 * Generate insights from a progress summary
 * 
 * Insights are prioritized and capped to avoid overwhelming the user.
 * Order: workout consistency → nutrition quality → weight trends → combination
 * 
 * @param summary - The computed weekly progress summary
 * @returns Array of Insight objects (max 5)
 */
export function generateInsights(summary: ProgressSummary): Insight[] {
    const insights: Insight[] = [];

    // Generate insights in priority order
    insights.push(...generateWorkoutInsights(summary));
    insights.push(...generateNutritionInsights(summary));
    insights.push(...generateWeightInsights(summary));
    insights.push(...generateCombinationInsights(summary));

    // Cap to avoid overwhelming UI
    return insights.slice(0, MAX_INSIGHTS);
}

/**
 * Workout-related insights
 */
function generateWorkoutInsights(summary: ProgressSummary): Insight[] {
    const insights: Insight[] = [];
    const { sessionsCompleted, sessionsPlanned, completionRate, warmupCompletedSessions } = summary.workouts;

    // Gate: Skip if explicitly no workouts planned
    if (sessionsPlanned === 0) {
        return insights; // Could add: "No workouts planned this week"
    }

    // No sessions logged
    if (sessionsCompleted === 0) {
        insights.push({
            category: 'workout',
            message: "No workouts logged yet - let's get started!"
        });
        return insights;
    }

    // Warmup adherence insights (high priority if warmups exist)
    if (warmupCompletedSessions !== undefined && sessionsCompleted > 0) {
        const warmupRate = warmupCompletedSessions / sessionsCompleted;

        if (warmupRate >= 0.9) {
            // Excellent warmup adherence
            insights.push({
                category: 'workout',
                message: "Nice: you're consistently doing your warmup. That's exactly what long-term knees and shoulders like."
            });
        } else if (warmupRate < 0.5 && sessionsCompleted >= 2) {
            // Poor warmup adherence
            insights.push({
                category: 'workout',
                message: "You're getting your sessions in, but often skipping warmups. A few extra minutes of prep will help your joints and performance."
            });
        }
    }

    // High consistency with good completion
    if (
        sessionsCompleted >= INSIGHT_THRESHOLDS.MIN_SESSIONS_FOR_CONSISTENCY &&
        completionRate !== undefined &&
        completionRate >= INSIGHT_THRESHOLDS.MIN_COMPLETION_RATE_STRONG
    ) {
        const rate = Math.round(completionRate * 100);
        insights.push({
            category: 'workout',
            message: `💪 Great consistency! You hit ${sessionsCompleted} workouts with ${rate}% completion.`
        });
        return insights;
    }

    // Showing up but not finishing
    if (
        sessionsCompleted >= INSIGHT_THRESHOLDS.MIN_SESSIONS_FOR_CONSISTENCY &&
        completionRate !== undefined &&
        completionRate < INSIGHT_THRESHOLDS.MIN_COMPLETION_RATE_WEAK
    ) {
        insights.push({
            category: 'workout',
            message: "You're showing up; next step is finishing more of what you start."
        });
        return insights;
    }

    // Below minimum sessions
    if (sessionsCompleted < INSIGHT_THRESHOLDS.MIN_SESSIONS_FOR_CONSISTENCY) {
        insights.push({
            category: 'workout',
            message: "Keep building momentum - aim for at least 3 workouts per week."
        });
    }

    return insights;
}

/**
 * Nutrition-related insights
 * Guards against insufficient data before making claims
 */
function generateNutritionInsights(summary: ProgressSummary): Insight[] {
    const insights: Insight[] = [];
    const {
        daysLogged,
        avgCaloriesTarget,
        avgCaloriesDelta,
        avgProteinTarget,
        avgProteinDelta,
    } = summary.nutrition;

    // Gate: Need minimum days before giving quality feedback
    if (daysLogged < INSIGHT_THRESHOLDS.MIN_DAYS_FOR_PATTERNS) {
        insights.push({
            category: 'nutrition',
            message: "Try logging at least 5 days to see meaningful patterns."
        });
        return insights; // Only return this message, no quality feedback
    }

    // Logging frequency feedback (only if we have enough data)
    if (daysLogged >= INSIGHT_THRESHOLDS.GOOD_LOGGING_DAYS) {
        insights.push({
            category: 'nutrition',
            message: `📊 Excellent tracking! You logged ${daysLogged} days.`
        });
    }

    // Calorie adherence (requires target and enough logging days)
    if (avgCaloriesTarget !== undefined && avgCaloriesDelta !== undefined) {
        const absDelta = Math.abs(avgCaloriesDelta);

        if (absDelta <= INSIGHT_THRESHOLDS.CALORIE_DELTA_PERFECT) {
            insights.push({
                category: 'nutrition',
                message: "🎯 You're hitting your calorie goals consistently."
            });
        } else if (absDelta <= INSIGHT_THRESHOLDS.CALORIE_DELTA_GOOD) {
            if (avgCaloriesDelta > 0) {
                insights.push({
                    category: 'nutrition',
                    message: "Slightly above target - consider portion adjustments."
                });
            } else {
                insights.push({
                    category: 'nutrition',
                    message: "Slightly under target - you have room for more nutrition."
                });
            }
        } else if (avgCaloriesDelta > INSIGHT_THRESHOLDS.CALORIE_DELTA_GOOD) {
            insights.push({
                category: 'nutrition',
                message: "Consider adjusting portions to get closer to your target."
            });
        }
    }

    // Protein feedback (requires target)
    if (
        avgProteinTarget !== undefined &&
        avgProteinDelta !== undefined &&
        avgProteinDelta < INSIGHT_THRESHOLDS.PROTEIN_DELTA_CONCERN
    ) {
        insights.push({
            category: 'nutrition',
            message: "You're a bit under your protein target; 10-20g more per day would help."
        });
    }

    return insights;
}

/**
 * Weight trend insights
 * Only makes claims if enough data points exist
 */
function generateWeightInsights(summary: ProgressSummary): Insight[] {
    const insights: Insight[] = [];
    const { hasEnoughData, changePerWeek, trend } = summary.weight;

    // Gate: Need enough data for reliable trends
    if (!hasEnoughData) {
        insights.push({
            category: 'weight',
            message: "Log a few more weigh-ins to establish trends."
        });
        return insights;
    }

    // Significant change detected
    if (
        changePerWeek !== undefined &&
        Math.abs(changePerWeek) > INSIGHT_THRESHOLDS.WEIGHT_SIGNIFICANT_CHANGE
    ) {
        if (trend === 'decreasing') {
            insights.push({
                category: 'weight',
                message: "📉 Weight trending down - keep up the great work!"
            });
        } else if (trend === 'increasing') {
            insights.push({
                category: 'weight',
                message: "📈 Weight trending up slightly."
            });
        }
    } else {
        // Weight is stable
        insights.push({
            category: 'weight',
            message: "⚖️ Weight holding steady."
        });
    }

    return insights;
}

/**
 * Combination insights (high engagement across multiple areas)
 */
function generateCombinationInsights(summary: ProgressSummary): Insight[] {
    const insights: Insight[] = [];

    const { sessionsCompleted } = summary.workouts;
    const { daysLogged, avgCaloriesDelta } = summary.nutrition;

    // High engagement: consistent workouts + good nutrition tracking + close to target
    const highWorkouts = sessionsCompleted >= INSIGHT_THRESHOLDS.HIGH_ENGAGEMENT_SESSIONS;
    const highLogging = daysLogged >= INSIGHT_THRESHOLDS.HIGH_ENGAGEMENT_DAYS;
    const goodAdherence =
        avgCaloriesDelta !== undefined &&
        Math.abs(avgCaloriesDelta) <= INSIGHT_THRESHOLDS.HIGH_ENGAGEMENT_CALORIE_DELTA;

    if (highWorkouts && highLogging && goodAdherence) {
        insights.push({
            category: 'combination',
            message: "🔥 You're crushing it this week! Great consistency across workouts and nutrition."
        });
    }

    return insights;
}
