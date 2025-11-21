import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import * as routes from '../routes';

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

describe('Progress Tracking Smoke Tests', () => {
    const TEST_USER_ID = 'demo-user'; // Routes hardcode this, so we must test against it
    const WEEK_START = '2025-05-05'; // Future date to avoid conflicts

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

    it('should generate insights when enough data is logged', async () => {
        // 1. Log 3 workouts
        const workouts = [
            { date: '2025-05-05', exercises: [{ name: 'Squat', sets: [{ reps: 5, weight: 200, rpe: 8 }] }] },
            { date: '2025-05-07', exercises: [{ name: 'Bench', sets: [{ reps: 5, weight: 150, rpe: 8 }] }] },
            { date: '2025-05-09', exercises: [{ name: 'Deadlift', sets: [{ reps: 5, weight: 250, rpe: 8 }] }] },
        ];

        for (const w of workouts) {
            const res = await request(app)
                .post('/api/logs/workout-session')
                .send({ ...w, notes: 'Test workout' });
            expect(res.status).toBe(201);
        }

        // 2. Log 5 nutrition days
        const nutritionDays = [
            '2025-05-05', '2025-05-06', '2025-05-07', '2025-05-08', '2025-05-09'
        ];

        for (const date of nutritionDays) {
            const res = await request(app)
                .post('/api/logs/nutrition-day')
                .send({
                    date,
                    meals: [{ type: 'breakfast', items: [] }],
                });
            expect(res.status).toBe(201);
        }

        // 3. Fetch summary
        const res = await request(app)
            .get('/api/progress/week-summary')
            .query({ weekStart: WEEK_START });

        expect(res.status).toBe(200);
        expect(res.body.data).toBeDefined();

        const summary = res.body.data;
        console.log('DEBUG: Insights returned:', summary.insights);

        expect(summary.workouts.sessionsCompleted).toBeGreaterThanOrEqual(3);
        expect(summary.nutrition.daysLogged).toBeGreaterThanOrEqual(5);

        // Check for insights
        expect(summary.insights).toBeDefined();
        expect(Array.isArray(summary.insights)).toBe(true);

        // We expect at least one insight about consistency or logging
        const hasConsistencyInsight = summary.insights.some((i: string) =>
            i.includes('consistency') || i.includes('logged') || i.includes('tracking')
        );
        expect(hasConsistencyInsight).toBe(true);
    });

    it('should handle empty week gracefully', async () => {
        const FUTURE_WEEK = '2025-12-01';

        const res = await request(app)
            .get('/api/progress/week-summary')
            .query({ weekStart: FUTURE_WEEK });

        expect(res.status).toBe(200);
        const summary = res.body.data;

        expect(summary.workouts.sessionsCompleted).toBe(0);
        expect(summary.nutrition.daysLogged).toBe(0);

        // Should have "get started" insight or similar, but definitely not crash
        expect(Array.isArray(summary.insights)).toBe(true);
    });
});
