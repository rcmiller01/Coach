import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import type { PoseKeypoint } from '../poseTypes';

let detector: poseDetection.PoseDetector | null = null;

/**
 * Load the MoveNet Lightning pose detection model
 */
export async function loadPoseModel(): Promise<void> {
  if (detector) {
    return; // Already loaded
  }

  try {
    const model = poseDetection.SupportedModels.MoveNet;
    detector = await poseDetection.createDetector(model, {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    });
  } catch (error) {
    console.error('Failed to load pose model:', error);
    throw error;
  }
}

/**
 * Estimate pose from a video element
 * Returns keypoints in our PoseKeypoint format
 */
export async function estimatePose(
  video: HTMLVideoElement
): Promise<PoseKeypoint[]> {
  if (!detector) {
    throw new Error('Pose model not loaded. Call loadPoseModel() first.');
  }

  if (!video || video.readyState < 2) {
    return []; // Video not ready
  }

  try {
    const poses = await detector.estimatePoses(video, {
      flipHorizontal: true,
    });

    if (poses.length === 0) {
      return [];
    }

    // Convert from TensorFlow format to our PoseKeypoint format
    const pose = poses[0];
    const keypoints: PoseKeypoint[] = pose.keypoints.map((kp) => ({
      name: kp.name || 'unknown',
      x: kp.x / video.videoWidth, // Normalize to 0-1
      y: kp.y / video.videoHeight, // Normalize to 0-1
      z: kp.z,
      confidence: kp.score || 0,
    }));

    return keypoints;
  } catch (error) {
    console.error('Failed to estimate pose:', error);
    return [];
  }
}
