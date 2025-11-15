import React, { useState, useEffect, useRef } from 'react';
import type { ProgramDay } from '../program/types';
import type { WorkoutSessionState, WorkoutSetState } from './types';
import ExerciseBlock from './ExerciseBlock';
import RestTimer from './RestTimer';
import { getSetHint } from './coachingHints';
import CameraPreview from '../pose/CameraPreview';
import PoseDebugPanel from '../pose/PoseDebugPanel';
import type { DerivedAngle } from '../pose/poseTypes';
import { loadPoseModel, estimatePose } from '../pose/detector/poseDetector';
import { calculateAngles } from '../pose/detector/angleCalculator';
import type { DerivedAngle } from '../pose/poseTypes';
import { loadPoseModel, estimatePose } from '../pose/detector/poseDetector';
import { calculateAngles } from '../pose/detector/angleCalculator';
import { appendHistoryEntry } from '../history/historyStorage';
import type { WorkoutHistoryEntry } from '../history/types';
import type { ExerciseLoadSuggestion } from '../progression/progressionTypes';

interface WorkoutSessionViewProps {
  programDay: ProgramDay;
  onExit: () => void;
  onViewExercise?: (exerciseId: string) => void;
  defaultFormCheckEnabled?: boolean;
  loadSuggestions?: ExerciseLoadSuggestion[];
}

