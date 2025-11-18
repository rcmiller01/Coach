/**
 * FoodLogList - Display logged food items with editing capabilities
 * 
 * Shows each logged food with:
 * - Name, quantity, calories, macros
 * - AI badge if from AI search
 * - Expandable explanation (reasoning, sources, confidence)
 * - Inline editing for macros
 * - Delete button
 */

import { useState } from 'react';
import type { LoggedFoodItem } from '../nutrition/nutritionTypes';

interface FoodLogListProps {
  items: LoggedFoodItem[];
  onUpdateItem: (item: LoggedFoodItem) => void;
  onRemoveItem: (itemId: string) => void;
}

export default function FoodLogList({ items, onUpdateItem, onRemoveItem }: FoodLogListProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [editingMacros, setEditingMacros] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="bg-slate-900 rounded-lg p-8 border border-slate-800 text-center text-slate-400">
        No food logged yet. Add your first item above!
      </div>
    );
  }

  const handleToggleExpand = (itemId: string) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const handleToggleEditMacros = (itemId: string) => {
    setEditingMacros(editingMacros === itemId ? null : itemId);
  };

  const handleUpdateMacros = (
    item: LoggedFoodItem,
    field: 'calories' | 'proteinGrams' | 'carbsGrams' | 'fatsGrams',
    value: number
  ) => {
    // Track user corrections: store original values on first edit
    const updatedItem: LoggedFoodItem = {
      ...item,
      userAdjusted: true,
      // Store original values if not already stored
      originalCalories: item.originalCalories ?? item.calories,
      originalProteinGrams: item.originalProteinGrams ?? item.proteinGrams,
      originalCarbsGrams: item.originalCarbsGrams ?? item.carbsGrams,
      originalFatsGrams: item.originalFatsGrams ?? item.fatsGrams,
      // Update the actual value
      [field]: value,
      userOverrides: {
        ...item.userOverrides,
        [field]: value,
      },
    };
    onUpdateItem(updatedItem);
  };

  const getDisplayValue = (
    item: LoggedFoodItem,
    field: 'calories' | 'proteinGrams' | 'carbsGrams' | 'fatsGrams'
  ): number => {
    return item.userOverrides?.[field] ?? item[field];
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
    <div className="space-y-3">
      {items.map(item => {
        const isExpanded = expandedItem === item.id;
        const isEditingMacros = editingMacros === item.id;
        const hasAI = item.aiExplanation;

        return (
          <div
            key={item.id}
            className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden"
          >
            {/* Main Item Row */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-medium text-slate-200">
                      {item.name}
                    </h3>
                    {hasAI && (
                      <span className="px-2 py-0.5 bg-blue-900/30 border border-blue-800 text-blue-400 text-xs rounded">
                        AI
                      </span>
                    )}
                    {item.dataSource === 'official' && (
                      <span className="px-2 py-0.5 bg-green-900/30 border border-green-800 text-green-400 text-xs rounded">
                        Official
                      </span>
                    )}
                    {item.dataSource === 'estimated' && (
                      <span className="px-2 py-0.5 bg-amber-900/30 border border-amber-800 text-amber-400 text-xs rounded">
                        Estimate
                      </span>
                    )}
                    {item.userAdjusted && (
                      <span className="px-2 py-0.5 bg-purple-900/30 border border-purple-800 text-purple-400 text-xs rounded" title="You've edited this item">
                        Edited
                      </span>
                    )}
                    {item.sourceType === 'plan' && (
                      <span className="px-2 py-0.5 bg-purple-900/30 border border-purple-800 text-purple-400 text-xs rounded">
                        Plan
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-400">
                    {item.quantity} {item.unit}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>

              {/* Macros Display/Edit */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <div>
                    <span className="text-blue-400 font-semibold">
                      {Math.round(getDisplayValue(item, 'calories'))}
                    </span>
                    <span className="text-slate-500"> cal</span>
                  </div>
                  <div>
                    <span className="text-green-400 font-semibold">
                      {Math.round(getDisplayValue(item, 'proteinGrams'))}g
                    </span>
                    <span className="text-slate-500"> P</span>
                  </div>
                  <div>
                    <span className="text-amber-400 font-semibold">
                      {Math.round(getDisplayValue(item, 'carbsGrams'))}g
                    </span>
                    <span className="text-slate-500"> C</span>
                  </div>
                  <div>
                    <span className="text-purple-400 font-semibold">
                      {Math.round(getDisplayValue(item, 'fatsGrams'))}g
                    </span>
                    <span className="text-slate-500"> F</span>
                  </div>
                </div>

                {/* Edit Macros Button */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleEditMacros(item.id)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {isEditingMacros ? 'Done Editing' : 'Edit Macros'}
                  </button>
                  {hasAI && (
                    <button
                      onClick={() => handleToggleExpand(item.id)}
                      className="text-xs text-slate-400 hover:text-slate-300"
                    >
                      {isExpanded ? 'Hide Details' : 'Show AI Details'}
                    </button>
                  )}
                </div>

                {/* Inline Macro Editor */}
                {isEditingMacros && (
                  <div className="grid grid-cols-2 gap-2 mt-2 p-2 bg-slate-800/50 rounded">
                    <div>
                      <label className="text-xs text-slate-400">Calories</label>
                      <input
                        type="number"
                        aria-label="Calories"
                        value={getDisplayValue(item, 'calories')}
                        onChange={(e) =>
                          handleUpdateMacros(item, 'calories', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Protein (g)</label>
                      <input
                        type="number"
                        aria-label="Protein in grams"
                        value={getDisplayValue(item, 'proteinGrams')}
                        onChange={(e) =>
                          handleUpdateMacros(item, 'proteinGrams', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Carbs (g)</label>
                      <input
                        type="number"
                        aria-label="Carbs in grams"
                        value={getDisplayValue(item, 'carbsGrams')}
                        onChange={(e) =>
                          handleUpdateMacros(item, 'carbsGrams', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Fats (g)</label>
                      <input
                        type="number"
                        aria-label="Fats in grams"
                        value={getDisplayValue(item, 'fatsGrams')}
                        onChange={(e) =>
                          handleUpdateMacros(item, 'fatsGrams', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Explanation (Expandable) */}
            {isExpanded && hasAI && (
              <div className="border-t border-slate-800 bg-slate-900/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-slate-300">
                    🤖 AI Analysis
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded border ${getConfidenceBadge(
                      item.aiExplanation!.confidence
                    )}`}
                  >
                    {item.aiExplanation!.confidence} confidence
                  </span>
                </div>

                <div className="mb-3">
                  <div className="text-xs font-medium text-slate-400 mb-1">
                    Reasoning
                  </div>
                  <div className="text-sm text-slate-300">
                    {item.aiExplanation!.reasoning}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-slate-400 mb-1">
                    Sources
                  </div>
                  <div className="space-y-1">
                    {item.aiExplanation!.sources.map((source, idx) => (
                      <div key={idx} className="text-sm">
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
                          <span className="text-slate-300">{source.label}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
