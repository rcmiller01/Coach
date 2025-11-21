import { Pool } from 'pg';

// Types for weight tracking
export interface WeightEntry {
    id: number;
    userId: string;
    date: string;  // YYYY-MM-DD
    weightLbs: number;
    loggedAt: Date;
}

/**
 * Repository for weight logging
 */
export class WeightRepository {
    constructor(private pool: Pool) { }

    /**
     * Log weight for a specific date
     */
    async logWeight(userId: string, date: string, weightLbs: number): Promise<WeightEntry> {
        const result = await this.pool.query(
            `INSERT INTO weight_log (user_id, date, weight_lbs)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, date)
       DO UPDATE SET weight_lbs = $3, logged_at = NOW()
       RETURNING *`,
            [userId, date, weightLbs]
        );

        const row = result.rows[0];
        return {
            id: row.id,
            userId: row.user_id,
            date: row.date,
            weightLbs: parseFloat(row.weight_lbs),
            loggedAt: row.logged_at,
        };
    }

    /**
     * Get weight logs for a date range
     */
    async getWeightLogsByDateRange(
        userId: string,
        startDate: string,
        endDate: string
    ): Promise<WeightEntry[]> {
        const result = await this.pool.query(
            `SELECT * FROM weight_log
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date ASC`,
            [userId, startDate, endDate]
        );

        return result.rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            date: row.date,
            weightLbs: parseFloat(row.weight_lbs),
            loggedAt: row.logged_at,
        }));
    }

    /**
     * Get latest weight entry
     */
    async getLatestWeight(userId: string): Promise<WeightEntry | null> {
        const result = await this.pool.query(
            `SELECT * FROM weight_log
       WHERE user_id = $1
       ORDER BY date DESC
       LIMIT 1`,
            [userId]
        );

        if (result.rows.length === 0) return null;

        const row = result.rows[0];
        return {
            id: row.id,
            userId: row.user_id,
            date: row.date,
            weightLbs: parseFloat(row.weight_lbs),
            loggedAt: row.logged_at,
        };
    }
}
