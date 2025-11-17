import { useState } from 'react';
import type { DietTargets } from '../nutrition/dietEngine';
import { DietTodayPanel } from '../nutrition/DietTodayPanel';
import { loadDailyFoodTotals } from '../nutrition/foodLog';

interface DietSummaryCardProps {
  dietTargets: DietTargets;
  date: string;
}

/**
 * DietSummaryCard - Compact diet overview with expandable entry panel
 */
export function DietSummaryCard({ dietTargets, date }: DietSummaryCardProps) {
  const [showEntryPanel, setShowEntryPanel] = useState(false);
  
  const foodLog = loadDailyFoodTotals(date);
  const loggedCalories = foodLog?.calories || 0;
  const loggedProtein = foodLog?.proteinGrams || 0;
  const loggedCarbs = foodLog?.carbsGrams || 0;
  const loggedFats = foodLog?.fatsGrams || 0;
  const remaining = dietTargets.calories - loggedCalories;
  const percentConsumed = (loggedCalories / dietTargets.calories) * 100;

  return (
    <>
      <div className="bg-slate-900 rounded-lg border border-slate-800">
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Nutrition</h3>
            <button
              onClick={() => setShowEntryPanel(!showEntryPanel)}
              className="px-3 py-1.5 bg-slate-800 active:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {showEntryPanel ? 'Hide' : '+ Add Food'}
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="mb-3">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  percentConsumed > 100 ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentConsumed, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-xs">
              <span className="text-slate-400">
                {Math.round(loggedCalories)} / {dietTargets.calories} kcal
              </span>
              <span className={remaining < 0 ? 'text-red-400' : 'text-slate-400'}>
                {Math.round(remaining)} remaining
              </span>
            </div>
          </div>

          {/* Macros row */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-white font-medium">{Math.round(loggedProtein)}g</div>
              <div className="text-slate-500">Protein</div>
            </div>
            <div>
              <div className="text-white font-medium">{Math.round(loggedCarbs)}g</div>
              <div className="text-slate-500">Carbs</div>
            </div>
            <div>
              <div className="text-white font-medium">{Math.round(loggedFats)}g</div>
              <div className="text-slate-500">Fat</div>
            </div>
          </div>
        </div>
      </div>

      {/* Entry panel - bottom sheet on mobile, inline on desktop */}
      {showEntryPanel && (
        <>
          {/* Mobile: Bottom sheet */}
          <div className="md:hidden">
            <div 
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowEntryPanel(false)}
            />
            
            <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-900 rounded-t-2xl border-t border-slate-800 max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Log Food</h3>
                <button
                  onClick={() => setShowEntryPanel(false)}
                  className="text-slate-400 active:text-slate-300"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <DietTodayPanel dietTargets={dietTargets} date={date} />
              </div>
            </div>
          </div>

          {/* Desktop: Inline panel */}
          <div className="hidden md:block mt-3">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <DietTodayPanel dietTargets={dietTargets} date={date} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
