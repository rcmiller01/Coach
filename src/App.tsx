import { useState } from 'react'
import ProgramWeekView from './features/program/ProgramWeekView'
import WorkoutSessionView from './features/workout/WorkoutSessionView'
import ExerciseDetailView from './features/exercise/ExerciseDetailView'
import type { ProgramDay } from './features/program/types'
// import OnboardingWizard from './features/onboarding/OnboardingWizard'
import './App.css'

function App() {
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

  // 3. Otherwise show the program week view
  return (
    <ProgramWeekView 
      onStartDay={setActiveDay}
      onViewExercise={setActiveExerciseId}
    />
  );
  
  // To see onboarding again, comment out the above and uncomment below:
  // return <OnboardingWizard />
}

export default App
