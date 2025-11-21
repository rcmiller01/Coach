import { describe, it, expect } from 'vitest';
import { generateInsights } from './insightEngine';
import { ProgressSummary } from '../../src/features/progress/types';

describe('InsightEngine', () => {
    const baseWeek: Pick<ProgressSummary, 'userId' | 'weekStart' | 'weekEnd'> = {
        userId: 'test-user',
        weekStart: '2025-01-06',
        weekEnd: '2025-01-12',
    };

    describe('Workout Insights', () => {
        it('generates strong positive message for high consistency', () => {
            const summary: ProgressSummary = {
                ...baseWeek,
                workouts: {
                    sessionsCompleted: 4,
                    completionRate: 0.85,
                },
                nutrition: { daysLogged: 0, avgCaloriesActual: 0, avgProteinActual: 0 },
                weight: { hasEnoughData: false, trend: 'unknown' },
                insights: [],
            };

            const insights = generateInsights(summary);

            expect(insights.some(i => i.includes('💪 Great consistency'))).toBe(true);
            expect(insights.some(i => i.includes('85%'))).toBe(true);
        });

        it('suggests finishing sets when completion rate is low', () => {
            const summary: ProgressSummary = {
                ...baseWeek,
                workouts: {
                    sessionsCompleted: 3,
                    completionRate: 0.4,
                },
                nutrition: { daysLogged: 0, avgCaloriesActual: 0, avgProteinActual: 0 },
                weight: { hasEnoughData: false, trend: 'unknown' },
                insights: [],
            };

            const insights = generateInsights(summary);

            expect(insights.some(i => i.includes('finishing more of what you start'))).toBe(true);
        });

        it('nudges for more sessions when below minimum', () => {
            const summary: ProgressSummary = {
                ...baseWeek,
                workouts: {
                    sessionsCompleted: 2,
                },
                nutrition: { daysLogged: 0, avgCaloriesActual: 0, avgProteinActual: 0 },
                weight: { hasEnoughData: false, trend: 'unknown' },
                insights: [],
            };

            const insights = generateInsights(summary);

            expect(insights.some(i => i.includes('at least 3 workouts'))).toBe(true);
        });

        it('encourages getting started when no workouts logged', () => {
            const summary: ProgressSummary = {
                ...baseWeek,
                workouts: {
                    sessionsCompleted: 0,
                },
                nutrition: { daysLogged: 0, avgCaloriesActual: 0, avgProteinActual: 0 },
                weight: { hasEnoughData: false, trend: 'unknown' },
                insights: [],
            };

            const insights = generateInsights(summary);

            expect(insights.some(i => i.includes("let's get started"))).toBe(true);
        });
    });

    describe('Nutrition Insights', () => {
        it('praises excellent tracking', () => {
            const summary: ProgressSummary = {
                ...baseWeek,
                workouts: { sessionsCompleted: 0 },
                nutrition: {
                    daysLogged: 6,
                    avgCaloriesActual: 2000,
                    avgProteinActual: 150,
                },
                weight: { hasEnoughData: false, trend: 'unknown' },
                insights: [],
            };

            const insights = generateInsights(summary);

            expect(insights.some(i => i.includes('📊 Excellent tracking'))).toBe(true);
        });

        it('gives on-target feedback when calories are perfect', () => {
            const summary: ProgressSummary = {
                ...baseWeek,
                workouts: { sessionsCompleted: 0 },
                nutrition: {
                    daysLogged: 5,
                    avgCaloriesActual: 2050,
                    avgCaloriesTarget: 2000,
                    avgCaloriesDelta: 50,
                    avgProteinActual: 150,
                },
                weight: { hasEnoughData: false, trend: 'unknown' },
                insights: [],
            };

            const insights = generateInsights(summary);

            expect(insights.some(i => i.includes('🎯'))).toBe(true);
        });

        it('suggests portion adjustments when significantly over', () => {
            const summary: ProgressSummary = {
                ...baseWeek,
                workouts: { sessionsCompleted: 0 },
                nutrition: {
                    daysLogged: 5,
                    avgCaloriesActual: 2400,
                    avgCaloriesTarget: 2000,
                    avgCaloriesDelta: 400,
                    avgProteinActual: 150,
                },
                weight: { hasEnoughData: false, trend: 'unknown' },
                insights: [],
            };

            const insights = generateInsights(summary);

            expect(insights.some(i => i.includes('adjusting portions'))).toBe(true);
        });

        it('suggests more protein when significantly under target', () => {
            const summary: ProgressSummary = {
                ...baseWeek,
                workouts: { sessionsCompleted: 0 },
                nutrition: {
                    daysLogged: 5,
                    avgCaloriesActual: 2000,
                    avgProteinActual: 100,
                    avgProteinTarget: 150,
                    avgProteinDelta: -50,
                },
                weight: { hasEnoughData: false, trend: 'unknown' },
                insights: [],
            };

            const insights = generateInsights(summary);

            expect(insights.some(i => i.includes('protein target'))).toBe(true);
        });

        it('asks for more logging when insufficient data', () => {
            const summary: ProgressSummary = {
                ...baseWeek,
                workouts: { sessionsCompleted: 0 },
                nutrition: {
                    daysLogged: 2,
                    avgCaloriesActual: 2000,
                    avgProteinActual: 150,
                },
                weight: { hasEnoughData: false, trend: 'unknown' },
                insights: [],
            };

            const insights = generateInsights(summary);

            expect(insights.some(i => i.includes('at least 5 days'))).toBe(true);
        });
    });

    describe('Weight Insights', () => {
        it('celebrates weight loss trend', () => {
            const summary: ProgressSummary = {
                ...baseWeek,
                workouts: { sessionsCompleted: 0 },
                nutrition: { daysLogged: 0, avgCaloriesActual: 0, avgProteinActual: 0 },
                weight: {
                    hasEnoughData: true,
                    latest: 178,
                    startOfPeriod: 180,
                    change: -2,
                    changePerWeek: -0.5,
                    trend: 'decreasing',
                },
                insights: [],
            };

            const insights = generateInsights(summary);

            expect(insights.some(i => i.includes('📉'))).toBe(true);
            expect(insights.some(i => i.includes('trending down'))).toBe(true);
        });

        it('notes stable weight when change is minimal', () => {
            const summary: ProgressSummary = {
                ...baseWeek,
                workouts: { sessionsCompleted: 0 },
                nutrition: { daysLogged: 0, avgCaloriesActual: 0, avgProteinActual: 0 },
                weight: {
                    hasEnoughData: true,
                    latest: 180,
                    startOfPeriod: 180,
                    change: 0,
                    changePerWeek: 0.1,
                    trend: 'stable',
                },
                insights: [],
            };

            const insights = generateInsights(summary);

            expect(insights.some(i => i.includes('⚖️'))).toBe(true);
            expect(insights.some(i => i.includes('steady'))).toBe(true);
        });

        it('asks for more data when insufficient weigh-ins', () => {
            const summary: ProgressSummary = {
                ...baseWeek,
                workouts: { sessionsCompleted: 0 },
                nutrition: { daysLogged: 0, avgCaloriesActual: 0, avgProteinActual: 0 },
                weight: {
                    hasEnoughData: false,
                    trend: 'unknown',
                },
                insights: [],
            };

            const insights = generateInsights(summary);

            expect(insights.some(i => i.includes('more weigh-ins'))).toBe(true);
        });
    });

    describe('Combination Insights', () => {
        it('celebrates crushing it when all metrics are strong', () => {
            const summary: ProgressSummary = {
                ...baseWeek,
                workouts: {
                    sessionsCompleted: 4,
                    completionRate: 0.9,
                },
                nutrition: {
                    daysLogged: 6,
                    avgCaloriesActual: 2050,
                    avgCaloriesTarget: 2000,
                    avgCaloriesDelta: 50,
                    avgProteinActual: 150,
                },
                weight: {
                    hasEnoughData: true,
                    latest: 178,
                    changePerWeek: -0.4,
                    trend: 'decreasing',
                },
                insights: [],
            };

            const insights = generateInsights(summary);

            expect(insights.some(i => i.includes('🔥'))).toBe(true);
            expect(insights.some(i => i.includes('crushing it'))).toBe(true);
        });

        it('does not celebrate when only one metric is good', () => {
            const summary: ProgressSummary = {
                ...baseWeek,
                workouts: {
                    sessionsCompleted: 4,
                    completionRate: 0.9,
                },
                nutrition: {
                    daysLogged: 2, // Low logging
                    avgCaloriesActual: 2000,
                    avgProteinActual: 150,
                },
                weight: { hasEnoughData: false, trend: 'unknown' },
                insights: [],
            };

            const insights = generateInsights(summary);

            expect(insights.some(i => i.includes('crushing it'))).toBe(false);
        });
    });
});
