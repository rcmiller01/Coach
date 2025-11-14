import React, { useState } from 'react';
import type { ProgramDay } from '../program/types';
import type { WorkoutSessionState, WorkoutSetState } from './types';
import ExerciseBlock from './ExerciseBlock';

interface WorkoutSessionViewProps {
  programDay: ProgramDay;
  onExit: () => void;
}

const WorkoutSessionView: React.FC<WorkoutSessionViewProps> = ({ programDay, onExit }) => {
  // Initialize session state once on mount using lazy initializer
  const [session, setSession] = useState<WorkoutSessionState>(() => {
    const sets: WorkoutSetState[] = [];
    
    programDay.exercises.forEach((exercise) => {
      for (let i = 0; i < exercise.sets; i++) {
        sets.push({
          id: `${exercise.id}-set-${i}`,
          exerciseId: exercise.id,
          setIndex: i,
          targetReps: exercise.reps,
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

  const handleUpdateSet = (setId: string, updates: Partial<WorkoutSetState>) => {
    if (!session) return;

    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sets: prev.sets.map((set) =>
          set.id === setId ? { ...set, ...updates } : set
        ),
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

    // Log the session for now (later this would save to backend)
    console.log('Workout session completed:', session);
    
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
              />
            );
          })}
        </div>

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
