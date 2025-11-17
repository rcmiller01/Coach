import React from 'react';
import type { ProgramExercise } from '../../program/types';
import type { WorkoutSetState } from '../types';
import ExerciseBlock from '../ExerciseBlock';

interface ExerciseFocusCardProps {
  exercise: ProgramExercise;
  exerciseSets: WorkoutSetState[];
  onUpdateSet: (setId: string, updates: Partial<WorkoutSetState>) => void;
  onViewExercise?: (exerciseId: string) => void;
  onSubstituteExercise?: (exerciseId: string) => void;
  targetLoadKg?: number;
}

/**
 * ExerciseFocusCard - Single exercise display for mobile focus mode
 * Full-width, large touch targets, clear hierarchy
 */
const ExerciseFocusCard: React.FC<ExerciseFocusCardProps> = ({
  exercise,
  exerciseSets,
  onUpdateSet,
  onViewExercise,
  onSubstituteExercise,
  targetLoadKg,
}) => {
  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800">
      {/* Exercise header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2 className="text-xl font-bold text-white flex-1">
            {exercise.name}
          </h2>
          {onSubstituteExercise && (
            <button
              onClick={() => onSubstituteExercise(exercise.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 active:bg-slate-700 whitespace-nowrap"
            >
              Swap
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span>{exercise.sets} sets × {exercise.reps} reps</span>
          {targetLoadKg && (
            <>
              <span>•</span>
              <span>{targetLoadKg} kg suggested</span>
            </>
          )}
        </div>

        {onViewExercise && (
          <button
            onClick={() => onViewExercise(exercise.id)}
            className="mt-2 text-xs text-blue-400 active:text-blue-300"
          >
            View technique tips →
          </button>
        )}
      </div>

      {/* Exercise sets - delegated to ExerciseBlock */}
      <div className="p-3">
        <ExerciseBlock
          exercise={exercise}
          sets={exerciseSets}
          onUpdateSet={onUpdateSet}
        />
      </div>
    </div>
  );
};

export default ExerciseFocusCard;