const WorkoutSessionView: React.FC<WorkoutSessionViewProps> = ({ 
  programDay, 
  onExit, 
  onViewExercise,
  defaultFormCheckEnabled,
  loadSuggestions = []
}) => {
  // Initialize session state once on mount using lazy initializer
  const [session, setSession] = useState<WorkoutSessionState>(() => {
    const sets: WorkoutSetState[] = [];
    
    programDay.exercises.forEach((exercise) => {
      // Find load suggestion for this exercise
      const suggestion = loadSuggestions.find((s) => s.exerciseId === exercise.id);
      const targetLoadKg = suggestion?.suggestedLoadKg ?? undefined;
      
      for (let i = 0; i < exercise.sets; i++) {
        sets.push({
          id: `${exercise.id}-set-${i}`,
          exerciseId: exercise.id,
          setIndex: i,
          targetReps: exercise.reps,
          targetLoadKg,
          status: 'pending',
        });
      }
    });

    return {
      id: `session-${Date.now()}`,
      programDay,
      startedAt: new Date().toISOString(),
      status: 'in_progress',
      sets,
    };
  });

  // Track the last completed set for rest timer and coaching hints
  const [lastCompletedSet, setLastCompletedSet] = useState<WorkoutSetState | null>(null);
  const [restTimerActive, setRestTimerActive] = useState(false);

  // Form check (camera + pose) state
  const [formCheckEnabled, setFormCheckEnabled] = useState(
    defaultFormCheckEnabled ?? false
  );
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [liveAngles, setLiveAngles] = useState<DerivedAngle[]>([]);
  
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Pose detection effect
  useEffect(() => {
    if (!formCheckEnabled || !videoElementRef.current) {
      // Stop detection loop
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setLiveAngles([]);
      return;
    }

    let isActive = true;

    // Load model and start detection loop
    const startDetection = async () => {
      try {
        await loadPoseModel();
        
        const detectLoop = async () => {
          if (!isActive || !videoElementRef.current) {
            return;
          }

          try {
            // Estimate pose from video
            const keypoints = await estimatePose(videoElementRef.current);
            
            // Calculate angles from keypoints
            const angles = calculateAngles(keypoints);
            
            // Update state
            setLiveAngles(angles);
          } catch (error) {
            console.error('Pose detection error:', error);
          }

          // Continue loop
          if (isActive) {
            animationFrameRef.current = requestAnimationFrame(detectLoop);
          }
        };

        // Start the loop
        detectLoop();
      } catch (error) {
        console.error('Failed to start pose detection:', error);
        setCameraError('Failed to load pose detection model');
      }
    };

    startDetection();

    // Cleanup
    return () => {
      isActive = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [formCheckEnabled]);
  const [liveAngles, setLiveAngles] = useState<DerivedAngle[]>([]);
  
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const handleUpdateSet = (setId: string, updates: Partial<WorkoutSetState>) => {
    if (!session) return;

    setSession((prev) => {
      if (!prev) return prev;
      
      const updatedSets = prev.sets.map((set) =>
        set.id === setId ? { ...set, ...updates } : set
      );
      
      // Check if this update marked a set as completed
      const updatedSet = updatedSets.find((s) => s.id === setId);
      if (updatedSet && updates.status === 'completed') {
        setLastCompletedSet(updatedSet);
        setRestTimerActive(true);
      }
      
      return {
        ...prev,
        sets: updatedSets,
      };
    });
  };

  const handleFinishWorkout = () => {
    if (!session) return;

    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        status: 'completed',
        endedAt: new Date().toISOString(),
      };
    });

    // Build history entry from current session
    const historyEntry: WorkoutHistoryEntry = {
      id: `${programDay.id}-${Date.now()}`,
      completedAt: new Date().toISOString(),
      programDayId: programDay.id,
      dayOfWeek: programDay.dayOfWeek,
      focus: programDay.focus,
      exercises: programDay.exercises.map((exercise) => {
        const exerciseSets = session.sets.filter((s) => s.exerciseId === exercise.id);
        return {
          exerciseId: exercise.id,
          name: exercise.name,
          sets: exerciseSets,
        };
      }),
    };

    // Save to localStorage
    appendHistoryEntry(historyEntry);
    
    // Return to week view after a brief delay
    setTimeout(() => {
      onExit();
    }, 1500);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading workout...</p>
      </div>
    );
  }

  const dayLabels: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  };

  const focusLabels: Record<string, string> = {
    upper: 'Upper Body',
    lower: 'Lower Body',
    full: 'Full Body',
    conditioning: 'Conditioning',
    other: 'Training',
  };

  const completedSets = session.sets.filter((s) => s.status === 'completed').length;
  const totalSets = session.sets.length;
  const allSetsComplete = completedSets === totalSets;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={onExit}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            {session.status === 'completed' && (
              <span className="text-green-700 font-medium">✓ Completed</span>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">
            {dayLabels[programDay.dayOfWeek]} – {focusLabels[programDay.focus]}
          </h1>
          
          {programDay.description && (
            <p className="text-gray-600 mt-1">{programDay.description}</p>
          )}

          {/* Progress */}
          <div className="mt-4 bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-600">
                {completedSets} / {totalSets} sets
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedSets / totalSets) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Form Check (beta) */}
        {session.status === 'in_progress' && (
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Form Check (beta)</h2>
                <p className="text-xs text-gray-500">Enable camera to preview form feedback</p>
              </div>
              <button
                onClick={() => {
                  setFormCheckEnabled(!formCheckEnabled);
                  if (formCheckEnabled) {
                    setCameraError(null);
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  formCheckEnabled
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {formCheckEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>

            {formCheckEnabled && (
              <div className="space-y-4">
                <div>
                  <CameraPreview 
                    isActive={true} 
                    onError={setCameraError}
                    onVideoReady={(video) => {
                      videoElementRef.current = video;
                    }}
                  />
                  {cameraError && (
                    <p className="text-xs text-red-600 mt-2">
                      Error: {cameraError}
                    </p>
                  )}
                </div>
                <PoseDebugPanel 
                  exerciseId={programDay.exercises[0]?.id || 'unknown'}
                  exerciseName={programDay.exercises[0]?.name || 'Exercise'}
                  angles={liveAngles}
                />
              </div>
            )}
          </div>
        )}

        {/* Exercises */}
        <div className="space-y-4">
          {programDay.exercises.map((exercise) => {
            const exerciseSets = session.sets.filter((s) => s.exerciseId === exercise.id);
            return (
              <ExerciseBlock
                key={exercise.id}
                exercise={exercise}
                sets={exerciseSets}
                onUpdateSet={handleUpdateSet}
                onViewExercise={onViewExercise}
              />
            );
          })}
        </div>

        {/* Rest & Coaching */}
        {session.status === 'in_progress' && lastCompletedSet && (
          <div className="mt-6 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Rest & Coaching</h2>
            
            <RestTimer
              durationSeconds={90}
              isActive={restTimerActive}
              onComplete={() => setRestTimerActive(false)}
              onCancel={() => setRestTimerActive(false)}
            />
            
            {(() => {
              const hint = getSetHint(lastCompletedSet);
              if (hint) {
                return (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <span className="font-medium">💡 Tip:</span> {hint}
                    </p>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {/* Finish button */}
        {session.status === 'in_progress' && (
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-4">
            <button
              onClick={handleFinishWorkout}
              disabled={!allSetsComplete}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                allSetsComplete
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {allSetsComplete ? 'Finish Workout' : `Complete all sets to finish (${completedSets}/${totalSets})`}
            </button>
            {!allSetsComplete && (
              <p className="text-xs text-gray-500 text-center mt-2">
                You can skip sets if needed
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutSessionView;
