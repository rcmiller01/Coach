import React, { useState } from 'react';
import type { ProgramDay, ProgramExercise } from './types';

interface ProgramDayCardProps {
  day: ProgramDay;
  onSubstitute?: (exerciseId: string, exercise: ProgramExercise) => void;
  onStartWorkout?: () => void;
  onViewExercise?: (exerciseId: string) => void;
}

const ProgramDayCard: React.FC<ProgramDayCardProps> = ({ day, onSubstitute, onStartWorkout, onViewExercise }) => {
  const [showAllExercises, setShowAllExercises] = useState(false);
  const totalSets = day.exercises.reduce((sum, ex) => sum + ex.sets, 0);

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

  return (
    <div
      className="bg-white rounded-lg shadow border border-gray-200 p-4"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {dayLabels[day.dayOfWeek]}
          </h3>
          <p className="text-sm text-blue-600 font-medium">{focusLabels[day.focus]}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{day.exercises.length}</div>
          <div className="text-xs text-gray-500">exercises</div>
        </div>
      </div>

      {day.description && (
        <p className="text-sm text-gray-600 mb-3">{day.description}</p>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>{day.exercises.length} exercises</span>
        <span>•</span>
        <span>{totalSets} total sets</span>
      </div>

      {/* Exercise preview */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <ul className="space-y-2">
          {(showAllExercises ? day.exercises : day.exercises.slice(0, 3)).map((exercise) => (
            <li key={exercise.id} className="text-sm text-gray-700">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-gray-400">•</span>
                  <span className="truncate">{exercise.name}</span>
                  <span className="text-gray-500 text-xs whitespace-nowrap">
                    {exercise.sets}×{exercise.reps}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {onViewExercise && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewExercise(exercise.id);
                      }}
                      className="text-xs text-gray-600 hover:text-gray-800 font-medium hover:underline whitespace-nowrap"
                    >
                      Details
                    </button>
                  )}
                  {onSubstitute && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSubstitute(exercise.id, exercise);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline whitespace-nowrap"
                    >
                      Substitute
                    </button>
                  )}
                </div>
              </div>
              {exercise.notes && (
                <p className="text-xs text-gray-500 ml-5 mt-1">{exercise.notes}</p>
              )}
            </li>
          ))}
        </ul>
        {day.exercises.length > 3 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAllExercises(!showAllExercises);
            }}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAllExercises 
              ? 'Show less' 
              : `+${day.exercises.length - 3} more...`
            }
          </button>
        )}
      </div>

      {/* Start Workout button */}
      {onStartWorkout && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={onStartWorkout}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
          >
            Start workout
          </button>
        </div>
      )}
    </div>
  );
};

export default ProgramDayCard;
