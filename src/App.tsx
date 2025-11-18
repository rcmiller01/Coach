import { useState, useEffect } from 'react'
import ProgramWeekView from './features/program/ProgramWeekView'
import WorkoutSessionView from './features/workout/WorkoutSessionView'
import ExerciseDetailView from './features/exercise/ExerciseDetailView'
import WorkoutHistoryView from './features/history/WorkoutHistoryView'
import OnboardingWizard from './features/onboarding/OnboardingWizard'
import SettingsView from './features/settings/SettingsView'
// New AI-assisted nutrition pages
import NutritionPage from './features/nutrition/NutritionPage'
import MealsPage from './features/meals/MealsPage'
import { TodayHub } from './features/today/TodayHub'
import { PwaInstallHint } from './features/today/PwaInstallHint'
import { generateProgramWeekFromOnboarding, generateInitialProgram } from './features/program/programGenerator'
import { loadMultiWeekProgram, saveMultiWeekProgram, clearMultiWeekProgram } from './features/program/programStorage'
import { generateNextWeekAndBlock, ensureBlocksExist } from './features/program/weekRenewal'
import { saveProfile, loadProfile, clearProfile } from './features/profile/profileStorage'
import { clearHistory, loadAllHistory } from './features/history/historyStorage'
import { loadSettings, saveSettings, type CoachSettings } from './features/settings/settingsStorage'
import { getLoadSuggestionsForExercises } from './features/progression/progressionEngine'
import { getActualLoadsForWeek, type ActualExerciseLoad } from './features/progression/actualLoads'
import { deriveNutritionProfileFromOnboarding, calculateNutritionTargets } from './features/nutrition/nutritionCalculator'
import { loadNutritionTargets, saveNutritionTargets } from './features/nutrition/nutritionStorage'
import { calculateDietTargets, type DietTargets } from './features/nutrition/dietEngine'
import { extractUserStats } from './features/nutrition/userStatsConverter'
import { loadDietTargets, saveDietTargets } from './features/nutrition/dietStorage'
import { mapPrimaryGoalToBlockGoal } from './features/onboarding/types'
import type { NutritionTargets, UserContext } from './features/nutrition/nutritionTypes'
import type { ProgramDay, ProgramWeek, ProgramMultiWeek } from './features/program/types'
import type { OnboardingState } from './features/onboarding/types'
import type { WorkoutHistoryEntry } from './features/history/types'
import type { ExerciseLoadSuggestion } from './features/progression/progressionTypes'
import './App.css'

type MainView = 'today' | 'program' | 'history' | 'settings' | 'nutrition' | 'meals';

