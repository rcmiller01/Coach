/**
 * MealPlanEditor - Edit a single day's meal plan
 * 
 * Shows meals (Breakfast, Lunch, Dinner, Snacks) with food items.
 * Supports:
 * - Regenerating individual meals with AI
 * - Locking meals to reuse in future weeks
 * - Swapping individual foods (AI-assisted search)
 * - Copying from another day
 */

import { useState } from 'react';
import type { DayPlan, WeeklyPlan, PlannedFoodItem, NutritionTargets, DietaryPreferences } from './nutritionTypes';
import { copyDayPlan, updateDayPlan, regenerateMeal } from '../../api/nutritionApiClient';
import { NutritionApiError } from './nutritionTypes';

interface MealPlanEditorProps {
  dayPlan: DayPlan | undefined;
  onUpdate: (plan: DayPlan) => void;
  weeklyPlan: WeeklyPlan | null;
  targets: NutritionTargets;
  planProfile?: 'standard' | 'glp1';
  preferences?: DietaryPreferences;
}

export default function MealPlanEditor({ 
  dayPlan, 
  onUpdate, 
  weeklyPlan,
  targets,
  planProfile,
  preferences
}: MealPlanEditorProps) {
  const [loading, setLoading] = useState(false);
  const [regeneratingMealIndex, setRegeneratingMealIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [swapState, setSwapState] = useState<{
    mealId: string;
    foodId: string;
    foodName: string;
  } | null>(null);

  if (!dayPlan) {
    return (
      <div className="p-4 text-center text-slate-400">
        No plan for this day yet. Click "Generate" above.
      </div>
    );
  }

  const handleCopyFromDay = async (fromDate: string) => {
    if (!dayPlan) return;
    
    setLoading(true);
    setError(null);
    try {
      const copiedPlan = await copyDayPlan(fromDate, dayPlan.date);
      onUpdate(copiedPlan);
    } catch (err) {
      console.error('Failed to copy plan:', err);
      setError('Failed to copy plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateMeal = async (mealIndex: number) => {
    if (!dayPlan) return;
    
    setRegeneratingMealIndex(mealIndex);
    setError(null);
    try {
      const updatedPlan = await regenerateMeal({
        date: dayPlan.date,
        dayPlan,
        mealIndex,
        targets,
        planProfile,
        preferences,
      });
      onUpdate(updatedPlan);
    } catch (err) {
      console.error('Failed to regenerate meal:', err);
      if (err instanceof NutritionApiError) {
        setError(err.message);
      } else {
        setError('Failed to regenerate meal. Please try again.');
      }
    } finally {
      setRegeneratingMealIndex(null);
    }
  };

  const handleToggleLock = (mealIndex: number) => {
    if (!dayPlan) return;
    
    const updatedMeals = dayPlan.meals.map((meal, idx) => {
      if (idx === mealIndex) {
        return { ...meal, locked: !meal.locked };
      }
      return meal;
    });

    const updatedPlan: DayPlan = {
      ...dayPlan,
      meals: updatedMeals,
    };

    onUpdate(updatedPlan);
  };

  const handleSwapFood = (mealId: string, foodId: string, foodName: string) => {
    setSwapState({ mealId, foodId, foodName });
  };

  const handleSelectSwap = async (newFood: PlannedFoodItem) => {
    if (!swapState || !dayPlan) return;

    // Find meal and replace food item
    const updatedMeals = dayPlan.meals.map(meal => {
      if (meal.id === swapState.mealId) {
        return {
          ...meal,
          items: meal.items.map(item =>
            item.id === swapState.foodId ? newFood : item
          ),
        };
      }
      return meal;
    });

    const updatedPlan: DayPlan = {
      ...dayPlan,
      meals: updatedMeals,
    };

    try {
      await updateDayPlan(dayPlan.date, updatedPlan);
      onUpdate(updatedPlan);
      setSwapState(null);
    } catch (err) {
      console.error('Failed to update plan:', err);
      setError('Failed to update plan. Please try again.');
    }
  };

  const getMealTypeLabel = (type: string): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Get list of other days in the week for "Copy from..." dropdown
  const otherDays = weeklyPlan?.days
    .filter(d => d.date !== dayPlan.date && d.meals.length > 0)
    .map(d => ({
      date: d.date,
      label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    })) || [];

  return (
    <div className="divide-y divide-slate-800">
      
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-900/20 border-b border-red-800">
          <div className="text-sm text-red-300">{error}</div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-red-400 hover:text-red-300"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Copy From Dropdown */}
      {otherDays.length > 0 && (
        <div className="p-4 bg-slate-900/50">
          <select
            aria-label="Copy meal plan from another day"
            onChange={(e) => {
              if (e.target.value) {
                handleCopyFromDay(e.target.value);
                e.target.value = ''; // Reset
              }
            }}
            disabled={loading}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">📋 Copy from another day...</option>
            {otherDays.map(({ date, label }) => (
              <option key={date} value={date}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Meals List */}
      {dayPlan.meals.map((meal, mealIndex) => {
        const mealTotal = meal.items.reduce(
          (sum, item) => sum + item.calories,
          0
        );
        const isRegenerating = regeneratingMealIndex === mealIndex;

        return (
          <div key={meal.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-200">
                  {getMealTypeLabel(meal.type)}
                </h3>
                {meal.locked && (
                  <span className="text-xs px-2 py-0.5 bg-amber-900/30 text-amber-400 border border-amber-700 rounded">
                    🔒 Locked
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-slate-400">
                  {mealTotal} cal
                </div>
                <button
                  onClick={() => handleToggleLock(mealIndex)}
                  title={meal.locked ? 'Unlock (allow regeneration)' : 'Lock (reuse in future weeks)'}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    meal.locked
                      ? 'bg-amber-700 hover:bg-amber-600 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  {meal.locked ? '🔓' : '🔒'}
                </button>
                <button
                  onClick={() => handleRegenerateMeal(mealIndex)}
                  disabled={isRegenerating || loading}
                  className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded transition-colors"
                >
                  {isRegenerating ? '⏳' : '🔄'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {meal.items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-slate-800/50 rounded"
                >
                  <div className="flex-1">
                    <div className="text-sm text-slate-200">{item.name}</div>
                    <div className="text-xs text-slate-400">
                      {item.quantity} {item.unit} · {item.calories} cal · {Math.round(item.proteinGrams)}g P
                    </div>
                  </div>
                  <button
                    onClick={() => handleSwapFood(meal.id, item.id, item.name)}
                    className="ml-2 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  >
                    Swap
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Swap Modal */}
      {swapState && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto border border-slate-700">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-semibold text-slate-100">
                  Replace "{swapState.foodName}"
                </h3>
                <button
                  onClick={() => setSwapState(null)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>
              <div className="text-sm text-slate-400">
                Search for a replacement food
              </div>
            </div>

            <div className="p-4">
              {/* TODO: Integrate FoodSearchPanel component here */}
              <div className="text-center py-8 text-slate-400">
                <div className="mb-2">🔍</div>
                <div>Food search UI coming soon</div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      // Demo: swap with a dummy food
                      const dummyFood: PlannedFoodItem = {
                        id: `replaced-${Date.now()}`,
                        name: 'Replacement food (demo)',
                        quantity: 1,
                        unit: 'serving',
                        calories: 300,
                        proteinGrams: 25,
                        carbsGrams: 30,
                        fatsGrams: 10,
                      };
                      handleSelectSwap(dummyFood);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Use Demo Replacement
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
