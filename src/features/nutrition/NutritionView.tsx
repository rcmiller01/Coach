import React from 'react';
import type { NutritionTargets } from './nutritionTypes';

interface NutritionViewProps {
  targets: NutritionTargets | null;
}

const NutritionView: React.FC<NutritionViewProps> = ({ targets }) => {
  if (!targets) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto p-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            Nutrition
          </h1>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
            <p className="text-gray-600">
              No nutrition targets yet. Complete onboarding to generate a plan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
          Nutrition
        </h1>

        {/* Daily Calorie Target */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Daily Calorie Target
          </h2>
          <div className="text-center">
            <div className="text-5xl md:text-6xl font-bold text-blue-600 mb-2">
              {targets.caloriesPerDay.toLocaleString()}
            </div>
            <div className="text-xl text-gray-600">kcal per day</div>
          </div>
        </div>

        {/* Macronutrient Breakdown */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Macronutrient Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Protein */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-sm font-medium text-green-800 mb-1">Protein</div>
              <div className="text-3xl font-bold text-green-700 mb-1">
                {targets.proteinGrams}
              </div>
              <div className="text-sm text-green-600">grams</div>
              <div className="text-xs text-green-600 mt-2">
                {Math.round((targets.proteinGrams * 4 / targets.caloriesPerDay) * 100)}% of calories
              </div>
            </div>

            {/* Carbs */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-sm font-medium text-blue-800 mb-1">Carbs</div>
              <div className="text-3xl font-bold text-blue-700 mb-1">
                {targets.carbsGrams}
              </div>
              <div className="text-sm text-blue-600">grams</div>
              <div className="text-xs text-blue-600 mt-2">
                {Math.round((targets.carbsGrams * 4 / targets.caloriesPerDay) * 100)}% of calories
              </div>
            </div>

            {/* Fat */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="text-sm font-medium text-yellow-800 mb-1">Fat</div>
              <div className="text-3xl font-bold text-yellow-700 mb-1">
                {targets.fatGrams}
              </div>
              <div className="text-sm text-yellow-600">grams</div>
              <div className="text-xs text-yellow-600 mt-2">
                {Math.round((targets.fatGrams * 9 / targets.caloriesPerDay) * 100)}% of calories
              </div>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 text-xl">ℹ️</div>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">About these targets</p>
              <p className="text-blue-700">
                These are approximate targets based on your profile, activity level, and fitness goal. 
                Adjust as needed based on your progress and how you feel. Consistency over time matters 
                more than hitting exact numbers every day.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionView;
