/**
 * Progress tracking for weekly meal plan generation.
 * Enables real-time UI updates and quality signals.
 */

export type GenerationPhase =
  | 'initializing'
  | 'generating_days'
  | 'auto_fixing'
  | 'validating'
  | 'complete'
  | 'error';

export type AutoFixMethod = 'scaling' | 'regeneration' | 'none' | 'failed';

export interface DayAutoFixResult {
  date: string;
  method: AutoFixMethod;
  attemptCount?: number; // for regeneration
  originalOutOfRange: boolean;
  fixedInRange: boolean;
}

export interface WeeklyGenerationProgress {
  phase: GenerationPhase;
  
  // Phase-specific progress
  daysGenerated: number; // 0-7
  daysAutoFixed: number; // 0-7
  
  // Overall metrics
  totalDays: number; // always 7
  
  // Quality signals
  autoFixResults: DayAutoFixResult[];
  
  // Summary counts
  daysWithinToleranceFirstPass: number;
  daysFixedByScaling: number;
  daysFixedByRegeneration: number;
  daysStillOutOfRange: number;
  
  // Metadata
  startTime: Date;
  endTime?: Date;
  error?: string;
}

export class WeeklyGenerationTracker {
  private progress: WeeklyGenerationProgress;
  
  constructor() {
    this.progress = this.createInitialProgress();
  }
  
  private createInitialProgress(): WeeklyGenerationProgress {
    return {
      phase: 'initializing',
      daysGenerated: 0,
      daysAutoFixed: 0,
      totalDays: 7,
      autoFixResults: [],
      daysWithinToleranceFirstPass: 0,
      daysFixedByScaling: 0,
      daysFixedByRegeneration: 0,
      daysStillOutOfRange: 0,
      startTime: new Date(),
    };
  }
  
  startGeneratingDays(): void {
    this.progress.phase = 'generating_days';
  }
  
  incrementDaysGenerated(): void {
    this.progress.daysGenerated++;
  }
  
  startAutoFixing(): void {
    this.progress.phase = 'auto_fixing';
  }
  
  recordAutoFixAttempt(date: string, originalOutOfRange: boolean): void {
    // Record initial state for this day
    const existing = this.progress.autoFixResults.find(r => r.date === date);
    if (!existing) {
      this.progress.autoFixResults.push({
        date,
        method: 'none',
        originalOutOfRange,
        fixedInRange: false,
      });
    }
  }
  
  recordAutoFixResult(
    date: string,
    method: AutoFixMethod,
    fixedInRange: boolean,
    attemptCount?: number
  ): void {
    const result = this.progress.autoFixResults.find(r => r.date === date);
    if (result) {
      result.method = method;
      result.fixedInRange = fixedInRange;
      result.attemptCount = attemptCount;
    } else {
      this.progress.autoFixResults.push({
        date,
        method,
        originalOutOfRange: true,
        fixedInRange,
        attemptCount,
      });
    }
    
    this.progress.daysAutoFixed++;
    
    // Update summary counts
    this.recomputeSummaryCounts();
  }
  
  recordDayWithinTolerance(date: string): void {
    this.progress.autoFixResults.push({
      date,
      method: 'none',
      originalOutOfRange: false,
      fixedInRange: true,
    });
    this.progress.daysWithinToleranceFirstPass++;
  }
  
  private recomputeSummaryCounts(): void {
    this.progress.daysFixedByScaling = this.progress.autoFixResults.filter(
      r => r.method === 'scaling' && r.fixedInRange
    ).length;
    
    this.progress.daysFixedByRegeneration = this.progress.autoFixResults.filter(
      r => r.method === 'regeneration' && r.fixedInRange
    ).length;
    
    this.progress.daysStillOutOfRange = this.progress.autoFixResults.filter(
      r => r.originalOutOfRange && !r.fixedInRange
    ).length;
  }
  
  startValidating(): void {
    this.progress.phase = 'validating';
  }
  
  complete(): void {
    this.progress.phase = 'complete';
    this.progress.endTime = new Date();
  }
  
  error(message: string): void {
    this.progress.phase = 'error';
    this.progress.error = message;
    this.progress.endTime = new Date();
  }
  
  getProgress(): WeeklyGenerationProgress {
    return { ...this.progress };
  }
  
  getQualitySummary(): string {
    const { daysWithinToleranceFirstPass, daysFixedByScaling, daysFixedByRegeneration, daysStillOutOfRange } = this.progress;
    
    const parts: string[] = [];
    if (daysWithinToleranceFirstPass > 0) {
      parts.push(`${daysWithinToleranceFirstPass} perfect on first pass`);
    }
    if (daysFixedByScaling > 0) {
      parts.push(`${daysFixedByScaling} scaled`);
    }
    if (daysFixedByRegeneration > 0) {
      parts.push(`${daysFixedByRegeneration} regenerated`);
    }
    if (daysStillOutOfRange > 0) {
      parts.push(`${daysStillOutOfRange} still out-of-range`);
    }
    
    return parts.join(', ');
  }

  /**
   * Get JSON-safe status snapshot for API responses.
   */
  getStatus(): {
    phase: GenerationPhase;
    daysGenerated: number;
    daysAutoFixed: number;
    totalDays: number;
    daysWithinToleranceFirstPass: number;
    daysFixedByScaling: number;
    daysFixedByRegeneration: number;
    daysStillOutOfRange: number;
    qualitySummary: string;
    startTime: Date;
    endTime?: Date;
    error?: string;
  } {
    return {
      phase: this.progress.phase,
      daysGenerated: this.progress.daysGenerated,
      daysAutoFixed: this.progress.daysAutoFixed,
      totalDays: this.progress.totalDays,
      daysWithinToleranceFirstPass: this.progress.daysWithinToleranceFirstPass,
      daysFixedByScaling: this.progress.daysFixedByScaling,
      daysFixedByRegeneration: this.progress.daysFixedByRegeneration,
      daysStillOutOfRange: this.progress.daysStillOutOfRange,
      qualitySummary: this.getQualitySummary(),
      startTime: this.progress.startTime,
      endTime: this.progress.endTime,
      error: this.progress.error,
    };
  }
}
