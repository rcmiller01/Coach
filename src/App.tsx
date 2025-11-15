import { useState, useEffect } from 'react'
import ProgramWeekView from './features/program/ProgramWeekView'
import WorkoutSessionView from './features/workout/WorkoutSessionView'
import ExerciseDetailView from './features/exercise/ExerciseDetailView'
import WorkoutHistoryView from './features/history/WorkoutHistoryView'
import OnboardingWizard from './features/onboarding/OnboardingWizard'
import SettingsView from './features/settings/SettingsView'
import NutritionView from './features/nutrition/NutritionView'
import MealPlanView from './features/meals/MealPlanView'
import { generateProgramWeekFromOnboarding } from './features/program/programGenerator'
import { loadMultiWeekProgram, saveMultiWeekProgram, clearMultiWeekProgram } from './features/program/programStorage'
import { generateNextWeek } from './features/program/weekRenewal'
import { saveProfile, loadProfile, clearProfile } from './features/profile/profileStorage'
import { clearHistory, loadAllHistory } from './features/history/historyStorage'
import { loadSettings, saveSettings, type CoachSettings } from './features/settings/settingsStorage'
import { getLoadSuggestionsForExercises } from './features/progression/progressionEngine'
import { getActualLoadsForWeek, type ActualExerciseLoad } from './features/progression/actualLoads'
import { deriveNutritionProfileFromOnboarding, calculateNutritionTargets } from './features/nutrition/nutritionCalculator'
import { loadNutritionTargets, saveNutritionTargets } from './features/nutrition/nutritionStorage'
import { generateDailyMealPlan } from './features/meals/mealPlanGenerator'
import { loadMealPlan, saveMealPlan } from './features/meals/mealPlanStorage'
import type { DailyMealPlan } from './features/meals/mealTypes'
import type { NutritionTargets } from './features/nutrition/nutritionTypes'
import type { ProgramDay, ProgramWeek, ProgramMultiWeek } from './features/program/types'
import type { OnboardingState } from './features/onboarding/types'
import type { WorkoutHistoryEntry } from './features/history/types'
import type { ExerciseLoadSuggestion } from './features/progression/progressionTypes'
import './App.css'

type MainView = 'program' | 'history' | 'settings' | 'nutrition' | 'meals';

