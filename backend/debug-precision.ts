
import { RealNutritionAiService } from './RealNutritionAiService';
import { nutritionFoodLookup } from './services/nutritionFoodLookupService';
import { PRECISION_NUTRITION_CONFIG } from './services/nutritionPlanConfig';
import { NutritionTargets } from '../src/features/nutrition/nutritionTypes';

async function run() {
    console.log('Starting debug script...');

    // Mock DB response
    const mockDbResponse = {
        'chicken breast': {
            name: 'Chicken Breast',
            calories: 165,
            protein: 31,
            carbs: 0,
            fat: 3.6,
            servingSize: 100,
            servingUnit: 'g'
        }
    };

    // Mock findBatch
    nutritionFoodLookup.findBatch = async (names: string[]) => {
        console.log('findBatch called with:', names);
        return mockDbResponse;
    };

    const service = new RealNutritionAiService();

    const dayPlan = {
        date: '2025-01-01',
        meals: [{
            id: 'm1',
            type: 'lunch',
            items: [{
                id: 'i1',
                name: 'chicken breast',
                quantity: 100,
                unit: 'g',
                calories: 200,
                proteinGrams: 30,
                carbsGrams: 0,
                fatsGrams: 5
            }]
        }]
    };

    try {
        // Access private method
        const correctedDays = await (service as any).applyPrecisionCorrections(
            [dayPlan],
            {} as NutritionTargets,
            PRECISION_NUTRITION_CONFIG
        );

        const correctedItem = correctedDays[0].meals[0].items[0];
        console.log('Corrected Item:', JSON.stringify(correctedItem, null, 2));

        if (correctedItem.calories === 165) {
            console.log('✅ SUCCESS: Calories corrected to 165');
        } else {
            console.log(`❌ FAILURE: Calories are ${correctedItem.calories}, expected 165`);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
