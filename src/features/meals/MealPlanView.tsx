import React, { useState } from 'react';
import type { DailyMealPlan, FoodItem } from './mealTypes';
import { substituteFoodInMealPlan } from './mealPlanActions';
import { FoodSearchEntry } from '../nutrition/FoodSearchEntry';
import type { FoodItem as DatabaseFoodItem } from '../nutrition/foodDatabase';

interface MealPlanViewProps {
  mealPlan: DailyMealPlan | null;
  onGenerate: () => void;
  onCopyFromYesterday?: () => void;
  onPlanUpdated?: (plan: DailyMealPlan) => void;
}

const MealPlanView: React.FC<MealPlanViewProps> = ({
  mealPlan,
  onGenerate,
  onCopyFromYesterday,
  onPlanUpdated
}) => {
  const [swapState, setSwapState] = useState<{
    mealId: string;
    foodId: string;
    foodName: string;
  } | null>(null);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSwapFood = (mealId: string, foodId: string, foodName: string) => {
    setSwapState({ mealId, foodId, foodName });
  };

  const handleSelectSwap = (dbFood: DatabaseFoodItem) => {
    if (!swapState || !mealPlan) return;

    // Convert database food to meal plan food (1 serving)
    const scaleFactor = dbFood.gramsPerUnit / 100;
    const newFood: FoodItem = {
      id: dbFood.id,
      name: dbFood.name,
      protein: dbFood.proteinPer100g * scaleFactor,
      carbs: dbFood.carbsPer100g * scaleFactor,
      fat: dbFood.fatsPer100g * scaleFactor,
      calories: dbFood.caloriesPer100g * scaleFactor,
      quantity: 1
    };

    const updatedPlan = substituteFoodInMealPlan(
      mealPlan.date,
      swapState.mealId,
      swapState.foodId,
      newFood
    );

    if (updatedPlan && onPlanUpdated) {
      onPlanUpdated(updatedPlan);
    }

    setSwapState(null);
  };

  const handleCancelSwap = () => {
    setSwapState(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Today's Meal Plan
          </h1>
          <div className="flex gap-2">
            {onCopyFromYesterday && mealPlan && (
              <button
                onClick={onCopyFromYesterday}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                title="Copy yesterday's plan"
              >
                📋 Copy Yesterday
              </button>
            )}
            <button
              onClick={onGenerate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              {mealPlan ? '🔄 Regenerate' : 'Generate'}
            </button>
          </div>
        </div>

        {/* Swap Food Modal */}
        {swapState && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Swap: {swapState.foodName}
                  </h2>
                  <button
                    onClick={handleCancelSwap}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                <FoodSearchEntry
                  onFoodSelected={handleSelectSwap}
                  autoFocus={true}
                />
              </div>
            </div>
          </div>
        )}

        {!mealPlan ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-5xl mb-4">🍽️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No meal plan yet
            </h2>
            <p className="text-gray-600 mb-4">
              Generate a personalized meal plan based on your nutrition targets.
            </p>
            <button
              onClick={onGenerate}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Generate Meal Plan for Today
            </button>
          </div>
        ) : (
          <>
            {/* Date header */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-blue-800">
                Plan for {formatDate(mealPlan.date)}
              </p>
            </div>

            {/* Meals */}
            <div className="space-y-4 mb-6">
              {mealPlan.meals.map((meal) => (
                <div
                  key={meal.id}
                  className="bg-white rounded-lg shadow border border-gray-200 p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {meal.name}
                  </h2>

                  {/* Foods */}
                  <div className="space-y-2 mb-4">
                    {meal.foods.map((food, index) => (
                      <div
                        key={`${food.id}-${index}`}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex-1">
                          <span className="text-gray-700">{food.name}</span>
                          {food.quantity && food.quantity !== 1 && (
                            <span className="ml-2 text-sm text-gray-500">
                              ({food.quantity} servings)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">
                            {Math.round(food.calories)} cal
                          </span>
                          <button
                            onClick={() => handleSwapFood(meal.id, food.id, food.name)}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                          >
                            Swap
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Meal totals */}
                  <div className="grid grid-cols-4 gap-3 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">Calories</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {meal.totalCalories}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">Protein</div>
                      <div className="text-lg font-semibold text-green-700">
                        {meal.totalProtein}g
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">Carbs</div>
                      <div className="text-lg font-semibold text-blue-700">
                        {meal.totalCarbs}g
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">Fat</div>
                      <div className="text-lg font-semibold text-yellow-700">
                        {meal.totalFat}g
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Daily totals */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Daily Totals
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600 mb-1">Total Calories</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {mealPlan.totalCalories}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-green-800 mb-1">Protein</div>
                  <div className="text-2xl font-bold text-green-700">
                    {mealPlan.totalProtein}g
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-blue-800 mb-1">Carbs</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {mealPlan.totalCarbs}g
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-yellow-800 mb-1">Fat</div>
                  <div className="text-2xl font-bold text-yellow-700">
                    {mealPlan.totalFat}g
                  </div>
                </div>
              </div>
            </div>

            {/* Info note */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 text-xl">ℹ️</div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Simple Meal Template</p>
                  <p className="text-blue-700">
                    This is a basic meal template generated from your nutrition targets.
                    Use it as a starting point and adjust portion sizes or swap foods as needed.
                    All values are approximate.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MealPlanView;
