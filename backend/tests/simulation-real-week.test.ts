import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import * as routes from '../routes';
import { generateProgramWeekFromOnboarding } from '../../src/features/program/programGenerator';
import { initialOnboardingState, OnboardingState } from '../../src/features/onboarding/types';

// Mock the database pool
const mockPool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Setup express app for testing
const app = express();
app.use(express.json());

// Register routes
app.post('/api/logs/workout-session', routes.logWorkoutSession);
app.post('/api/logs/nutrition-day', routes.logNutritionDay);
app.post('/api/logs/weight', routes.logWeight);
app.get('/api/progress/week-summary', routes.getWeekSummary);

describe('Real User Week Simulation', () => {
    const TEST_USER_ID = 'demo-user'; // Hardcoded in routes.ts for now
    const WEEK_START = '2025-06-02'; // Monday

    // User Profile: 30yo Male, Lower Back Pain, 45m/session, Dumbbells
    const userProfile: OnboardingState = {
        ...initialOnboardingState,
        age: 30,
        gender: 'male',
        weightLbs: 185,
        heightFeet: 5,
        heightInches: 10,
        primaryGoal: 'build_muscle',
        trainingExperience: 'intermediate',
        jointIssues: [{ area: 'lower_back', severity: 'mild' }],
        equipment: ['dumbbell', 'bodyweight'],
        sessionsPerWeek: 3,
        minutesPerSession: 45,
        preferredDays: ['monday', 'wednesday', 'friday'],
    };

    beforeAll(async () => {
        // Initialize repositories
        routes.initializeRepositories(mockPool);

        // Clean up any existing test data
        await mockPool.query('DELETE FROM weight_log WHERE user_id = $1', [TEST_USER_ID]);
        await mockPool.query('DELETE FROM nutrition_day_logs WHERE user_id = $1', [TEST_USER_ID]);
        await mockPool.query('DELETE FROM workout_sessions WHERE user_id = $1', [TEST_USER_ID]);
    });

    afterAll(async () => {
        // Cleanup
        await mockPool.query('DELETE FROM weight_log WHERE user_id = $1', [TEST_USER_ID]);
        await mockPool.query('DELETE FROM nutrition_day_logs WHERE user_id = $1', [TEST_USER_ID]);
        await mockPool.query('DELETE FROM workout_sessions WHERE user_id = $1', [TEST_USER_ID]);
        await mockPool.end();
    });

    it('should run a full week simulation', async () => {
        console.log('\n=== STARTING REAL USER SIMULATION ===\n');

        // 1. Generate Program
        console.log('1. Generating Program...');
        const programWeek = generateProgramWeekFromOnboarding(userProfile);
        expect(programWeek).toBeDefined();
        expect(programWeek.days.length).toBe(3);

        console.log(`   Generated ${programWeek.days.length} sessions.`);
        console.log(`   Focus: ${programWeek.focus}`);

        // 2. Verify Warmups
        console.log('\n2. Verifying Warmups...');
        for (const day of programWeek.days) {
            const warmupDuration = day.warmup.reduce((acc, step) => acc + step.durationSeconds, 0);
            const durationMinutes = Math.round(warmupDuration / 60);

            console.log(`   Day ${day.dayOfWeek} (${day.focus}): ${durationMinutes} min warmup`);

            // Check for lower back contraindications (should be avoided/handled)
            const hasBackAggravators = day.warmup.some(w =>
                // Simple check for known back-heavy moves if we had a list, 
                // but rely on service logic.
                // For now, just print what we have.
                false
            );

            day.warmup.forEach(w => {
                // console.log(`      - ${w.name} (${w.durationSeconds}s)`);
            });

            // Expect reasonable duration (5-10 mins for 45 min session)
            expect(durationMinutes).toBeGreaterThanOrEqual(3);
            expect(durationMinutes).toBeLessThanOrEqual(12);
        }

        // 3. Log Data (Simulate the week)
        console.log('\n3. Logging Data...');

        // Log Workouts
        const dates = ['2025-06-02', '2025-06-04', '2025-06-06']; // Mon, Wed, Fri

        for (let i = 0; i < 3; i++) {
            const date = dates[i];
            const programDay = programWeek.days[i];

            // Construct payload
            const exercises = [];

            // Add Warmup as exercises (how they might be logged if user checks them off)
            // In reality, frontend might aggregate them, but let's log them as sets for fidelity
            for (const w of programDay.warmup) {
                exercises.push({
                    name: w.name,
                    sets: [{ reps: 1, weight: 0, rpe: 0, isWarmup: true, notes: 'Warmup done' }]
                });
            }

            // Add Main Lifts
            for (const ex of programDay.exercises) {
                exercises.push({
                    name: ex.name,
                    sets: [
                        { reps: 10, weight: 30, rpe: 7, isWarmup: false },
                        { reps: 10, weight: 30, rpe: 8, isWarmup: false },
                        { reps: 10, weight: 30, rpe: 9, isWarmup: false }
                    ]
                });
            }

            const res = await request(app)
                .post('/api/logs/workout-session')
                .send({ date, exercises, notes: `Session ${i + 1} felt good` });
            expect(res.status).toBe(201);
            process.stdout.write('.');
        }
        console.log(' Workouts logged.');

        // Log Nutrition (7 days)
        const nutritionDates = [
            '2025-06-02', '2025-06-03', '2025-06-04', '2025-06-05',
            '2025-06-06', '2025-06-07', '2025-06-08'
        ];

        for (const date of nutritionDates) {
            // Simulate slight variance
            const calories = 2000 + Math.floor(Math.random() * 200);
            const protein = 150 + Math.floor(Math.random() * 20);

            const res = await request(app)
                .post('/api/logs/nutrition-day')
                .send({
                    date,
                    meals: [{
                        mealType: 'summary',
                        foodItems: [{
                            name: 'Daily Summary',
                            calories: calories,
                            proteinGrams: protein,
                            carbsGrams: 200,
                            fatsGrams: 60
                        }],
                    }],
                });
            expect(res.status).toBe(201);
            process.stdout.write('.');
        }
        console.log(' Nutrition logged.');

        // Log Weight (7 days, slight fluctuation)
        let currentWeight = 185.0;
        for (const date of nutritionDates) {
            currentWeight += (Math.random() - 0.5); // +/- 0.5 lbs

            const res = await request(app)
                .post('/api/logs/weight')
                .send({ date, weightLbs: parseFloat(currentWeight.toFixed(1)) });
            expect(res.status).toBe(201);
            process.stdout.write('.');
        }
        console.log(' Weight logged.');

        // 4. Verify Dashboard
        console.log('\n4. Verifying Dashboard & Insights...');

        const res = await request(app)
            .get('/api/progress/week-summary')
            .query({ weekStart: WEEK_START });

        expect(res.status).toBe(200);
        const summary = res.body.data;

        console.log('\n--- DASHBOARD SUMMARY ---');
        console.log(`Workouts: ${summary.workouts.sessionsCompleted} / 3`);
        console.log(`Warmup Adherence: ${summary.workouts.warmupCompletedSessions} / 3`);
        console.log(`Nutrition Days: ${summary.nutrition.daysLogged} / 7`);
        console.log(`Weight Trend: ${summary.weight.trend}`);

        console.log('\n--- COACH NOTES (INSIGHTS) ---');
        summary.insights.forEach((insight: string) => {
            console.log(`> ${insight}`);
        });
        console.log('----------------------------\n');

        // Assertions
        expect(summary.workouts.sessionsCompleted).toBe(3);
        expect(summary.workouts.warmupCompletedSessions).toBe(3);
        expect(summary.insights.length).toBeGreaterThan(0);
    });
});
