import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATABASE_URL = process.env.DATABASE_URL;

async function run() {
    const pool = new Pool({ connectionString: DATABASE_URL });
    try {
        console.log('📦 Reading migration file 004...');
        const sql = readFileSync(join(__dirname, 'db', 'migrations', '004_alpha_foundation.sql'), 'utf8');
        console.log('🚀 Running migration 004...');
        await pool.query(sql);
        console.log('✅ Migration 004 completed!');
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await pool.end();
    }
}
run();
