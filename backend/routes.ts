/**
 * Backend Routes - Nutrition & Meals API
 * 
 * REST API endpoints for meal planning and food logging.
 * Uses NutritionAiService for AI-powered features.
 * 
 * This is a TypeScript pseudo-implementation showing the API structure.
 * In a real backend (Express, Fastify, etc.), you'd wire these to actual route handlers.
 * 
 * Example with Express:
 * ```
 * app.get('/api/nutrition/plan', getNutritionPlan);
 * app.post('/api/nutrition/plan/week', generateWeeklyPlan);
 * // etc.
 * ```
 */

// Stub types for Express Request/Response (replace with real Express types in production)
interface Request {
  query: Record<string, unknown>;
  params: Record<string, string>;
  body: unknown;
}
interface Response {
  status(code: number): Response;
  json(data: unknown): void;
}
import type {
  WeeklyPlan,
  DayPlan,
  DayLog,
  LoggedFoodItem,
  ApiErrorResponse,
  RegenerateMealRequest,
  RegenerateMealResponse,
} from '../src/features/nutrition/nutritionTypes';
import { NutritionApiError } from '../src/features/nutrition/nutritionTypes';
import { StubNutritionAiService } from './NutritionAiService';
import { RealNutritionAiService } from './RealNutritionAiService';
import { generateProgramWeekFromOnboarding } from '../src/features/program/programGenerator';
import type { OnboardingState } from '../src/features/onboarding/types';

// In-memory storage for development (replace with real database)
const weeklyPlansStore: Map<string, WeeklyPlan> = new Map();
const dayLogsStore: Map<string, DayLog> = new Map();

// Service instance - use real or stub based on environment
const USE_REAL_AI = process.env.USE_REAL_AI === 'true';
const nutritionAiService = USE_REAL_AI
  ? new RealNutritionAiService()
  : new StubNutritionAiService();

// Placeholder user ID (in real app, extract from auth token)
const STUB_USER_ID = 'user-123';

// ============================================================================
// NUTRITION PLAN ENDPOINTS
// ============================================================================

/**
 * GET /api/nutrition/plan?weekStart=YYYY-MM-DD
 * Fetch weekly meal plan
 */
export async function getNutritionPlan(req: Request, res: Response) {
  try {
    const weekStart = req.query.weekStart as string;
    if (!weekStart) {
      return res.status(400).json({ error: 'weekStart query parameter required' });
    }

    const plan = weeklyPlansStore.get(weekStart) || {
      weekStartDate: weekStart,
      days: [],
    };

    res.json({ data: plan });
  } catch (error) {
    console.error('getNutritionPlan error:', error);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
}

/**
 * POST /api/nutrition/plan/week
 * Generate new weekly meal plan using AI
 * Body: { weekStartDate: string, targets: NutritionTargets, userContext: UserContext }
 */
export async function generateWeeklyPlan(req: Request, res: Response) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { weekStartDate, targets, userContext } = req.body as any;

    // Validate inputs
    if (!weekStartDate || !targets) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'weekStartDate and targets are required',
          retryable: false,
        },
      };
      return res.status(400).json(errorResponse);
    }

    // Generate plan using real AI service
    const plan = await nutritionAiService.generateMealPlanForWeek({
      weekStartDate,
      targets,
      userContext: userContext || {},
      userId: STUB_USER_ID,
    });

    // Store plan
    weeklyPlansStore.set(weekStartDate, plan);

    res.json({ data: plan });
  } catch (error) {
    console.error('generateWeeklyPlan error:', error);

    if (error instanceof NutritionApiError) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: error.code,
          message: error.message,
          retryable: error.retryable,
          details: error.details,
        },
      };

      const statusCode =
        error.code === 'AI_QUOTA_EXCEEDED' ? 429 :
          error.code === 'AI_TIMEOUT' ? 504 :
            error.code === 'VALIDATION_ERROR' ? 400 :
              500;

      return res.status(statusCode).json(errorResponse);
    }

    const errorResponse: ApiErrorResponse = {
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Failed to generate weekly plan',
        retryable: false,
      },
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * POST /api/nutrition/plan/day
 * Generate new daily meal plan using AI
 * Body: { date: string, targets: NutritionTargets, userContext: UserContext }
 */
