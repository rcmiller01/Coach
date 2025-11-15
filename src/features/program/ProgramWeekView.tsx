import React, { useState } from 'react';
import type { ProgramWeek, ProgramDay, ProgramExercise, TrainingBlock } from './types';
import ProgramDayCard from './ProgramDayCard';
import type { ExerciseMetadata } from './exercise-substitution/types';
import { findSubstitutes } from './exercise-substitution/findSubstitutes';
import SubstitutionModal from './exercise-substitution/SubstitutionModal';
import WeeklyProgressSummary from './WeeklyProgressSummary';
import WeeklyDashboard from './WeeklyDashboard';
import { CoachInsightsPanel } from './CoachInsightsPanel';
import { BlockSummary } from './BlockSummary';
import { DietSummary } from '../nutrition/DietSummary';
import type { DietTargets } from '../nutrition/dietEngine';
import { 
  generateCoachInsights, 
  sortInsightsByPriority,
  type CoachInsightInputs 
} from './coachInsights';
import { 
  calculateWeeklyAdherence, 
  calculateWeeklyStress, 
  summarizeKeyLifts 
} from './weeklyAdherence';
import type { ExerciseLoadSuggestion } from '../progression/progressionTypes';
import type { ActualExerciseLoad } from '../progression/actualLoads';
import type { WorkoutHistoryEntry } from '../history/types';

interface ProgramWeekViewProps {
  week: ProgramWeek;
  onStartDay: (day: ProgramDay) => void;
  onViewExercise: (exerciseId: string) => void;
  loadSuggestions?: ExerciseLoadSuggestion[];
  currentWeekActualLoads?: ActualExerciseLoad[];
  previousWeekActualLoads?: ActualExerciseLoad[];
  currentWeekIndex?: number;
  totalWeeks?: number;
  onRenewWeek?: () => void;
  onNavigateToWeek?: (weekIndex: number) => void;
  allWeeks?: ProgramWeek[]; // All weeks for getting previous week
  history?: WorkoutHistoryEntry[]; // Workout history for dashboard
  blocks?: TrainingBlock[]; // Training blocks for block summary
  dietTargets?: DietTargets | null; // Diet/nutrition targets
}

