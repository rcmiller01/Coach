/**
 * Backend Routes - Nutrition & Meals API
 * 
 * REST API endpoints for meal planning and food logging.
 * Uses NutritionAiService for AI-powered features.
 */

interface Request {
  query: Record<string, unknown>;
  params: Record<string, string>;
  body: unknown;
  headers: Record<string, unknown>; // Added for x-user-id
}
interface Response {
  status(code: number): Response;
  json(data: unknown): void;
  send(data?: unknown): void;
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
import { WorkoutRepository } from './db/repositories/WorkoutRepository';
import { NutritionLogRepository } from './db/repositories/NutritionLogRepository';
import { WeightRepository } from './db/repositories/WeightRepository';
import { Pool } from 'pg';
import { ProgressSummaryService } from './services/progressSummaryService';
import { NutritionistProfileRepository } from './db/repositories/NutritionistProfileRepository';
import { generateNutritionistPlan } from './services/NutritionistEngine';
import { NutritionistProfile } from '../src/features/nutritionist/types';
import { UserRepository } from './db/repositories/UserRepository';
import { SettingsRepository } from './db/repositories/SettingsRepository';
import { WeeklyPlansRepository } from './db/repositories/WeeklyPlansRepository';
import { LoggingService } from './services/LoggingService';
import { nutritionGenerationSessionStore } from './services/nutritionGenerationSessionStore';
import { WeeklyGenerationTracker } from './services/weeklyGenerationProgress';
import { DEFAULT_NUTRITION_CONFIG, getNutritionConfig } from './services/nutritionPlanConfig';
import { nutritionMetrics } from './services/nutritionMetricsService';

// In-memory storage for development (replace with real database)
const dayLogsStore: Map<string, DayLog> = new Map();

// Service instance - use real or stub based on environment
const USE_REAL_AI = process.env.USE_REAL_AI === 'true';
const nutritionAiService = USE_REAL_AI
  ? new RealNutritionAiService()
  : new StubNutritionAiService();

// Placeholder user ID (in real app, extract from auth token)
const STUB_USER_ID = 'user-123';
const DEMO_MODE = process.env.DEMO_MODE === 'true';
const DEMO_USER_ID = process.env.DEMO_USER_ID || 'demo-user-1';

function getUserId(req: Request): string {
  const headerId = req.headers['x-user-id'] as string;
  if (headerId) return headerId;
  if (DEMO_MODE) return DEMO_USER_ID;
  return STUB_USER_ID;
}

// Repository instances (initialized by server)
let workoutRepo: WorkoutRepository;
let nutritionLogRepo: NutritionLogRepository;
let weightRepo: WeightRepository;
let progressSummaryService: ProgressSummaryService;
let nutritionistRepo: NutritionistProfileRepository;
let userRepo: UserRepository;
let settingsRepo: SettingsRepository;
let weeklyPlansRepo: WeeklyPlansRepository;
let loggingService: LoggingService;

/**
 * Initialize repositories with database pool
 * Called from server.ts after pool is created
 */
export function initializeRepositories(pool: Pool) {
  workoutRepo = new WorkoutRepository(pool);
  nutritionLogRepo = new NutritionLogRepository(pool);
  weightRepo = new WeightRepository(pool);
  progressSummaryService = new ProgressSummaryService(pool);

  // Initialize new repos
  nutritionistRepo = new NutritionistProfileRepository(pool);
  userRepo = new UserRepository(pool);
  settingsRepo = new SettingsRepository(pool);
  weeklyPlansRepo = new WeeklyPlansRepository(pool);
  loggingService = new LoggingService(pool);
}

// ============================================================================
// NUTRITION PLAN ENDPOINTS
// ============================================================================

export async function getNutritionPlan(req: Request, res: Response) {
  try {
    const weekStart = req.query.weekStart as string;
    if (!weekStart) {
      return res.status(400).json({ error: 'weekStart query parameter required' });
    }

    const userId = getUserId(req);
    const plan = await weeklyPlansRepo.getWeeklyPlan(userId, weekStart) || {
      weekStartDate: weekStart,
      days: [],
    };

    res.json({ data: plan });
  } catch (error) {
    console.error('getNutritionPlan error:', error);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
}

export async function generateWeeklyPlan(req: Request, res: Response) {
  console.log('🎯 generateWeeklyPlan called - request received');
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { weekStartDate, targets, userContext, configProfile } = req.body as any;

    console.log('📦 Request body:', JSON.stringify({ weekStartDate, targets, userContext, configProfile }, null, 2));

    // Validate inputs
    if (!weekStartDate || !targets) {
      console.log('❌ Validation failed: missing weekStartDate or targets');
      return res.status(400).json({ error: 'weekStartDate and targets required' });
    }

    // Get nutrition config profile
    const config = configProfile ? getNutritionConfig(configProfile) : DEFAULT_NUTRITION_CONFIG;

    // Create tracker for progress monitoring
    const userId = getUserId(req);
    console.log(`📅 [WeeklyPlan] Starting generation for user ${userId}, week ${weekStartDate}`);
    const tracker = new WeeklyGenerationTracker();
    const sessionId = nutritionGenerationSessionStore.createSession(tracker, userId, weekStartDate);

    console.log(`🆔 Created generation session: ${sessionId}`);

    // Return sessionId immediately, generate plan asynchronously
    res.json({
      data: {
        sessionId,
        weekStartDate,
      }
    });

    // Generate plan asynchronously (don't await here)
    (async () => {
      try {
        const plan = await nutritionAiService.generateMealPlanForWeek({
          weekStartDate,
          targets,
          userContext: userContext || {},
          userId,
          config,
          tracker,
        });

        // Store plan
        await weeklyPlansRepo.upsertWeeklyPlan(userId, weekStartDate, plan);

        console.log(`✅ [WeeklyPlan] Generation complete for session ${sessionId}`);
      } catch (error) {
        console.error(`❌ [WeeklyPlan] Generation failed for session ${sessionId}:`, error);
        tracker.error(error instanceof Error ? error.message : String(error));
      }
    })();
  } catch (error: any) {
    console.error('❌ generateWeeklyPlan error:', error);
    console.error('Error type:', typeof error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack?.split('\n').slice(0, 3).join('\n'));

    // Always return valid JSON
    res.status(500).json({
      error: {
        message: error?.message || 'Failed to generate weekly plan',
        code: error?.code || 'UNKNOWN_ERROR'
      }
    });
  }
}

export async function generateDailyPlan(req: Request, res: Response) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { date, targets, userContext } = req.body as any;

