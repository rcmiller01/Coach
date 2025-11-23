/**
 * In-memory session store for tracking weekly meal plan generation progress.
 * Enables real-time status polling during generation without database overhead.
 */

import { WeeklyGenerationTracker } from './weeklyGenerationProgress';

export interface GenerationSessionEntry {
  sessionId: string;
  tracker: WeeklyGenerationTracker;
  createdAt: Date;
  userId: string;
  weekStartDate: string;
}

class NutritionGenerationSessionStore {
  private sessions = new Map<string, GenerationSessionEntry>();

  /**
   * Create a new generation session with a tracker.
   * Returns the sessionId for polling status.
   */
  createSession(
    tracker: WeeklyGenerationTracker,
    userId: string,
    weekStartDate: string
  ): string {
    const sessionId = this.generateSessionId();
    const entry: GenerationSessionEntry = {
      sessionId,
      tracker,
      createdAt: new Date(),
      userId,
      weekStartDate,
    };
    this.sessions.set(sessionId, entry);
    return sessionId;
  }

  /**
   * Retrieve a session by ID.
   */
  getSession(sessionId: string): GenerationSessionEntry | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Remove a completed or expired session.
   */
  removeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Get all sessions (for admin/debugging).
   */
  getAllSessions(): GenerationSessionEntry[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Clear all sessions (for tests).
   */
  clear(): void {
    this.sessions.clear();
  }

  /**
   * Clean up old sessions (optional background task).
   * Removes sessions older than maxAgeMs.
   */
  cleanupOldSessions(maxAgeMs: number = 3600000): number {
    const now = Date.now();
    let removed = 0;
    
    for (const [sessionId, entry] of this.sessions.entries()) {
      if (now - entry.createdAt.getTime() > maxAgeMs) {
        this.sessions.delete(sessionId);
        removed++;
      }
    }
    
    return removed;
  }

  private generateSessionId(): string {
    // Use crypto.randomUUID if available (Node 16.7+), fallback otherwise
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Fallback: generate a random ID
    return `sess_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
  }
}

// Singleton instance
export const nutritionGenerationSessionStore = new NutritionGenerationSessionStore();
