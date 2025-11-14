import { useState } from 'react'
import ProgramWeekView from './features/program/ProgramWeekView'
import WorkoutSessionView from './features/workout/WorkoutSessionView'
import ExerciseDetailView from './features/exercise/ExerciseDetailView'
import WorkoutHistoryView from './features/history/WorkoutHistoryView'
import type { ProgramDay } from './features/program/types'
// import OnboardingWizard from './features/onboarding/OnboardingWizard'
import './App.css'

type MainView = 'program' | 'history';

function App() {
  const [mainView, setMainView] = useState<MainView>('program');
  const [activeDay, setActiveDay] = useState<ProgramDay | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);

  // Render precedence:
  // 1. If viewing exercise details, show ExerciseDetailView
  if (activeExerciseId) {
    return (
      <ExerciseDetailView
        exerciseId={activeExerciseId}
        onClose={() => setActiveExerciseId(null)}
      />
    );
  }

  // 2. If a day is active, show the workout session view
  if (activeDay) {
    return (
      <WorkoutSessionView 
        programDay={activeDay} 
        onExit={() => setActiveDay(null)}
        onViewExercise={setActiveExerciseId}
      />
    );
  }

  // 3. Otherwise show the main view with navigation
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2">
          <button
            onClick={() => setMainView('program')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mainView === 'program'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Program
          </button>
          <button
            onClick={() => setMainView('history')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mainView === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Main content */}
      {mainView === 'program' ? (
        <ProgramWeekView 
          onStartDay={setActiveDay}
          onViewExercise={setActiveExerciseId}
        />
      ) : (
        <WorkoutHistoryView />
      )}
    </div>
  );
  
  // To see onboarding again, comment out the above and uncomment below:
  // return <OnboardingWizard />
}

export default App
