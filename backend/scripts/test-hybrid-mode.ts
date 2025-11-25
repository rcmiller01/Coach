
import { RealNutritionAiService } from '../RealNutritionAiService';
import { DayPlan, NutritionTargets, UserContext } from '../../src/features/nutrition/nutritionTypes';
import { WeeklyGenerationTracker } from '../services/weeklyGenerationProgress';
import { DEFAULT_NUTRITION_CONFIG } from '../services/nutritionPlanConfig';

async function testHybridMode() {
    console.log('🧪 Testing Hybrid Mode (Verified Regeneration)...');

    const service = new RealNutritionAiService();
    const tracker = new WeeklyGenerationTracker();

    // Mock targets
    const targets: NutritionTargets = {
        caloriesPerDay: 2000,
        proteinGrams: 150,
        carbsGrams: 200,
        fatGrams: 65,
    };

    const userContext: UserContext = { locale: 'en-US' };
    const userId = 'test-user';

    // Create a mock day that is WAY out of range (too low)
    // This should trigger scaling, but we'll mock the scaling to fail or be insufficient
    // Actually, let's just create a day that is structurally valid but numerically terrible
    const badDay: DayPlan = {
        date: '2025-01-01',
        meals: [
            {
                id: 'm1',
                type: 'breakfast',
                items: [{ id: 'i1', name: 'Tiny Apple', quantity: 1, unit: 'piece', calories: 50, proteinGrams: 0, carbsGrams: 10, fatsGrams: 0 }]
            }
        ],
        aiExplanation: { summary: 'Bad plan', details: 'Very bad plan' }
    };

    // We need to spy on generateMealPlanForDay to see if it's called with useTools: true
    // But since we can't easily spy in this script without a test runner, we'll rely on logs
    // and the fact that we're calling the real service.

    // However, we want to force the "Verified Regeneration" path.
    // The logic is: Scale -> Regenerate (Fast) -> Verified Regenerate.

    // To ensure we hit Verified Regenerate, we need Fast Regenerate to FAIL to produce a good plan.
    // This is hard to guarantee with the real LLM unless we mock it.

    // ALTERNATIVE: We can just run the function and see if it logs "Attempting Verified Regeneration".
    // But that requires the LLM to fail twice.

    // Let's try to run it and see. If the LLM is good, it might fix it in the Fast phase.
    // To force failure, we could set strict targets that are hard to hit? No, that's flaky.

    // Let's just run it and observe.

    console.log('Running autoFixDayMacros on a bad day...');
    const fixedDay = await service['autoFixDayMacros'](
        badDay,
        targets,
        userContext,
        userId,
        { ...DEFAULT_NUTRITION_CONFIG, enableAutoFix: true, maxRegenerationsPerDay: 1 }, // 1 fast attempt
        tracker
    );

    console.log('Fixed Day:', JSON.stringify(fixedDay, null, 2));
    console.log('Tracker Status:', JSON.stringify(tracker.getStatus(), null, 2));
}

// We need to access private method, so we cast to any
testHybridMode().catch(console.error);
