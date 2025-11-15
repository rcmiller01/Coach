/**
 * foodDatabase.ts - Static food database for name-based food logging
 * 
 * Purpose:
 * - Provide a local database of common foods with per-100g macros
 * - Support simple search by name
 * - Convert food items + portions to macro totals
 * 
 * Design:
 * - Foods defined with unit types (grams, cups, pieces, etc.)
 * - Per-100g base macros for easy scaling
 * - Simple substring matching for search
 */

export type FoodUnit = 
  | 'g'        // grams
  | 'cup'      // cups
  | 'piece'    // whole items (eggs, chicken breast, etc.)
  | 'tbsp'     // tablespoons
  | 'oz';      // ounces

export interface FoodItem {
  id: string;
  name: string;
  unit: FoodUnit;
  gramsPerUnit: number; // How many grams is 1 unit
  
  // Per 100g macros (base values)
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatsPer100g: number;
}

/**
 * Static food database
 * All macros are per 100g for consistency
 */
export const FOOD_ITEMS: FoodItem[] = [
  // Proteins
  {
    id: 'chicken_breast',
    name: 'Chicken Breast',
    unit: 'g',
    gramsPerUnit: 1,
    caloriesPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    fatsPer100g: 3.6,
  },
  {
    id: 'chicken_thigh',
    name: 'Chicken Thigh',
    unit: 'g',
    gramsPerUnit: 1,
    caloriesPer100g: 209,
    proteinPer100g: 26,
    carbsPer100g: 0,
    fatsPer100g: 10.9,
  },
  {
    id: 'egg',
    name: 'Egg (Large)',
    unit: 'piece',
    gramsPerUnit: 50, // 1 large egg ≈ 50g
    caloriesPer100g: 143,
    proteinPer100g: 12.6,
    carbsPer100g: 0.7,
    fatsPer100g: 9.5,
  },
  {
    id: 'salmon',
    name: 'Salmon',
    unit: 'g',
    gramsPerUnit: 1,
    caloriesPer100g: 208,
    proteinPer100g: 20,
    carbsPer100g: 0,
    fatsPer100g: 13,
  },
  {
    id: 'tuna',
    name: 'Tuna (canned in water)',
    unit: 'g',
    gramsPerUnit: 1,
    caloriesPer100g: 116,
    proteinPer100g: 26,
    carbsPer100g: 0,
    fatsPer100g: 0.8,
  },
  {
    id: 'ground_beef_90',
    name: 'Ground Beef (90% lean)',
    unit: 'g',
    gramsPerUnit: 1,
    caloriesPer100g: 176,
    proteinPer100g: 20,
    carbsPer100g: 0,
    fatsPer100g: 10,
  },
  {
    id: 'greek_yogurt',
    name: 'Greek Yogurt (non-fat)',
    unit: 'g',
    gramsPerUnit: 1,
    caloriesPer100g: 59,
    proteinPer100g: 10,
    carbsPer100g: 3.6,
    fatsPer100g: 0.4,
  },
  {
    id: 'whey_protein',
    name: 'Whey Protein Powder',
    unit: 'g',
    gramsPerUnit: 1,
    caloriesPer100g: 400,
    proteinPer100g: 80,
    carbsPer100g: 6.7,
    fatsPer100g: 6.7,
  },

  // Carbs
  {
    id: 'white_rice',
    name: 'White Rice (cooked)',
    unit: 'g',
    gramsPerUnit: 1,
    caloriesPer100g: 130,
    proteinPer100g: 2.7,
    carbsPer100g: 28.2,
    fatsPer100g: 0.3,
  },
  {
    id: 'brown_rice',
    name: 'Brown Rice (cooked)',
    unit: 'g',
    gramsPerUnit: 1,
    caloriesPer100g: 111,
    proteinPer100g: 2.6,
    carbsPer100g: 23,
    fatsPer100g: 0.9,
  },
  {
    id: 'oatmeal',
    name: 'Oatmeal (cooked)',
    unit: 'g',
    gramsPerUnit: 1,
    caloriesPer100g: 71,
    proteinPer100g: 2.5,
    carbsPer100g: 12,
    fatsPer100g: 1.5,
  },
  {
    id: 'sweet_potato',
    name: 'Sweet Potato',
    unit: 'g',
    gramsPerUnit: 1,
    caloriesPer100g: 86,
    proteinPer100g: 1.6,
    carbsPer100g: 20,
    fatsPer100g: 0.1,
  },
  {
    id: 'whole_wheat_bread',
    name: 'Whole Wheat Bread',
    unit: 'piece',
    gramsPerUnit: 30, // 1 slice ≈ 30g
    caloriesPer100g: 247,
    proteinPer100g: 13,
    carbsPer100g: 41,
    fatsPer100g: 3.4,
  },
  {
    id: 'banana',
    name: 'Banana',
    unit: 'piece',
    gramsPerUnit: 120, // 1 medium banana ≈ 120g
    caloriesPer100g: 89,
    proteinPer100g: 1.1,
    carbsPer100g: 23,
    fatsPer100g: 0.3,
  },
  {
    id: 'apple',
    name: 'Apple',
    unit: 'piece',
    gramsPerUnit: 180, // 1 medium apple ≈ 180g
    caloriesPer100g: 52,
    proteinPer100g: 0.3,
    carbsPer100g: 14,
    fatsPer100g: 0.2,
  },
  {
    id: 'pasta',
    name: 'Pasta (cooked)',
    unit: 'g',
    gramsPerUnit: 1,
    caloriesPer100g: 131,
    proteinPer100g: 5,
    carbsPer100g: 25,
    fatsPer100g: 1.1,
  },

  // Fats
  {
    id: 'olive_oil',
    name: 'Olive Oil',
    unit: 'tbsp',
    gramsPerUnit: 14, // 1 tbsp ≈ 14g
    caloriesPer100g: 884,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatsPer100g: 100,
  },
  {
    id: 'peanut_butter',
    name: 'Peanut Butter',
    unit: 'tbsp',
    gramsPerUnit: 16, // 1 tbsp ≈ 16g
    caloriesPer100g: 588,
    proteinPer100g: 25,
    carbsPer100g: 20,
    fatsPer100g: 50,
  },
  {
    id: 'almonds',
    name: 'Almonds',
    unit: 'g',
    gramsPerUnit: 1,
    caloriesPer100g: 579,
    proteinPer100g: 21,
    carbsPer100g: 22,
    fatsPer100g: 50,
  },
  {
    id: 'avocado',
    name: 'Avocado',
    unit: 'g',
    gramsPerUnit: 1,
    caloriesPer100g: 160,
    proteinPer100g: 2,
    carbsPer100g: 8.5,
    fatsPer100g: 15,
  },
  {
    id: 'cheese_cheddar',
    name: 'Cheddar Cheese',
    unit: 'g',
    gramsPerUnit: 1,
    caloriesPer100g: 403,
    proteinPer100g: 25,
    carbsPer100g: 1.3,
    fatsPer100g: 33,
  },

  // Vegetables (low-cal)
  {
    id: 'broccoli',
    name: 'Broccoli',
    unit: 'g',
    gramsPerUnit: 1,
    caloriesPer100g: 34,
    proteinPer100g: 2.8,
    carbsPer100g: 7,
    fatsPer100g: 0.4,
  },
  {
    id: 'spinach',
    name: 'Spinach',
    unit: 'g',
    gramsPerUnit: 1,
    caloriesPer100g: 23,
    proteinPer100g: 2.9,
    carbsPer100g: 3.6,
    fatsPer100g: 0.4,
  },
  {
    id: 'carrots',
    name: 'Carrots',
    unit: 'g',
    gramsPerUnit: 1,
    caloriesPer100g: 41,
    proteinPer100g: 0.9,
    carbsPer100g: 10,
    fatsPer100g: 0.2,
  },

  // Milk & Dairy
  {
    id: 'milk_whole',
    name: 'Milk (whole)',
    unit: 'cup',
    gramsPerUnit: 244, // 1 cup ≈ 244g
    caloriesPer100g: 61,
    proteinPer100g: 3.2,
    carbsPer100g: 4.8,
    fatsPer100g: 3.3,
  },
  {
    id: 'milk_skim',
    name: 'Milk (skim)',
    unit: 'cup',
    gramsPerUnit: 244,
    caloriesPer100g: 34,
    proteinPer100g: 3.4,
    carbsPer100g: 5,
    fatsPer100g: 0.1,
  },
];

/**
 * Search for foods by name (case-insensitive substring match)
 */
export function findFoodsByQuery(query: string): FoodItem[] {
  if (!query.trim()) {
    return [];
  }

  const lowerQuery = query.toLowerCase().trim();
  
  return FOOD_ITEMS.filter((food) =>
    food.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Calculate macros for a given food item and number of units
 * Returns total macros based on gramsPerUnit scaling
 */
export function calculateMacros(
  food: FoodItem,
  units: number
): {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
} {
  const totalGrams = food.gramsPerUnit * units;
  const scaleFactor = totalGrams / 100;

  return {
    calories: food.caloriesPer100g * scaleFactor,
    proteinGrams: food.proteinPer100g * scaleFactor,
    carbsGrams: food.carbsPer100g * scaleFactor,
    fatsGrams: food.fatsPer100g * scaleFactor,
  };
}
