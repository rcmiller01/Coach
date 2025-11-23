/**
 * Test helper for creating custom nutrition configs
 */

import { NutritionPlanConfig, DEFAULT_NUTRITION_CONFIG } from '../services/nutritionPlanConfig';

export function createTestConfig(overrides: Partial<NutritionPlanConfig> = {}): NutritionPlanConfig {
  return {
    ...DEFAULT_NUTRITION_CONFIG,
    ...overrides,
  };
}
