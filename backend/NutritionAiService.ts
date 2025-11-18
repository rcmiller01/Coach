/**
 * NutritionAiService Interface
 * 
 * Defines the contract for AI-powered nutrition features.
 * This service orchestrates:
 * - LLM calls for meal plan generation
 * - MCP nutrition server for food database lookup
 * - Parsing user text input into structured food data
 * 
 * TODO: Implement real LLM + MCP integration
 * TODO: Add abuse protection (rate limiting, quota checks)
 */

import type {
  WeeklyPlan,
  DayPlan,
  LoggedFoodItem,
  NutritionTargets,
  UserContext,
} from '../src/features/nutrition/nutritionTypes';

/**
 * User quota tracking (stub)
 * TODO: Implement persistent storage and actual limits
 */
export interface UserAiQuota {
  userId: string;
  dailyPlanGenerationsRemaining: number;
  dailyFoodParsesRemaining: number;
  resetAt: Date;
}

export interface NutritionAiService {
  /**
   * Check if user has AI quota remaining for a specific action.
   * Throws error if quota exceeded.
   * 
   * @param userId - User identifier
   * @param action - Type of AI action to check
   */
  checkUserAiQuota(
    userId: string,
    action: 'generatePlan' | 'parseFood'
  ): Promise<UserAiQuota>;

  /**
   * Generate a full week meal plan using AI.
   * 
   * @param args - Generation parameters
   * @returns WeeklyPlan with 7 days of meals
   * 
   * TODO: Implement LLM prompt engineering:
   * - Include user targets (calories, macros)
   * - Consider location for restaurant options
   * - Respect dietary preferences/restrictions
   * - Balance variety across the week
   */
  generateMealPlanForWeek(args: {
    weekStartDate: string;
    targets: NutritionTargets;
    userContext: UserContext;
    userId: string;
  }): Promise<WeeklyPlan>;

  /**
   * Generate a single day meal plan using AI.
   * 
   * @param args - Generation parameters
   * @returns DayPlan with breakfast, lunch, dinner, snacks
   * 
   * TODO: Same as generateMealPlanForWeek but for one day
   */
  generateMealPlanForDay(args: {
    date: string;
    targets: NutritionTargets;
    userContext: UserContext;
    userId: string;
  }): Promise<DayPlan>;

  /**
   * Parse free-text food description into structured data.
   * Uses AI to interpret portion sizes, cooking methods, etc.
   * Queries nutrition database (via MCP) for macro values.
   * 
   * @param args - Parsing parameters
   * @returns LoggedFoodItem with calories, macros, explanation, sources, confidence
   * 
   * TODO: Implement multi-step process:
   * 1. LLM parses text into structured query
   * 2. MCP nutrition server looks up food in database
   * 3. LLM generates explanation and confidence score
   * 4. Return combined result
   */
  parseFood(args: {
    text: string;
    userContext: UserContext;
    userId: string;
  }): Promise<LoggedFoodItem>;
}

/**
 * Stub implementation using dummy data.
 * Replace with real implementation when backend is ready.
 */
export class StubNutritionAiService implements NutritionAiService {
  async checkUserAiQuota(
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    action: 'generatePlan' | 'parseFood'
  ): Promise<UserAiQuota> {
    // Stub: Always allow for now
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
    // Stub: Return dummy 7-day plan
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
    // Stub: Return dummy plan for one day
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
    // Stub: Return plausible dummy result
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
        reasoning: `Based on your description "${args.text}", I estimated typical nutrition values for this food. The values are derived from similar items in the USDA database.`,
        sources: [
          { label: 'USDA FoodData Central', url: 'https://fdc.nal.usda.gov/' },
          { label: 'Internal food database' },
        ],
        confidence: 'medium',
      },
    };
  }
}
