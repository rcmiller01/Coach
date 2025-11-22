import { Pool } from 'pg';

// Types for nutrition logging
export interface NutritionMealInput {
    mealType: string;  // breakfast, lunch, dinner, snack
    mealTime?: string; // HH:MM format
    foodItems: any[];  // Array of food item objects
}

export interface NutritionDayInput {
    userId: string;
    date: string;  // YYYY-MM-DD
    meals: NutritionMealInput[];
}

export interface NutritionMeal {
    id: number;
    dayLogId: number;
    mealType: string;
    mealTime?: string;
    foodItems: any[];
}

export interface NutritionDayLog {
    id: number;
    userId: string;
    date: string;
    totalCalories?: number;
    totalProteinGrams?: number;
    totalCarbsGrams?: number;
    totalFatsGrams?: number;
    loggedAt: Date;
    meals: NutritionMeal[];
}

/**
 * Repository for nutrition day logging
 */
export class NutritionLogRepository {
    constructor(private pool: Pool) { }

    /**
     * Log nutrition for a day with meals
     */
    async logNutritionDay(input: NutritionDayInput): Promise<NutritionDayLog> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Calculate totals from meals
            let totalCalories = 0;
            let totalProteinGrams = 0;
            let totalCarbsGrams = 0;
            let totalFatsGrams = 0;

            for (const meal of input.meals) {
                for (const item of meal.foodItems) {
                    totalCalories += item.calories || 0;
                    totalProteinGrams += item.proteinGrams || 0;
                    totalCarbsGrams += item.carbsGrams || 0;
                    totalFatsGrams += item.fatsGrams || 0;
                }
            }

            // Insert/update nutrition day log
            const dayLogResult = await client.query(
                `INSERT INTO nutrition_day_logs 
         (user_id, date, total_calories, total_protein_grams, total_carbs_grams, total_fats_grams)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, date)
         DO UPDATE SET total_calories = $3, total_protein_grams = $4, 
                       total_carbs_grams = $5, total_fats_grams = $6, logged_at = NOW()
         RETURNING *`,
                [input.userId, input.date, totalCalories, totalProteinGrams, totalCarbsGrams, totalFatsGrams]
            );

            const dayLog = dayLogResult.rows[0];

            // Delete existing meals (in case of update)
            await client.query('DELETE FROM nutrition_meal_logs WHERE day_log_id = $1', [dayLog.id]);

            // Insert meals
            const meals: NutritionMeal[] = [];
            for (const meal of input.meals) {
                const mealResult = await client.query(
                    `INSERT INTO nutrition_meal_logs (day_log_id, meal_type, meal_time, food_items)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
                    [dayLog.id, meal.mealType, meal.mealTime, JSON.stringify(meal.foodItems)]
                );
                const mealRow = mealResult.rows[0];
                meals.push({
                    id: mealRow.id,
                    dayLogId: mealRow.day_log_id,
                    mealType: mealRow.meal_type,
                    mealTime: mealRow.meal_time,
                    foodItems: mealRow.food_items,
                });
            }

            await client.query('COMMIT');

            return {
                id: dayLog.id,
                userId: dayLog.user_id,
                date: dayLog.date,
                totalCalories: dayLog.total_calories,
                totalProteinGrams: parseFloat(dayLog.total_protein_grams),
                totalCarbsGrams: parseFloat(dayLog.total_carbs_grams),
                totalFatsGrams: parseFloat(dayLog.total_fats_grams),
                loggedAt: dayLog.logged_at,
                meals,
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get nutrition logs for a date range
     */
    async getNutritionLogsByDateRange(
        userId: string,
        startDate: string,
        endDate: string
    ): Promise<NutritionDayLog[]> {
        const logsResult = await this.pool.query(
            `SELECT * FROM nutrition_day_logs
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date DESC`,
            [userId, startDate, endDate]
        );

        const logs: NutritionDayLog[] = [];
        for (const row of logsResult.rows) {
            const mealsResult = await this.pool.query(
                'SELECT * FROM nutrition_meal_logs WHERE day_log_id = $1',
                [row.id]
            );

            logs.push({
                id: row.id,
                userId: row.user_id,
                date: row.date,
                totalCalories: row.total_calories,
                totalProteinGrams: parseFloat(row.total_protein_grams),
                totalCarbsGrams: parseFloat(row.total_carbs_grams),
                totalFatsGrams: parseFloat(row.total_fats_grams),
                loggedAt: row.logged_at,
                meals: mealsResult.rows.map((m: any) => ({
                    id: m.id,
                    dayLogId: m.day_log_id,
                    mealType: m.meal_type,
                    mealTime: m.meal_time,
                    foodItems: m.food_items,
                })),
            });
        }

        return logs;
    }
}
