// Pose estimation type definitions

export interface PoseKeypoint {
  name: string;        // e.g., "left_knee"
  x: number;           // normalized 0–1
  y: number;           // normalized 0–1
  z?: number;          // optional depth
  confidence: number;  // 0–1
}

export interface PoseFrame {
  timestampMs: number;
  keypoints: PoseKeypoint[];
}

export interface DerivedAngle {
  name: string;        // e.g., "left_knee_flexion"
  valueDeg: number;
}
