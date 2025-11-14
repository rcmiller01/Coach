import React, { useState } from 'react';
import { mockProgramWeek } from './mockProgramWeek';
import type { ProgramWeek, ProgramDay, ProgramExercise } from './types';
import ProgramDayCard from './ProgramDayCard';
import type { ExerciseMetadata } from './exercise-substitution/types';
import { findSubstitutes } from './exercise-substitution/findSubstitutes';
import SubstitutionModal from './exercise-substitution/SubstitutionModal';

interface ProgramWeekViewProps {
  onStartDay?: (day: ProgramDay) => void;
  onViewExercise?: (exerciseId: string) => void;
}

const ProgramWeekView: React.FC<ProgramWeekViewProps> = ({ onStartDay, onViewExercise }) => {
  const [programWeek, setProgramWeek] = useState<ProgramWeek>(mockProgramWeek);
  const [selectedExercise, setSelectedExercise] = useState<{
    dayId: string;
    exerciseId: string;
    exercise: ProgramExercise;
  } | null>(null);
  const [substituteCandidates, setSubstituteCandidates] = useState<ExerciseMetadata[]>([]);

  // Mock user equipment - in production this would come from user profile
  const userEquipment = ['barbell', 'dumbbell', 'bodyweight'];

  const formatWeekDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const handleSubstituteClick = (dayId: string, exerciseId: string, exercise: ProgramExercise) => {
    // Find substitutes using the exercise name as metadata lookup
    const candidates = findSubstitutes(
      { id: exerciseId, name: exercise.name, primaryMuscle: 'legs', equipment: 'barbell', movement: 'squat' },
      userEquipment
    );
    
    setSelectedExercise({ dayId, exerciseId, exercise });
    setSubstituteCandidates(candidates);
  };

  const handleSelectSubstitute = (replacement: ExerciseMetadata) => {
    if (!selectedExercise) return;

    setProgramWeek((prev) => ({
      ...prev,
      days: prev.days.map((day) =>
        day.id === selectedExercise.dayId
          ? {
              ...day,
              exercises: day.exercises.map((ex) =>
                ex.id === selectedExercise.exerciseId
                  ? { ...ex, name: replacement.name }
                  : ex
              ),
            }
          : day
      ),
    }));

    setSelectedExercise(null);
    setSubstituteCandidates([]);
  };

  const handleCloseModal = () => {
    setSelectedExercise(null);
    setSubstituteCandidates([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            This Week
          </h1>
          <p className="text-gray-600">
            Week of {formatWeekDate(mockProgramWeek.weekStartDate)}
          </p>
          {mockProgramWeek.focus && (
            <p className="mt-2 text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <span className="font-medium">Focus:</span> {mockProgramWeek.focus}
            </p>
          )}
        </div>

        {/* Training Days */}
        <div className="space-y-4">
          {programWeek.days.map((day) => (
            <ProgramDayCard
              key={day.id}
              day={day}
              onSubstitute={(exerciseId, exercise) => 
                handleSubstituteClick(day.id, exerciseId, exercise)
              }
              onStartWorkout={onStartDay ? () => onStartDay(day) : undefined}
              onViewExercise={onViewExercise}
            />
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8 p-4 bg-white rounded-lg shadow border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">Week Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Training Days:</span>{' '}
              <span className="font-medium text-gray-900">
                {programWeek.days.length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Total Exercises:</span>{' '}
              <span className="font-medium text-gray-900">
                {programWeek.days.reduce(
                  (sum, day) => sum + day.exercises.length,
                  0
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Substitution Modal */}
        {selectedExercise && (
          <SubstitutionModal
            exercise={selectedExercise.exercise}
            candidates={substituteCandidates}
            onSelect={handleSelectSubstitute}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </div>
  );
};

export default ProgramWeekView;
