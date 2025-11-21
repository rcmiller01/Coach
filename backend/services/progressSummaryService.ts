/**
 * Progress Summary Service
 * 
 * Centralized logic for calculating weekly progress summaries.
 * Aggregates data from repositories and generates insights.
 */

import { Pool } from 'pg';
import { ProgressSummary } from '../../src/features/progress/types';
import { generateInsights } from './insightEngine';
import { WorkoutRepository } from '../db/repositories/WorkoutRepository';
import { NutritionLogRepository } from '../db/repositories/NutritionLogRepository';
import { WeightRepository } from '../db/repositories/WeightRepository';

export class ProgressSummaryService {
    private workoutRepo: WorkoutRepository;
    private nutritionRepo: NutritionLogRepository;
    private weightRepo: WeightRepository;

    constructor(pool: Pool) {
        this.workoutRepo = new WorkoutRepository(pool);
        this.nutritionRepo = new NutritionLogRepository(pool);
        this.weightRepo = new WeightRepository(pool);
    }

    /**
     * Compute weekly progress summary with insights
     */
    async computeWeeklySummary(userId: string, weekStart: string): Promise<ProgressSummary> {
        // Calculate week end (6 days after start)
        const startDate = new Date(weekStart);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        const weekEnd = endDate.toISOString().split('T')[0];

        // Fetch data in parallel
        const [workoutSessions, nutritionLogs, weightLogs] = await Promise.all([
            this.workoutRepo.getWorkoutSessionsByDateRange(userId, weekStart, weekEnd),
            this.nutritionRepo.getNutritionLogsByDateRange(userId, weekStart, weekEnd),
            this.getWeightLogsForTrends(userId, weekStart),
        ]);

        // Compute workout metrics
        const workouts = this.computeWorkoutMetrics(workoutSessions);

        // Compute nutrition metrics
        const nutrition = this.computeNutritionMetrics(nutritionLogs);

        // Compute weight metrics
        const weight = this.computeWeightMetrics(weightLogs);

        // Build the summary (without insights yet)
        const summary: ProgressSummary = {
            userId,
            weekStart,
            weekEnd,
            workouts,
            nutrition,
            weight,
            insights: [], // Will be filled next
        };

        // Generate insights
        summary.insights = generateInsights(summary);

        return summary;
    }

    /**
     * Get weight logs for trend calculation (look back 4 weeks)
     */
    private async getWeightLogsForTrends(userId: string, weekStart: string) {
        const startDate = new Date(weekStart);
        startDate.setDate(startDate.getDate() - 28); // 4 weeks back
        const lookbackStart = startDate.toISOString().split('T')[0];

        const endDate = new Date(weekStart);
        endDate.setDate(endDate.getDate() + 6); // through end of week
        const weekEnd = endDate.toISOString().split('T')[0];

        return this.weightRepo.getWeightLogsByDateRange(userId, lookbackStart, weekEnd);
    }

    /**
     * Compute workout metrics from sessions
     */
    private computeWorkoutMetrics(sessions: any[]) {
        const sessionsCompleted = sessions.length;
        let setsCompleted = 0;

        for (const session of sessions) {
            setsCompleted += session.sets?.length || 0;
        }

        return {
            sessionsCompleted,
            setsCompleted: setsCompleted > 0 ? setsCompleted : undefined,
            completionRate: undefined, // Can be enhanced if we track planned sets
        };
    }

    /**
     * Compute nutrition metrics from logs
     */
    private computeNutritionMetrics(logs: any[]) {
        const daysLogged = logs.length;

        if (daysLogged === 0) {
            return {
                daysLogged: 0,
                avgCaloriesActual: 0,
                avgProteinActual: 0,
            };
        }

        // Calculate averages
        let totalCalories = 0;
        let totalProtein = 0;

        for (const log of logs) {
            totalCalories += log.totalCalories || 0;
            totalProtein += log.totalProteinGrams || 0;
        }

        const avgCaloriesActual = Math.round(totalCalories / daysLogged);
        const avgProteinActual = Math.round(totalProtein / daysLogged);

        // TODO: Get target values from user profile/onboarding
        // For now, use common defaults
        const avgCaloriesTarget = 2000;
        const avgProteinTarget = 150;

        const avgCaloriesDelta = avgCaloriesActual - avgCaloriesTarget;
        const avgProteinDelta = avgProteinActual - avgProteinTarget;

        return {
            daysLogged,
            avgCaloriesActual,
            avgCaloriesTarget,
            avgCaloriesDelta,
            avgProteinActual,
            avgProteinTarget,
            avgProteinDelta,
        };
    }

    /**
     * Compute weight metrics and trends
     */
    private computeWeightMetrics(logs: any[]) {
        const hasEnoughData = logs.length >= 3;

        if (!hasEnoughData || logs.length === 0) {
            return {
                hasEnoughData: false,
                trend: 'unknown' as const,
            };
        }

        // Sort by date to ensure correct ordering
        const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));

        const latest = sortedLogs[sortedLogs.length - 1].weightLbs;
        const startOfPeriod = sortedLogs[0].weightLbs;
        const change = latest - startOfPeriod;

        // Calculate slope (change per week)
        const daysBetween =
            (new Date(sortedLogs[sortedLogs.length - 1].date).getTime() -
                new Date(sortedLogs[0].date).getTime()) /
            (1000 * 60 * 60 * 24);
        const weeks = daysBetween / 7;
        const changePerWeek = weeks > 0 ? change / weeks : 0;

        // Determine trend
        let trend: 'increasing' | 'decreasing' | 'stable' | 'unknown';
        if (Math.abs(changePerWeek) > 0.3) {
            trend = changePerWeek > 0 ? 'increasing' : 'decreasing';
        } else {
            trend = 'stable';
        }

        return {
            hasEnoughData: true,
            latest,
            startOfPeriod,
            change,
            changePerWeek,
            trend,
        };
    }
}