export async function generateDailyPlan(req: Request, res: Response) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { date, targets, userContext } = req.body as any;

    // Validate inputs
    if (!date || !targets) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'date and targets are required',
          retryable: false,
        },
      };
      return res.status(400).json(errorResponse);
    }

    // Generate plan using real AI service
    const dayPlan = await nutritionAiService.generateMealPlanForDay({
      date,
      targets,
      userContext: userContext || {},
      userId: STUB_USER_ID,
    });

    // Update weekly plan store if exists
    const weekStart = getWeekStart(new Date(date));
    const weeklyPlan = weeklyPlansStore.get(weekStart);
    if (weeklyPlan) {
      const updatedDays = weeklyPlan.days.filter(d => d.date !== date);
      updatedDays.push(dayPlan);
      weeklyPlansStore.set(weekStart, { ...weeklyPlan, days: updatedDays });
    }

    res.json({ data: dayPlan });
  } catch (error) {
    console.error('generateDailyPlan error:', error);

    if (error instanceof NutritionApiError) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: error.code,
          message: error.message,
          retryable: error.retryable,
          details: error.details,
        },
      };

      const statusCode =
        error.code === 'AI_QUOTA_EXCEEDED' ? 429 :
          error.code === 'AI_TIMEOUT' ? 504 :
            error.code === 'VALIDATION_ERROR' ? 400 :
              500;

      return res.status(statusCode).json(errorResponse);
    }

    const errorResponse: ApiErrorResponse = {
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Failed to generate daily plan',
        retryable: false,
      },
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * PUT /api/nutrition/plan/day/:date
 * Update an existing day plan
 * Body: DayPlan
 */
export async function updateDayPlan(req: Request, res: Response) {
  try {
    const date = req.params.date;
    const dayPlan = req.body as DayPlan;

    // Update in weekly plan store
    const weekStart = getWeekStart(new Date(date));
    const weeklyPlan = weeklyPlansStore.get(weekStart);
    if (weeklyPlan) {
      const updatedDays = weeklyPlan.days.map(d => d.date === date ? dayPlan : d);
      weeklyPlansStore.set(weekStart, { ...weeklyPlan, days: updatedDays });
    }

    res.json({ data: dayPlan });
  } catch (error) {
    console.error('updateDayPlan error:', error);
    res.status(500).json({ error: 'Failed to update day plan' });
  }
}

/**
 * POST /api/nutrition/plan/copy
 * Copy meal plan from one day to another
 * Body: { fromDate: string, toDate: string }
 */
export async function copyDayPlan(req: Request, res: Response) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { fromDate, toDate } = req.body as any;

    const fromWeekStart = getWeekStart(new Date(fromDate));
    const fromWeeklyPlan = weeklyPlansStore.get(fromWeekStart);
    const sourcePlan = fromWeeklyPlan?.days.find(d => d.date === fromDate);

    if (!sourcePlan) {
      return res.status(404).json({ error: 'Source plan not found' });
    }

    // Create copy with new date and IDs
    const copiedPlan: DayPlan = {
      date: toDate,
      meals: sourcePlan.meals.map(meal => ({
        ...meal,
        id: `${meal.type}-${toDate}`,
        items: meal.items.map(item => ({
          ...item,
          id: `${item.id}-copy-${Date.now()}`,
        })),
      })),
    };

    // Store in destination week
    const toWeekStart = getWeekStart(new Date(toDate));
    const toWeeklyPlan = weeklyPlansStore.get(toWeekStart);
    if (toWeeklyPlan) {
      const updatedDays = toWeeklyPlan.days.filter(d => d.date !== toDate);
      updatedDays.push(copiedPlan);
      weeklyPlansStore.set(toWeekStart, { ...toWeeklyPlan, days: updatedDays });
    }

    res.json({ data: copiedPlan });
  } catch (error) {
    console.error('copyDayPlan error:', error);
    res.status(500).json({ error: 'Failed to copy day plan' });
  }
}

/**
 * POST /api/nutrition/plan/day/regenerate-meal
 * Regenerate a single meal within a day plan
 * Body: RegenerateMealRequest
 */
export async function regenerateMeal(req: Request, res: Response) {
  try {
    const request = req.body as RegenerateMealRequest;

    // Validate inputs
    if (!request.date || !request.dayPlan || request.mealIndex === undefined || !request.targets) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'date, dayPlan, mealIndex, and targets are required',
          retryable: false,
        },
      };
      return res.status(400).json(errorResponse);
    }

    // Regenerate meal using AI service
    const response: RegenerateMealResponse = await nutritionAiService.regenerateMeal({
      ...request,
      userId: STUB_USER_ID,
    });

    // Update in weekly plan store
    const weekStart = getWeekStart(new Date(request.date));
    const weeklyPlan = weeklyPlansStore.get(weekStart);
    if (weeklyPlan) {
      const updatedDays = weeklyPlan.days.map(d =>
        d.date === request.date ? response.updatedDayPlan : d
      );
      weeklyPlansStore.set(weekStart, { ...weeklyPlan, days: updatedDays });
    }

    res.json({ data: response.updatedDayPlan });
  } catch (error) {
    console.error('regenerateMeal error:', error);

    if (error instanceof NutritionApiError) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: error.code,
          message: error.message,
          retryable: error.retryable,
          details: error.details,
        },
      };

      const statusCode =
        error.code === 'AI_QUOTA_EXCEEDED' ? 429 :
          error.code === 'AI_TIMEOUT' ? 504 :
            error.code === 'VALIDATION_ERROR' ? 400 :
              500;

      return res.status(statusCode).json(errorResponse);
    }

    const errorResponse: ApiErrorResponse = {
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Failed to regenerate meal',
        retryable: false,
      },
    };
    res.status(500).json(errorResponse);
  }
}