    if (!date || !targets) {
      return res.status(400).json({ error: 'date and targets required' });
    }

    const userId = getUserId(req);
    console.log(`📅 [DailyPlan] Generating for user ${userId}, date ${date}`);
    const dayPlan = await nutritionAiService.generateMealPlanForDay({
      date,
      targets,
      userContext: userContext || {},
      userId,
    });

    const weekStart = getWeekStart(new Date(date));
    let weeklyPlan = await weeklyPlansRepo.getWeeklyPlan(userId, weekStart);

    if (weeklyPlan) {
      const updatedDays = weeklyPlan.days.filter(d => d.date !== date);
      updatedDays.push(dayPlan);
      weeklyPlan = { ...weeklyPlan, days: updatedDays };
    } else {
      weeklyPlan = {
        weekStartDate: weekStart,
        days: [dayPlan]
      };
    }

    await weeklyPlansRepo.upsertWeeklyPlan(userId, weekStart, weeklyPlan);

    console.log(`✅ [DailyPlan] Generated and saved for ${date}`);
    res.json({ data: dayPlan });
  } catch (error) {
    console.error(`❌ [DailyPlan] Failed for ${req.params.date}:`, error);
    res.status(500).json({ error: 'Failed to generate daily plan' });
  }
}

export async function updateDayPlan(req: Request, res: Response) {
  try {
    const date = req.params.date;
    const dayPlan = req.body as DayPlan;

    const userId = getUserId(req);
    const weekStart = getWeekStart(new Date(date));
    const weeklyPlan = await weeklyPlansRepo.getWeeklyPlan(userId, weekStart);
    if (weeklyPlan) {
      const updatedDays = weeklyPlan.days.map(d => d.date === date ? dayPlan : d);
      await weeklyPlansRepo.upsertWeeklyPlan(userId, weekStart, { ...weeklyPlan, days: updatedDays });
    }

    res.json({ data: dayPlan });
  } catch (error) {
    console.error('updateDayPlan error:', error);
    res.status(500).json({ error: 'Failed to update day plan' });
  }
}

