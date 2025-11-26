/**
 * MealsPage - Daily Food Log
 * 
 * Shows what the user actually ate each day.
 * Auto-fills from the day's plan on first visit.
 * Supports:
 * - Editing portions and macros
 * - Adding foods via AI-assisted search
 * - Viewing AI explanations (reasoning, sources, confidence)
 */

import { useState, useEffect, useCallback } from 'react';
import type { DayLog, LoggedFoodItem, DayPlan, UserContext } from '../nutrition/nutritionTypes';
import { fetchDayLog, saveDayLog, fetchWeeklyPlan } from '../../api/nutritionApiClient';
import FoodLogList from './FoodLogList';
import FoodSearchPanel from './FoodSearchPanel';

// Helper: Get Monday of the week
const getWeekStart = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
};

// Helper: Convert DayPlan to DayLog
const convertPlanToLog = (plan: DayPlan): DayLog => {
  const items: LoggedFoodItem[] = [];

  plan.meals.forEach(meal => {
    meal.items.forEach(item => {
      items.push({
        ...item,
        id: `log-${item.id}-${Date.now()}`,
        mealType: meal.type, // ← PRESERVE MEAL TYPE
        sourceType: 'plan',
        userAdjusted: false,
        dataSource: 'official', // Assume plan items are from official sources
      });
    });
  });

  return recalculateTotals({ date: plan.date, items });
};

// Helper: Recalculate log totals
const recalculateTotals = (log: { date: string; items: LoggedFoodItem[] }): DayLog => {
  let totalCalories = 0;
  let totalProteinGrams = 0;
  let totalCarbsGrams = 0;
  let totalFatsGrams = 0;

  log.items.forEach(item => {
    const cal = item.userOverrides?.calories ?? item.calories;
    const protein = item.userOverrides?.proteinGrams ?? item.proteinGrams;
    const carbs = item.userOverrides?.carbsGrams ?? item.carbsGrams;
    const fats = item.userOverrides?.fatsGrams ?? item.fatsGrams;

    totalCalories += cal;
    totalProteinGrams += protein;
    totalCarbsGrams += carbs;
    totalFatsGrams += fats;
  });

  return {
    date: log.date,
    items: log.items,
    totalCalories,
    totalProteinGrams,
    totalCarbsGrams,
    totalFatsGrams,
  };
};

interface MealsPageProps {
  userContext?: UserContext;
}

export default function MealsPage({ userContext }: MealsPageProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [dayLog, setDayLog] = useState<DayLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Load log for selected date
  const loadDayLog = useCallback(async () => {
    setLoading(true);
    try {
      let log = await fetchDayLog(selectedDate);

      // If log is empty, auto-fill from plan
      if (log.items.length === 0) {
        const weekStart = getWeekStart(new Date(selectedDate));
        const weeklyPlan = await fetchWeeklyPlan(weekStart);
        const dayPlan = weeklyPlan?.days.find(d => d.date === selectedDate);

        if (dayPlan) {
          log = convertPlanToLog(dayPlan);
          await saveDayLog(log);
        }
      }

      setDayLog(log);
    } catch (err) {
      console.error('Failed to load day log:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadDayLog();
  }, [loadDayLog]);

  const handleAddFood = async (food: LoggedFoodItem) => {
    if (!dayLog) return;

    const updatedLog = recalculateTotals({
      date: dayLog.date,
      items: [...dayLog.items, food],
    });

    setDayLog(updatedLog);
    await saveDayLog(updatedLog);
    setShowSearch(false);
  };

  const handleUpdateItem = async (updatedItem: LoggedFoodItem) => {
    if (!dayLog) return;

    const updatedItems = dayLog.items.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    );

    const updatedLog = recalculateTotals({
      date: dayLog.date,
      items: updatedItems,
    });

    setDayLog(updatedLog);
    await saveDayLog(updatedLog);
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!dayLog) return;

    const updatedItems = dayLog.items.filter(item => item.id !== itemId);

    const updatedLog = recalculateTotals({
      date: dayLog.date,
      items: updatedItems,
    });

    setDayLog(updatedLog);
    await saveDayLog(updatedLog);
  };

  const goToPrevDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-md mx-auto px-3 pt-3 pb-24 flex flex-col gap-3">

        {/* Date Navigation */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPrevDay}
              className="px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Prev
            </button>
            <h2 className="text-lg font-semibold text-slate-100">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </h2>
            <button
              onClick={goToNextDay}
              className="px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Day Totals */}
        {dayLog && (
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {Math.round(dayLog.totalCalories)}
                </div>
                <div className="text-sm text-slate-400">Calories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {Math.round(dayLog.totalProteinGrams)}g
                </div>
                <div className="text-sm text-slate-400">Protein</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-amber-400">
                  {Math.round(dayLog.totalCarbsGrams)}g
                </div>
                <div className="text-sm text-slate-400">Carbs</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-purple-400">
                  {Math.round(dayLog.totalFatsGrams)}g
                </div>
                <div className="text-sm text-slate-400">Fats</div>
              </div>
            </div>
          </div>
        )}

        {/* Add Food Button */}
        <button
          onClick={() => setShowSearch(true)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          + Add Food
        </button>

        {/* Food Log List */}
        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading...</div>
        ) : dayLog ? (
          <FoodLogList
            items={dayLog.items}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
          />
        ) : (
          <div className="text-center py-8 text-slate-400">
            No food logged for this day yet.
          </div>
        )}

        {/* Search Modal */}
        {showSearch && (
          <FoodSearchPanel
            onAddFood={handleAddFood}
            onCancel={() => setShowSearch(false)}
            userContext={userContext}
          />
        )}

      </div>
    </div>
  );
}
