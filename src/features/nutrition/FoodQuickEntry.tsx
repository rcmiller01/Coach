import { useState } from 'react';
import { addFoodEntry } from './foodLog';
import type { DailyFoodTotals } from './foodLog';

interface FoodQuickEntryProps {
  date: string;
  onTotalsChange?: (totals: DailyFoodTotals) => void;
}

/**
 * FoodQuickEntry - Quick numeric input for logging food
 * 
 * Purpose:
 * - Provide a simple way to add calories and macros for a meal/snack
 * - Update daily totals when user clicks "Add"
 * - Reset inputs after successful add
 * 
 * Design: Small horizontal form with 4 numeric inputs and an Add button
 */
export function FoodQuickEntry({ date, onTotalsChange }: FoodQuickEntryProps) {
  const [calories, setCalories] = useState<string>('');
  const [protein, setProtein] = useState<string>('');
  const [carbs, setCarbs] = useState<string>('');
  const [fats, setFats] = useState<string>('');

  const handleAdd = () => {
    // Parse values
    const cals = parseFloat(calories) || 0;
    const prot = parseFloat(protein) || 0;
    const carb = parseFloat(carbs) || 0;
    const fat = parseFloat(fats) || 0;

    // Ignore if all zeros or empty
    if (cals === 0 && prot === 0 && carb === 0 && fat === 0) {
      return;
    }

    // Add entry
    const updated = addFoodEntry(date, {
      calories: cals,
      proteinGrams: prot,
      carbsGrams: carb,
      fatsGrams: fat,
    });

    // Notify parent
    onTotalsChange?.(updated);

    // Reset inputs
    setCalories('');
    setProtein('');
    setCarbs('');
    setFats('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-3">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Quick Add Food</h4>
      
      <div className="flex flex-wrap items-center gap-2">
        {/* Calories */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            placeholder="kcal"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
            min="0"
            step="1"
          />
          <span className="text-xs text-gray-600">kcal</span>
        </div>

        {/* Protein */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            placeholder="P"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
            min="0"
            step="0.1"
          />
          <span className="text-xs text-gray-600">g P</span>
        </div>

        {/* Carbs */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            placeholder="C"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
            min="0"
            step="0.1"
          />
          <span className="text-xs text-gray-600">g C</span>
        </div>

        {/* Fats */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            placeholder="F"
            value={fats}
            onChange={(e) => setFats(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
            min="0"
            step="0.1"
          />
          <span className="text-xs text-gray-600">g F</span>
        </div>

        {/* Add button */}
        <button
          onClick={handleAdd}
          className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}
