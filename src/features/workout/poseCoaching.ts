import type { DerivedAngle } from '../pose/poseTypes';
import type { RomEvaluationResult } from '../rom/romTypes';

export interface CoachingCueResult {
  primary: string | null;
  secondary?: string | null;
}

/**
 * Generate pose-based coaching cues based on ROM evaluation and angles
 * Rule-based, exercise-specific feedback
 */
export function getPoseCoachingCue(
  exerciseId: string,
  romResult: RomEvaluationResult | null,
  _angles: DerivedAngle[]
): CoachingCueResult {
  // No ROM result available
  if (!romResult) {
    return { primary: null };
  }

  // Barbell Back Squat specific cues
  if (exerciseId === 'barbell-back-squat') {
    // Find relevant angle evaluations
    const knee = romResult.angles.find((a) => a.name === 'left_knee_flexion');
    const hinge = romResult.angles.find((a) => a.name === 'hip_hinge');

    // Check for shallow depth (knee angle too small)
    if (knee && knee.valueDeg < 90) {
      return {
        primary: 'Depth looks a bit shallow.',
        secondary: 'Try sitting a little deeper while keeping your heels down and spine neutral.',
      };
    }

    // Check for excessive forward lean
    if (hinge && hinge.valueDeg > 55) {
      return {
        primary: 'Torso is leaning quite far forward.',
        secondary: 'Focus on bracing your core and keeping your chest more upright if it feels comfortable.',
      };
    }

    // Good form - everything within range
    if (romResult.overallStatus === 'ok') {
      return {
        primary: 'Form looks within a good range for this rep.',
        secondary: 'Keep bracing your core and controlling the descent.',
      };
    }

    // Generic warning fallback
    return {
      primary: 'Some angles are outside the usual range.',
      secondary: 'If anything feels painful or unstable, reduce the load and focus on control.',
    };
  }

  // For other exercises, no specific cues yet
  return { primary: null };
}
