
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'coach_nutrition',
});

async function clearPlans() {
    try {
        console.log('Clearing all meal plans...');
        await pool.query('DELETE FROM day_plans');
        await pool.query('DELETE FROM weekly_plans');
        console.log('✅ All plans cleared.');
    } catch (err) {
        console.error('❌ Failed to clear plans:', err);
    } finally {
        await pool.end();
    }
}

clearPlans();
