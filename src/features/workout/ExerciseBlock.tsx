import React from 'react';
import type { ProgramExercise } from '../program/types';
import type { WorkoutSetState } from './types';

interface ExerciseBlockProps {
  exercise: ProgramExercise;
  sets: WorkoutSetState[];
  onUpdateSet: (setId: string, updates: Partial<WorkoutSetState>) => void;
  onViewExercise?: (exerciseId: string) => void;
}

const ExerciseBlock: React.FC<ExerciseBlockProps> = ({ exercise, sets, onUpdateSet, onViewExercise }) => {
  // Check if any set has a suggested load
  const suggestedLoadKg = sets[0]?.targetLoadKg;
  const suggestedLoadLbs = suggestedLoadKg ? Math.round(suggestedLoadKg * 2.20462) : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      {/* Exercise header */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900">{exercise.name}</h3>
            <p className="text-sm text-gray-600">
              Target: {exercise.sets} sets × {exercise.reps} reps
            </p>
            {suggestedLoadLbs && (
              <p className="text-sm text-green-700 font-medium mt-1">
                Suggested load: {suggestedLoadLbs} lbs
              </p>
            )}
            {exercise.notes && (
              <p className="text-sm text-gray-500 mt-1 italic">{exercise.notes}</p>
            )}
          </div>
          {onViewExercise && (
            <button
              onClick={() => onViewExercise(exercise.id)}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium border border-blue-300 rounded hover:bg-blue-50 transition-colors"
            >
              View Details
            </button>
          )}
        </div>
      </div>

      {/* Sets list */}
      <div className="space-y-3">
        {sets.map((set) => (
          <div
            key={set.id}
            className={`border rounded-lg p-3 ${
              set.status === 'completed'
                ? 'bg-green-50 border-green-300'
                : set.status === 'skipped'
                ? 'bg-gray-100 border-gray-300'
                : 'bg-white border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="font-medium text-gray-900">Set {set.setIndex + 1}</span>
                <span className="text-sm text-gray-600 ml-2">
                  Target: {set.targetReps} reps
                </span>
              </div>
              {set.status === 'completed' && (
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                  ✓ Complete
                </span>
              )}
              {set.status === 'skipped' && (
                <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2 py-1 rounded">
                  Skipped
                </span>
              )}
            </div>

            {set.status === 'pending' && (
              <div className="space-y-3">
                {/* Input fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor={`reps-${set.id}`} className="block text-xs font-medium text-gray-700 mb-1">
                      Reps Performed
                    </label>
                    <input
                      id={`reps-${set.id}`}
                      type="number"
                      min="0"
                      value={set.performedReps ?? ''}
                      onChange={(e) =>
                        onUpdateSet(set.id, {
                          performedReps: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 8"
                    />
                  </div>

                  <div>
                    <label htmlFor={`load-${set.id}`} className="block text-xs font-medium text-gray-700 mb-1">
                      Load (kg) - Optional
                    </label>
                    <input
                      id={`load-${set.id}`}
                      type="number"
                      min="0"
                      step="0.5"
                      value={set.performedLoadKg ?? ''}
                      onChange={(e) =>
                        onUpdateSet(set.id, {
                          performedLoadKg: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 60"
                    />
                  </div>

                  <div>
                    <label htmlFor={`rpe-${set.id}`} className="block text-xs font-medium text-gray-700 mb-1">
                      RPE (1-10) - Optional
                    </label>
                    <select
                      id={`rpe-${set.id}`}
                      value={set.rpe ?? ''}
                      onChange={(e) =>
                        onUpdateSet(set.id, {
                          rpe: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select RPE</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rpe) => (
                        <option key={rpe} value={rpe}>
                          {rpe}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdateSet(set.id, { status: 'completed' })}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors"
                  >
                    Mark Complete
                  </button>
                  <button
                    onClick={() => onUpdateSet(set.id, { status: 'skipped' })}
                    className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            {/* Display completed/skipped set data */}
            {set.status !== 'pending' && (
              <div className="flex items-center gap-4 text-sm text-gray-700">
                {set.performedReps && <span>Reps: {set.performedReps}</span>}
                {set.performedLoadKg && <span>Load: {set.performedLoadKg} kg</span>}
                {set.rpe && <span>RPE: {set.rpe}</span>}
                {set.status !== 'skipped' && (
                  <button
                    onClick={() => onUpdateSet(set.id, { status: 'pending' })}
                    className="ml-auto text-xs text-blue-600 hover:text-blue-700 underline"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseBlock;
