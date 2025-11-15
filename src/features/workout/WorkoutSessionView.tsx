import React, { useState, useEffect, useRef } from 'react';
import type { ProgramDay, BlockGoal } from '../program/types';
import type { WorkoutSessionState, WorkoutSetState } from './types';
import ExerciseBlock from './ExerciseBlock';
import RestTimer from './RestTimer';
import { getSetHint } from './coachingHints';
import CameraPreview from '../pose/CameraPreview';
import PoseDebugPanel from '../pose/PoseDebugPanel';
import type { DerivedAngle } from '../pose/poseTypes';
import { loadPoseModel, estimatePose } from '../pose/detector/poseDetector';
import { calculateAngles } from '../pose/detector/angleCalculator';
import { RepCounter, detectExercisePattern } from './repCounter';
import { appendHistoryEntry } from '../history/historyStorage';
import type { WorkoutHistoryEntry } from '../history/types';
import type { ExerciseLoadSuggestion } from '../progression/progressionTypes';
import type { ActualExerciseLoad } from '../progression/actualLoads';
import SessionHud from './SessionHud';
import SessionSummary from './SessionSummary';

interface WorkoutSessionViewProps {
  programDay: ProgramDay;
  onExit: () => void;
  onViewExercise?: (exerciseId: string) => void;
  onSubstituteExercise?: (dayId: string, exerciseId: string, newExerciseName: string) => void;
  defaultFormCheckEnabled?: boolean;
  loadSuggestions?: ExerciseLoadSuggestion[];
  weekNumber?: number; // Current week number (1-indexed)
  trainingPhase?: 'build' | 'deload'; // Current training phase
  blockGoal?: BlockGoal; // Current block goal
  previousWeekLoads?: ActualExerciseLoad[]; // Last week's actual loads for comparison
}

