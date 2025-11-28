/**
 * API Client for Progress Tracking
 */

import { apiClient } from '../lib/apiClient';

export interface WeekSummary {
    userId: string;
    weekStart: string;
    weekEnd: string;

    workouts: {
        sessionsCompleted: number;
        sessionsPlanned?: number;
        completionRate?: number;
        warmupCompletedSessions?: number;
    };

    nutrition: {
        daysLogged: number;
        avgCaloriesActual: number;
        avgCaloriesTarget?: number;
        avgCaloriesDelta?: number;
        avgProteinActual: number;
        avgProteinTarget?: number;
        avgProteinDelta?: number;
        adherenceScore?: number;
    };

    weight: {
        hasEnoughData: boolean;
        latest?: number;
        changePerWeek?: number;
        trend: 'increasing' | 'decreasing' | 'stable' | 'unknown';
    };

    insights: string[];
}

export interface WeightEntry {
    date: string;
    weight: number;
}

export interface TrendsData {
    weights: WeightEntry[];
    trend: 'increasing' | 'decreasing' | 'stable';
}

/**
 * Fetch weekly summary metrics
 */
export async function fetchWeekSummary(weekStartDate: string): Promise<WeekSummary | null> {
    try {
        return await apiClient.get<WeekSummary>(`/progress/week-summary?weekStart=${weekStartDate}`);
    } catch (error) {
        console.error('Failed to fetch week summary:', error);
        return null;
    }
}

/**
 * Fetch trends data for charts
 */
export async function fetchTrends(startDate: string, endDate: string): Promise<TrendsData> {
    try {
        return await apiClient.get<TrendsData>(`/progress/trends?startDate=${startDate}&endDate=${endDate}`);
    } catch (error) {
        console.error('Failed to fetch trends:', error);
        return {
            weights: [],
            trend: 'stable'
        };
    }
}

/**
 * Log a workout session completion
 */
export async function logWorkoutSession(sessionData: any): Promise<boolean> {
    try {
        await apiClient.post('/logs/workout-session', sessionData);
        return true;
    } catch (error) {
        console.error('Failed to log workout session:', error);
        return false;
    }
}

/**
 * Log daily nutrition summary
 */
export async function logNutritionDay(nutritionData: any): Promise<boolean> {
    try {
        await apiClient.post('/logs/nutrition-day', nutritionData);
        return true;
    } catch (error) {
        console.error('Failed to log nutrition day:', error);
        return false;
    }
}

/**
 * Log body weight
 */
export async function logWeight(weight: number, date: string): Promise<boolean> {
    try {
        await apiClient.post('/logs/weight', { weight, date });
        return true;
    } catch (error) {
        console.error('Failed to log weight:', error);
        return false;
    }
}
