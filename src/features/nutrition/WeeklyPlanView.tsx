/**
 * WeeklyPlanView - Overview of 7-day meal plan
 * 
 * Shows a row of days with status and quick macros summary.
 * User can click a day to select it for detailed editing.
 */

import type { WeeklyPlan } from './nutritionTypes';

interface WeeklyPlanViewProps {
  weeklyPlan: WeeklyPlan | null;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  weekStartDate: string;
}

export default function WeeklyPlanView({
  weeklyPlan,
  selectedDate,
  onSelectDate,
  weekStartDate,
}: WeeklyPlanViewProps) {
  // Generate array of 7 days starting from weekStartDate
  const generateWeekDays = (): Array<{ date: string; dayName: string }> => {
    const days = [];
    const start = new Date(weekStartDate + 'T00:00:00');
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      days.push({ date: dateStr, dayName });
    }
    
    return days;
  };

  const weekDays = generateWeekDays();

  const getDayPlan = (date: string) => {
    return weeklyPlan?.days.find(d => d.date === date);
  };

  const calculateDayCalories = (date: string): number => {
    const plan = getDayPlan(date);
    if (!plan) return 0;
    
    let total = 0;
    plan.meals.forEach(meal => {
      meal.items.forEach(item => {
        total += item.calories;
      });
    });
    return total;
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {weekDays.map(({ date, dayName }) => {
        const plan = getDayPlan(date);
        const calories = calculateDayCalories(date);
        const isSelected = date === selectedDate;
        const hasData = plan && plan.meals.length > 0;

        return (
          <button
            key={date}
            onClick={() => onSelectDate(date)}
            className={`flex-shrink-0 w-20 p-2 rounded-lg border transition-all ${
              isSelected
                ? 'bg-blue-600 border-blue-500 text-white'
                : hasData
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
            }`}
          >
            <div className="text-xs font-medium mb-1">{dayName}</div>
            <div className="text-sm">
              {new Date(date + 'T00:00:00').getDate()}
            </div>
            {hasData ? (
              <div className="mt-1 text-xs opacity-80">
                {calories} cal
              </div>
            ) : (
              <div className="mt-1 text-xs opacity-50">
                —
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