const WorkoutSessionView: React.FC<WorkoutSessionViewProps> = ({ 
  programDay, 
  onExit, 
  onViewExercise,
  onSubstituteExercise,
  defaultFormCheckEnabled,
  loadSuggestions = [],
  weekNumber,
  trainingPhase,
  blockGoal,
  previousWeekLoads = []
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
  
  // Rep counting state
  const [repCountingEnabled, setRepCountingEnabled] = useState(false);
  const [currentRepCount, setCurrentRepCount] = useState(0);
  const repCounterRef = useRef<RepCounter | null>(null);
  
  // Focus mode: single-exercise workflow
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [betweenExerciseRest, setBetweenExerciseRest] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  
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
            
            // Rep counting logic
            if (repCountingEnabled && repCounterRef.current && angles.length > 0) {
              const repDetected = repCounterRef.current.update(angles);
              if (repDetected) {
                const newCount = repCounterRef.current.getCount();
                setCurrentRepCount(newCount);
              }
            }
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
        
        // Check if this was the last set of the current exercise
        const currentExercise = programDay.exercises[currentExerciseIndex];
        const currentExerciseSets = updatedSets.filter(s => s.exerciseId === currentExercise.id);
        const allCurrentSetsComplete = currentExerciseSets.every(s => s.status === 'completed' || s.status === 'skipped');
        
        if (allCurrentSetsComplete) {
          // Exercise complete - trigger transition
          handleExerciseCompleted();
        }
      }
      
      return {
        ...prev,
        sets: updatedSets,
      };
    });
  };

  const handleExerciseCompleted = () => {
    // Check if there's a next exercise
    if (currentExerciseIndex < programDay.exercises.length - 1) {
      // Start between-exercise rest
      setBetweenExerciseRest(true);
      setRestTimeRemaining(90); // 90 seconds between exercises
      
      // Reset rep counter
      if (repCounterRef.current) {
        repCounterRef.current.reset();
        setCurrentRepCount(0);
      }
    } else {
      // All exercises done - complete the session
      handleFinishWorkout();
    }
  };

  const handleSkipRestAndAdvance = () => {
    setBetweenExerciseRest(false);
    setRestTimeRemaining(0);
    setCurrentExerciseIndex(prev => prev + 1);
    
    // Initialize rep counter for new exercise
    if (repCountingEnabled) {
      const nextExercise = programDay.exercises[currentExerciseIndex + 1];
      if (nextExercise) {
        const pattern = detectExercisePattern(nextExercise.name);
        repCounterRef.current = new RepCounter(pattern);
        setCurrentRepCount(0);
      }
    }
  };

  // Between-exercise rest timer
  useEffect(() => {
    if (!betweenExerciseRest || restTimeRemaining <= 0) return;

    const interval = setInterval(() => {
      setRestTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-advance when timer hits 0
          clearInterval(interval);
          handleSkipRestAndAdvance();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [betweenExerciseRest, restTimeRemaining]);

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

  // Calculate average RPE from completed sets
  const completedSetsWithRpe = session.sets.filter((s) => s.status === 'completed' && s.rpe);
  const avgRpe = completedSetsWithRpe.length > 0
    ? completedSetsWithRpe.reduce((sum, s) => sum + (s.rpe || 0), 0) / completedSetsWithRpe.length
    : null;

  const formatBlockGoal = (goal: BlockGoal): string => {
    const goalMap: Record<BlockGoal, string> = {
      strength: 'Strength',
      hypertrophy: 'Hypertrophy',
      general: 'General',
      return_to_training: 'Return to Training',
    };
    return goalMap[goal];
  };

  // Show completed session summary
  if (session.status === 'completed') {
    return <SessionSummary session={session} programDay={programDay} onFinish={onExit} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 py-8">
        {/* Back button */}
        <div className="mb-6">
          <button
            onClick={onExit}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        {/* Session HUD */}
        <SessionHud
          currentExerciseIndex={currentExerciseIndex}
          totalExercises={programDay.exercises.length}
          currentExerciseName={programDay.exercises[currentExerciseIndex]?.name || 'Exercise'}
          completedSets={completedSets}
          totalSets={totalSets}
          blockGoal={blockGoal}
          trainingPhase={trainingPhase}
          weekNumber={weekNumber}
          nextExerciseName={
            currentExerciseIndex < programDay.exercises.length - 1
              ? programDay.exercises[currentExerciseIndex + 1]?.name
              : undefined
          }
        />

        {/* Hidden legacy header for reference */}
        <div className="hidden">
          {/* Session progress summary */}
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span className={`font-medium ${allSetsComplete ? 'text-green-700' : 'text-gray-700'}`}>
              {completedSets}/{totalSets} sets
            </span>
            {avgRpe && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-gray-700">Avg RPE: {avgRpe.toFixed(1)}</span>
              </>
            )}
          </div>
        </div>

        {/* Form Check & Rep Counting (beta) */}
        {session.status === 'in_progress' && (
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Form Check & Rep Counting (beta)</h2>
                <p className="text-xs text-gray-500">Enable camera for form feedback and automatic rep counting</p>
              </div>
              <button
                onClick={() => {
                  const newState = !formCheckEnabled;
                  setFormCheckEnabled(newState);
                  if (!newState) {
                    setCameraError(null);
                    setRepCountingEnabled(false);
                    setCurrentRepCount(0);
                    repCounterRef.current = null;
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  formCheckEnabled
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {formCheckEnabled ? 'Disable Camera' : 'Enable Camera'}
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

                {/* Rep Counting Controls */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Automatic Rep Counting</h3>
                      <p className="text-xs text-gray-500">Track reps automatically using pose detection</p>
                    </div>
                    <button
                      onClick={() => {
                        const newState = !repCountingEnabled;
                        setRepCountingEnabled(newState);
                        
                        if (newState) {
                          // Start counting - detect exercise pattern
                          const currentExercise = programDay.exercises[0]; // First exercise as default
                          const pattern = detectExercisePattern(currentExercise?.name || '');
                          repCounterRef.current = new RepCounter(pattern);
                          setCurrentRepCount(0);
                        } else {
                          // Stop counting
                          repCounterRef.current = null;
                          setCurrentRepCount(0);
                        }
                      }}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        repCountingEnabled
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {repCountingEnabled ? 'Stop Counting' : 'Start Counting'}
                    </button>
                  </div>

                  {repCountingEnabled && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-4xl font-bold text-green-700">{currentRepCount}</div>
                          <div className="text-sm text-green-600 mt-1">reps counted</div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              // Apply count to current pending set
                              const pendingSet = session.sets.find(s => s.status === 'pending');
                              if (pendingSet) {
                                handleUpdateSet(pendingSet.id, { performedReps: currentRepCount });
                              }
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
                          >
                            Apply to Current Set
                          </button>
                          <button
                            onClick={() => {
                              repCounterRef.current?.reset();
                              setCurrentRepCount(0);
                            }}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded transition-colors"
                          >
                            Reset Counter
                          </button>
                        </div>
                      </div>
                      {repCounterRef.current && (
                        <div className="mt-3 text-xs text-gray-600">
                          Phase: <span className="font-medium">{repCounterRef.current.getCurrentPhase()}</span>
                          {' • '}
                          <span className="text-gray-500">Exercise: {programDay.exercises[0]?.name || 'Unknown'}</span>
                        </div>
                      )}
                    </div>
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

        {/* Between-Exercise Rest Screen */}
        {betweenExerciseRest && currentExerciseIndex < programDay.exercises.length - 1 && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Exercise Complete! 🎉</h2>
              <p className="text-gray-600 mb-4">Take a breather before the next exercise</p>
              
              <div className="bg-white rounded-lg p-6 mb-4">
                <div className="text-6xl font-bold text-blue-600 mb-2">{restTimeRemaining}s</div>
                <div className="text-sm text-gray-600">Rest remaining</div>
              </div>
              
              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">Next exercise:</p>
                <p className="text-xl font-semibold text-gray-900">
                  {programDay.exercises[currentExerciseIndex + 1].name}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {programDay.exercises[currentExerciseIndex + 1].sets} sets × {programDay.exercises[currentExerciseIndex + 1].reps} reps
                </p>
              </div>
              
              <button
                onClick={handleSkipRestAndAdvance}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Skip Rest & Start Now
              </button>
            </div>
          </div>
        )}

        {/* Current Exercise (Focus Mode) */}
        {!betweenExerciseRest && session.status === 'in_progress' && (
          <div className="space-y-4">
            {/* Exercise Progress Indicator */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Exercise {currentExerciseIndex + 1} of {programDay.exercises.length}
                </span>
                <div className="flex gap-1">
                  {programDay.exercises.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-2 w-8 rounded-full ${
                        idx < currentExerciseIndex
                          ? 'bg-green-500'
                          : idx === currentExerciseIndex
                          ? 'bg-blue-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Quick navigation buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setCurrentExerciseIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentExerciseIndex === 0}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setCurrentExerciseIndex(prev => Math.min(programDay.exercises.length - 1, prev + 1))}
                  disabled={currentExerciseIndex === programDay.exercises.length - 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Current Exercise Card */}
            {(() => {
              const currentExercise = programDay.exercises[currentExerciseIndex];
              const exerciseSets = session.sets.filter((s) => s.exerciseId === currentExercise.id);
              const prevLoad = previousWeekLoads.find((load) => load.exerciseId === currentExercise.id);
              
              return (
                <ExerciseBlock
                  key={currentExercise.id}
                  exercise={currentExercise}
                  sets={exerciseSets}
                  onUpdateSet={handleUpdateSet}
                  onViewExercise={onViewExercise}
                  previousWeekLoad={prevLoad}
                />
              );
            })()}
          </div>
        )}

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
