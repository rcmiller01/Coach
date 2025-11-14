import type { DerivedAngle } from '../pose/poseTypes';
import type {
  ExerciseRomProfile,
  RomEvaluationResult,
  AngleEvaluation,
  AngleRange,
} from './romTypes';
import { romProfiles } from './romProfiles';

/**
 * Get the ROM profile for a specific exercise
 */
export function getRomProfileForExercise(
  exerciseId: string
): ExerciseRomProfile | undefined {
  return romProfiles.find((profile) => profile.exerciseId === exerciseId);
}

/**
 * Evaluate ROM for a given profile and set of derived angles
 */
export function evaluateRom(
  profile: ExerciseRomProfile,
  angles: DerivedAngle[]
): RomEvaluationResult {
  // Build a map from angle name to value for quick lookup
  const angleMap = new Map<string, number>();
  angles.forEach((angle) => {
    angleMap.set(angle.name, angle.valueDeg);
  });

  const evaluatedAngles: AngleEvaluation[] = [];
  let hasWarning = false;

  // Evaluate each angle range in the profile
  profile.angles.forEach((range: AngleRange) => {
    const value = angleMap.get(range.name);

    if (value === undefined) {
      // No data for this angle
      evaluatedAngles.push({
        name: range.name,
        valueDeg: 0,
        status: 'warn',
        message: 'No data for this angle yet.',
      });
      hasWarning = true;
    } else {
      // Use soft ranges if available, otherwise use expected ranges
      const minDeg = range.softMinDeg ?? range.expectedMinDeg;
      const maxDeg = range.softMaxDeg ?? range.expectedMaxDeg;

      if (value < minDeg) {
        evaluatedAngles.push({
          name: range.name,
          valueDeg: value,
          status: 'warn',
          message: 'Below the recommended range for this angle.',
        });
        hasWarning = true;
      } else if (value > maxDeg) {
        evaluatedAngles.push({
          name: range.name,
          valueDeg: value,
          status: 'warn',
          message: 'Above the recommended range for this angle.',
        });
        hasWarning = true;
      } else {
        evaluatedAngles.push({
          name: range.name,
          valueDeg: value,
          status: 'ok',
        });
      }
    }
  });

  return {
    overallStatus: hasWarning ? 'warn' : 'ok',
    angles: evaluatedAngles,
  };
}

/**
 * Evaluate ROM for a specific exercise and set of derived angles
 * Returns null if no profile exists for the exercise
 */
export function evaluateRomForExercise(
  exerciseId: string,
  angles: DerivedAngle[]
): RomEvaluationResult | null {
  const profile = getRomProfileForExercise(exerciseId);
  if (!profile) {
    return null;
  }
  return evaluateRom(profile, angles);
}
