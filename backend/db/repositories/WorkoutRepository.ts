import { Pool } from 'pg';

// Types for workout logging
export interface WorkoutSetInput {
    exerciseName: string;
    setNumber: number;
    reps?: number;
    weightLbs?: number;
    rpe?: number;
    notes?: string;
}

export interface WorkoutSessionInput {
    userId: string;
    date: string;  // YYYY-MM-DD
    programWeekId?: string;
    dayOfWeek?: string;
    sets: WorkoutSetInput[];
    notes?: string;
}

export interface WorkoutSet {
    id: number;
    sessionId: number;
    exerciseName: string;
    setNumber: number;
    reps?: number;
    weightLbs?: number;
    rpe?: number;
    notes?: string;
}

export interface WorkoutSession {
    id: number;
    userId: string;
    date: string;
    programWeekId?: string;
    dayOfWeek?: string;
    completedAt: Date;
    notes?: string;
    sets: WorkoutSet[];
}

/**
 * Repository for workout session logging
 */
export class WorkoutRepository {
    constructor(private pool: Pool) { }

    /**
     * Log a workout session with sets
     */
    async logWorkoutSession(input: WorkoutSessionInput): Promise<WorkoutSession> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Insert workout session
            const sessionResult = await client.query(
                `INSERT INTO workout_sessions (user_id, date, program_week_id, day_of_week, notes)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, date) 
         DO UPDATE SET program_week_id = $3, day_of_week = $4, notes = $5, completed_at = NOW()
         RETURNING *`,
                [input.userId, input.date, input.programWeekId, input.dayOfWeek, input.notes]
            );

            const session = sessionResult.rows[0];

            // Delete existing sets for this session (in case of update)
            await client.query('DELETE FROM workout_set_logs WHERE session_id = $1', [session.id]);

            // Insert sets
            const sets: WorkoutSet[] = [];
            for (const set of input.sets) {
                const setResult = await client.query(
                    `INSERT INTO workout_set_logs 
           (session_id, exercise_name, set_number, reps, weight_lbs, rpe, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
                    [session.id, set.exerciseName, set.setNumber, set.reps, set.weightLbs, set.rpe, set.notes]
                );
                sets.push(setResult.rows[0]);
            }

            await client.query('COMMIT');

            return {
                id: session.id,
                userId: session.user_id,
                date: session.date,
                programWeekId: session.program_week_id,
                dayOfWeek: session.day_of_week,
                completedAt: session.completed_at,
                notes: session.notes,
                sets,
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get workout sessions for a date range
     */
    async getWorkoutSessionsByDateRange(
        userId: string,
        startDate: string,
        endDate: string
    ): Promise<WorkoutSession[]> {
        const sessionsResult = await this.pool.query(
            `SELECT * FROM workout_sessions 
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date DESC`,
            [userId, startDate, endDate]
        );

        const sessions: WorkoutSession[] = [];
        for (const row of sessionsResult.rows) {
            const setsResult = await this.pool.query(
                'SELECT * FROM workout_set_logs WHERE session_id = $1 ORDER BY set_number',
                [row.id]
            );

            sessions.push({
                id: row.id,
                userId: row.user_id,
                date: row.date,
                programWeekId: row.program_week_id,
                dayOfWeek: row.day_of_week,
                completedAt: row.completed_at,
                notes: row.notes,
                sets: setsResult.rows.map((s: any) => ({
                    id: s.id,
                    sessionId: s.session_id,
                    exerciseName: s.exercise_name,
                    setNumber: s.set_number,
                    reps: s.reps,
                    weightLbs: parseFloat(s.weight_lbs),
                    rpe: parseFloat(s.rpe),
                    notes: s.notes,
                })),
            });
        }

        return sessions;
    }
}
