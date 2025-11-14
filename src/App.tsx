import { useState } from 'react'
import ProgramWeekView from './features/program/ProgramWeekView'
import WorkoutSessionView from './features/workout/WorkoutSessionView'
import type { ProgramDay } from './features/program/types'
// import OnboardingWizard from './features/onboarding/OnboardingWizard'
import './App.css'

function App() {
  const [activeDay, setActiveDay] = useState<ProgramDay | null>(null);

  // If a day is active, show the workout session view
  if (activeDay) {
    return (
      <WorkoutSessionView 
        programDay={activeDay} 
        onExit={() => setActiveDay(null)}
      />
    );
  }

  // Otherwise show the program week view
  return <ProgramWeekView onStartDay={setActiveDay} />
  
  // To see onboarding again, comment out the above and uncomment below:
  // return <OnboardingWizard />
}

export default App
