import { Pool } from 'pg';

export interface User {
    id: string;
    username: string;
    createdAt: Date;
}

export class UserRepository {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async createUser(username: string): Promise<User> {
        const result = await this.pool.query(
            `INSERT INTO users (username) VALUES ($1) RETURNING id, username, created_at`,
            [username]
        );
        return this.mapRowToUser(result.rows[0]);
    }

    async getUserByUsername(username: string): Promise<User | null> {
        const result = await this.pool.query(
            `SELECT id, username, created_at FROM users WHERE username = $1`,
            [username]
        );
        return result.rows.length ? this.mapRowToUser(result.rows[0]) : null;
    }

    async getUserById(id: string): Promise<User | null> {
        const result = await this.pool.query(
            `SELECT id, username, created_at FROM users WHERE id = $1`,
            [id]
        );
        return result.rows.length ? this.mapRowToUser(result.rows[0]) : null;
    }

    async listUsers(): Promise<User[]> {
        const result = await this.pool.query(
            `SELECT id, username, created_at FROM users ORDER BY created_at DESC`
        );
        return result.rows.map(this.mapRowToUser);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapRowToUser(row: any): User {
        return {
            id: row.id,
            username: row.username,
            createdAt: row.created_at,
        };
    }
}
