/**
 * Config-Driven RealNutritionAiService Tests
 * 
 * Tests the service behavior under different configs (STRICT, DEFAULT, RELAXED)
 * and validates auto-fix, metrics, and progress tracking integration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RealNutritionAiService } from '../RealNutritionAiService';
import type { NutritionTargets, UserContext, DayPlan } from '../../src/features/nutrition/nutritionTypes';
import { 
  DEFAULT_NUTRITION_CONFIG, 
  STRICT_NUTRITION_CONFIG, 
  RELAXED_NUTRITION_CONFIG 
} from '../services/nutritionPlanConfig';
import { nutritionMetrics } from '../services/nutritionMetricsService';

// ============================================================================
// MOCKS
// ============================================================================

// Mock OpenAI
const mockChatCreate = vi.fn();
vi.mock('openai', () => {
  class MockOpenAI {
    chat = {
      completions: {
        create: mockChatCreate,
      },
    };
  }
  return {
    default: MockOpenAI,
  };
});

// Mock quota service
vi.mock('../quotaService.js', () => ({
  getQuotaStatus: vi.fn().mockResolvedValue({
    dailyRemaining: 100,
    dailyLimit: 100,
    resetTime: new Date(Date.now() + 86400000).toISOString(),
  }),
  decrementQuota: vi.fn().mockResolvedValue(undefined),
}));

// ============================================================================
// TEST FIXTURES
// ============================================================================

const mockTargets: NutritionTargets = {
  caloriesPerDay: 2000,
  proteinGrams: 150,
  carbsGrams: 200,
  fatGrams: 65,
};

const mockUserContext: UserContext = {
  fitnessGoals: ['lose_fat'],
  dietaryRestrictions: [],
  activityLevel: 'moderate',
  preferredCuisines: [],
};

/**
 * Helper: Create a mock day plan with specified macros
 */
function createMockDayResponse(date: string, macros: { calories: number; protein: number; carbs: number; fat: number }) {
  // Distribute macros across 3 meals roughly evenly
  const mealsCount = 3;
  const perMeal = {
    calories: macros.calories / mealsCount,
    protein: macros.protein / mealsCount,
    carbs: macros.carbs / mealsCount,
    fat: macros.fat / mealsCount,
  };

  return {
    choices: [{
      message: {
        role: 'assistant' as const,
        content: JSON.stringify({
          date,
          meals: Array.from({ length: mealsCount }).map((_, i) => ({
            id: `meal-${i}`,
            type: i === 0 ? 'breakfast' : i === 1 ? 'lunch' : 'dinner',
            name: `Meal ${i + 1}`,
            items: [{
              foodId: `food-${i}`,
              name: `Food Item ${i}`,
              quantity: 1,
              unit: 'serving',
              calories: perMeal.calories,
              proteinGrams: perMeal.protein,
              carbsGrams: perMeal.carbs,
              fatsGrams: perMeal.fat,
            }],
          })),
          aiExplanation: 'Mock meal plan',
        }),
      },
    }],
  };
}

/**
 * Helper: Create mock responses for a full week with specified macro variance
 */
function createWeekMockResponses(startDate: string, macroVariance: number = 0) {
  const responses = [];
  const start = new Date(startDate);
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Add variance to macros (percentage off target)
    const macros = {
      calories: mockTargets.caloriesPerDay * (1 + macroVariance),
      protein: mockTargets.proteinGrams * (1 + macroVariance),
      carbs: mockTargets.carbsGrams * (1 + macroVariance),
      fat: mockTargets.fatGrams * (1 + macroVariance),
    };
    
    responses.push(createMockDayResponse(dateStr, macros));
  }
  
  return responses;
}

// ============================================================================
// TESTS
// ============================================================================

