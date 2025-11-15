import { useState } from 'react';
import type { DietTargets } from './dietEngine';
import { loadDailyFoodTotals } from './foodLog';
import type { DailyFoodTotals } from './foodLog';
import { FoodQuickEntry } from './FoodQuickEntry';

interface DietTodayPanelProps {
  dietTargets: DietTargets;
  date: string;
}

/**
 * DietTodayPanel - Today's diet tracking at a glance
 * 
 * Purpose:
 * - Show daily targets vs. logged food vs. remaining
 * - Provide quick food entry interface
 * - Update in real-time as user logs food
 * 
 * Design: Card with three rows (Target, Logged, Remaining) + quick entry form
 */
export function DietTodayPanel({ dietTargets, date }: DietTodayPanelProps) {
  const [dailyTotals, setDailyTotals] = useState<DailyFoodTotals | null>(() => 
    loadDailyFoodTotals(date)
  );

  // Handle updates from FoodQuickEntry
  const handleTotalsChange = (updated: DailyFoodTotals) => {
    setDailyTotals(updated);
  };

  // Calculate logged and remaining
  const logged = dailyTotals || {
    date,
    calories: 0,
    proteinGrams: 0,
    carbsGrams: 0,
    fatsGrams: 0,
  };

  const remaining = {
    calories: Math.max(0, dietTargets.calories - logged.calories),
    proteinGrams: Math.max(0, dietTargets.proteinGrams - logged.proteinGrams),
    carbsGrams: Math.max(0, dietTargets.carbsGrams - logged.carbsGrams),
    fatsGrams: Math.max(0, dietTargets.fatsGrams - logged.fatsGrams),
  };

  // Calculate percentages for visual bars
  const caloriesPct = Math.min(100, (logged.calories / dietTargets.calories) * 100);
  const proteinPct = Math.min(100, (logged.proteinGrams / dietTargets.proteinGrams) * 100);
  const carbsPct = Math.min(100, (logged.carbsGrams / dietTargets.carbsGrams) * 100);
  const fatsPct = Math.min(100, (logged.fatsGrams / dietTargets.fatsGrams) * 100);

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Diet Today</h3>

      {/* Target row */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Target</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-800">
          <span className="font-semibold">{Math.round(dietTargets.calories)} kcal</span>
          <span className="text-gray-400">·</span>
          <span>{Math.round(dietTargets.proteinGrams)}g P</span>
          <span className="text-gray-400">·</span>
          <span>{Math.round(dietTargets.carbsGrams)}g C</span>
          <span className="text-gray-400">·</span>
          <span>{Math.round(dietTargets.fatsGrams)}g F</span>
        </div>
      </div>

      {/* Logged row with progress bars */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Logged</span>
          <span className="text-xs text-gray-500">
            {Math.round(caloriesPct)}% of target
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-800 mb-2">
          <span className="font-semibold text-blue-600">{Math.round(logged.calories)} kcal</span>
          <span className="text-gray-400">·</span>
          <span className="text-blue-600">{Math.round(logged.proteinGrams)}g P</span>
          <span className="text-gray-400">·</span>
          <span className="text-blue-600">{Math.round(logged.carbsGrams)}g C</span>
          <span className="text-gray-400">·</span>
          <span className="text-blue-600">{Math.round(logged.fatsGrams)}g F</span>
        </div>
        
        {/* Visual progress bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              caloriesPct >= 95 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${caloriesPct}%` }}
          />
        </div>
      </div>

      {/* Remaining row */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Remaining</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="font-semibold">{Math.round(remaining.calories)} kcal</span>
          <span className="text-gray-400">·</span>
          <span>{Math.round(remaining.proteinGrams)}g P</span>
          <span className="text-gray-400">·</span>
          <span>{Math.round(remaining.carbsGrams)}g C</span>
          <span className="text-gray-400">·</span>
          <span>{Math.round(remaining.fatsGrams)}g F</span>
        </div>
      </div>

      {/* Macro breakdown bars */}
      <div className="mb-4 space-y-2">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Protein</span>
            <span>{Math.round(proteinPct)}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                proteinPct >= 95 ? 'bg-green-500' : 'bg-orange-400'
              }`}
              style={{ width: `${proteinPct}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Carbs</span>
            <span>{Math.round(carbsPct)}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                carbsPct >= 95 ? 'bg-green-500' : 'bg-yellow-400'
              }`}
              style={{ width: `${carbsPct}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Fats</span>
            <span>{Math.round(fatsPct)}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                fatsPct >= 95 ? 'bg-green-500' : 'bg-purple-400'
              }`}
              style={{ width: `${fatsPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick entry form */}
      <FoodQuickEntry date={date} onTotalsChange={handleTotalsChange} />
    </div>
  );
}
