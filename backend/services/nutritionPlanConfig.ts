/**
 * Configuration for nutrition meal plan generation and auto-fix behavior.
 * Centralizes magic numbers to enable:
 * - Strict vs relaxed nutrition profiles
 * - A/B testing and experimentation
 * - User-specific tuning later
 */

export interface NutritionPlanConfig {
  /**
   * Macro tolerance threshold (%).
   * If actual macro deviates from target by more than this %, auto-fix triggers.
   * Default: 20 (i.e., ±20%)
   */
  macroTolerancePercent: number;

  /**
   * Maximum scaling factor upward (portion increase).
   * Default: 1.5 (can scale up to 150% of original portions)
   */
  maxScaleFactorUp: number;

  /**
   * Maximum scaling factor downward (portion decrease).
   * Default: 0.5 (can scale down to 50% of original portions)
   */
  maxScaleFactorDown: number;

  /**
   * Minimum scaling factor change to apply.
   * If calculated scaleFactor is within [1 - threshold, 1 + threshold], skip scaling.
   * Default: 0.05 (skip if within 5% of 1.0)
   */
  minScaleThreshold: number;

  /**
   * Maximum number of regeneration attempts per day during auto-fix.
   * Default: 1
   */
  maxRegenerationsPerDay: number;

  /**
   * Whether to auto-fix macro deviations during weekly generation.
   * Default: true
   */
  enableAutoFix: boolean;
}

/**
 * Default configuration - balanced approach.
 * - Moderate tolerance (±20%)
 * - Conservative scaling (0.5-1.5x)
 * - Single regeneration attempt
 */
export const DEFAULT_NUTRITION_CONFIG: NutritionPlanConfig = {
  macroTolerancePercent: 20,
  maxScaleFactorUp: 1.5,
  maxScaleFactorDown: 0.5,
  minScaleThreshold: 0.05,
  maxRegenerationsPerDay: 1,
  enableAutoFix: true,
};

/**
 * Strict configuration - tighter macro accuracy.
 * - Tight tolerance (±10%)
 * - More conservative scaling (0.7-1.3x)
 * - Two regeneration attempts
 */
export const STRICT_NUTRITION_CONFIG: NutritionPlanConfig = {
  macroTolerancePercent: 10,
  maxScaleFactorUp: 1.3,
  maxScaleFactorDown: 0.7,
  minScaleThreshold: 0.05,
  maxRegenerationsPerDay: 2,
  enableAutoFix: true,
};

/**
 * Relaxed configuration - more flexible macro ranges.
 * - Wide tolerance (±30%)
 * - Aggressive scaling (0.3-2.0x)
 * - Zero regeneration attempts (scaling only)
 */
export const RELAXED_NUTRITION_CONFIG: NutritionPlanConfig = {
  macroTolerancePercent: 30,
  maxScaleFactorUp: 2.0,
  maxScaleFactorDown: 0.3,
  minScaleThreshold: 0.05,
  maxRegenerationsPerDay: 0,
  enableAutoFix: true,
};

/**
 * Get nutrition config by profile name.
 * Later: fetch from database per user preferences.
 */
export function getNutritionConfig(profile: 'default' | 'strict' | 'relaxed' = 'default'): NutritionPlanConfig {
  switch (profile) {
    case 'strict':
      return STRICT_NUTRITION_CONFIG;
    case 'relaxed':
      return RELAXED_NUTRITION_CONFIG;
    default:
      return DEFAULT_NUTRITION_CONFIG;
  }
}

/**
 * Merge partial config overrides with defaults.
 * Useful for testing and experiments.
 */
export function mergeNutritionConfig(overrides: Partial<NutritionPlanConfig>): NutritionPlanConfig {
  return {
    ...DEFAULT_NUTRITION_CONFIG,
    ...overrides,
  };
}
