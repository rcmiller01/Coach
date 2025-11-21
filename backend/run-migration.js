/**
 * Run database migration for progress tracking tables
 * Usage: node backend/run-migration.js
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
}

async function runMigration() {
    const pool = new Pool({ connectionString: DATABASE_URL });

    try {
        console.log('📦 Reading migration file...');
        const migrationSQL = readFileSync(
            join(__dirname, 'db', 'migrations', '001_progress_tracking.sql'),
            'utf8'
        );

        console.log('🚀 Running migration...');
        await pool.query(migrationSQL);

        console.log('✅ Migration completed successfully!');
        console.log('\nCreated tables:');
        console.log('  - workout_sessions');
        console.log('  - workout_set_logs');
        console.log('  - nutrition_day_logs');
        console.log('  - nutrition_meal_logs');
        console.log('  - weight_log');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

runMigration()
    .then(() => {
        console.log('\n🎉 Database is ready for progress tracking!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Migration error:', error);
        process.exit(1);
    });
