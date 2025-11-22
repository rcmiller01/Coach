import { Pool } from 'pg';

export class LoggingService {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async logInfo(userId: string | null, endpoint: string, message: string, meta?: object) {
        await this.log('info', userId, endpoint, message, meta);
    }

    async logError(userId: string | null, endpoint: string, message: string, meta?: object) {
        await this.log('error', userId, endpoint, message, meta);
    }

    async logEvent(userId: string, type: string, meta?: object) {
        try {
            await this.pool.query(
                `INSERT INTO app_events (user_id, type, meta) VALUES ($1, $2, $3)`,
                [userId, type, JSON.stringify(meta || {})]
            );
        } catch (err) {
            console.error('Failed to log event:', err);
        }
    }

    private async log(level: string, userId: string | null, endpoint: string, message: string, meta?: object) {
        try {
            // Fire and forget - don't await if we don't want to block response, 
            // but for alpha stability, awaiting is safer to ensure we catch DB errors.
            // We'll catch errors here so we don't crash the app if logging fails.
            await this.pool.query(
                `INSERT INTO app_logs (level, user_id, endpoint, message, meta) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [level, userId, endpoint, message, JSON.stringify(meta || {})]
            );
        } catch (err) {
            // Fallback to console
            console.error(`[${level}] ${message}`, err);
        }
    }
}