export async function copyDayPlan(req: Request, res: Response) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { fromDate, toDate } = req.body as any;

    const userId = getUserId(req);
    const fromWeekStart = getWeekStart(new Date(fromDate));
    const fromWeeklyPlan = await weeklyPlansRepo.getWeeklyPlan(userId, fromWeekStart);
    const sourcePlan = fromWeeklyPlan?.days.find(d => d.date === fromDate);

    if (!sourcePlan) {
      return res.status(404).json({ error: 'Source plan not found' });
    }

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

    const toWeekStart = getWeekStart(new Date(toDate));
    let toWeeklyPlan = await weeklyPlansRepo.getWeeklyPlan(userId, toWeekStart);

    if (toWeeklyPlan) {
      const updatedDays = toWeeklyPlan.days.filter(d => d.date !== toDate);
      updatedDays.push(copiedPlan);
      toWeeklyPlan = { ...toWeeklyPlan, days: updatedDays };
    } else {
      toWeeklyPlan = {
        weekStartDate: toWeekStart,
        days: [copiedPlan]
      };
    }

    await weeklyPlansRepo.upsertWeeklyPlan(userId, toWeekStart, toWeeklyPlan);

    res.json({ data: copiedPlan });
  } catch (error) {
    console.error('copyDayPlan error:', error);
    res.status(500).json({ error: 'Failed to copy day plan' });
  }
}

export async function regenerateMeal(req: Request, res: Response) {
  try {
    const request = req.body as RegenerateMealRequest;

    if (!request.date || !request.dayPlan || request.mealIndex === undefined || !request.targets) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const userId = getUserId(req);
    console.log(`🔄 [RegenerateMeal] Starting for user ${userId}, date ${request.date}, meal ${request.mealIndex}`);
    const response: RegenerateMealResponse = await nutritionAiService.regenerateMeal({
      ...request,
      userId,
    });

    const weekStart = getWeekStart(new Date(request.date));
    const weeklyPlan = await weeklyPlansRepo.getWeeklyPlan(userId, weekStart);
    if (weeklyPlan) {
      const updatedDays = weeklyPlan.days.map(d =>
        d.date === request.date ? response.updatedDayPlan : d
      );
      await weeklyPlansRepo.upsertWeeklyPlan(userId, weekStart, { ...weeklyPlan, days: updatedDays });
    }

    res.json({ data: response.updatedDayPlan });
    console.log(`✅ [RegenerateMeal] Complete for ${request.date}`);
  } catch (error) {
    console.error(`❌ [RegenerateMeal] Failed:`, error);
    res.status(500).json({ error: 'Failed to regenerate meal' });
  }
}

export async function deleteWeeklyPlan(req: Request, res: Response) {
  try {
    const { weekStartDate } = req.body as any;
    if (!weekStartDate) {
      return res.status(400).json({ error: 'weekStartDate required' });
    }

    const userId = getUserId(req);
    console.log(`🗑️ [DeleteWeek] Deleting plan for user ${userId}, week ${weekStartDate}`);
    await weeklyPlansRepo.deleteWeeklyPlan(userId, weekStartDate);

    res.json({ success: true });
  } catch (error) {
    console.error('deleteWeeklyPlan error:', error);
    res.status(500).json({ error: 'Failed to delete weekly plan' });
  }
}

export async function verifyFoodItem(req: Request, res: Response) {
  try {
    const item = req.body as { name: string; quantity: number; unit: string; foodId?: string };

    if (!item.name || !item.quantity || !item.unit) {
      return res.status(400).json({ error: 'Invalid item data: name, quantity, and unit are required' });
    }

    const verified = await nutritionAiService.verifyFoodItem(item);
    res.json({ data: verified });
  } catch (error) {
    console.error('verifyFoodItem error:', error);
    res.status(500).json({ error: 'Failed to verify food item' });
  }
}

// ============================================================================
// MEAL LOG ENDPOINTS
// ============================================================================

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

