/**
 * API Client for Progress Tracking
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface WeekSummary {
    userId: string;
    weekStart: string;
    weekEnd: string;

    workouts: {
        sessionsCompleted: number;
        sessionsPlanned?: number;
        completionRate?: number;
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
 * Fetch weekly progress summary
 */
export async function fetchWeekSummary(weekStart: string): Promise<WeekSummary> {
    const response = await fetch(`${API_BASE_URL}/api/progress/week-summary?weekStart=${weekStart}`);

    if (!response.ok) {
        throw new Error('Failed to fetch week summary');
    }

    const data = await response.json();
    return data.data;
}

/**
 * Fetch progress trends (weight tracking)
 */
export async function fetchTrends(startDate: string, endDate: string): Promise<TrendsData> {
    const response = await fetch(
        `${API_BASE_URL}/api/progress/trends?startDate=${startDate}&endDate=${endDate}`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch trends');
    }

    const data = await response.json();
    return data.data;
}