function App() {
  const [mainView, setMainView] = useState<MainView>('program');
  const [activeDay, setActiveDay] = useState<ProgramDay | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [multiWeekProgram, setMultiWeekProgram] = useState<ProgramMultiWeek | null>(null);
  const [settings, setSettings] = useState<CoachSettings>(() => loadSettings());
  const [nutritionTargets, setNutritionTargets] = useState<NutritionTargets | null>(null);
  const [mealPlan, setMealPlan] = useState<DailyMealPlan | null>(null);
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [loadSuggestions, setLoadSuggestions] = useState<ExerciseLoadSuggestion[]>([]);
  const [currentWeekActualLoads, setCurrentWeekActualLoads] = useState<ActualExerciseLoad[]>([]);
  const [previousWeekActualLoads, setPreviousWeekActualLoads] = useState<ActualExerciseLoad[]>([]);

  // Load saved profile on mount and generate program
  useEffect(() => {
    const savedProfile = loadProfile();
    if (savedProfile) {
      setOnboardingState(savedProfile);
      
      // Try to load existing multi-week program
      const savedMultiWeek = loadMultiWeekProgram();
      if (savedMultiWeek) {
        setMultiWeekProgram(savedMultiWeek);
      } else {
        // Generate initial week 1 if no multi-week program exists
        const week = generateProgramWeekFromOnboarding(savedProfile);
        const initialMultiWeek: ProgramMultiWeek = {
          currentWeekIndex: 0,
          weeks: [week],
        };
        setMultiWeekProgram(initialMultiWeek);
        saveMultiWeekProgram(initialMultiWeek);
      }

      // Load or calculate nutrition targets
      const savedNutrition = loadNutritionTargets();
      if (savedNutrition) {
        setNutritionTargets(savedNutrition);
      } else {
        const nutritionProfile = deriveNutritionProfileFromOnboarding(savedProfile);
        const targets = calculateNutritionTargets(nutritionProfile);
        setNutritionTargets(targets);
        saveNutritionTargets(targets);
      }
    }

    // Load today's meal plan
    const today = new Date().toISOString().slice(0, 10);
    const savedMealPlan = loadMealPlan(today);
    if (savedMealPlan) {
      setMealPlan(savedMealPlan);
    }

    // Load workout history
    const savedHistory = loadAllHistory();
    setHistory(savedHistory);
  }, []);

  // Compute load suggestions when program week or history changes
  useEffect(() => {
    if (!multiWeekProgram) return;
    
    const currentWeek = multiWeekProgram.weeks[multiWeekProgram.currentWeekIndex];
    
    // Collect all unique exercises from the current week
    const allExercises = currentWeek.days.flatMap((day) =>
      day.exercises.map((ex) => ({ id: ex.id, name: ex.name }))
    );
    
    // Get suggestions for current week (for workout session initialization)
    // Pass the training phase to adjust suggestions for deload weeks
    const suggestions = getLoadSuggestionsForExercises(
      history, 
      allExercises, 
      currentWeek.trainingPhase || 'build' // Default to 'build' for backward compatibility
    );
    setLoadSuggestions(suggestions);

    // Extract ACTUAL performed loads for progress tracking
    const currentActualLoads = getActualLoadsForWeek(history, currentWeek);
    setCurrentWeekActualLoads(currentActualLoads);

    // If we're on Week 2+, get actual loads from previous week
    if (multiWeekProgram.currentWeekIndex > 0) {
      const prevWeek = multiWeekProgram.weeks[multiWeekProgram.currentWeekIndex - 1];
      const prevActualLoads = getActualLoadsForWeek(history, prevWeek);
      setPreviousWeekActualLoads(prevActualLoads);
    } else {
      setPreviousWeekActualLoads([]);
    }
  }, [multiWeekProgram, history]);

  // Handle onboarding completion
  function handleOnboardingComplete(state: OnboardingState) {
    setOnboardingState(state);
    saveProfile(state);
    
    // Generate initial week 1 and create multi-week structure
    const week1 = generateProgramWeekFromOnboarding(state);
    const initialMultiWeek: ProgramMultiWeek = {
      currentWeekIndex: 0,
      weeks: [week1],
    };
    setMultiWeekProgram(initialMultiWeek);
    saveMultiWeekProgram(initialMultiWeek);

    // Calculate and save nutrition targets
    const nutritionProfile = deriveNutritionProfileFromOnboarding(state);
    const targets = calculateNutritionTargets(nutritionProfile);
    setNutritionTargets(targets);
    saveNutritionTargets(targets);

    setMainView('program');
  }

  // Handle settings update
  function handleUpdateSettings(next: CoachSettings) {
    setSettings(next);
    saveSettings(next);
  }

  // Handle profile reset
  function handleResetProfile() {
    clearProfile();
    clearMultiWeekProgram();
    setOnboardingState(null);
    setMultiWeekProgram(null);
    setNutritionTargets(null);
    setMainView('program');
  }

  // Handle clear history
  function handleClearHistory() {
    clearHistory();
    setHistory([]);
    // History view will show "no workouts logged yet" after this
  }

  // Handle meal plan generation
  function handleGenerateMealPlan() {
    if (!nutritionTargets) return;
    const today = new Date().toISOString().slice(0, 10);
    const plan = generateDailyMealPlan(nutritionTargets, today);
    saveMealPlan(plan);
    setMealPlan(plan);
  }

  // Handle week renewal (generate next week with progressive overload)
  function handleRenewWeek() {
    if (!multiWeekProgram) return;

    const currentWeek = multiWeekProgram.weeks[multiWeekProgram.currentWeekIndex];

    // Collect all exercises from current week
    const allExercises = currentWeek.days.flatMap((day) =>
      day.exercises.map((ex) => ({ id: ex.id, name: ex.name }))
    );

    // Get progressive overload suggestions
    const suggestions = getLoadSuggestionsForExercises(history, allExercises);

    // Generate next week (pass all weeks and history for phase detection)
    const nextWeek = generateNextWeek(
      currentWeek, 
      suggestions, 
      multiWeekProgram.weeks, 
      history
    );

    // Update multi-week program
    const updatedProgram: ProgramMultiWeek = {
      currentWeekIndex: multiWeekProgram.currentWeekIndex + 1,
      weeks: [...multiWeekProgram.weeks, nextWeek],
    };

    setMultiWeekProgram(updatedProgram);
    saveMultiWeekProgram(updatedProgram);
  }

  // Handle week navigation (go back to previous weeks)
  function handleNavigateToWeek(weekIndex: number) {
    if (!multiWeekProgram) return;
    if (weekIndex < 0 || weekIndex >= multiWeekProgram.weeks.length) return;

    const updatedProgram: ProgramMultiWeek = {
      ...multiWeekProgram,
      currentWeekIndex: weekIndex,
    };

    setMultiWeekProgram(updatedProgram);
    saveMultiWeekProgram(updatedProgram);
  }

  // Render precedence:
  // 1. If no program yet, show onboarding
  if (!multiWeekProgram) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  // 2. If viewing exercise details, show ExerciseDetailView
  if (activeExerciseId) {
    return (
      <ExerciseDetailView
        exerciseId={activeExerciseId}
        onClose={() => setActiveExerciseId(null)}
      />
    );
  }

  // 3. If a day is active, show the workout session view
  if (activeDay) {
    // Compute suggestions for this day's exercises
    const daySuggestions = activeDay.exercises.map((ex) => {
      const match = loadSuggestions.find((s) => s.exerciseId === ex.id);
      return match || {
        exerciseId: ex.id,
        exerciseName: ex.name,
        suggestedLoadKg: null,
        rationale: 'No data available yet.',
      };
    });

    return (
      <WorkoutSessionView 
        programDay={activeDay} 
        onExit={() => setActiveDay(null)}
        onViewExercise={setActiveExerciseId}
        defaultFormCheckEnabled={settings.defaultFormCheckEnabled}
        loadSuggestions={daySuggestions}
      />
    );
  }

  // 4. Otherwise show the main view with navigation
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
          <button
            onClick={() => setMainView('settings')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mainView === 'settings'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setMainView('nutrition')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mainView === 'nutrition'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Nutrition
          </button>
          <button
            onClick={() => setMainView('meals')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mainView === 'meals'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Meals
          </button>
        </div>
      </div>

      {/* Main content */}
      {mainView === 'program' ? (
        <ProgramWeekView 
          week={multiWeekProgram.weeks[multiWeekProgram.currentWeekIndex]}
          currentWeekIndex={multiWeekProgram.currentWeekIndex}
          totalWeeks={multiWeekProgram.weeks.length}
          onStartDay={setActiveDay}
          onViewExercise={setActiveExerciseId}
          loadSuggestions={loadSuggestions}
          currentWeekActualLoads={currentWeekActualLoads}
          previousWeekActualLoads={previousWeekActualLoads}
          onRenewWeek={handleRenewWeek}
          onNavigateToWeek={handleNavigateToWeek}
        />
      ) : mainView === 'history' ? (
        <WorkoutHistoryView />
      ) : mainView === 'nutrition' ? (
        <NutritionView targets={nutritionTargets} />
      ) : mainView === 'meals' ? (
        <MealPlanView
          mealPlan={mealPlan}
          onGenerate={handleGenerateMealPlan}
        />
      ) : (
        <SettingsView
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onResetProfile={handleResetProfile}
          onClearHistory={handleClearHistory}
        />
      )}
    </div>
  );
}

export default App
