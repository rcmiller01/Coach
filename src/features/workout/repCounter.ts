/**
 * repCounter.ts - Automatic rep counting from pose angles
 * 
 * Purpose:
 * - Track joint angles over time to detect rep patterns
 * - Count reps automatically for common exercises
 * - Support multiple exercise types (squat, push-up, etc.)
 * 
 * Algorithm:
 * - Track primary joint angle (knee for squats, elbow for push-ups)
 * - Detect transitions: extended → flexed → extended = 1 rep
 * - Use hysteresis thresholds to avoid false triggers
 */

import type { DerivedAngle } from '../pose/poseTypes';

export type ExercisePattern = 
  | 'squat'         // Knee angle tracking
  | 'push_up'       // Elbow angle tracking (future)
  | 'deadlift'      // Hip hinge tracking (future)
  | 'generic';      // Generic flexion/extension

interface RepState {
  phase: 'extended' | 'flexed' | 'transitioning';
  count: number;
  lastAngle: number;
  lastTransitionTime: number;
}

/**
 * RepCounter class - maintains state and detects reps
 */
export class RepCounter {
  private state: RepState;
  private pattern: ExercisePattern;
  
  // Thresholds (in degrees)
  private readonly EXTENDED_THRESHOLD = 160;  // Straight leg/arm
  private readonly FLEXED_THRESHOLD = 90;     // Deep squat/low push-up
  private readonly HYSTERESIS = 10;           // Degrees of buffer to prevent bouncing
  private readonly MIN_REP_TIME_MS = 500;     // Minimum time between reps (prevent double-counting)

  constructor(pattern: ExercisePattern = 'generic') {
    this.pattern = pattern;
    this.state = {
      phase: 'extended',
      count: 0,
      lastAngle: 180,
      lastTransitionTime: Date.now(),
    };
  }

  /**
   * Get current rep count
   */
  getCount(): number {
    return this.state.count;
  }

  /**
   * Reset counter
   */
  reset(): void {
    this.state = {
      phase: 'extended',
      count: 0,
      lastAngle: 180,
      lastTransitionTime: Date.now(),
    };
  }

  /**
   * Get the primary tracking angle based on exercise pattern
   */
  private getPrimaryAngle(angles: DerivedAngle[]): number | null {
    switch (this.pattern) {
      case 'squat': {
        // Use average of both knee angles for squats
        const leftKnee = angles.find(a => a.name === 'left_knee_flexion');
        const rightKnee = angles.find(a => a.name === 'right_knee_flexion');
        
        if (leftKnee && rightKnee) {
          return (leftKnee.valueDeg + rightKnee.valueDeg) / 2;
        }
        return leftKnee?.valueDeg ?? rightKnee?.valueDeg ?? null;
      }
      
      case 'deadlift': {
        // Use hip hinge angle
        const hipHinge = angles.find(a => a.name === 'hip_hinge');
        return hipHinge?.valueDeg ?? null;
      }
      
      case 'generic':
      default:
        // Use first available angle (fallback)
        return angles[0]?.valueDeg ?? null;
    }
  }

  /**
   * Update with new angle data and detect reps
   * Returns true if a new rep was counted
   */
  update(angles: DerivedAngle[]): boolean {
    const currentAngle = this.getPrimaryAngle(angles);
    
    if (currentAngle === null) {
      return false; // No valid angle data
    }

    const now = Date.now();
    const timeSinceLastTransition = now - this.state.lastTransitionTime;
    
    // State machine for rep detection
    let repDetected = false;

    if (this.state.phase === 'extended') {
      // Check if transitioning to flexed
      if (currentAngle < this.FLEXED_THRESHOLD - this.HYSTERESIS) {
        this.state.phase = 'flexed';
        this.state.lastTransitionTime = now;
      }
    } else if (this.state.phase === 'flexed') {
      // Check if transitioning back to extended (completing the rep)
      if (
        currentAngle > this.EXTENDED_THRESHOLD - this.HYSTERESIS &&
        timeSinceLastTransition > this.MIN_REP_TIME_MS
      ) {
        this.state.phase = 'extended';
        this.state.count += 1;
        this.state.lastTransitionTime = now;
        repDetected = true;
      }
    }

    this.state.lastAngle = currentAngle;
    return repDetected;
  }

  /**
   * Get current phase (useful for UI feedback)
   */
  getCurrentPhase(): 'extended' | 'flexed' | 'transitioning' {
    return this.state.phase;
  }

  /**
   * Get debug info
   */
  getDebugInfo(): {
    count: number;
    phase: string;
    lastAngle: number;
  } {
    return {
      count: this.state.count,
      phase: this.state.phase,
      lastAngle: Math.round(this.state.lastAngle),
    };
  }
}

/**
 * Detect exercise pattern from exercise name/ID
 * Simple heuristic based on common keywords
 */
export function detectExercisePattern(exerciseName: string): ExercisePattern {
  const nameLower = exerciseName.toLowerCase();
  
  if (nameLower.includes('squat') || nameLower.includes('lunge')) {
    return 'squat';
  }
  
  if (nameLower.includes('push') || nameLower.includes('press')) {
    return 'push_up';
  }
  
  if (nameLower.includes('deadlift') || nameLower.includes('hinge')) {
    return 'deadlift';
  }
  
  return 'generic';
}
