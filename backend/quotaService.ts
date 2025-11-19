/**
 * Phase 4: Real Quota Tracking & Rate Limiting
 * 
 * Database-backed quota enforcement with:
 * - 100 parseFood calls per day per user
 * - 10 calls per minute rate limiting (sliding window)
 * - Usage logging for analytics
 */

import * as dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Quota limits
export const DAILY_PARSE_LIMIT = 100;
export const PER_MINUTE_RATE_LIMIT = 10;

// In-memory sliding window for per-minute rate limiting
// Key: userId, Value: array of timestamps
const rateLimitWindows = new Map<string, number[]>();

/**
 * Check if user is within rate limits
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  
  // Get or create window
  let window = rateLimitWindows.get(userId);
  if (!window) {
    window = [];
    rateLimitWindows.set(userId, window);
  }
  
  // Remove timestamps older than 1 minute
  const recentCalls = window.filter(ts => ts > oneMinuteAgo);
  rateLimitWindows.set(userId, recentCalls);
  
  return recentCalls.length < PER_MINUTE_RATE_LIMIT;
}

/**
 * Record a new call in the rate limit window
 */
function recordRateLimitCall(userId: string): void {
  const now = Date.now();
  const window = rateLimitWindows.get(userId) || [];
  window.push(now);
  rateLimitWindows.set(userId, window);
}

/**
 * Check if user has AI features enabled (admin kill switch)
 */
export async function checkUserAiEnabled(userId: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT ai_enabled FROM users WHERE id = $1',
    [userId]
  );
  
  // If user doesn't exist yet, they're enabled by default
  if (result.rows.length === 0) {
    // Create user record
    await pool.query(
      'INSERT INTO users (id, ai_enabled) VALUES ($1, true) ON CONFLICT (id) DO NOTHING',
      [userId]
    );
    return true;
  }
  
  return result.rows[0].ai_enabled;
}

/**
 * Check and increment daily quota
 * Throws error if quota exceeded or rate limit hit
 */
export async function checkAndIncrementQuota(
  userId: string
): Promise<{ remaining: number; resetsAt: Date }> {
  // Check admin kill switch first
  const aiEnabled = await checkUserAiEnabled(userId);
  if (!aiEnabled) {
    throw new Error('AI_DISABLED_FOR_USER');
  }
  
  // Check per-minute rate limit
  if (!checkRateLimit(userId)) {
    throw new Error('AI_RATE_LIMITED');
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Upsert daily usage record
    const upsertResult = await client.query(
      `INSERT INTO user_ai_usage_daily (user_id, date, parse_food_calls, tokens_used)
       VALUES ($1, $2, 0, 0)
       ON CONFLICT (user_id, date)
       DO UPDATE SET last_updated = CURRENT_TIMESTAMP
       RETURNING parse_food_calls`,
      [userId, today]
    );
    
    const currentCalls = upsertResult.rows[0].parse_food_calls;
    
    // Check if over limit
    if (currentCalls >= DAILY_PARSE_LIMIT) {
      await client.query('ROLLBACK');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      throw new Error(`AI_QUOTA_EXCEEDED:${tomorrow.toISOString()}`);
    }
    
    // Increment usage
    await client.query(
      `UPDATE user_ai_usage_daily
       SET parse_food_calls = parse_food_calls + 1
       WHERE user_id = $1 AND date = $2`,
      [userId, today]
    );
    
    await client.query('COMMIT');
    
    // Record rate limit call
    recordRateLimitCall(userId);
    
    const remaining = DAILY_PARSE_LIMIT - currentCalls - 1;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    return { remaining, resetsAt: tomorrow };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update token usage for a user (called after successful parse)
 */
export async function recordTokenUsage(
  userId: string,
  tokensUsed: number
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  await pool.query(
    `UPDATE user_ai_usage_daily
     SET tokens_used = tokens_used + $1
     WHERE user_id = $2 AND date = $3`,
    [tokensUsed, userId, today]
  );
}

/**
 * Get current quota status for a user
 */
export async function getQuotaStatus(userId: string): Promise<{
  dailyRemaining: number;
  dailyLimit: number;
  resetsAt: Date;
}> {
  const today = new Date().toISOString().split('T')[0];
  
  const result = await pool.query(
    'SELECT parse_food_calls FROM user_ai_usage_daily WHERE user_id = $1 AND date = $2',
    [userId, today]
  );
  
  const used = result.rows.length > 0 ? result.rows[0].parse_food_calls : 0;
  const remaining = Math.max(0, DAILY_PARSE_LIMIT - used);
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  return {
    dailyRemaining: remaining,
    dailyLimit: DAILY_PARSE_LIMIT,
    resetsAt: tomorrow,
  };
}

/**
 * Log a parseFood event for analytics
 */
export async function logParseFoodEvent(event: {
  userId: string;
  textInput: string;
  provenance?: 'official' | 'estimated';
  confidence?: 'low' | 'medium' | 'high';
  calories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatsGrams?: number;
  errorCode?: string;
  durationMs: number;
  tokensUsed?: number;
}): Promise<void> {
  // Hash the input text for privacy (don't store raw user input)
  const textHash = crypto
    .createHash('sha256')
    .update(event.textInput)
    .digest('hex');
  
  await pool.query(
    `INSERT INTO parse_food_events (
      user_id, text_hash, provenance, confidence,
      calories, protein_grams, carbs_grams, fats_grams,
      error_code, duration_ms, tokens_used
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      event.userId,
      textHash,
      event.provenance || null,
      event.confidence || null,
      event.calories || null,
      event.proteinGrams || null,
      event.carbsGrams || null,
      event.fatsGrams || null,
      event.errorCode || null,
      event.durationMs,
      event.tokensUsed || null,
    ]
  );
}

/**
 * Mark a food item as user-adjusted in the log
 */
export async function markFoodAsAdjusted(
  userId: string,
  textHash: string
): Promise<void> {
  await pool.query(
    `UPDATE parse_food_events
     SET user_adjusted = true
     WHERE user_id = $1 AND text_hash = $2`,
    [userId, textHash]
  );
}

/**
 * Get usage analytics for a date range
 */
export async function getUsageAnalytics(startDate: string, endDate: string) {
  const result = await pool.query(
    `SELECT 
      COUNT(*) as total_parses,
      COUNT(*) FILTER (WHERE error_code IS NULL) as successful_parses,
      COUNT(*) FILTER (WHERE error_code IS NOT NULL) as failed_parses,
      COUNT(*) FILTER (WHERE provenance = 'official') as official_matches,
      COUNT(*) FILTER (WHERE provenance = 'estimated') as estimates,
      COUNT(*) FILTER (WHERE user_adjusted = true) as user_adjusted_count,
      COUNT(*) FILTER (WHERE confidence = 'high') as high_confidence,
      COUNT(*) FILTER (WHERE confidence = 'medium') as medium_confidence,
      COUNT(*) FILTER (WHERE confidence = 'low') as low_confidence,
      ROUND(AVG(duration_ms)::numeric, 0) as avg_duration_ms,
      SUM(tokens_used) as total_tokens
    FROM parse_food_events
    WHERE timestamp BETWEEN $1 AND $2`,
    [startDate, endDate]
  );
  
  return result.rows[0];
}

export { pool };
