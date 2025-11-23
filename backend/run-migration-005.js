/**
 * Run migration 005: Add ai_enabled to users
 * Usage: node backend/run-migration-005.js
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
        console.log('📦 Reading migration file 005...');
        const migrationSQL = readFileSync(
            join(__dirname, 'db', 'migrations', '005_add_ai_enabled_to_users.sql'),
            'utf8'
        );

        console.log('🚀 Running migration 005...');
        await pool.query(migrationSQL);
        console.log('✅ Migration 005 completed successfully!');

        console.log('🔍 Verifying column existence...');
        // Check if column exists by selecting it from a user (or just checking schema info if user table empty)
        // We'll just try to select it from the table definition in information_schema to be safe even if table is empty
        const result = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'ai_enabled';
        `);

        if (result.rows.length > 0) {
            console.log('✅ Verification passed: ai_enabled column exists in users table.');
        } else {
            console.error('❌ Verification failed: ai_enabled column NOT found in users table.');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

runMigration()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Migration error:', error);
        process.exit(1);
    });