function App() {
  const [mainView, setMainView] = useState<MainView>('today');
  const [activeDay, setActiveDay] = useState<ProgramDay | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [multiWeekProgram, setMultiWeekProgram] = useState<ProgramMultiWeek | null>(null);
  const [settings, setSettings] = useState<CoachSettings>(() => loadSettings());
  const [nutritionTargets, setNutritionTargets] = useState<NutritionTargets | null>(null);
  const [dietTargets, setDietTargets] = useState<DietTargets | null>(null);
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [loadSuggestions, setLoadSuggestions] = useState<ExerciseLoadSuggestion[]>([]);
  const [currentWeekActualLoads, setCurrentWeekActualLoads] = useState<ActualExerciseLoad[]>([]);
  const [previousWeekActualLoads, setPreviousWeekActualLoads] = useState<ActualExerciseLoad[]>([]);

  // Build UserContext from onboarding data for AI nutrition features
  const userContext: UserContext | undefined = onboardingState
    ? {
        city: onboardingState.city,
        zipCode: onboardingState.zipCode,
        locale: 'en-US',
      }
    : undefined;

  // Load saved profile on mount and generate program
  useEffect(() => {
    const savedProfile = loadProfile();
    if (savedProfile) {
      setOnboardingState(savedProfile);
      
      // Try to load existing multi-week program
      const savedMultiWeek = loadMultiWeekProgram();
      if (savedMultiWeek) {
        // Ensure legacy programs have blocks
        const programWithBlocks = ensureBlocksExist(savedMultiWeek);
        setMultiWeekProgram(programWithBlocks);
        if (programWithBlocks !== savedMultiWeek) {
          saveMultiWeekProgram(programWithBlocks);
        }
      } else {
        // Generate initial program with first week and block
        const initialMultiWeek = generateInitialProgram(savedProfile);
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

      // Load or calculate diet targets (goal-aware)
      const savedDiet = loadDietTargets();
      if (savedDiet) {
        setDietTargets(savedDiet);
      } else {
        const userStats = extractUserStats(savedProfile);
        const blockGoal = mapPrimaryGoalToBlockGoal(savedProfile.primaryGoal);
        const dietTargets = calculateDietTargets(userStats, blockGoal);
        setDietTargets(dietTargets);
        saveDietTargets(dietTargets);
      }
    }

    // Load workout history
    const savedHistory = loadAllHistory();
    setHistory(savedHistory);
  }, []);

  // Compute load suggestions when program week or history changes
  useEffect(() => {
    if (!multiWeekProgram) return;
    
    const currentWeek = multiWeekProgram.weeks[multiWeekProgram.currentWeekIndex];
    
    // Find active block to get current training goal
    const activeBlock = multiWeekProgram.blocks?.find((block) => {
      if (block.endWeekIndex === null) {
        return multiWeekProgram.currentWeekIndex >= block.startWeekIndex;
      }
      return (
        multiWeekProgram.currentWeekIndex >= block.startWeekIndex &&
        multiWeekProgram.currentWeekIndex <= block.endWeekIndex
      );
    });
    const blockGoal = activeBlock?.goal || 'general';
    
    // Collect all unique exercises from the current week
    const allExercises = currentWeek.days.flatMap((day) =>
      day.exercises.map((ex) => ({ id: ex.id, name: ex.name }))
    );
    
    // Get suggestions for current week (goal-aware and phase-aware)
    const suggestions = getLoadSuggestionsForExercises(
      history, 
      allExercises, 
      currentWeek.trainingPhase || 'build',
      blockGoal
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
    
    // Generate initial program with first week and block
    const initialMultiWeek = generateInitialProgram(state);
    setMultiWeekProgram(initialMultiWeek);
    saveMultiWeekProgram(initialMultiWeek);

    // Calculate and save nutrition targets
    const nutritionProfile = deriveNutritionProfileFromOnboarding(state);
    const targets = calculateNutritionTargets(nutritionProfile);
    setNutritionTargets(targets);
    saveNutritionTargets(targets);

    // Calculate and save diet targets based on the initial block goal
    const userStats = extractUserStats(state);
    const initialBlockGoal = mapPrimaryGoalToBlockGoal(state.primaryGoal || 'general');
    const diet = calculateDietTargets(userStats, initialBlockGoal);
    setDietTargets(diet);
    saveDietTargets(diet);

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

    // Generate next week and manage block transitions
    const updatedProgram = generateNextWeekAndBlock(
      multiWeekProgram,
      suggestions,
      history
    );

    setMultiWeekProgram(updatedProgram);
    saveMultiWeekProgram(updatedProgram);
  }

  // Handle exercise substitution (persist to program)
  function handleExerciseSubstitution(dayId: string, exerciseId: string, newExerciseName: string) {
    if (!multiWeekProgram) return;

    const updatedProgram: ProgramMultiWeek = {
      ...multiWeekProgram,
      weeks: multiWeekProgram.weeks.map((week, wIndex) => {
        if (wIndex !== multiWeekProgram.currentWeekIndex) return week;

        return {
          ...week,
          days: week.days.map(day => {
            if (day.id !== dayId) return day;

            return {
              ...day,
              exercises: day.exercises.map(ex =>
                ex.id === exerciseId
                  ? { ...ex, name: newExerciseName }
                  : ex
              ),
            };
          }),
        };
      }),
    };

    setMultiWeekProgram(updatedProgram);
    saveMultiWeekProgram(updatedProgram);
    
    // Update activeDay if it's the current day
    if (activeDay && activeDay.id === dayId) {
      const updatedDay = updatedProgram.weeks[multiWeekProgram.currentWeekIndex].days.find(d => d.id === dayId);
      if (updatedDay) {
        setActiveDay(updatedDay);
      }
    }
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
  if (activeDay && multiWeekProgram) {
    const currentWeek = multiWeekProgram.weeks[multiWeekProgram.currentWeekIndex];
    
    // Find active block to get current training goal
    const activeBlock = multiWeekProgram.blocks?.find((block) => {
      if (block.endWeekIndex === null) {
        return multiWeekProgram.currentWeekIndex >= block.startWeekIndex;
      }
      return (
        multiWeekProgram.currentWeekIndex >= block.startWeekIndex &&
        multiWeekProgram.currentWeekIndex <= block.endWeekIndex
      );
    });
    
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
        onSubstituteExercise={handleExerciseSubstitution}
        defaultFormCheckEnabled={settings.defaultFormCheckEnabled}
        loadSuggestions={daySuggestions}
        weekNumber={multiWeekProgram.currentWeekIndex + 1}
        trainingPhase={currentWeek.trainingPhase || 'build'}
        blockGoal={activeBlock?.goal || 'general'}
        previousWeekLoads={previousWeekActualLoads}
      />
    );
  }

  // 4. Otherwise show the main view with navigation
  return (
    <div className="min-h-screen bg-gray-50">
      {/* PWA Install Hint - shows only on mobile browsers */}
      <PwaInstallHint />

      {/* Top navigation bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2">
          <button
            onClick={() => setMainView('today')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mainView === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Today
          </button>
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
        </div>
      </div>

      {/* Main content */}
      {mainView === 'today' ? (
        <TodayHub
          todaysSession={(() => {
            // Find today's session by matching day of week
            const today = new Date();
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const todayName = dayNames[today.getDay()];
            
            const currentWeek = multiWeekProgram.weeks[multiWeekProgram.currentWeekIndex];
            const todaysDay = currentWeek.days.find(d => d.dayOfWeek === todayName);
            
            if (!todaysDay) return null;
            
            // Get current block goal
            const currentBlock = multiWeekProgram.blocks?.find(
              block => 
                multiWeekProgram.currentWeekIndex >= block.startWeekIndex &&
                multiWeekProgram.currentWeekIndex <= block.endWeekIndex
            );
            
            return {
              day: todaysDay,
              weekIndex: multiWeekProgram.currentWeekIndex,
              weekPhase: currentWeek.trainingPhase || 'build',
              blockGoal: currentBlock?.goal || 'general',
            };
          })()}
          dietTargets={dietTargets}
          history={history}
          onStartSession={setActiveDay}
          onViewSummary={() => setMainView('history')}
        />
      ) : mainView === 'program' ? (
        <ProgramWeekView 
          week={multiWeekProgram.weeks[multiWeekProgram.currentWeekIndex]}
          currentWeekIndex={multiWeekProgram.currentWeekIndex}
          totalWeeks={multiWeekProgram.weeks.length}
          onStartDay={setActiveDay}
          onViewExercise={setActiveExerciseId}
          onSubstituteExercise={handleExerciseSubstitution}
          loadSuggestions={loadSuggestions}
          currentWeekActualLoads={currentWeekActualLoads}
          previousWeekActualLoads={previousWeekActualLoads}
          onRenewWeek={handleRenewWeek}
          onNavigateToWeek={handleNavigateToWeek}
          allWeeks={multiWeekProgram.weeks}
          history={history}
          blocks={multiWeekProgram.blocks || []}
          dietTargets={dietTargets}
        />
      ) : mainView === 'history' ? (
        <WorkoutHistoryView />
      ) : mainView === 'nutrition' ? (
        <NutritionPage
          targets={nutritionTargets || { caloriesPerDay: 2000, proteinGrams: 150, carbsGrams: 200, fatGrams: 65 }}
          userContext={userContext}
        />
      ) : mainView === 'meals' ? (
        <MealsPage userContext={userContext} />
      ) : (
        <SettingsView
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onResetProfile={handleResetProfile}
          onClearHistory={handleClearHistory}
          program={multiWeekProgram}
          history={history}
          dietTargets={dietTargets}
          foodLog={(() => {
            try {
              const raw = localStorage.getItem('ai_coach_food_log_v1');
              return raw ? JSON.parse(raw) : {};
            } catch {
              return {};
            }
          })()}
        />
      )}
    </div>
  );
}

export default App
