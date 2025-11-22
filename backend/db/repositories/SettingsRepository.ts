import { Pool } from 'pg';

export interface UserSettings {
    timePerSession?: number;
    trainingDays?: number[]; // e.g. [1, 3, 5] for Mon, Wed, Fri
    calorieTarget?: number;
    mealsPerDay?: number;
}

export class SettingsRepository {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async getSettings(userId: string): Promise<UserSettings> {
        const result = await this.pool.query(
            `SELECT settings FROM user_settings WHERE user_id = $1`,
            [userId]
        );
        return result.rows.length ? result.rows[0].settings : {};
    }

    async upsertSettings(userId: string, settings: UserSettings): Promise<UserSettings> {
        // Merge with existing settings logic is handled by the client usually, 
        // but here we'll just do a simple upsert. 
        // To do a proper merge, we'd fetch first or use jsonb_concat in SQL.
        // Let's use jsonb concatenation for safety.

        const result = await this.pool.query(
            `INSERT INTO user_settings (user_id, settings, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id)
             DO UPDATE SET 
                settings = user_settings.settings || $2,
                updated_at = NOW()
             RETURNING settings`,
            [userId, JSON.stringify(settings)]
        );
        return result.rows[0].settings;
    }
}
