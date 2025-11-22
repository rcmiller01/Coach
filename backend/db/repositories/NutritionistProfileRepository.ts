import { Pool } from 'pg';
import { NutritionistProfile } from '../../../src/features/nutritionist/types';

export class NutritionistProfileRepository {
    constructor(private pool: Pool) { }

    /**
     * Get profile by user ID
     */
    async getProfile(userId: string): Promise<NutritionistProfile | null> {
        const result = await this.pool.query(
            'SELECT profile FROM nutritionist_profiles WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) return null;
        return result.rows[0].profile;
    }

    /**
     * Create or update profile
     */
    async upsertProfile(userId: string, profile: NutritionistProfile): Promise<NutritionistProfile> {
        // Ensure updated_at is set
        const profileToSave = {
            ...profile,
            userId, // Ensure ID matches
            updatedAt: new Date().toISOString(),
        };

        const result = await this.pool.query(
            `INSERT INTO nutritionist_profiles (user_id, profile, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET profile = $2, updated_at = NOW()
       RETURNING profile`,
            [userId, JSON.stringify(profileToSave)]
        );

        return result.rows[0].profile;
    }
}
