
import { describe, it, expect } from 'vitest';
import { generateInsights, Insight } from '../services/insightEngine';
import { ProgressSummary, INSIGHT_THRESHOLDS } from '../../src/features/progress/types';

// Helper to create a base summary with defaults
function createBaseSummary(overrides: Partial<ProgressSummary> = {}): ProgressSummary {
    return {
        userId: 'test-user',
        weekStart: '2025-05-05',
        weekEnd: '2025-05-11',
        workouts: {
            sessionsCompleted: 0,
            sessionsPlanned: 3,
            completionRate: 0,
            ...overrides.workouts
        },
        nutrition: {
            daysLogged: 0,
            avgCaloriesActual: 0,
            avgProteinActual: 0,
            ...overrides.nutrition
        },
        weight: {
            hasEnoughData: false,
            trend: 'unknown',
            ...overrides.weight
        },
        insights: [],
        ...overrides
    };
}

describe('Insight Engine Rules', () => {

    describe('Scenario: Good Week', () => {
        it('should generate positive insights for consistent workouts and nutrition', () => {
            const summary = createBaseSummary({
                workouts: {
                    sessionsCompleted: 4,
                    sessionsPlanned: 4,
                    completionRate: 0.9
                },
                nutrition: {
                    daysLogged: 6,
                    avgCaloriesActual: 2050,
                    avgCaloriesTarget: 2000,
                    avgCaloriesDelta: 50,
                    avgProteinActual: 160,
                    avgProteinTarget: 150,
                    avgProteinDelta: 10
                },
                weight: {
                    hasEnoughData: true,
                    changePerWeek: -0.5,
                    trend: 'decreasing'
                }
            });

            const insights = generateInsights(summary);

            // Check for specific categories
            const workoutInsight = insights.find(i => i.category === 'workout');
            expect(workoutInsight?.message).toContain('Great consistency');

            const nutritionInsight = insights.find(i => i.category === 'nutrition');
            expect(nutritionInsight?.message).toContain('Excellent tracking');

            const weightInsight = insights.find(i => i.category === 'weight');
            expect(weightInsight?.message).toContain('Weight trending down');

            // Check for combination insight
            const comboInsight = insights.find(i => i.category === 'combination');
            expect(comboInsight?.message).toContain('crushing it');
        });
    });

    describe('Scenario: Sparse Data', () => {
        it('should encourage logging without making claims', () => {
            const summary = createBaseSummary({
                workouts: {
                    sessionsCompleted: 1,
                    sessionsPlanned: 3,
                    completionRate: 1.0
                },
                nutrition: {
                    daysLogged: 2,
                    avgCaloriesActual: 2000,
                    avgProteinActual: 150
                },
                weight: {
                    hasEnoughData: false,
                    trend: 'unknown'
                }
            });

            const insights = generateInsights(summary);

            // Should not have combination insight
            expect(insights.find(i => i.category === 'combination')).toBeUndefined();

            // Should encourage workouts
            expect(insights.find(i => i.category === 'workout')?.message)
                .toContain('aim for at least 3 workouts');

            // Should encourage nutrition logging (no quality feedback yet)
            expect(insights.find(i => i.category === 'nutrition')?.message)
                .toContain('Try logging at least 5 days');

            // Should encourage weight logging
            expect(insights.find(i => i.category === 'weight')?.message)
                .toContain('Log a few more weigh-ins');
        });
    });

    describe('Scenario: Boundary Conditions', () => {
        it('should distinguish between perfect and good calorie adherence', () => {
            // Perfect adherence (+90)
            const perfectSummary = createBaseSummary({
                nutrition: {
                    daysLogged: 5,
                    avgCaloriesActual: 2090,
                    avgCaloriesTarget: 2000,
                    avgCaloriesDelta: 90,
                    avgProteinActual: 150
                }
            });
            const perfectInsights = generateInsights(perfectSummary);

            const perfectNutritionInsights = perfectInsights.filter(i => i.category === 'nutrition');
            expect(perfectNutritionInsights.some(i => i.message.includes('hitting your calorie goals consistently')))
                .toBe(true);

            // Good adherence (+110) - slightly above
            const goodSummary = createBaseSummary({
                nutrition: {
                    daysLogged: 5,
                    avgCaloriesActual: 2110,
                    avgCaloriesTarget: 2000,
                    avgCaloriesDelta: 110,
                    avgProteinActual: 150
                }
            });
            const goodInsights = generateInsights(goodSummary);

            const goodNutritionInsights = goodInsights.filter(i => i.category === 'nutrition');
            expect(goodNutritionInsights.some(i => i.message.includes('Slightly above target')))
                .toBe(true);
        });

        it('should detect weight trends just above threshold', () => {
            // Just above 0.3 threshold
            const summary = createBaseSummary({
                weight: {
                    hasEnoughData: true,
                    changePerWeek: -0.31,
                    trend: 'decreasing'
                }
            });

            const insights = generateInsights(summary);
            expect(insights.find(i => i.category === 'weight')?.message)
                .toContain('Weight trending down');
        });

        it('should consider weight stable just below threshold', () => {
            // Just below 0.3 threshold (technically stable logic handles this in service, 
            // but here we test the insight generation based on the passed trend)

            // If service passes 'stable', we should see stable message
            const summary = createBaseSummary({
                weight: {
                    hasEnoughData: true,
                    changePerWeek: -0.29,
                    trend: 'stable'
                }
            });

            const insights = generateInsights(summary);
            expect(insights.find(i => i.category === 'weight')?.message)
                .toContain('Weight holding steady');
        });
    });
});
