/**
 * Metrics tracking for nutrition meal plan generation.
 * In-memory counters for observability and experimentation.
 * Later: persist to database or export to monitoring system.
 */

import { NutritionPlanConfig } from './nutritionPlanConfig';

export interface NutritionGenerationMetrics {
  // Generation counts
  totalWeeksGenerated: number;
  totalDaysGenerated: number;

  // First-pass quality
  daysWithinToleranceFirstPass: number;
  daysOutOfRangeFirstPass: number;

  // Auto-fix outcomes
  daysFixedByScaling: number;
  daysFixedByRegeneration: number;
  daysStillOutOfRangeAfterAutoFix: number;

  // Regeneration details
  totalRegenerationAttempts: number;
  regenerationSuccesses: number;
  regenerationFailures: number;

  // Performance
  averageGenerationTimeMs: number;
  averageAutoFixTimeMs: number;
}

class NutritionMetricsService {
  private metrics: NutritionGenerationMetrics;
  private generationTimes: number[] = [];
  private autoFixTimes: number[] = [];

  constructor() {
    this.metrics = this.createInitialMetrics();
  }

  private createInitialMetrics(): NutritionGenerationMetrics {
    return {
      totalWeeksGenerated: 0,
      totalDaysGenerated: 0,
      daysWithinToleranceFirstPass: 0,
      daysOutOfRangeFirstPass: 0,
      daysFixedByScaling: 0,
      daysFixedByRegeneration: 0,
      daysStillOutOfRangeAfterAutoFix: 0,
      totalRegenerationAttempts: 0,
      regenerationSuccesses: 0,
      regenerationFailures: 0,
      averageGenerationTimeMs: 0,
      averageAutoFixTimeMs: 0,
    };
  }

  recordWeekGenerated(daysCount: number = 7): void {
    this.metrics.totalWeeksGenerated++;
    this.metrics.totalDaysGenerated += daysCount;
  }

  recordDayWithinTolerance(): void {
    this.metrics.daysWithinToleranceFirstPass++;
  }

  recordDayOutOfRange(): void {
    this.metrics.daysOutOfRangeFirstPass++;
  }

  recordAutoFixByScaling(success: boolean): void {
    if (success) {
      this.metrics.daysFixedByScaling++;
    } else {
      this.metrics.daysStillOutOfRangeAfterAutoFix++;
    }
  }

  recordAutoFixByRegeneration(success: boolean, attemptCount: number): void {
    this.metrics.totalRegenerationAttempts += attemptCount;

    if (success) {
      this.metrics.daysFixedByRegeneration++;
      this.metrics.regenerationSuccesses++;
    } else {
      this.metrics.daysStillOutOfRangeAfterAutoFix++;
      this.metrics.regenerationFailures++;
    }
  }

  recordGenerationTime(timeMs: number): void {
    this.generationTimes.push(timeMs);
    this.metrics.averageGenerationTimeMs = this.computeAverage(this.generationTimes);
  }

  recordAutoFixTime(timeMs: number): void {
    this.autoFixTimes.push(timeMs);
    this.metrics.averageAutoFixTimeMs = this.computeAverage(this.autoFixTimes);
  }

  private computeAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  getMetrics(): NutritionGenerationMetrics {
    return { ...this.metrics };
  }

  getFirstPassQualityRate(): number {
    const total = this.metrics.daysWithinToleranceFirstPass + this.metrics.daysOutOfRangeFirstPass;
    if (total === 0) return 0;
    return (this.metrics.daysWithinToleranceFirstPass / total) * 100;
  }

  getAutoFixSuccessRate(): number {
    const totalAutoFixAttempts = this.metrics.daysOutOfRangeFirstPass;
    if (totalAutoFixAttempts === 0) return 0;

    const fixed = this.metrics.daysFixedByScaling + this.metrics.daysFixedByRegeneration;
    return (fixed / totalAutoFixAttempts) * 100;
  }

  getRegenerationSuccessRate(): number {
    const total = this.metrics.regenerationSuccesses + this.metrics.regenerationFailures;
    if (total === 0) return 0;
    return (this.metrics.regenerationSuccesses / total) * 100;
  }

  getSummary(): string {
    return `
📊 Nutrition Generation Metrics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Weeks Generated: ${this.metrics.totalWeeksGenerated}
Days Generated: ${this.metrics.totalDaysGenerated}

First-Pass Quality:
  ✅ Within tolerance: ${this.metrics.daysWithinToleranceFirstPass} (${this.getFirstPassQualityRate().toFixed(1)}%)
  ⚠️  Out of range: ${this.metrics.daysOutOfRangeFirstPass}

Auto-Fix Results:
  📏 Fixed by scaling: ${this.metrics.daysFixedByScaling}
  🔄 Fixed by regeneration: ${this.metrics.daysFixedByRegeneration}
  ❌ Still out of range: ${this.metrics.daysStillOutOfRangeAfterAutoFix}
  Success rate: ${this.getAutoFixSuccessRate().toFixed(1)}%

Regeneration:
  Total attempts: ${this.metrics.totalRegenerationAttempts}
  Successes: ${this.metrics.regenerationSuccesses}
  Failures: ${this.metrics.regenerationFailures}
  Success rate: ${this.getRegenerationSuccessRate().toFixed(1)}%

Performance:
  Avg generation time: ${this.metrics.averageGenerationTimeMs.toFixed(0)}ms
  Avg auto-fix time: ${this.metrics.averageAutoFixTimeMs.toFixed(0)}ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
  }

  getQualityViolations(config: NutritionPlanConfig): string[] {
    const violations: string[] = [];

    // Check First-Pass Quality
    if (config.minFirstPassQualityRate !== undefined) {
      const currentRate = this.getFirstPassQualityRate() / 100; // Convert % to decimal
      if (currentRate < config.minFirstPassQualityRate) {
        violations.push(
          `First-pass quality rate ${currentRate.toFixed(2)} is below threshold ${config.minFirstPassQualityRate}`
        );
      }
    }

    // Check Auto-Fix Success
    if (config.minAutoFixSuccessRate !== undefined) {
      const currentRate = this.getAutoFixSuccessRate() / 100; // Convert % to decimal
      if (currentRate < config.minAutoFixSuccessRate) {
        violations.push(
          `Auto-fix success rate ${currentRate.toFixed(2)} is below threshold ${config.minAutoFixSuccessRate}`
        );
      }
    }

    return violations;
  }

  reset(): void {
    this.metrics = this.createInitialMetrics();
    this.generationTimes = [];
    this.autoFixTimes = [];
  }
}



// Singleton instance
export const nutritionMetrics = new NutritionMetricsService();
