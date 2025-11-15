import { useState } from 'react';
import { findFoodsByQuery, calculateMacros, type FoodItem } from './foodDatabase';
import { addFoodEntry } from './foodLog';
import type { DailyFoodTotals } from './foodLog';

interface FoodSearchEntryProps {
  date: string;
  onTotalsChange?: (totals: DailyFoodTotals) => void;
}

/**
 * FoodSearchEntry - Food logging by name + portion
 * 
 * Purpose:
 * - Let users search for foods by name
 * - Select a food and specify units/portions
 * - Convert to macros and add to daily totals
 * 
 * Design:
 * - Search input with live results dropdown
 * - Once selected: show food info + unit input
 * - "Add" converts to macros and saves via addFoodEntry
 */
export function FoodSearchEntry({ date, onTotalsChange }: FoodSearchEntryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [units, setUnits] = useState<string>('1');
  const [showResults, setShowResults] = useState(false);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length >= 2) {
      const results = findFoodsByQuery(query);
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setSearchQuery(food.name);
    setSearchResults([]);
    setShowResults(false);
    setUnits('1');
  };

  const handleClearSelection = () => {
    setSelectedFood(null);
    setSearchQuery('');
    setUnits('1');
  };

  const handleAdd = () => {
    if (!selectedFood) return;

    const unitsNum = parseFloat(units) || 0;
    if (unitsNum <= 0) return;

    // Calculate macros for this food + units
    const macros = calculateMacros(selectedFood, unitsNum);

    // Add to food log
    const updated = addFoodEntry(date, macros);

    // Notify parent
    onTotalsChange?.(updated);

    // Reset
    handleClearSelection();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedFood) {
      handleAdd();
    }
  };

  // Preview macros for current selection
  const previewMacros = selectedFood
    ? calculateMacros(selectedFood, parseFloat(units) || 0)
    : null;

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-3">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Add Food by Name</h4>

      {/* Search input */}
      <div className="relative mb-3">
        <input
          type="text"
          placeholder="Search foods (e.g., chicken, rice, egg)..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => {
            if (searchQuery.trim().length >= 2) {
              setShowResults(true);
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
          disabled={!!selectedFood}
        />

        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 && !selectedFood && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {searchResults.map((food) => (
              <button
                key={food.id}
                onClick={() => handleSelectFood(food)}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">{food.name}</div>
                <div className="text-xs text-gray-500">
                  Per {food.unit === 'piece' ? '1 piece' : food.unit === 'g' ? '100g' : `1 ${food.unit}`}: 
                  {' '}{Math.round(food.caloriesPer100g)} kcal, 
                  {' '}P: {Math.round(food.proteinPer100g)}g, 
                  C: {Math.round(food.carbsPer100g)}g, 
                  F: {Math.round(food.fatsPer100g)}g
                </div>
              </button>
            ))}
          </div>
        )}

        {showResults && searchResults.length === 0 && searchQuery.trim().length >= 2 && !selectedFood && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
            <p className="text-sm text-gray-500">No foods found. Try a different search.</p>
          </div>
        )}
      </div>

      {/* Selected food details */}
      {selectedFood && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium text-gray-900 text-sm">{selectedFood.name}</div>
            <button
              onClick={handleClearSelection}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Change
            </button>
          </div>

          {/* Unit input */}
          <div className="flex items-center gap-2 mb-2">
            <label htmlFor="food-units-input" className="text-sm text-gray-700">Amount:</label>
            <input
              id="food-units-input"
              type="number"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              min="0"
              step="0.1"
            />
            <span className="text-sm text-gray-600">
              {selectedFood.unit === 'piece' 
                ? parseFloat(units) === 1 ? 'piece' : 'pieces'
                : selectedFood.unit}
            </span>
          </div>

          {/* Macro preview */}
          {previewMacros && parseFloat(units) > 0 && (
            <div className="text-xs text-gray-600 mb-2">
              <span className="font-semibold">Will add: </span>
              {Math.round(previewMacros.calories)} kcal · 
              {' '}P: {Math.round(previewMacros.proteinGrams)}g · 
              C: {Math.round(previewMacros.carbsGrams)}g · 
              F: {Math.round(previewMacros.fatsGrams)}g
            </div>
          )}

          {/* Add button */}
          <button
            onClick={handleAdd}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
          >
            Add to Log
          </button>
        </div>
      )}
    </div>
  );
}
