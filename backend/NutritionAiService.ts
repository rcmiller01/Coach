/**
 * NutritionAiService Interface
 * 
 * Defines the contract for AI-powered nutrition features.
 * This service orchestrates:
 * - LLM calls for meal plan generation
 * - MCP nutrition server for food database lookup
 * - Parsing user text input into structured food data
 */

import type {
  WeeklyPlan,
  DayPlan,
  LoggedFoodItem,
  NutritionTargets,
  UserContext,
  PlanProfile,
  DietaryPreferences,
  RegenerateMealRequest,
  RegenerateMealResponse,
} from '../src/features/nutrition/nutritionTypes';

/**
 * User quota tracking (stub)
 */
export interface UserAiQuota {
  userId: string;
  dailyPlanGenerationsRemaining: number;
  dailyFoodParsesRemaining: number;
  resetAt: Date;
}

export interface NutritionAiService {
  checkUserAiQuota(
    userId: string,
    action: 'generatePlan' | 'parseFood'
  ): Promise<UserAiQuota>;

  generateMealPlanForWeek(args: {
    weekStartDate: string;
    targets: NutritionTargets;
    userContext: UserContext;
    userId: string;
    planProfile?: PlanProfile;
    preferences?: DietaryPreferences;
    previousWeek?: WeeklyPlan;
  }): Promise<WeeklyPlan>;

  generateMealPlanForDay(args: {
    date: string;
    targets: NutritionTargets;
    userContext: UserContext;
    userId: string;
    planProfile?: PlanProfile;
    preferences?: DietaryPreferences;
  }): Promise<DayPlan>;

  regenerateMeal(request: RegenerateMealRequest & { userId: string }): Promise<RegenerateMealResponse>;

  parseFood(args: {
    text: string;
    userContext: UserContext;
    userId: string;
  }): Promise<LoggedFoodItem>;

  verifyFoodItem(item: {
    name: string;
    quantity: number;
    unit: string;
    foodId?: string;
  }): Promise<{
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatsGrams: number;
  }>;

  runExperiment(
    weekStartDate: string,
    targets: NutritionTargets,
    userContext: UserContext,
    modes: string[],
    userId: string
  ): Promise<any[]>;
}

/**
 * Stub implementation using dummy data.
 */
export class StubNutritionAiService implements NutritionAiService {
  // ... existing methods ...

  async runExperiment(
    weekStartDate: string,
    targets: NutritionTargets,
    userContext: UserContext,
    modes: string[],
    userId: string
  ): Promise<any[]> {
    return modes.map(mode => ({
      mode,
      totalTimeMs: 1000,
      macroDeviation: { calories: 50, protein: 5, carbs: 10, fat: 2 },
      qualityScore: 0.95,
      note: 'Stub experiment result'
    }));
  }

