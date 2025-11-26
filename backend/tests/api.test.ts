import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';

describe('Backend API Integration', () => {
    describe('GET /health', () => {
        it('returns 200 and status ok', async () => {
            const response = await request(app).get('/health');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('ok');
        });
    });

    describe('POST /api/nutrition/plan/week', () => {
        it('generates a weekly meal plan', async () => {
            const payload = {
                weekStartDate: '2025-01-01',
                targets: {
                    caloriesPerDay: 2000,
                    proteinGrams: 150,
                    carbsGrams: 200,
                    fatGrams: 65,
                },
                userContext: {
                    city: 'Test City',
                    locale: 'en-US',
                },
                userId: 'test-user-integration',
                planProfile: 'standard',
            };

            const response = await request(app)
                .post('/api/nutrition/plan/week')
                .send(payload);

            expect(response.status).toBe(200);
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('sessionId');
            expect(response.body.data).toHaveProperty('weekStartDate');
            // The actual plan generation is async, so we just check for the session ID
        }, 60000); // Increase timeout for AI generation
    });

    describe('POST /api/nutrition/plan/day/regenerate-meal', () => {
        it.skip('regenerates a specific meal', async () => {
            const payload = {
                date: '2025-01-01',
                mealIndex: 0,
                dayPlan: {
                    date: '2025-01-01',
                    meals: [
                        { type: 'breakfast', items: [{ name: 'Old Food', calories: 500 }] }
                    ]
                },
                targets: {
                    caloriesPerDay: 2000,
                    proteinGrams: 150,
                    carbsGrams: 200,
                    fatGrams: 65,
                },
                userContext: { locale: 'en-US' },
                userId: 'test-user-integration',
            };

            const response = await request(app)
                .post('/api/nutrition/plan/day/regenerate-meal')
                .send(payload);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('meals');
            expect(response.body.data.meals[0].items.length).toBeGreaterThan(0);
        }, 60000);
    });

    describe('POST /api/program/week/generate', () => {
        it('generates a workout week from onboarding state', async () => {
            const payload = {
                onboardingState: {
                    primaryGoal: 'build_muscle',
                    sessionsPerWeek: 3,
                    trainingEnvironment: 'gym',
                    equipment: ['barbell', 'dumbbell'],
                    planProfile: 'standard',
                }
            };

            const response = await request(app)
                .post('/api/program/week/generate')
                .send(payload);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('days');
            expect(response.body.data.days).toHaveLength(3);
            expect(response.body.data.focus).toBeDefined();
        });
    });

    describe('Persistence Checks', () => {
        it('persists weekly plan across requests (simulated restart)', async () => {
            const userId = 'test-user-persistence';
            const weekStartDate = '2025-11-24';
            const date = '2025-11-24'; // Monday

            // 1. Generate a DAILY plan (synchronous) to seed the DB
            const payload = {
                date,
                targets: {
                    caloriesPerDay: 2000,
                    proteinGrams: 150,
                    carbsGrams: 200,
                    fatGrams: 65,
                },
                userContext: { locale: 'en-US' },
                userId,
            };

            const genResponse = await request(app)
                .post('/api/nutrition/plan/day')
                .set('x-user-id', userId)
                .send(payload);

            expect(genResponse.status).toBe(200);

            // 2. Verify we can retrieve it via the weekly plan endpoint
            const getResponse = await request(app)
                .get(`/api/nutrition/plan?weekStart=${weekStartDate}`)
                .set('x-user-id', userId);

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.data).toBeDefined();
            expect(getResponse.body.data.weekStartDate).toBe(weekStartDate);
            // Verify the day we generated is there
            const day = getResponse.body.data.days.find((d: any) => d.date === date);
            expect(day).toBeDefined();
            expect(day.meals.length).toBeGreaterThan(0);
        });

        it('persists copied days correctly', async () => {
            const userId = 'test-user-copy-persistence';
            const sourceDate = '2025-11-25';
            const destDate = '2025-11-27';
            const weekStart = '2025-11-24'; // Monday

            // 1. Generate source day (synchronous)
            await request(app)
                .post('/api/nutrition/plan/day')
                .set('x-user-id', userId)
                .send({
                    date: sourceDate,
                    targets: { caloriesPerDay: 2000, proteinGrams: 150, carbsGrams: 200, fatGrams: 65 },
                    userContext: { locale: 'en-US' }
                });

            // 2. Copy day
            const copyResponse = await request(app)
                .post('/api/nutrition/plan/copy')
                .set('x-user-id', userId)
                .send({
                    fromDate: sourceDate,
                    toDate: destDate
                });

            expect(copyResponse.status).toBe(200);
            expect(copyResponse.body.data.date).toBe(destDate);
            expect(copyResponse.body.data.meals.length).toBeGreaterThan(0);

            // 3. Verify persistence via GET
            const getResponse = await request(app)
                .get(`/api/nutrition/plan?weekStart=${weekStart}`)
                .set('x-user-id', userId);

            const plan = getResponse.body.data;
            const destDay = plan.days.find((d: any) => d.date === destDate);
            expect(destDay).toBeDefined();
            expect(destDay.meals.length).toBeGreaterThan(0);
            // Verify IDs are regenerated (simple check: shouldn't be empty)
            expect(destDay.meals[0].id).toContain(destDate);
        });
    });
});
