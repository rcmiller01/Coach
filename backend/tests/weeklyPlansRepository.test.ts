import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { WeeklyPlansRepository } from '../db/repositories/WeeklyPlansRepository';
import type { WeeklyPlan } from '../../src/features/nutrition/nutritionTypes';

dotenv.config();

describe('WeeklyPlansRepository', () => {
    let pool: Pool;
    let repo: WeeklyPlansRepository;
    const testUserId = 'test-user-repo';
    const testWeekStart = '2025-01-01';

    beforeAll(() => {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL not set');
        }
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });
        repo = new WeeklyPlansRepository(pool);
    });

    afterAll(async () => {
        await pool.end();
    });

    beforeEach(async () => {
        // Clean up any existing test data
        await repo.deleteWeeklyPlan(testUserId, testWeekStart);
    });

    const mockPlan: WeeklyPlan = {
        weekStartDate: testWeekStart,
        days: [
            {
                date: testWeekStart,
                meals: [
                    {
                        id: 'breakfast',
                        type: 'breakfast',
                        items: [
                            {
                                id: 'item-1',
                                name: 'Oatmeal',
                                quantity: 1,
                                unit: 'cup',
                                calories: 150,
                                proteinGrams: 5,
                                carbsGrams: 27,
                                fatsGrams: 3
                            }
                        ]
                    }
                ]
            }
        ]
    };

    it('should upsert and get a weekly plan', async () => {
        await repo.upsertWeeklyPlan(testUserId, testWeekStart, mockPlan);

        const retrieved = await repo.getWeeklyPlan(testUserId, testWeekStart);
        expect(retrieved).toBeDefined();
        expect(retrieved?.weekStartDate).toBe(testWeekStart);
        expect(retrieved?.days).toHaveLength(1);
        expect(retrieved?.days[0].meals[0].type).toBe('breakfast');
    });

    it('should return null for non-existent plan', async () => {
        const retrieved = await repo.getWeeklyPlan(testUserId, '2099-01-01');
        expect(retrieved).toBeNull();
    });

    it('should update an existing plan', async () => {
        await repo.upsertWeeklyPlan(testUserId, testWeekStart, mockPlan);

        const updatedPlan = {
            ...mockPlan,
            days: [
                {
                    ...mockPlan.days[0],
                    meals: [
                        {
                            ...mockPlan.days[0].meals[0],
                            items: [
                                {
                                    ...mockPlan.days[0].meals[0].items[0],
                                    calories: 200 // Changed value
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        await repo.upsertWeeklyPlan(testUserId, testWeekStart, updatedPlan);

        const retrieved = await repo.getWeeklyPlan(testUserId, testWeekStart);
        expect(retrieved?.days[0].meals[0].items[0].calories).toBe(200);
    });

    it('should delete a weekly plan', async () => {
        await repo.upsertWeeklyPlan(testUserId, testWeekStart, mockPlan);
        await repo.deleteWeeklyPlan(testUserId, testWeekStart);

        const retrieved = await repo.getWeeklyPlan(testUserId, testWeekStart);
        expect(retrieved).toBeNull();
    });

    it('should handle week start date normalization consistently', async () => {
        // Ensure that passing the same date string retrieves the same record
        const dateString = '2025-11-24';
        const planForDate: WeeklyPlan = { ...mockPlan, weekStartDate: dateString };

        await repo.upsertWeeklyPlan(testUserId, dateString, planForDate);
        const retrieved = await repo.getWeeklyPlan(testUserId, dateString);

        expect(retrieved).toBeDefined();
        expect(retrieved?.weekStartDate).toBe(dateString);

        // Cleanup
        await repo.deleteWeeklyPlan(testUserId, dateString);
    });

    it('should isolate plans between users', async () => {
        const userA = 'user-a';
        const userB = 'user-b';
        const date = '2025-11-24';

        // Create distinct plans for A and B
        const planA: WeeklyPlan = {
            ...mockPlan,
            weekStartDate: date,
            days: [{
                ...mockPlan.days[0],
                meals: [{ ...mockPlan.days[0].meals[0], items: [{ ...mockPlan.days[0].meals[0].items[0], calories: 1000 }] }]
            }]
        };
        const planB: WeeklyPlan = {
            ...mockPlan,
            weekStartDate: date,
            days: [{
                ...mockPlan.days[0],
                meals: [{ ...mockPlan.days[0].meals[0], items: [{ ...mockPlan.days[0].meals[0].items[0], calories: 2000 }] }]
            }]
        };

        await repo.upsertWeeklyPlan(userA, date, planA);
        await repo.upsertWeeklyPlan(userB, date, planB);

        const retrievedA = await repo.getWeeklyPlan(userA, date);
        const retrievedB = await repo.getWeeklyPlan(userB, date);

        expect(retrievedA?.days[0].meals[0].items[0].calories).toBe(1000);
        expect(retrievedB?.days[0].meals[0].items[0].calories).toBe(2000);

        // Cleanup
        await repo.deleteWeeklyPlan(userA, date);
        await repo.deleteWeeklyPlan(userB, date);
    });
});
