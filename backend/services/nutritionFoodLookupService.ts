/**
 * Service for looking up food macros from a "database" (mocked for now).
 * Used in Precision Mode to validate and correct AI-generated macros.
 */

export interface FoodMacro {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize: number; // in grams
    servingUnit: string;
}

// Mock database of common foods
// In a real app, this would query a SQL database or external API
const MOCK_FOOD_DB: Record<string, FoodMacro> = {
    // Proteins
    'chicken breast': { name: 'Chicken Breast (cooked)', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: 100, servingUnit: 'g' },
    'salmon': { name: 'Salmon (cooked)', calories: 208, protein: 20, carbs: 0, fat: 13, servingSize: 100, servingUnit: 'g' },
    'egg': { name: 'Large Egg', calories: 72, protein: 6, carbs: 0.4, fat: 5, servingSize: 50, servingUnit: 'g' },
    'tofu': { name: 'Tofu (firm)', calories: 144, protein: 17, carbs: 3, fat: 8, servingSize: 100, servingUnit: 'g' },
    'greek yogurt': { name: 'Greek Yogurt (non-fat)', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, servingSize: 100, servingUnit: 'g' },
    'steak': { name: 'Beef Steak (grilled)', calories: 271, protein: 26, carbs: 0, fat: 19, servingSize: 100, servingUnit: 'g' },

    // Carbs
    'rice': { name: 'White Rice (cooked)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, servingSize: 100, servingUnit: 'g' },
    'brown rice': { name: 'Brown Rice (cooked)', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, servingSize: 100, servingUnit: 'g' },
    'oats': { name: 'Oats (rolled, dry)', calories: 389, protein: 16.9, carbs: 66, fat: 6.9, servingSize: 100, servingUnit: 'g' },
    'sweet potato': { name: 'Sweet Potato (baked)', calories: 90, protein: 2, carbs: 20.7, fat: 0.15, servingSize: 100, servingUnit: 'g' },
    'quinoa': { name: 'Quinoa (cooked)', calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9, servingSize: 100, servingUnit: 'g' },
    'pasta': { name: 'Pasta (cooked)', calories: 131, protein: 5, carbs: 25, fat: 1.1, servingSize: 100, servingUnit: 'g' },

    // Fats
    'avocado': { name: 'Avocado', calories: 160, protein: 2, carbs: 8.5, fat: 14.7, servingSize: 100, servingUnit: 'g' },
    'almonds': { name: 'Almonds', calories: 579, protein: 21, carbs: 22, fat: 50, servingSize: 100, servingUnit: 'g' },
    'olive oil': { name: 'Olive Oil', calories: 884, protein: 0, carbs: 0, fat: 100, servingSize: 100, servingUnit: 'ml' },
    'peanut butter': { name: 'Peanut Butter', calories: 588, protein: 25, carbs: 20, fat: 50, servingSize: 100, servingUnit: 'g' },

    // Fruits/Veg
    'apple': { name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, servingSize: 100, servingUnit: 'g' },
    'banana': { name: 'Banana', calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, servingSize: 100, servingUnit: 'g' },
    'broccoli': { name: 'Broccoli (cooked)', calories: 35, protein: 2.4, carbs: 7.2, fat: 0.4, servingSize: 100, servingUnit: 'g' },
    'spinach': { name: 'Spinach (raw)', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, servingSize: 100, servingUnit: 'g' },
};

export class NutritionFoodLookupService {
    /**
     * Batch lookup for food items.
     * Returns a map of lowercased food name -> FoodMacro.
     */
    async findBatch(names: string[]): Promise<Record<string, FoodMacro | null>> {
        const results: Record<string, FoodMacro | null> = {};

        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 50));

        for (const name of names) {
            const normalizedName = name.toLowerCase().trim();
            let match: FoodMacro | null = null;

            // Simple substring matching for mock DB
            for (const [key, macro] of Object.entries(MOCK_FOOD_DB)) {
                if (normalizedName.includes(key)) {
                    match = macro;
                    break;
                }
            }

            results[name] = match;
        }

        return results;
    }
}

export const nutritionFoodLookup = new NutritionFoodLookupService();