  async checkUserAiQuota(
    userId: string,
    action: 'generatePlan' | 'parseFood'
  ): Promise<UserAiQuota> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      userId,
      dailyPlanGenerationsRemaining: 10,
      dailyFoodParsesRemaining: 50,
      resetAt: tomorrow,
    };
  }

  async generateMealPlanForWeek(args: {
    weekStartDate: string;
    targets: NutritionTargets;
    userContext: UserContext;
    userId: string;
  }): Promise<WeeklyPlan> {
    const days: DayPlan[] = [];
    const startDate = new Date(args.weekStartDate);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      days.push({
        date: dateStr,
        meals: [
          {
            id: `breakfast-${dateStr}`,
            type: 'breakfast',
            items: [
              {
                id: `food-1-${dateStr}`,
                name: 'Oatmeal with berries and almonds',
                quantity: 1,
                unit: 'serving',
                calories: 350,
                proteinGrams: 12,
                carbsGrams: 58,
                fatsGrams: 10,
              },
            ],
          },
          {
            id: `lunch-${dateStr}`,
            type: 'lunch',
            items: [
              {
                id: `food-2-${dateStr}`,
                name: 'Grilled chicken Caesar salad',
                quantity: 1,
                unit: 'serving',
                calories: 480,
                proteinGrams: 42,
                carbsGrams: 22,
                fatsGrams: 20,
              },
            ],
          },
          {
            id: `dinner-${dateStr}`,
            type: 'dinner',
            items: [
              {
                id: `food-3-${dateStr}`,
                name: 'Baked salmon with quinoa and broccoli',
                quantity: 1,
                unit: 'serving',
                calories: 550,
                proteinGrams: 48,
                carbsGrams: 45,
                fatsGrams: 18,
              },
            ],
          },
        ],
      });
    }

    return {
      weekStartDate: args.weekStartDate,
      days,
    };
  }

  async generateMealPlanForDay(args: {
    date: string;
    targets: NutritionTargets;
    userContext: UserContext;
    userId: string;
  }): Promise<DayPlan> {
    return {
      date: args.date,
      meals: [
        {
          id: `breakfast-${args.date}`,
          type: 'breakfast',
          items: [
            {
              id: `food-1-${args.date}`,
              name: 'Greek yogurt parfait',
              quantity: 1,
              unit: 'serving',
              calories: 320,
              proteinGrams: 18,
              carbsGrams: 40,
              fatsGrams: 8,
            },
          ],
        },
        {
          id: `lunch-${args.date}`,
          type: 'lunch',
          items: [
            {
              id: `food-2-${args.date}`,
              name: 'Turkey and avocado wrap',
              quantity: 1,
              unit: 'serving',
              calories: 450,
              proteinGrams: 32,
              carbsGrams: 48,
              fatsGrams: 14,
            },
          ],
        },
        {
          id: `dinner-${args.date}`,
          type: 'dinner',
          items: [
            {
              id: `food-3-${args.date}`,
              name: 'Beef stir-fry with brown rice',
              quantity: 1,
              unit: 'serving',
              calories: 580,
              proteinGrams: 45,
              carbsGrams: 55,
              fatsGrams: 18,
            },
          ],
        },
      ],
    };
  }

  async parseFood(args: {
    text: string;
    userContext: UserContext;
    userId: string;
  }): Promise<LoggedFoodItem> {
    return {
      id: `parsed-${Date.now()}`,
      name: args.text,
      quantity: 1,
      unit: 'serving',
      calories: 400,
      proteinGrams: 28,
      carbsGrams: 42,
      fatsGrams: 12,
      sourceType: 'search',
      aiExplanation: {
        reasoning: `Based on your description "${args.text}", I estimated typical nutrition values.`,
        sources: [
          { label: 'USDA FoodData Central', url: 'https://fdc.nal.usda.gov/' },
        ],
        confidence: 'medium',
      },
      userAdjusted: false,
      dataSource: 'estimated',
    };
  }

  async regenerateMeal(request: RegenerateMealRequest & { userId: string }): Promise<RegenerateMealResponse> {
    const newMeal = {
      id: `meal-${Date.now()}`,
      type: request.dayPlan.meals[request.mealIndex].type,
      items: [
        {
          id: `food-regen-${Date.now()}`,
          name: 'Regenerated Meal Option',
          quantity: 1,
          unit: 'serving' as any,
          calories: 500,
          proteinGrams: 30,
          carbsGrams: 50,
          fatsGrams: 20,
        },
      ],
    };

    const updatedDayPlan = {
      ...request.dayPlan,
      meals: request.dayPlan.meals.map((m, i) => (i === request.mealIndex ? newMeal : m)),
    };

    return {
      updatedDayPlan,
    };
  }

  async verifyFoodItem(item: {
    name: string;
    quantity: number;
    unit: string;
    foodId?: string;
  }): Promise<{
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatsGrams: number;
  }> {
    return {
      calories: 100,
      proteinGrams: 10,
      carbsGrams: 10,
      fatsGrams: 2,
    };
  }
}