export async function parseFood(req: Request, res: Response) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { text, city, zipCode, locale } = req.body as any;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text required' });
    }

    const foodItem: LoggedFoodItem = await nutritionAiService.parseFood({
      text,
      userContext: { city, zipCode, locale },
      userId: STUB_USER_ID,
    });

    res.json({ data: foodItem });
  } catch (error: any) {
    console.error('parseFood error:', error);
    const responseBody: any = {
      error: 'Failed to parse food',
      details: error.message,
      stack: error.stack
    };
    if ((error as any).originalError) {
      responseBody.originalError = (error as any).originalError;
    }
    res.status(500).json(responseBody);
  }
}

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
// PROGRESS TRACKING ENDPOINTS
// ============================================================================

export async function logWorkoutSession(req: Request, res: Response) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { date, exercises, notes } = req.body as any;

    if (!date || !exercises || !Array.isArray(exercises)) {
      return res.status(400).json({ error: 'date and exercises array are required' });
    }

    const sets = exercises.flatMap((exercise: any, exerciseIdx: number) =>
      (exercise.sets || []).map((set: any, setIdx: number) => ({
        exerciseName: exercise.name,
        setNumber: setIdx + 1,
        reps: set.reps,
        weightLbs: set.weight,
        rpe: set.rpe,
        notes: set.notes,
        isWarmup: set.isWarmup,
      }))
    );

    const session = await workoutRepo.logWorkoutSession({
      userId: STUB_USER_ID,
      date,
      sets,
      notes,
    });

    res.status(201).json({ data: session });
  } catch (error) {
    console.error('logWorkoutSession error:', error);
    res.status(500).json({ error: 'Failed to log workout session' });
  }
}

export async function logNutritionDay(req: Request, res: Response) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { date, meals } = req.body as any;

    if (!date || !meals || !Array.isArray(meals)) {
      return res.status(400).json({ error: 'date and meals array are required' });
    }

    const log = await nutritionLogRepo.logNutritionDay({
      userId: STUB_USER_ID,
      date,
      meals,
    });

    res.status(201).json({ data: log });
  } catch (error) {
    console.error('logNutritionDay error:', error);
    res.status(500).json({ error: 'Failed to log nutrition day' });
  }
}

export async function logWeight(req: Request, res: Response) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { date, weightLbs } = req.body as any;

    if (!date || weightLbs === undefined) {
      return res.status(400).json({ error: 'date and weightLbs are required' });
    }

    const entry = await weightRepo.logWeight(STUB_USER_ID, date, weightLbs);

    res.status(201).json({ data: entry });
  } catch (error) {
    console.error('logWeight error:', error);
    res.status(500).json({ error: 'Failed to log weight' });
  }
}

export async function getWeekSummary(req: Request, res: Response) {
  try {
    const weekStart = req.query.weekStart as string;

    if (!weekStart) {
      return res.status(400).json({ error: 'weekStart query parameter required' });
    }

    const summary = await progressSummaryService.computeWeeklySummary(
      STUB_USER_ID,
      weekStart
    );

    res.json({ data: summary });
  } catch (error: any) {
    console.error('Week summary error:', error);
    res.status(500).json({ error: 'Failed to get week summary' });
  }
}

