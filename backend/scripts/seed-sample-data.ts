#!/usr/bin/env node
/**
 * Seed Sample Data 
 * 
 * Creates realistic demo data for the demo-user to showcase Coach Notes.
 * Idempotent: can be run multiple times without duplicating data.
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const DEMO_USER_ID = 'demo-user';

// Fixed week for reproducible seeds
const WEEK_START = '2025-01-13'; // Monday
const DATES = [
    '2025-01-13', // Mon
    '2025-01-14', // Tue
    '2025-01-15', // Wed
    '2025-01-16', // Thu
    '2025-01-17', // Fri
    '2025-01-18', // Sat
    '2025-01-19', // Sun
];

async function seed() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log('🌱 Seeding sample data...');

        // Make idempotent: delete existing demo-user data first
        await pool.query('DELETE FROM weight_log WHERE user_id = $1', [DEMO_USER_ID]);
        await pool.query('DELETE FROM nutrition_day_logs WHERE user_id = $1', [DEMO_USER_ID]);
        await pool.query('DELETE FROM workout_sessions WHERE user_id = $1', [DEMO_USER_ID]);
        console.log('✅ Cleaned existing demo-user data');

        // Seed workouts: 3 sessions this week (realistic pattern)
        await pool.query(`
      INSERT INTO workout_sessions (user_id, date, day_of_week, notes, completed_at)
      VALUES
        ($1, $2, 'Monday', 'Morning push session', NOW()),
        ($1, $3, 'Wednesday', 'Evening legs', NOW()),
        ($1, $4, 'Friday', 'Quick upper body', NOW())
    `, [
            DEMO_USER_ID,
            DATES[0], // Monday
            DATES[2], // Wednesday
            DATES[4], // Friday
        ]);
        console.log('✅ Seeded 3 workout sessions');

        // Seed nutrition: 5 days logged (good logging pattern)
        const baseCal = 2200;
        const basePro = 165;
        await pool.query(`
      INSERT INTO nutrition_day_logs (user_id, date, total_calories, total_protein_grams, total_carbs_grams, total_fats_grams, logged_at)
      VALUES
        ($1, $2, $3, $4, 200, 60, NOW()),
        ($1, $5, $6, $7, 190, 55, NOW()),
        ($1, $8, $9, $10, 210, 65, NOW()),
        ($1, $11, $12, $13, 180, 50, NOW()),
        ($1, $14, $15, $16, 220, 70, NOW())
    `, [
            DEMO_USER_ID,
            DATES[0], baseCal + 50, basePro + 5,
            DATES[1], baseCal - 30, basePro - 2,
            DATES[2], baseCal + 20, basePro + 3,
            DATES[4], baseCal - 10, basePro,
            DATES[5], baseCal + 40, basePro + 4,
        ]);
        console.log('✅ Seeded 5 nutrition logs (avg ~2200 cal, ~165g protein)');

        // Seed weight: 4 weigh-ins showing slow downward trend
        await pool.query(`
      INSERT INTO weight_log (user_id, date, weight_lbs, logged_at)
      VALUES
        ($1, $2, 185.2, NOW()),
        ($1, $3, 184.8, NOW()),
        ($1, $4, 184.5, NOW()),
        ($1, $5, 184.3, NOW())
    `, [
            DEMO_USER_ID,
            DATES[0],
            DATES[2],
            DATES[4],
            DATES[6],
        ]);
        console.log('✅ Seeded 4 weight logs (trending down slowly)');

        console.log('');
        console.log('🎉 Seed complete!');
        console.log('');
        console.log(`Try fetching progress summary:`);
        console.log(`  GET /api/progress/week-summary?weekStart=${WEEK_START}`);
        console.log('');
        console.log('Expected insights:');
        console.log('  - Great consistency on workouts (3 sessions)');
        console.log('  - Excellent nutrition tracking (5 days)');
        console.log('  - Weight trending down');
        console.log('  - Possibly a "crushing it" combo insight');

    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

seed();
