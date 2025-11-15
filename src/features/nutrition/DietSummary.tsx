import type { DietTargets } from './dietEngine';

interface DietSummaryProps {
  targets: DietTargets | null;
}

/**
 * DietSummary - Compact display of daily calorie and macro targets
 * 
 * Shows:
 * - Total calories
 * - Protein, carbs, fats (in grams)
 * - Goal-based label explaining the calorie target
 * 
 * Design: Small horizontal bar similar to Coach Insights, meant to be visible
 * in the week header or session view for ongoing nutrition awareness.
 */
export function DietSummary({ targets }: DietSummaryProps) {
  if (!targets) {
    return (
      <div className="bg-gray-100 p-3 rounded-lg text-sm text-gray-500">
        No diet targets calculated yet.
      </div>
    );
  }

  const { calories, proteinGrams, carbsGrams, fatsGrams, label } = targets;

  return (
    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-blue-900">Daily Nutrition Targets</h3>
      </div>
      
      {/* Macros display */}
      <div className="flex items-center gap-4 text-sm text-gray-800 mb-2">
        <div className="flex items-center gap-1">
          <span className="font-bold text-blue-700">{Math.round(calories)}</span>
          <span className="text-gray-600">kcal</span>
        </div>
        <div className="w-px h-4 bg-gray-300" /> {/* divider */}
        <div className="flex items-center gap-1">
          <span className="font-semibold">{Math.round(proteinGrams)}g</span>
          <span className="text-gray-600">protein</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-semibold">{Math.round(carbsGrams)}g</span>
          <span className="text-gray-600">carbs</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-semibold">{Math.round(fatsGrams)}g</span>
          <span className="text-gray-600">fats</span>
        </div>
      </div>

      {/* Label explaining the target */}
      <p className="text-xs text-blue-700 italic">{label}</p>
    </div>
  );
}
