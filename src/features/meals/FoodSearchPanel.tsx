/**
 * FoodSearchPanel - AI-assisted food lookup
 * 
 * User enters free-text description (e.g., "6-inch Italian BMT, no cheese")
 * AI returns structured food data with explanation, sources, and confidence.
 */

import { useState } from 'react';
import type { LoggedFoodItem, UserContext } from '../nutrition/nutritionTypes';
import { NutritionApiError } from '../nutrition/nutritionTypes';
import { parseFood } from '../../api/nutritionApiClient.v2';

interface FoodSearchPanelProps {
  onAddFood: (food: LoggedFoodItem) => void;
  onCancel: () => void;
  userContext?: UserContext;
}

export default function FoodSearchPanel({
  onAddFood,
  onCancel,
  userContext,
}: FoodSearchPanelProps) {
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LoggedFoodItem | null>(null);
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);

  const handleSearch = async () => {
    if (!searchText.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const food = await parseFood(searchText, userContext);
      setResult(food);
    } catch (err) {
      if (err instanceof NutritionApiError) {
        setError({
          message: err.message,
          retryable: err.retryable,
        });
      } else {
        setError({
          message: 'An unexpected error occurred. Please try again.',
          retryable: true,
        });
      }
      console.error('Food search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (result) {
      onAddFood(result);
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      low: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
      medium: 'bg-blue-900/30 text-blue-400 border-blue-800',
      high: 'bg-green-900/30 text-green-400 border-green-800',
    };
    return colors[confidence as keyof typeof colors] || colors.medium;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 z-10">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-semibold text-slate-100">
              Add Food
            </h3>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-200 text-xl"
            >
              ✕
            </button>
          </div>
          <div className="text-sm text-slate-400">
            Describe what you ate (e.g., "large apple" or "chicken breast, 6oz grilled")
          </div>
        </div>

        {/* Search Input */}
        <div className="p-4 space-y-3">
          <textarea
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="e.g., 6-inch Italian BMT, no cheese"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !searchText.trim()}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading ? '🔍 Searching...' : '🔍 Search'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-300 text-sm space-y-2">
            <p>{error.message}</p>
            {error.retryable && (
              <button
                onClick={handleSearch}
                className="text-blue-400 hover:text-blue-300 underline text-sm"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="p-4 border-t border-slate-800">
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
              
              {/* Food Name */}
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="text-base font-medium text-slate-200">
                    {result.name}
                  </h4>
                  {result.dataSource === 'official' && (
                    <span className="px-2 py-0.5 bg-green-900/30 border border-green-800 text-green-400 text-xs rounded">
                      Official
                    </span>
                  )}
                  {result.dataSource === 'estimated' && (
                    <span className="px-2 py-0.5 bg-amber-900/30 border border-amber-800 text-amber-400 text-xs rounded">
                      Estimate
                    </span>
                  )}
                  {result.aiExplanation && (
                    <span
                      className={`px-2 py-0.5 text-xs rounded border ${getConfidenceBadge(
                        result.aiExplanation.confidence
                      )}`}
                    >
                      {result.aiExplanation.confidence}
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-400">
                  {result.quantity} {result.unit}
                </div>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-slate-400">Calories</div>
                  <div className="text-lg font-semibold text-blue-400">
                    {Math.round(result.calories)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Protein</div>
                  <div className="text-lg font-semibold text-green-400">
                    {Math.round(result.proteinGrams)}g
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Carbs</div>
                  <div className="text-lg font-semibold text-amber-400">
                    {Math.round(result.carbsGrams)}g
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Fats</div>
                  <div className="text-lg font-semibold text-purple-400">
                    {Math.round(result.fatsGrams)}g
                  </div>
                </div>
              </div>

              {/* AI Explanation */}
              {result.aiExplanation && (
                <div className="pt-3 border-t border-slate-700">
                  <div className="text-xs font-medium text-slate-400 mb-1">
                    How this was calculated
                  </div>
                  <div className="text-sm text-slate-300 mb-2">
                    {result.aiExplanation.reasoning}
                  </div>
                  <div className="text-xs font-medium text-slate-400 mb-1">
                    Sources
                  </div>
                  <div className="space-y-1">
                    {result.aiExplanation.sources.map((source, idx) => (
                      <div key={idx} className="text-xs">
                        {source.url ? (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline"
                          >
                            {source.label}
                          </a>
                        ) : (
                          <span className="text-slate-400">{source.label}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Button */}
              <button
                onClick={handleAdd}
                className="w-full mt-3 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                ✓ Add to Log
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