export async function getTrends(req: Request, res: Response) {
  try {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate query parameters required' });
    }

    const weightLogs = await weightRepo.getWeightLogsByDateRange(STUB_USER_ID, startDate, endDate);

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (weightLogs.length >= 2) {
      const firstWeight = weightLogs[0].weightLbs;
      const lastWeight = weightLogs[weightLogs.length - 1].weightLbs;
      const diff = lastWeight - firstWeight;

      if (diff > 1) trend = 'increasing';
      else if (diff < -1) trend = 'decreasing';
    }

    res.json({
      data: {
        weights: weightLogs.map(log => ({ date: log.date, weight: log.weightLbs })),
        trend,
      },
    });
  } catch (error) {
    console.error('getTrends error:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
}

// ============================================================================
// AI NUTRITIONIST ENDPOINTS
// ============================================================================

export async function getNutritionistProfile(req: Request, res: Response) {
  try {
    const profile = await nutritionistRepo.getProfile(STUB_USER_ID);

    if (!profile) {
      return res.json({ data: null });
    }

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const summary = await progressSummaryService.computeWeeklySummary(STUB_USER_ID, startDate);

    const result = generateNutritionistPlan({ profile, progress: summary });

    res.json({ data: { profile, result } });
  } catch (error) {
    console.error('getNutritionistProfile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

export async function saveNutritionistProfile(req: Request, res: Response) {
  try {
    const profile = req.body as NutritionistProfile;

    if (!profile) {
      return res.status(400).json({ error: 'Profile data required' });
    }

    const saved = await nutritionistRepo.upsertProfile(STUB_USER_ID, profile);
    const plan = generateNutritionistPlan({ profile: saved });

    res.json({ data: saved, plan });
  } catch (error) {
    console.error('saveNutritionistProfile error:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
}

export async function nutritionistCheckIn(req: Request, res: Response) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { period } = req.body as any;

    const profile = await nutritionistRepo.getProfile(STUB_USER_ID);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const prevStartDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [summary, prevSummary] = await Promise.all([
      progressSummaryService.computeWeeklySummary(STUB_USER_ID, startDate),
      progressSummaryService.computeWeeklySummary(STUB_USER_ID, prevStartDate)
    ]);

    const result = generateNutritionistPlan({
      profile,
      progress: summary,
      previousProgress: prevSummary
    });

    if (profile.currentExperiment) {
      const exp = profile.currentExperiment;
      profile.pastExperiments = [...(profile.pastExperiments || []), { ...exp, status: 'completed', outcome: 'Evaluated at check-in' }];
      profile.currentExperiment = undefined;
      await nutritionistRepo.upsertProfile(STUB_USER_ID, profile);
    }

    res.json({ data: result });
  } catch (error) {
    console.error('nutritionistCheckIn error:', error);
    res.status(500).json({ error: 'Check-in failed' });
  }
}

// ============================================================================
// ALPHA RELEASE ENDPOINTS
// ============================================================================

export async function createUser(req: Request, res: Response) {
  try {
    const { username } = req.body as any;
    if (!username) return res.status(400).json({ error: 'Username required' });

    let user = await userRepo.getUserByUsername(username);
    if (!user) {
      user = await userRepo.createUser(username);
      await loggingService.logEvent(user.id, 'user_created', { username });
    } else {
      await loggingService.logEvent(user.id, 'user_login', { username });
    }

    res.json({ data: user });
  } catch (error) {
    console.error('createUser error:', error);
    res.status(500).json({ error: 'Failed to create/fetch user' });
  }
}

export async function getSettings(req: Request, res: Response) {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const settings = await settingsRepo.getSettings(userId);
    res.json({ data: settings });
  } catch (error) {
    console.error('getSettings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

export async function saveSettings(req: Request, res: Response) {
  try {
    const userId = req.headers['x-user-id'] as string;
    const settings = req.body as any;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const updated = await settingsRepo.upsertSettings(userId, settings);
    await loggingService.logEvent(userId, 'settings_updated', settings);

    res.json({ data: updated });
  } catch (error) {
    console.error('saveSettings error:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
}

export async function logFrontendError(req: Request, res: Response) {
  try {
    const { userId, route, errorMessage, componentStack } = req.body as any;
    await loggingService.logError(userId || null, 'frontend_error', errorMessage, { route, componentStack });
    res.status(200).send();
  } catch (error) {
    console.error('logFrontendError error:', error);
    res.status(500).send();
  }
}

export async function getTodaySummary(req: Request, res: Response) {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const settings = await settingsRepo.getSettings(userId);
    const isWorkoutDay = (settings.trainingDays || []).includes(new Date().getDay());

    const profile = await nutritionistRepo.getProfile(userId);
    let calorieTarget = settings.calorieTarget || 2000;
    let mealsPerDay = settings.mealsPerDay || 3;

    const summary = {
      date: new Date().toISOString().split('T')[0],
      isWorkoutDay,
      nutrition: {
        calorieTarget,
        mealsPerDay
      },
      weight: {
        lastLoggedDate: undefined,
        lastLoggedWeight: undefined
      }
    };

    res.json({ data: summary });
  } catch (error) {
    console.error('getTodaySummary error:', error);
    res.status(500).json({ error: 'Failed to get summary' });
  }
}

export async function regenerateWeek(req: Request, res: Response) {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    await loggingService.logEvent(userId, 'program_regenerated', {});

    res.json({ message: 'Week regenerated successfully' });
  } catch (error) {
    console.error('regenerateWeek error:', error);
    res.status(500).json({ error: 'Failed to regenerate week' });
  }
}

export async function reconfigureNutrition(req: Request, res: Response) {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const profile = await nutritionistRepo.getProfile(userId);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const plan = generateNutritionistPlan({ profile });

    await loggingService.logEvent(userId, 'nutrition_reconfigured', {});

    res.json({ data: plan });
  } catch (error) {
    console.error('reconfigureNutrition error:', error);
    res.status(500).json({ error: 'Failed to reconfigure nutrition' });
  }
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d.toISOString().split('T')[0];
}

// ============================================================================
// NUTRITION METRICS & STATUS ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/nutrition/metrics
 * Returns global nutrition generation metrics
 */
export async function getNutritionMetrics(req: Request, res: Response) {
  try {
    const metrics = nutritionMetrics.getMetrics();
    const firstPassQualityRate = nutritionMetrics.getFirstPassQualityRate();
    const autoFixSuccessRate = nutritionMetrics.getAutoFixSuccessRate();
    const regenerationSuccessRate = nutritionMetrics.getRegenerationSuccessRate();

    res.json({
      data: {
        weeksGenerated: metrics.totalWeeksGenerated,
        daysGenerated: metrics.totalDaysGenerated,
        firstPassQuality: {
          withinTolerance: metrics.daysWithinToleranceFirstPass,
          outOfRange: metrics.daysOutOfRangeFirstPass,
          rate: firstPassQualityRate,
        },
        autoFix: {
          scaled: metrics.daysFixedByScaling,
          regenerated: metrics.daysFixedByRegeneration,
          stillOutOfRange: metrics.daysStillOutOfRangeAfterAutoFix,
          successRate: autoFixSuccessRate,
        },
        regeneration: {
          totalAttempts: metrics.totalRegenerationAttempts,
          successes: metrics.regenerationSuccesses,
          failures: metrics.regenerationFailures,
          successRate: regenerationSuccessRate,
        },
        performance: {
          avgGenerationMs: metrics.averageGenerationTimeMs,
          avgAutoFixMs: metrics.averageAutoFixTimeMs,
        },
      },
    });
  } catch (error) {
    console.error('getNutritionMetrics error:', error);
    res.status(500).json({ error: 'Failed to get nutrition metrics' });
  }
}

/**
 * GET /api/v1/nutrition/generation/:sessionId/status
 * Returns real-time status of a meal plan generation session
 */
export async function getGenerationStatus(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;

    const session = nutritionGenerationSessionStore.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const status = session.tracker.getStatus();

    res.json({
      data: {
        sessionId: session.sessionId,
        userId: session.userId,
        weekStartDate: session.weekStartDate,
        createdAt: session.createdAt,
        status,
      },
    });
  } catch (error) {
    console.error('getGenerationStatus error:', error);
    res.status(500).json({ error: 'Failed to get generation status' });
  }
}

/**
 * DELETE /api/v1/nutrition/generation/:sessionId
 * Remove a completed or expired session (cleanup)
 */
export async function deleteGenerationSession(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;

    const session = nutritionGenerationSessionStore.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    nutritionGenerationSessionStore.removeSession(sessionId);

    res.json({ message: 'Session removed successfully' });
  } catch (error) {
    console.error('deleteGenerationSession error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
}

/**
 * POST /api/nutrition/experiments/compare-modes
 * Run an A/B test comparing different nutrition generation modes.
 */
export async function compareNutritionModes(req: Request, res: Response) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { weekStartDate, targets, userContext, modes } = req.body as any;

    if (!weekStartDate || !targets || !modes || !Array.isArray(modes)) {
      return res.status(400).json({ error: 'weekStartDate, targets, and modes array required' });
    }

    const results = await nutritionAiService.runExperiment(
      weekStartDate,
      targets,
      userContext || {},
      modes,
      STUB_USER_ID
    );

    res.json({ data: results });
  } catch (error) {
    console.error('compareNutritionModes error:', error);
    res.status(500).json({ error: 'Experiment failed' });
  }
}