const ProgramWeekView: React.FC<ProgramWeekViewProps> = ({ 
  week, 
  onStartDay, 
  onViewExercise,
  loadSuggestions = [],
  currentWeekActualLoads = [],
  previousWeekActualLoads = [],
  currentWeekIndex = 0,
  totalWeeks = 1,
  onRenewWeek,
  onNavigateToWeek,
  allWeeks = [],
  history = [],
  blocks = [],
  dietTargets = null,
}) => {
  const [programWeek, setProgramWeek] = useState<ProgramWeek>(week);
  const [selectedExercise, setSelectedExercise] = useState<{
    dayId: string;
    exerciseId: string;
    exercise: ProgramExercise;
  } | null>(null);
  const [substituteCandidates, setSubstituteCandidates] = useState<ExerciseMetadata[]>([]);
  const [showBlockSummary, setShowBlockSummary] = useState(false);
  const [blockToView, setBlockToView] = useState<TrainingBlock | null>(null);

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

  // Find the block that contains this week
  const currentBlock = blocks.find((block) => {
    if (block.endWeekIndex === null) {
      // Active block
      return currentWeekIndex >= block.startWeekIndex;
    }
    return currentWeekIndex >= block.startWeekIndex && currentWeekIndex <= block.endWeekIndex;
  });

  const handleViewBlockSummary = () => {
    if (currentBlock) {
      setBlockToView(currentBlock);
      setShowBlockSummary(true);
    }
  };

  const handleCloseBlockSummary = () => {
    setShowBlockSummary(false);
    setBlockToView(null);
  };

  const formatBlockGoal = (goal: string): string => {
    const goalMap: Record<string, string> = {
      strength: 'Strength',
      hypertrophy: 'Hypertrophy',
      general: 'General',
      return_to_training: 'Return to Training',
    };
    return goalMap[goal] || goal;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Week {currentWeekIndex + 1}
              </h1>
              {/* Training phase badge */}
              {programWeek.trainingPhase && (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    programWeek.trainingPhase === 'deload'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {programWeek.trainingPhase === 'deload' ? 'Deload' : 'Build'}
                </span>
              )}
              {/* Block goal badge */}
              {currentBlock && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                  {formatBlockGoal(currentBlock.goal)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Previous week button */}
              {onNavigateToWeek && currentWeekIndex > 0 && (
                <button
                  onClick={() => onNavigateToWeek(currentWeekIndex - 1)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <span>←</span>
                  <span>Previous</span>
                </button>
              )}
              {/* Next week button (navigate to existing week) */}
              {onNavigateToWeek && currentWeekIndex < totalWeeks - 1 && (
                <button
                  onClick={() => onNavigateToWeek(currentWeekIndex + 1)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <span>Next</span>
                  <span>→</span>
                </button>
              )}
              {/* Generate new week button */}
              {onRenewWeek && currentWeekIndex === totalWeeks - 1 && (
                <button
                  onClick={onRenewWeek}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <span>New Week</span>
                  <span>→</span>
                </button>
              )}
            </div>
          </div>
          <p className="text-gray-600">
            Week of {formatWeekDate(programWeek.weekStartDate)}
          </p>
          {programWeek.focus && (
            <p className="mt-2 text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <span className="font-medium">Focus:</span> {programWeek.focus}
            </p>
          )}
        </div>

        {/* Diet Summary - Show daily nutrition targets */}
        {dietTargets && (
          <div className="mb-6">
            <DietSummary targets={dietTargets} />
          </div>
        )}

        {/* View Block Summary Button */}
        {currentBlock && (
          <div className="mb-6">
            <button
              onClick={handleViewBlockSummary}
              className="w-full px-4 py-3 bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>📊</span>
              <span>View Block Summary (Block {currentBlock.startWeekIndex + 1})</span>
            </button>
          </div>
        )}

        {/* Coach Insights - Actionable coaching messages */}
        {(() => {
          const adherence = calculateWeeklyAdherence(programWeek, history);
          const previousWeek = currentWeekIndex > 0 && allWeeks.length > currentWeekIndex - 1 
            ? allWeeks[currentWeekIndex - 1] 
            : null;
          const stress = calculateWeeklyStress(programWeek, previousWeek, history);
          const keyLifts = summarizeKeyLifts(programWeek, previousWeek, history);

          const insightInputs: CoachInsightInputs = {
            weekNumber: currentWeekIndex + 1,
            phase: programWeek.trainingPhase || 'build',
            adherence,
            stress,
            keyLifts,
          };

          const insights = generateCoachInsights(insightInputs);
          const sortedInsights = sortInsightsByPriority(insights);

          return <CoachInsightsPanel insights={sortedInsights} maxDisplay={3} />;
        })()}

        {/* Weekly Dashboard - Bird's eye view of adherence and progress */}
        <WeeklyDashboard
          currentWeek={programWeek}
          currentWeekIndex={currentWeekIndex}
          previousWeek={currentWeekIndex > 0 && allWeeks.length > currentWeekIndex - 1 ? allWeeks[currentWeekIndex - 1] : null}
          history={history}
        />

        {/* Weekly Progress Summary */}
        <WeeklyProgressSummary
          currentWeekIndex={currentWeekIndex}
          currentWeekActualLoads={currentWeekActualLoads}
          previousWeekActualLoads={previousWeekActualLoads}
          currentWeekPhase={programWeek.trainingPhase}
        />

        {/* Training Days */}
        <div className="space-y-4">
          {programWeek.days.map((day) => (
            <ProgramDayCard
              key={day.id}
              day={day}
              onSubstitute={(exerciseId, exercise) => 
                handleSubstituteClick(day.id, exerciseId, exercise)
              }
              onStartWorkout={() => onStartDay(day)}
              onViewExercise={onViewExercise}
              loadSuggestions={loadSuggestions}
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

        {/* Block Summary Modal */}
        {showBlockSummary && blockToView && (
          <BlockSummary
            block={blockToView}
            allWeeks={allWeeks}
            history={history}
            onClose={handleCloseBlockSummary}
          />
        )}
      </div>
    </div>
  );
};

export default ProgramWeekView;
