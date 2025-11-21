import { describe, it, expect } from 'vitest';
import request from 'supertest';

const API_URL = 'http://localhost:3001';

describe('Backend API Integration', () => {
    describe('GET /health', () => {
        it('returns 200 and status ok', async () => {
            const response = await request(API_URL).get('/health');
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

            const response = await request(API_URL)
                .post('/api/nutrition/plan/week')
                .send(payload);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('weekStartDate');
            expect(response.body.data.days).toHaveLength(7);
            expect(response.body.data.days[0].meals).toHaveLength(4);
        }, 60000); // Increase timeout for AI generation
    });

    describe('POST /api/nutrition/plan/day/regenerate-meal', () => {
        it('regenerates a specific meal', async () => {
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

            const response = await request(API_URL)
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

            const response = await request(API_URL)
                .post('/api/program/week/generate')
                .send(payload);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('days');
            expect(response.body.data.days).toHaveLength(3);
            expect(response.body.data.focus).toBeDefined();
        });
    });
});
