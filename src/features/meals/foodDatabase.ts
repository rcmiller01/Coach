import type { FoodItem } from './mealTypes';

/**
 * Static food database with common items.
 * All values are approximate per serving.
 */
export const FOOD_DATABASE: FoodItem[] = [
  // Proteins
  {
    id: 'chicken-breast',
    name: 'Chicken Breast (4 oz)',
    protein: 35,
    carbs: 0,
    fat: 4,
    calories: 185,
  },
  {
    id: 'salmon',
    name: 'Salmon (4 oz)',
    protein: 25,
    carbs: 0,
    fat: 13,
    calories: 235,
  },
  {
    id: 'ground-beef',
    name: 'Ground Beef 93/7 (4 oz)',
    protein: 24,
    carbs: 0,
    fat: 8,
    calories: 185,
  },
  {
    id: 'eggs',
    name: 'Eggs (2 large)',
    protein: 13,
    carbs: 1,
    fat: 10,
    calories: 155,
  },
  {
    id: 'greek-yogurt',
    name: 'Greek Yogurt (1 cup)',
    protein: 20,
    carbs: 9,
    fat: 5,
    calories: 160,
  },

  // Carbs
  {
    id: 'oatmeal',
    name: 'Oatmeal (1/2 cup dry)',
    protein: 5,
    carbs: 27,
    fat: 3,
    calories: 150,
  },
  {
    id: 'rice',
    name: 'White Rice (1 cup cooked)',
    protein: 4,
    carbs: 45,
    fat: 0,
    calories: 205,
  },
  {
    id: 'pasta',
    name: 'Pasta (2 oz dry)',
    protein: 7,
    carbs: 42,
    fat: 1,
    calories: 200,
  },
  {
    id: 'sweet-potato',
    name: 'Sweet Potato (1 medium)',
    protein: 2,
    carbs: 27,
    fat: 0,
    calories: 115,
  },

  // Fats & Vegetables
  {
    id: 'avocado',
    name: 'Avocado (1/2 medium)',
    protein: 1,
    carbs: 6,
    fat: 11,
    calories: 120,
  },
  {
    id: 'olive-oil',
    name: 'Olive Oil (1 tbsp)',
    protein: 0,
    carbs: 0,
    fat: 14,
    calories: 120,
  },
  {
    id: 'mixed-vegetables',
    name: 'Mixed Vegetables (1 cup)',
    protein: 3,
    carbs: 12,
    fat: 0,
    calories: 60,
  },
];

// Helper to find foods by category
export const PROTEINS = FOOD_DATABASE.filter(f => 
  ['chicken-breast', 'salmon', 'ground-beef', 'eggs', 'greek-yogurt'].includes(f.id)
);

export const CARBS = FOOD_DATABASE.filter(f => 
  ['oatmeal', 'rice', 'pasta', 'sweet-potato'].includes(f.id)
);

export const FATS = FOOD_DATABASE.filter(f => 
  ['avocado', 'olive-oil'].includes(f.id)
);

export const VEGETABLES = FOOD_DATABASE.filter(f => 
  f.id === 'mixed-vegetables'
);
