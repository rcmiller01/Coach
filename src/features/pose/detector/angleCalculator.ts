import type { PoseKeypoint, DerivedAngle } from '../poseTypes';

/**
 * Compute the angle (in degrees) between three points using the law of cosines
 * @param a First point (e.g., hip)
 * @param b Vertex point (e.g., knee)
 * @param c Third point (e.g., ankle)
 * @returns Angle at point b in degrees
 */
function computeAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): number {
  // Vector from b to a
  const ba = { x: a.x - b.x, y: a.y - b.y };
  // Vector from b to c
  const bc = { x: c.x - b.x, y: c.y - b.y };

  // Dot product
  const dotProduct = ba.x * bc.x + ba.y * bc.y;

  // Magnitudes
  const magnitudeBA = Math.sqrt(ba.x * ba.x + ba.y * ba.y);
  const magnitudeBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y);

  // Avoid division by zero
  if (magnitudeBA === 0 || magnitudeBC === 0) {
    return 0;
  }

  // Cosine of angle
  const cosAngle = dotProduct / (magnitudeBA * magnitudeBC);

  // Clamp to [-1, 1] to handle floating point errors
  const clampedCos = Math.max(-1, Math.min(1, cosAngle));

  // Angle in radians, then convert to degrees
  const angleRad = Math.acos(clampedCos);
  const angleDeg = (angleRad * 180) / Math.PI;

  return angleDeg;
}

/**
 * Find a keypoint by name
 */
function findKeypoint(
  keypoints: PoseKeypoint[],
  name: string
): PoseKeypoint | undefined {
  return keypoints.find(
    (kp) => kp.name.toLowerCase() === name.toLowerCase() && kp.confidence > 0.3
  );
}

/**
 * Calculate derived angles from pose keypoints
 * Returns an array of DerivedAngle objects
 */
export function calculateAngles(keypoints: PoseKeypoint[]): DerivedAngle[] {
  const angles: DerivedAngle[] = [];

  // Left knee flexion (hip -> knee -> ankle)
  const leftHip = findKeypoint(keypoints, 'left_hip');
  const leftKnee = findKeypoint(keypoints, 'left_knee');
  const leftAnkle = findKeypoint(keypoints, 'left_ankle');

  if (leftHip && leftKnee && leftAnkle) {
    const angle = computeAngle(leftHip, leftKnee, leftAnkle);
    angles.push({
      name: 'left_knee_flexion',
      valueDeg: Math.round(angle),
    });
  }

  // Right knee flexion (hip -> knee -> ankle)
  const rightHip = findKeypoint(keypoints, 'right_hip');
  const rightKnee = findKeypoint(keypoints, 'right_knee');
  const rightAnkle = findKeypoint(keypoints, 'right_ankle');

  if (rightHip && rightKnee && rightAnkle) {
    const angle = computeAngle(rightHip, rightKnee, rightAnkle);
    angles.push({
      name: 'right_knee_flexion',
      valueDeg: Math.round(angle),
    });
  }

  // Hip hinge (shoulder -> hip -> knee)
  // Using left side as reference
  const leftShoulder = findKeypoint(keypoints, 'left_shoulder');
  
  if (leftShoulder && leftHip && leftKnee) {
    const angle = computeAngle(leftShoulder, leftHip, leftKnee);
    // Hip hinge is typically the complement of this angle (how far forward the torso is)
    const hipHinge = 180 - angle;
    angles.push({
      name: 'hip_hinge',
      valueDeg: Math.round(hipHinge),
    });
  }

  // Torso angle (vertical reference)
  // Calculate angle between shoulder-hip line and vertical
  if (leftShoulder && leftHip) {
    const dy = leftHip.y - leftShoulder.y;
    const dx = leftHip.x - leftShoulder.x;
    const angleFromVertical = Math.abs(Math.atan2(dx, dy) * (180 / Math.PI));
    angles.push({
      name: 'torso_angle',
      valueDeg: Math.round(90 - angleFromVertical), // 0 = vertical, 90 = horizontal
    });
  }

  return angles;
}
