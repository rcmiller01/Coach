import React from 'react';
import { loadHistory } from './historyStorage';

const WorkoutHistoryView: React.FC = () => {
  const entries = loadHistory();

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Workout History</h1>

        {entries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600 text-lg">
              No workouts logged yet. Complete a session to see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const completedSets = entry.exercises.flatMap((e) => e.sets).filter((s) => s.status === 'completed').length;
              const skippedSets = entry.exercises.flatMap((e) => e.sets).filter((s) => s.status === 'skipped').length;
              const pendingSets = entry.exercises.flatMap((e) => e.sets).filter((s) => s.status === 'pending').length;
              const totalSets = entry.exercises.flatMap((e) => e.sets).length;
              const totalExercises = entry.exercises.length;

              return (
                <div key={entry.id} className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
                  <div className="flex flex-col gap-2">
                    {/* Date */}
                    <p className="text-sm text-gray-500">
                      {new Date(entry.completedAt).toLocaleString()}
                    </p>

                    {/* Day + Focus */}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {dayLabels[entry.dayOfWeek] || entry.dayOfWeek} – {focusLabels[entry.focus] || entry.focus}
                    </h3>

                    {/* Summary */}
                    <p className="text-sm text-gray-700">
                      {totalExercises} {totalExercises === 1 ? 'exercise' : 'exercises'}, {totalSets}{' '}
                      {totalSets === 1 ? 'set' : 'sets'}
                      {completedSets > 0 && (
                        <span className="text-green-600 font-medium">
                          {' '}
                          ({completedSets} completed
                          {skippedSets > 0 && `, ${skippedSets} skipped`}
                          {pendingSets > 0 && `, ${pendingSets} pending`})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutHistoryView;
