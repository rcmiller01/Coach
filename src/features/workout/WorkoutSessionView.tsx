import React, { useState, useEffect, useRef } from 'react';
import type { ProgramDay, BlockGoal } from '../program/types';
import type { WorkoutSessionState, WorkoutSetState } from './types';
import { getSetHint } from './coachingHints';
import { loadPoseModel, estimatePose } from '../pose/detector/poseDetector';
import { calculateAngles } from '../pose/detector/angleCalculator';
import { RepCounter, detectExercisePattern } from './repCounter';
import { appendHistoryEntry } from '../history/historyStorage';
import type { WorkoutHistoryEntry } from '../history/types';
import type { ExerciseLoadSuggestion } from '../progression/progressionTypes';
import type { ActualExerciseLoad } from '../progression/actualLoads';
import type { DerivedAngle } from '../pose/poseTypes';
import SessionHud from './SessionHud';
import SessionSummary from './SessionSummary';
import FormCheckSection from './mobile/FormCheckSection';
import ExerciseFocusCard from './mobile/ExerciseFocusCard';
import BetweenExerciseRest from './mobile/BetweenExerciseRest';
import { SessionControlBar } from './mobile/SessionControlBar';
import { WarmupView } from './WarmupView';

interface WorkoutSessionViewProps {
  programDay: ProgramDay;
  onExit: () => void;
  onViewExercise?: (exerciseId: string) => void;
  onSubstituteExercise?: (dayId: string, exerciseId: string, newExerciseName: string) => void;
  defaultFormCheckEnabled?: boolean;
  restTimeBetweenExercises?: number; // seconds, default 90
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
  restTimeBetweenExercises = 90,
  loadSuggestions,
  weekNumber,
  trainingPhase,
  blockGoal,
  previousWeekLoads,
}) => {
  // Initialize session state once on mount using lazy initializer
  const [session, setSession] = useState<WorkoutSessionState>(() => {
    const sets: WorkoutSetState[] = [];

    // Initialize warmup sets
    if (programDay.warmup && programDay.warmup.length > 0) {
      programDay.warmup.forEach((step, index) => {
        sets.push({
          id: step.id,
          exerciseId: step.exerciseId,
          exerciseName: step.name,
          setIndex: index,
          targetReps: '0',
          durationSeconds: step.durationSeconds,
          isWarmup: true,
          status: 'pending',
        });
      });
    }

    programDay.exercises.forEach((exercise) => {
      // Find load suggestion for this exercise
      const suggestion = loadSuggestions?.find((s) => s.exerciseId === exercise.id);
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


  // Warmup phase state
  const [isWarmupPhase, setIsWarmupPhase] = useState(() =>
    programDay.warmup && programDay.warmup.length > 0
  );

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
      setRestTimeRemaining(restTimeBetweenExercises); // Use setting value

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

  const handleWarmupComplete = () => {
    setIsWarmupPhase(false);
    // Reset any warmup-specific state if needed
  };

  const handleSwapWarmup = (stepId: string, newExerciseId: string) => {
    // Placeholder for swap logic
    // In a real app, we'd look up the new exercise details and update the session state
    console.log('Swap warmup step', stepId, 'to', newExerciseId);

    // Update the set in session state
    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sets: prev.sets.map(s => {
          if (s.id === stepId) {
            return {
              ...s,
              exerciseId: newExerciseId,
              exerciseName: 'Alternative Exercise', // We'd need to look this up
            };
          }
          return s;
        })
      };
    });
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



  const focusLabels: Record<string, string> = {
    upper: 'Upper Body',
    lower: 'Lower Body',
    full: 'Full Body',
    conditioning: 'Conditioning',
    other: 'Training',
  };

  const completedSets = session.sets.filter((s) => s.status === 'completed').length;
  const totalSets = session.sets.length;
  const currentExercise = programDay.exercises[currentExerciseIndex];
  const currentExerciseSets = session.sets.filter((s) => s.exerciseId === currentExercise?.id);

  // Find load suggestion for current exercise
  const currentLoadSuggestion = loadSuggestions?.find((s) => s.exerciseId === currentExercise?.id);

  // Show completed session summary
  if (session.status === 'completed') {
    return <SessionSummary session={session} programDay={programDay} onFinish={onExit} />;
  }

  // Warmup Phase
  if (isWarmupPhase) {
    return (
      <WarmupView
        sets={session.sets.filter(s => s.isWarmup)}
        onUpdateSet={handleUpdateSet}
        onComplete={handleWarmupComplete}
        onSwap={handleSwapWarmup}
      />
    );
  }

  // Between-exercise rest overlay (full screen)
  if (betweenExerciseRest && currentExerciseIndex < programDay.exercises.length - 1) {
    const nextExercise = programDay.exercises[currentExerciseIndex + 1];
    return (
      <BetweenExerciseRest
        restTimeRemaining={restTimeRemaining}
        nextExerciseName={nextExercise.name}
        nextExerciseSets={nextExercise.sets}
        nextExerciseReps={nextExercise.reps}
        onSkipRest={handleSkipRestAndAdvance}
      />
    );
  }

  // Main workout view - mobile-first layout
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-md mx-auto px-3 pt-3 pb-40 flex flex-col gap-3">

        {/* Session HUD */}
        <SessionHud
          currentExerciseIndex={currentExerciseIndex}
          totalExercises={programDay.exercises.length}
          currentExerciseName={currentExercise?.name || 'Exercise'}
          completedSets={completedSets}
          totalSets={totalSets}
          blockGoal={blockGoal}
          trainingPhase={trainingPhase}
          weekNumber={weekNumber}
          sessionName={focusLabels[programDay.focus]}
          onBack={onExit}
        />

        {/* Form Check Section (collapsible) */}
        <FormCheckSection
          isEnabled={formCheckEnabled}
          onToggle={(enabled) => {
            setFormCheckEnabled(enabled);
            if (!enabled) {
              setCameraError(null);
              setRepCountingEnabled(false);
              setCurrentRepCount(0);
              repCounterRef.current = null;
            }
          }}
          onVideoReady={(video) => {
            videoElementRef.current = video;
          }}
          onError={setCameraError}
          cameraError={cameraError}
          liveAngles={liveAngles}
          currentExerciseId={currentExercise?.id}
          currentExerciseName={currentExercise?.name}
          repCountingEnabled={repCountingEnabled}
          currentRepCount={currentRepCount}
          onToggleRepCounting={(enabled) => {
            setRepCountingEnabled(enabled);

            if (enabled && currentExercise) {
              const pattern = detectExercisePattern(currentExercise.name);
              repCounterRef.current = new RepCounter(pattern);
              setCurrentRepCount(0);
            } else {
              repCounterRef.current = null;
              setCurrentRepCount(0);
            }
          }}
          onApplyReps={(count) => {
            const pendingSet = session.sets.find(s => s.status === 'pending');
            if (pendingSet) {
              handleUpdateSet(pendingSet.id, { performedReps: count });
            }
          }}
          onResetCounter={() => {
            repCounterRef.current?.reset();
            setCurrentRepCount(0);
          }}
          repPhase={repCounterRef.current?.getCurrentPhase()}
        />

        {/* Current Exercise Focus Card */}
        {currentExercise && (
          <ExerciseFocusCard
            exercise={currentExercise}
            exerciseSets={currentExerciseSets}
            onUpdateSet={handleUpdateSet}
            onViewExercise={onViewExercise}
            onSubstituteExercise={(exerciseId) => {
              if (onSubstituteExercise) {
                // Trigger substitution modal (implementation depends on your modal system)
                // For now, this is a placeholder
                console.log('Substitute exercise:', exerciseId);
              }
            }}
            targetLoadKg={currentLoadSuggestion?.suggestedLoadKg}
          />
        )}

        {/* Navigation Controls */}
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentExerciseIndex(prev => Math.max(0, prev - 1))}
            disabled={currentExerciseIndex === 0}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${currentExerciseIndex === 0
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-slate-800 text-white active:bg-slate-700'
              }`}
          >
            ← Previous
          </button>
          <button
            onClick={() => setCurrentExerciseIndex(prev => Math.min(programDay.exercises.length - 1, prev + 1))}
            disabled={currentExerciseIndex === programDay.exercises.length - 1}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${currentExerciseIndex === programDay.exercises.length - 1
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-slate-800 text-white active:bg-slate-700'
              }`}
          >
            Next →
          </button>
        </div>

        {/* Finish Workout Button */}
        <button
          onClick={handleFinishWorkout}
          className="w-full py-4 bg-green-600 active:bg-green-700 text-white font-semibold rounded-lg text-lg transition-colors"
        >
          Finish Workout
        </button>

      </div>

      {/* Sticky Bottom Control Bar */}
      {(() => {
        // Find the next pending set in the current exercise
        const pendingSet = currentExerciseSets.find(s => s.status === 'pending');

        if (!pendingSet) return null; // All sets complete for this exercise

        // Calculate which set number this is (1-indexed)
        const setNumber = pendingSet.setIndex + 1;
        const totalSetsForExercise = currentExerciseSets.length;

        const handleMarkComplete = () => {
          // Mark as completed with target reps if no specific reps were entered
          const updates: Partial<WorkoutSetState> = {
            status: 'completed',
            performedReps: pendingSet.performedReps ?? pendingSet.targetReps,
            performedLoadKg: pendingSet.performedLoadKg ?? pendingSet.targetLoadKg,
          };
          handleUpdateSet(pendingSet.id, updates);
        };

        const handleSkip = () => {
          handleUpdateSet(pendingSet.id, { status: 'skipped' });
        };

        return (
          <SessionControlBar
            currentSet={{
              exerciseName: currentExercise?.name || 'Exercise',
              setNumber,
              totalSets: totalSetsForExercise,
            }}
            onMarkComplete={handleMarkComplete}
            onSkip={handleSkip}
            isDisabled={false}
          />
        );
      })()}
    </div>
  );
};

export default WorkoutSessionView;