// ============================================================================
// MEAL LOG ENDPOINTS
// ============================================================================

/**
 * GET /api/meals/log/:date
 * Fetch food log for a specific date
 */
export async function getDayLog(req: Request, res: Response) {
  try {
    const date = req.params.date;
    const log = dayLogsStore.get(date) || {
      date,
      items: [],
      totalCalories: 0,
      totalProteinGrams: 0,
      totalCarbsGrams: 0,
      totalFatsGrams: 0,
    };

    res.json({ data: log });
  } catch (error) {
    console.error('getDayLog error:', error);
    res.status(500).json({ error: 'Failed to fetch day log' });
  }
}

/**
 * PUT /api/meals/log/:date
 * Save/update food log for a specific date
 * Body: DayLog
 */
export async function saveDayLog(req: Request, res: Response) {
  try {
    const date = req.params.date;
    const log = req.body as DayLog;

    dayLogsStore.set(date, log);

    res.json({ data: log });
  } catch (error) {
    console.error('saveDayLog error:', error);
    res.status(500).json({ error: 'Failed to save day log' });
  }
}

/**
 * POST /api/nutrition/parse-food
 * Parse free-text food description using AI
 * Body: { text: string, city?: string, zipCode?: string, locale?: string }
 */
export async function parseFood(req: Request, res: Response) {
  console.log('📥 parseFood route hit');
  console.log('Request body:', JSON.stringify(req.body));

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { text, city, zipCode, locale } = req.body as any;

    if (!text || typeof text !== 'string') {
      console.log('❌ Validation failed: text is required');
      const errorResponse: ApiErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'text field is required and must be a string',
          retryable: false,
        },
      };
      return res.status(400).json(errorResponse);
    }

    console.log(`🔍 Calling AI to parse: "${text}"`);
    // Parse food using AI service
    const foodItem: LoggedFoodItem = await nutritionAiService.parseFood({
      text,
      userContext: { city, zipCode, locale },
      userId: STUB_USER_ID,
    });

    console.log('✅ Food parsed successfully:', foodItem.name);
    res.json({ data: foodItem });
  } catch (error) {
    console.error('parseFood error:', error);

    // Handle typed errors
    if (error instanceof NutritionApiError) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: error.code,
          message: error.message,
          retryable: error.retryable,
          details: error.details,
        },
      };

      // Map error codes to HTTP status codes
      const statusCode =
        error.code === 'AI_QUOTA_EXCEEDED' ? 429 :
          error.code === 'AI_TIMEOUT' ? 504 :
            error.code === 'VALIDATION_ERROR' ? 400 :
              error.code === 'NOT_FOUND' ? 404 :
                500;

      return res.status(statusCode).json(errorResponse);
    }

    // Unhandled errors
    const errorResponse: ApiErrorResponse = {
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred while parsing your food',
        retryable: false,
      },
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * POST /api/program/week/generate
 * Generate workout program week from onboarding state
 * Body: { onboardingState: OnboardingState }
 */
export async function generateWorkoutProgram(req: Request, res: Response) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { onboardingState } = req.body as any;

    if (!onboardingState) {
      return res.status(400).json({ error: 'onboardingState is required' });
    }

    const programWeek = generateProgramWeekFromOnboarding(onboardingState);

    res.json({ data: programWeek });
  } catch (error) {
    console.error('generateWorkoutProgram error:', error);
    res.status(500).json({ error: 'Failed to generate workout program' });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get Monday of the week for a given date
 */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

// ============================================================================
// TODO: REAL BACKEND SETUP
// ============================================================================

/*
 * To set up a real backend, you would:
 * 
 * 1. Install dependencies:
 *    npm install express cors dotenv
 *    npm install -D @types/express @types/cors
 * 
 * 2. Create server.ts:
 *    import express from 'express';
 *    import cors from 'cors';
 *    import * as nutritionRoutes from './routes/nutrition';
 *    
 *    const app = express();
 *    app.use(cors());
 *    app.use(express.json());
 *    
 *    app.get('/api/nutrition/plan', nutritionRoutes.getNutritionPlan);
 *    app.post('/api/nutrition/plan/week', nutritionRoutes.generateWeeklyPlan);
 *    // ... register all routes
 *    
 *    app.listen(3001, () => console.log('API listening on port 3001'));
 * 
 * 3. Connect to database (PostgreSQL, MongoDB, etc.)
 * 
 * 4. Implement authentication middleware
 * 
 * 5. Wire up real LLM (OpenAI, Anthropic, etc.)
 * 
 * 6. Connect to MCP nutrition server
 */
