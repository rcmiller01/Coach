import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RealNutritionAiService } from '../RealNutritionAiService';
import { nutritionMetrics } from '../services/nutritionMetricsService';
import { nutritionFoodLookup } from '../services/nutritionFoodLookupService';
import {
    DEFAULT_NUTRITION_CONFIG,
    PRECISION_NUTRITION_CONFIG,
    STRICT_NUTRITION_CONFIG
} from '../services/nutritionPlanConfig';
import { NutritionTargets, UserContext } from '../../src/features/nutrition/nutritionTypes';

describe('Nutrition System - Precision & Quality', () => {
    let service: RealNutritionAiService;

    beforeEach(() => {
        service = new RealNutritionAiService();
        vi.clearAllMocks();
        nutritionMetrics.reset();
    });

    describe('Task A: Quality Thresholds', () => {
        it('should detect quality violations', () => {
            const config = {
                ...DEFAULT_NUTRITION_CONFIG,
                minFirstPassQualityRate: 0.8
            };

            // Simulate metrics
            // 1 success, 1 failure = 50% rate < 80%
            nutritionMetrics.recordDayWithinTolerance();
            nutritionMetrics.recordDayOutOfRange();

            const violations = nutritionMetrics.getQualityViolations(config);
            expect(violations.length).toBeGreaterThan(0);
            expect(violations[0]).toContain('First-pass quality rate');
        });

        it('should not report violations if metrics are good', () => {
            const config = {
                ...DEFAULT_NUTRITION_CONFIG,
                minFirstPassQualityRate: 0.5
            };

            // 1 success, 0 failure = 100% rate > 50%
            nutritionMetrics.recordDayWithinTolerance();

            const violations = nutritionMetrics.getQualityViolations(config);
            expect(violations.length).toBe(0);
        });
    });

    describe('Task B: Precision Mode', () => {
        it('should apply DB-backed corrections in precision mode', async () => {
            // Mock DB response
            const mockDbResponse = {
                'chicken breast': {
                    name: 'Chicken Breast',
                    calories: 165,
                    protein: 31,
                    carbs: 0,
                    fat: 3.6,
                    servingSize: 100,
                    servingUnit: 'g'
                }
            };

            const findBatchSpy = vi.spyOn(nutritionFoodLookup, 'findBatch');
            findBatchSpy.mockResolvedValue(mockDbResponse);

            // Create a dummy day plan with a food that needs correction
            // AI estimated 200 cal, DB says 165 cal for 100g
            const dayPlan = {
                date: '2025-01-01',
                meals: [{
                    id: 'm1',
                    type: 'lunch',
                    items: [{
                        id: 'i1',
                        name: 'chicken breast',
                        quantity: 100,
                        unit: 'g',
                        calories: 200, // Wrong value
                        proteinGrams: 30,
                        carbsGrams: 0,
                        fatsGrams: 5
                    }]
                }]
            };

            // We need to access the private method or simulate the flow.
            const correctedDays = await (service as any).applyPrecisionCorrections(
                [dayPlan],
                {} as NutritionTargets,
                PRECISION_NUTRITION_CONFIG
            );

            const correctedItem = correctedDays[0].meals[0].items[0];
            expect(correctedItem.calories).toBe(165); // Should be corrected to DB value
            expect(findBatchSpy).toHaveBeenCalledWith(expect.arrayContaining(['chicken breast']));
        });
    });

    describe('Task C: Experiment Harness', () => {
        it('should run experiment with multiple modes', async () => {
            // Spy on generateMealPlanForWeek
            const generateSpy = vi.spyOn(service, 'generateMealPlanForWeek');
            generateSpy.mockResolvedValue({
                weekStartDate: '2025-01-01',
                days: [] // Empty plan for simplicity
            } as any);

            const targets: NutritionTargets = {
                caloriesPerDay: 2000,
                proteinGrams: 150,
                carbsGrams: 200,
                fatGrams: 65
            };

            const results = await service.runExperiment(
                '2025-01-01',
                targets,
                {},
                ['default', 'strict'],
                'user-123'
            );

            expect(results.length).toBe(2);
            expect(results[0].mode).toBe('default');
            expect(results[1].mode).toBe('strict');
            expect(generateSpy).toHaveBeenCalledTimes(2);
        });
    });
});
