import { Pool } from 'pg';
import type { WeeklyPlan } from '../../../src/features/nutrition/nutritionTypes';

export class WeeklyPlansRepository {
    constructor(private pool: Pool) { }

    async getWeeklyPlan(userId: string, weekStartDate: string): Promise<WeeklyPlan | null> {
        const result = await this.pool.query(
            'SELECT plan_json FROM weekly_plans WHERE user_id = $1 AND week_start_date = $2',
            [userId, weekStartDate]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0].plan_json as WeeklyPlan;
    }

    async upsertWeeklyPlan(userId: string, weekStartDate: string, plan: WeeklyPlan): Promise<void> {
        await this.pool.query(
            `INSERT INTO weekly_plans (user_id, week_start_date, plan_json, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, week_start_date)
       DO UPDATE SET plan_json = EXCLUDED.plan_json, updated_at = NOW()`,
            [userId, weekStartDate, JSON.stringify(plan)]
        );
    }

    async deleteWeeklyPlan(userId: string, weekStartDate: string): Promise<void> {
        await this.pool.query(
            'DELETE FROM weekly_plans WHERE user_id = $1 AND week_start_date = $2',
            [userId, weekStartDate]
        );
    }
}
