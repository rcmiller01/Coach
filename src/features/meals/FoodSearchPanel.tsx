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
  const [error, setError] = useState<{ 
    code: string;
    message: string; 
    retryable: boolean;
  } | null>(null);

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
          code: err.code,
          message: err.message,
          retryable: err.retryable,
        });
      } else {
        setError({
          code: 'UNKNOWN_ERROR',
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

  const getErrorBannerStyle = (code: string) => {
    switch (code) {
      case 'AI_QUOTA_EXCEEDED':
      case 'AI_DISABLED_FOR_USER':
        return 'bg-amber-900/20 border-amber-800 text-amber-300';
      case 'AI_RATE_LIMITED':
      case 'AI_TIMEOUT':
        return 'bg-blue-900/20 border-blue-800 text-blue-300';
      default:
        return 'bg-red-900/20 border-red-800 text-red-300';
    }
  };

  const shouldDisableAISearch = error && (
    error.code === 'AI_QUOTA_EXCEEDED' || 
    error.code === 'AI_DISABLED_FOR_USER'
  );

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
            disabled={shouldDisableAISearch}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !searchText.trim() || shouldDisableAISearch}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading ? '🔍 Searching...' : shouldDisableAISearch ? '🔍 AI Search (Unavailable)' : '🔍 Search'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className={`mx-4 mb-4 p-3 border rounded-lg text-sm space-y-2 ${getErrorBannerStyle(error.code)}`}>
            <div className="font-medium">
              {error.code === 'AI_QUOTA_EXCEEDED' && '⚠️ Daily Limit Reached'}
              {error.code === 'AI_RATE_LIMITED' && '⏱️ Please Slow Down'}
              {error.code === 'AI_TIMEOUT' && '⏱️ Request Timed Out'}
              {error.code === 'AI_DISABLED_FOR_USER' && '🚫 AI Features Disabled'}
              {error.code === 'AI_PARSE_FAILED' && '❌ Could Not Parse'}
              {!['AI_QUOTA_EXCEEDED', 'AI_RATE_LIMITED', 'AI_TIMEOUT', 'AI_DISABLED_FOR_USER', 'AI_PARSE_FAILED'].includes(error.code) && '❌ Error'}
            </div>
            <p>{error.message}</p>
            
            {error.code === 'AI_QUOTA_EXCEEDED' && (
              <div className="pt-2 border-t border-amber-800/50">
                <p className="text-xs text-amber-400/80">
                  You can still add foods manually using the quick entry form below.
                </p>
              </div>
            )}
            
            {error.code === 'AI_DISABLED_FOR_USER' && (
              <div className="pt-2 border-t border-amber-800/50">
                <p className="text-xs text-amber-400/80">
                  Manual food logging is still available. Contact support if you believe this is an error.
                </p>
              </div>
            )}
            
            {error.retryable && !shouldDisableAISearch && (
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
                  
                  {/* Badge: Official/Estimate + Edited */}
                  {(result.dataSource || result.userAdjusted) && (
                    <span className={`px-2 py-0.5 text-xs rounded border ${
                      result.dataSource === 'official' 
                        ? 'bg-green-900/30 border-green-800 text-green-400'
                        : result.dataSource === 'estimated'
                        ? 'bg-amber-900/30 border-amber-800 text-amber-400'
                        : result.userAdjusted
                        ? 'bg-purple-900/30 border-purple-800 text-purple-400'
                        : ''
                    }`}>
                      {result.dataSource === 'official' && !result.userAdjusted && 'Official'}
                      {result.dataSource === 'estimated' && !result.userAdjusted && 'Estimate'}
                      {result.dataSource === 'official' && result.userAdjusted && 'Official · Edited'}
                      {result.dataSource === 'estimated' && result.userAdjusted && 'Estimate · Edited'}
                      {!result.dataSource && result.userAdjusted && 'Edited'}
                    </span>
                  )}
                  
                  {/* Confidence Badge */}
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
                  {/* Low confidence warning */}
                  {result.dataSource === 'estimated' && result.aiExplanation.confidence === 'low' && (
                    <div className="mb-3 p-2 bg-amber-900/10 border border-amber-800/50 rounded text-xs text-amber-400/90 flex items-start gap-2">
                      <span className="flex-shrink-0">⚠️</span>
                      <span>
                        Estimated based on ingredients. Actual values may differ from this food item.
                      </span>
                    </div>
                  )}
                  
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
