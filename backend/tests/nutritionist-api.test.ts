import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import * as routes from '../routes';
import { initialNutritionistProfile, NutritionistProfile } from '../../src/features/nutritionist/types';

// Mock the database pool
const mockPool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Setup express app for testing
const app = express();
app.use(express.json());

// Register routes
app.get('/api/nutritionist/profile', routes.getNutritionistProfile);
app.post('/api/nutritionist/profile', routes.saveNutritionistProfile);
app.post('/api/nutritionist/check-in', routes.nutritionistCheckIn);

describe('AI Nutritionist API', () => {
    const TEST_USER_ID = 'demo-user'; // Hardcoded in routes.ts stub

    beforeAll(async () => {
        // Initialize repositories
        routes.initializeRepositories(mockPool);

        // Clean up
        await mockPool.query('DELETE FROM nutritionist_profiles WHERE user_id = $1', [TEST_USER_ID]);
    });

    afterAll(async () => {
        await mockPool.query('DELETE FROM nutritionist_profiles WHERE user_id = $1', [TEST_USER_ID]);
        await mockPool.end();
    });

    it('should save and retrieve a profile', async () => {
        const profile: NutritionistProfile = {
            ...initialNutritionistProfile,
            goals: { primary: 'fat_loss' },
            meds: { metformin: true },
        };

        // Save
        const saveRes = await request(app)
            .post('/api/nutritionist/profile')
            .send(profile);

        expect(saveRes.status).toBe(200);
        expect(saveRes.body.data.goals.primary).toBe('fat_loss');
        expect(saveRes.body.plan).toBeDefined(); // Should return initial plan

        // Retrieve
        const getRes = await request(app)
            .get('/api/nutritionist/profile');

        expect(getRes.status).toBe(200);
        expect(getRes.body.data.meds.metformin).toBe(true);
    });

    it('should run a check-in', async () => {
        // Ensure profile exists (from previous test)

        const res = await request(app)
            .post('/api/nutritionist/check-in')
            .send({ period: '14d' });

        expect(res.status).toBe(200);
        expect(res.body.data.config).toBeDefined();
        expect(res.body.data.notes).toBeDefined();

        // Since we set fat_loss in previous test, expect calorie deficit
        expect(res.body.data.config.calorieTarget).toBeLessThan(2000);
    });
});
