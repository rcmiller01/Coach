/**
 * NutritionPage - Targets + Weekly Meal Plan
 * 
 * Shows:
 * - Daily/weekly calorie and macro targets
 * - Weekly meal plan overview
 * - Detailed day plan editor with AI-powered generate/regenerate/substitute
 */

import { useState, useEffect, useCallback } from 'react';
import type { NutritionTargets, WeeklyPlan, DayPlan, UserContext, PlanProfile } from './nutritionTypes';
import { NutritionApiError } from './nutritionTypes';
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
  const [error, setError] = useState<{ message: string; code?: string; retryable?: boolean } | null>(null);
  const [planProfile, setPlanProfile] = useState<PlanProfile>('standard');

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
      const plan = await generateMealPlanForWeek(currentWeekStart, targets, userContext, planProfile);
      setWeeklyPlan(plan);
    } catch (err) {
      console.error('Generate week error:', err);
      if (err instanceof NutritionApiError) {
        setError({ message: err.message, code: err.code, retryable: err.retryable });
      } else {
        setError({ message: 'Failed to generate meal plan. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateDay = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const dayPlan = await generateMealPlanForDay(date, targets, userContext, planProfile);
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
      console.error('Regenerate day error:', err);
      if (err instanceof NutritionApiError) {
        setError({ message: err.message, code: err.code, retryable: err.retryable });
      } else {
        setError({ message: 'Failed to regenerate day. Please try again.' });
      }
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-100">Daily Targets</h2>
            
            {/* Plan Profile Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="planProfile" className="text-xs text-slate-400">Profile:</label>
              <select
                id="planProfile"
                value={planProfile}
                onChange={(e) => setPlanProfile(e.target.value as PlanProfile)}
                className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded hover:bg-slate-750 transition-colors"
              >
                <option value="standard">Standard</option>
                <option value="glp1">GLP-1 Medication</option>
              </select>
            </div>
          </div>
          
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
            {planProfile === 'glp1' && (
              <div className="mt-2 text-xs text-blue-400 bg-blue-950/30 px-2 py-1.5 rounded border border-blue-900/50">
                💊 GLP-1 mode: Smaller portions, protein-focused, 4 meals
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className={`rounded-lg p-4 text-sm ${
            error.code === 'AI_QUOTA_EXCEEDED' 
              ? 'bg-amber-900/20 border border-amber-700 text-amber-300'
              : error.code === 'AI_PLAN_INFEASIBLE'
              ? 'bg-orange-900/20 border border-orange-700 text-orange-300'
              : 'bg-red-900/20 border border-red-800 text-red-300'
          }`}>
            <div className="font-medium mb-1">
              {error.code === 'AI_QUOTA_EXCEEDED' && '⚠️ Daily Limit Reached'}
              {error.code === 'AI_TIMEOUT' && '⏱️ Request Timed Out'}
              {error.code === 'AI_PLAN_FAILED' && '❌ Plan Generation Failed'}
              {error.code === 'AI_RATE_LIMITED' && '⏱️ Please Slow Down'}
              {error.code === 'AI_PLAN_INFEASIBLE' && '🚫 Impossible Targets'}
              {!error.code && '❌ Error'}
            </div>
            <div className="text-sm opacity-90">{error.message}</div>
            {error.retryable && (
              <button
                onClick={() => selectedDate ? handleRegenerateDay(selectedDate) : handleGenerateWeek()}
                className="mt-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded"
              >
                Try Again
              </button>
            )}
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
              
              {/* AI Explanation Summary */}
              {selectedDayPlan?.aiExplanation && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <div className="text-sm text-slate-300">
                    🤖 {selectedDayPlan.aiExplanation.summary}
                  </div>
                  {selectedDayPlan.aiExplanation.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                        How this plan was created
                      </summary>
                      <div className="mt-2 text-xs text-slate-400 leading-relaxed">
                        {selectedDayPlan.aiExplanation.details}
                      </div>
                    </details>
                  )}
                </div>
              )}
              
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
              targets={targets}
              planProfile={planProfile}
            />
          </div>
        )}

      </div>
    </div>
  );
}
