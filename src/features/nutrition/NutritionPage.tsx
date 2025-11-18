/**
 * NutritionPage - Targets + Weekly Meal Plan
 * 
 * Shows:
 * - Daily/weekly calorie and macro targets
 * - Weekly meal plan overview
 * - Detailed day plan editor with AI-powered generate/regenerate/substitute
 */

import { useState, useEffect, useCallback } from 'react';
import type { NutritionTargets, WeeklyPlan, DayPlan, UserContext } from './nutritionTypes';
import { fetchWeeklyPlan, generateMealPlanForWeek, generateMealPlanForDay } from '../../api/nutritionApiClient';
import WeeklyPlanView from './WeeklyPlanView';
import MealPlanEditor from './MealPlanEditor';

interface NutritionPageProps {
  targets: NutritionTargets;
  userContext?: UserContext;
}

export default function NutritionPage({ targets, userContext }: NutritionPageProps) {
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get Monday of the current week
  const getWeekStart = (date: Date): string => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  };

  const currentWeekStart = getWeekStart(new Date());

  // Load weekly plan on mount
  const loadWeeklyPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const plan = await fetchWeeklyPlan(currentWeekStart);
      setWeeklyPlan(plan);
    } catch (err) {
      setError('Failed to load meal plan');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart]);

  useEffect(() => {
    loadWeeklyPlan();
  }, [loadWeeklyPlan]);

  const handleGenerateWeek = async () => {
    setLoading(true);
    setError(null);
    try {
      const plan = await generateMealPlanForWeek(currentWeekStart, targets, userContext);
      setWeeklyPlan(plan);
    } catch (err) {
      setError('Failed to generate meal plan');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateDay = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const dayPlan = await generateMealPlanForDay(date, targets, userContext);
      // Update the weekly plan with the new day
      if (weeklyPlan) {
        const updatedDays = weeklyPlan.days.map(d => d.date === date ? dayPlan : d);
        // If date not in plan, add it
        if (!updatedDays.find(d => d.date === date)) {
          updatedDays.push(dayPlan);
        }
        setWeeklyPlan({ ...weeklyPlan, days: updatedDays });
      } else {
        // Create new weekly plan with just this day
        setWeeklyPlan({
          weekStartDate: currentWeekStart,
          days: [dayPlan],
        });
      }
    } catch (err) {
      setError('Failed to regenerate day');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDayPlanUpdate = (updatedPlan: DayPlan) => {
    if (!weeklyPlan) return;
    const updatedDays = weeklyPlan.days.map(d => d.date === updatedPlan.date ? updatedPlan : d);
    setWeeklyPlan({ ...weeklyPlan, days: updatedDays });
  };

  // Find the selected day's plan
  const selectedDayPlan = weeklyPlan?.days.find(d => d.date === selectedDate);

  // Calculate totals for selected day
  const calculateDayTotals = (plan: DayPlan | undefined) => {
    if (!plan) return { calories: 0, protein: 0, carbs: 0, fats: 0 };
    
    let calories = 0, protein = 0, carbs = 0, fats = 0;
    plan.meals.forEach(meal => {
      meal.items.forEach(item => {
        calories += item.calories;
        protein += item.proteinGrams;
        carbs += item.carbsGrams;
        fats += item.fatsGrams;
      });
    });
    
    return { calories, protein, carbs, fats };
  };

  const dayTotals = calculateDayTotals(selectedDayPlan);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-md mx-auto px-3 pt-3 pb-24 flex flex-col gap-3">
        
        {/* Targets Card */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <h2 className="text-lg font-semibold text-slate-100 mb-3">Daily Targets</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-2xl font-bold text-blue-400">{targets.caloriesPerDay}</div>
              <div className="text-sm text-slate-400">Calories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{targets.proteinGrams}g</div>
              <div className="text-sm text-slate-400">Protein</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-amber-400">{targets.carbsGrams}g</div>
              <div className="text-sm text-slate-400">Carbs</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-purple-400">{targets.fatGrams}g</div>
              <div className="text-sm text-slate-400">Fats</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800">
            <div className="text-sm text-slate-400">
              Weekly: {(targets.caloriesPerDay * 7).toLocaleString()} kcal · {targets.proteinGrams * 7}g P
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Weekly Plan Overview */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-100">This Week</h2>
            {!weeklyPlan || weeklyPlan.days.length === 0 ? (
              <button
                onClick={handleGenerateWeek}
                disabled={loading}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {loading ? '⏳ Generating...' : '✨ Generate Week'}
              </button>
            ) : null}
          </div>
          
          <WeeklyPlanView
            weeklyPlan={weeklyPlan}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            weekStartDate={currentWeekStart}
          />
        </div>

        {/* Day Plan Editor */}
        {selectedDate && (
          <div className="bg-slate-900 rounded-lg border border-slate-800">
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-slate-100">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </h2>
                <button
                  onClick={() => handleRegenerateDay(selectedDate)}
                  disabled={loading}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {loading ? '⏳' : selectedDayPlan ? '🔄 Regenerate' : '✨ Generate'}
                </button>
              </div>
              
              {/* Day Totals */}
              <div className="flex gap-3 text-sm">
                <div>
                  <span className="text-blue-400 font-semibold">{dayTotals.calories}</span>
                  <span className="text-slate-500"> / {targets.caloriesPerDay} kcal</span>
                </div>
                <div>
                  <span className="text-green-400 font-semibold">{Math.round(dayTotals.protein)}g</span>
                  <span className="text-slate-500"> P</span>
                </div>
                <div>
                  <span className="text-amber-400 font-semibold">{Math.round(dayTotals.carbs)}g</span>
                  <span className="text-slate-500"> C</span>
                </div>
                <div>
                  <span className="text-purple-400 font-semibold">{Math.round(dayTotals.fats)}g</span>
                  <span className="text-slate-500"> F</span>
                </div>
              </div>
            </div>

            <MealPlanEditor
              dayPlan={selectedDayPlan}
              onUpdate={handleDayPlanUpdate}
              weeklyPlan={weeklyPlan}
            />
          </div>
        )}

      </div>
    </div>
  );
}