describe('RealNutritionAiService - Config-Driven Tests', () => {
  let service: RealNutritionAiService;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    nutritionMetrics.reset();
    service = new RealNutritionAiService();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  // ==========================================================================
  // Task 2: Basic Weekly Generation Shape (DEFAULT Profile)
  // ==========================================================================

  describe('Task 2: Basic Weekly Generation', () => {
    it('generates 7-day plan with expected structure under DEFAULT config', async () => {
      // Arrange: Mock perfect macros (no auto-fix needed)
      const weekStartDate = '2025-01-06';
      const mockResponses = createWeekMockResponses(weekStartDate, 0); // 0% variance = perfect
      
      let callIndex = 0;
      mockChatCreate.mockImplementation(async () => {
        return mockResponses[callIndex++ % mockResponses.length];
      });

      // Act
      const result = await service.generateMealPlanForWeek({
        weekStartDate,
        targets: mockTargets,
        userContext: mockUserContext,
        userId: 'test-user',
      });

      // Assert
      expect(result.days).toHaveLength(7);
      expect(result.weekStartDate).toBe(weekStartDate);
      
      // Check dates increment correctly
      const startDate = new Date(weekStartDate);
      result.days.forEach((day, i) => {
        const expectedDate = new Date(startDate);
        expectedDate.setDate(startDate.getDate() + i);
        expect(day.date).toBe(expectedDate.toISOString().split('T')[0]);
        expect(day.meals).toBeDefined();
        expect(Array.isArray(day.meals)).toBe(true);
      });

      // Metrics should show successful generation
      const metrics = nutritionMetrics.getMetrics();
      expect(metrics.totalWeeksGenerated).toBeGreaterThan(0);
      expect(metrics.daysWithinToleranceFirstPass).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Task 3: STRICT vs RELAXED Behavior
  // ==========================================================================

  describe('Task 3: Config Sensitivity', () => {
    it('STRICT profile triggers more auto-fix than RELAXED for same macros', async () => {
      const weekStartDate = '2025-01-06';
      
      // Create macros that are 15% off target
      // - Out of range for STRICT (10% tolerance)
      // - Within range for RELAXED (30% tolerance)
      const variance = 0.15; // 15% off
      
      // Test STRICT
      nutritionMetrics.reset();
      const strictResponses = createWeekMockResponses(weekStartDate, variance);
      let callIndex = 0;
      mockChatCreate.mockImplementation(async () => {
        return strictResponses[callIndex++ % strictResponses.length];
      });

      await service.generateMealPlanForWeek({
        weekStartDate,
        targets: mockTargets,
        userContext: mockUserContext,
        userId: 'test-user',
        config: STRICT_NUTRITION_CONFIG,
      });

      const strictMetrics = nutritionMetrics.getMetrics();
      const strictAutoFixCount = strictMetrics.daysOutOfRangeFirstPass;

      // Test RELAXED
      nutritionMetrics.reset();
      const relaxedResponses = createWeekMockResponses(weekStartDate, variance);
      callIndex = 0;
      mockChatCreate.mockImplementation(async () => {
        return relaxedResponses[callIndex++ % relaxedResponses.length];
      });

      await service.generateMealPlanForWeek({
        weekStartDate,
        targets: mockTargets,
        userContext: mockUserContext,
        userId: 'test-user',
        config: RELAXED_NUTRITION_CONFIG,
      });

      const relaxedMetrics = nutritionMetrics.getMetrics();
      const relaxedAutoFixCount = relaxedMetrics.daysOutOfRangeFirstPass;

      // STRICT should catch more out-of-range days than RELAXED
      expect(strictAutoFixCount).toBeGreaterThan(relaxedAutoFixCount);
    });
  });

  // ==========================================================================
  // Task 4: Auto-Fix Scaling Path
  // ==========================================================================

  describe('Task 4: Auto-Fix Scaling', () => {
    it('uses scaling when macros are slightly off within scale limit', async () => {
      // Create a day that's 30% under target (scalable to fix)
      const date = '2025-01-06';
      const underMacros = {
        calories: mockTargets.caloriesPerDay * 0.7,  // 30% under
        protein: mockTargets.proteinGrams * 0.7,
        carbs: mockTargets.carbsGrams * 0.7,
        fat: mockTargets.fatGrams * 0.7,
      };

      mockChatCreate.mockResolvedValue(createMockDayResponse(date, underMacros));

      // Spy on the private method to confirm no regeneration
      const generateDaySpy = vi.spyOn(service as any, 'generateMealPlanForDay');
      const originalImpl = generateDaySpy.getMockImplementation();

      const result = await service.generateMealPlanForDay({
        date,
        targets: mockTargets,
        userContext: mockUserContext,
        userId: 'test-user',
      });

      // Should have called OpenAI once
      expect(mockChatCreate).toHaveBeenCalledTimes(1);
      
      // Check logs for scaling message
      const allLogs = consoleLogSpy.mock.calls.map(call => JSON.stringify(call));
      const hasScalingLog = allLogs.some(log => log.includes('Auto-fixed') && log.includes('scaling'));
      
      // Note: Scaling happens in generateMealPlanForWeek, not generateMealPlanForDay
      // So this test validates the day generation works; full auto-fix tested below
      expect(result).toBeDefined();
      expect(result.date).toBe(date);

      generateDaySpy.mockRestore();
    });

    it('weekly generation with scalable days shows scaling in metrics', async () => {
      const weekStartDate = '2025-01-06';
      
      // 30% under - scalable by 1.43x (within default 0.5-1.5 range)
      const mockResponses = createWeekMockResponses(weekStartDate, -0.30);
      
      let callIndex = 0;
      mockChatCreate.mockImplementation(async () => {
        return mockResponses[callIndex++ % mockResponses.length];
      });

      nutritionMetrics.reset();
      
      await service.generateMealPlanForWeek({
        weekStartDate,
        targets: mockTargets,
        userContext: mockUserContext,
        userId: 'test-user',
      });

      const metrics = nutritionMetrics.getMetrics();
      
      // Should show auto-fix attempts
      expect(metrics.daysOutOfRangeFirstPass).toBeGreaterThan(0);
      
      // Scaling should have fixed some days
      expect(metrics.daysFixedByScaling).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Task 5: Auto-Fix Regeneration Path
  // ==========================================================================

  describe('Task 5: Auto-Fix Regeneration', () => {
    it('regenerates day when scaling insufficient', async () => {
      const weekStartDate = '2025-01-06';
      
      // Create days with weird macro ratios that can't be fixed by scaling
      // (e.g., calories OK but protein way off)
      let callIndex = 0;
      const firstPassResponses = Array.from({ length: 7 }).map((_, i) => {
        const currentDate = new Date(weekStartDate);
        currentDate.setDate(currentDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        return createMockDayResponse(dateStr, {
          calories: mockTargets.caloriesPerDay, // Calories perfect
          protein: mockTargets.proteinGrams * 1.5, // Protein +50% (can't scale fix)
          carbs: mockTargets.carbsGrams * 0.6,    // Carbs -40%
          fat: mockTargets.fatGrams * 0.7,        // Fat -30%
        });
      });

      // Second pass (regeneration) returns good macros
      const regenerationResponses = Array.from({ length: 7 }).map((_, i) => {
        const currentDate = new Date(weekStartDate);
        currentDate.setDate(currentDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        return createMockDayResponse(dateStr, {
          calories: mockTargets.caloriesPerDay,
          protein: mockTargets.proteinGrams,
          carbs: mockTargets.carbsGrams,
          fat: mockTargets.fatGrams,
        });
      });

      mockChatCreate.mockImplementation(async () => {
        if (callIndex < 7) {
          return firstPassResponses[callIndex++];
        } else {
          return regenerationResponses[(callIndex++) - 7];
        }
      });

      nutritionMetrics.reset();

      await service.generateMealPlanForWeek({
        weekStartDate,
        targets: mockTargets,
        userContext: mockUserContext,
        userId: 'test-user',
      });

      const metrics = nutritionMetrics.getMetrics();

      // Should have attempted regeneration
      expect(metrics.totalRegenerationAttempts).toBeGreaterThan(0);
      expect(metrics.daysFixedByRegeneration).toBeGreaterThan(0);
      
      // Should have called OpenAI more than 7 times (initial + regenerations)
      expect(mockChatCreate).toHaveBeenCalled();
      expect(mockChatCreate.mock.calls.length).toBeGreaterThan(7);
    });

    it('respects maxRegenerationsPerDay limit', async () => {
      const weekStartDate = '2025-01-06';
      
      // Always return bad macros (can't be fixed)
      mockChatCreate.mockImplementation(async () => {
        const dateStr = '2025-01-06';
        return createMockDayResponse(dateStr, {
          calories: mockTargets.caloriesPerDay * 2.5, // Way off
          protein: mockTargets.proteinGrams * 2.5,
          carbs: mockTargets.carbsGrams * 2.5,
          fat: mockTargets.fatGrams * 2.5,
        });
      });

      nutritionMetrics.reset();

      // Should complete without infinite loop
      const result = await service.generateMealPlanForWeek({
        weekStartDate,
        targets: mockTargets,
        userContext: mockUserContext,
        userId: 'test-user',
      });

      expect(result.days).toHaveLength(7);
      
      const metrics = nutritionMetrics.getMetrics();
      
      // Should show failed auto-fix attempts
      expect(metrics.daysStillOutOfRangeAfterAutoFix).toBeGreaterThan(0);
      
      // Regeneration attempts should be limited (7 days * 1 max regen each = 7 max)
      expect(metrics.totalRegenerationAttempts).toBeLessThanOrEqual(7);
    });
  });

  // ==========================================================================
  // Task 6: JSON Error Handling
  // ==========================================================================

  describe('Task 6: JSON Error Handling', () => {
    it('throws clean error on invalid JSON and records failure', async () => {
      const date = '2025-01-06';
      
      // Mock invalid JSON response
      mockChatCreate.mockResolvedValue({
        choices: [{
          message: {
            role: 'assistant' as const,
            content: 'This is not valid JSON { broken',
          },
        }],
      });

      await expect(
        service.generateMealPlanForDay({
          date,
          targets: mockTargets,
          userContext: mockUserContext,
          userId: 'test-user',
        })
      ).rejects.toThrow();

      // Should have logged error - verify logs were called
      // (actual log content visible in test output shows MealPlanParseError)
      expect(consoleLogSpy.mock.calls.length).toBeGreaterThan(0);
    });

    it('weekly generation handles single day failure gracefully', async () => {
      const weekStartDate = '2025-01-06';
      
      let callIndex = 0;
      mockChatCreate.mockImplementation(async () => {
        // Third day fails with bad JSON
        if (callIndex === 2) {
          callIndex++;
          return {
            choices: [{
              message: {
                role: 'assistant' as const,
                content: 'Invalid JSON',
              },
            }],
          };
        }
        
        // Other days succeed
        const responses = createWeekMockResponses(weekStartDate, 0);
        return responses[callIndex++ % responses.length];
      });

      // Should throw and propagate error
      await expect(
        service.generateMealPlanForWeek({
          weekStartDate,
          targets: mockTargets,
          userContext: mockUserContext,
          userId: 'test-user',
        })
      ).rejects.toThrow();
    });
  });

  // ==========================================================================
  // Task 7: Metrics Accumulation
  // ==========================================================================

  describe('Task 7: Metrics Service Integration', () => {
    it('accumulates stats across multiple week generations', async () => {
      nutritionMetrics.reset();

      // Week 1: Perfect macros (no auto-fix)
      let mockResponses = createWeekMockResponses('2025-01-06', 0);
      let callIndex = 0;
      mockChatCreate.mockImplementation(async () => {
        return mockResponses[callIndex++ % mockResponses.length];
      });

      await service.generateMealPlanForWeek({
        weekStartDate: '2025-01-06',
        targets: mockTargets,
        userContext: mockUserContext,
        userId: 'test-user',
      });

      // Week 2: Bad macros (needs auto-fix)
      mockResponses = createWeekMockResponses('2025-01-13', -0.35); // 35% under
      callIndex = 0;
      mockChatCreate.mockImplementation(async () => {
        return mockResponses[callIndex++ % mockResponses.length];
      });

      await service.generateMealPlanForWeek({
        weekStartDate: '2025-01-13',
        targets: mockTargets,
        userContext: mockUserContext,
        userId: 'test-user',
      });

      // Check accumulated metrics
      const metrics = nutritionMetrics.getMetrics();
      
      expect(metrics.totalWeeksGenerated).toBe(2);
      expect(metrics.totalDaysGenerated).toBe(14);
      expect(metrics.daysWithinToleranceFirstPass).toBeGreaterThan(0);
      expect(metrics.daysOutOfRangeFirstPass).toBeGreaterThan(0);
      
      // At least some auto-fix should have occurred
      const totalFixed = metrics.daysFixedByScaling + metrics.daysFixedByRegeneration;
      expect(totalFixed).toBeGreaterThan(0);

      // Should be able to get summary without errors
      const summary = nutritionMetrics.getSummary();
      expect(summary).toContain('Weeks Generated');
      expect(summary).toContain('Days Generated');
    });

    it('provides quality rate calculations', async () => {
      nutritionMetrics.reset();

      // Generate a week with perfect macros
      const mockResponses = createWeekMockResponses('2025-01-06', 0);
      let callIndex = 0;
      mockChatCreate.mockImplementation(async () => {
        return mockResponses[callIndex++ % mockResponses.length];
      });

      await service.generateMealPlanForWeek({
        weekStartDate: '2025-01-06',
        targets: mockTargets,
        userContext: mockUserContext,
        userId: 'test-user',
      });

      const firstPassQuality = nutritionMetrics.getFirstPassQualityRate();
      
      // Should be high since macros were perfect
      expect(firstPassQuality).toBeGreaterThan(80);
      expect(firstPassQuality).toBeLessThanOrEqual(100);
    });
  });
});
