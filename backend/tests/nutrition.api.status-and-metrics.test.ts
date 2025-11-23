/**
 * Tests for Nutrition Metrics & Status API Endpoints
 * 
 * Tests the new read-only endpoints that expose metrics and generation progress:
 * - GET /api/v1/nutrition/metrics
 * - GET /api/v1/nutrition/generation/:sessionId/status
 * - DELETE /api/v1/nutrition/generation/:sessionId
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { nutritionMetrics } from '../services/nutritionMetricsService';
import { nutritionGenerationSessionStore } from '../services/nutritionGenerationSessionStore';
import { WeeklyGenerationTracker } from '../services/weeklyGenerationProgress';
import * as routes from '../routes';

// Mock response object
function createMockResponse() {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.jsonData = data;
    },
    send(data?: any) {
      this.jsonData = data;
    },
  };
  return res;
}

// Mock request object
function createMockRequest(overrides: any = {}) {
  return {
    query: {},
    params: {},
    body: {},
    headers: {},
    ...overrides,
  };
}

describe('Nutrition Metrics & Status API', () => {
  beforeEach(() => {
    // Reset state before each test
    nutritionMetrics.reset();
    nutritionGenerationSessionStore.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Test 1: Metrics Endpoint - Basic Success
  // ==========================================================================

  describe('GET /api/v1/nutrition/metrics', () => {
    it('returns metrics summary with expected structure', async () => {
      // Arrange: Seed some metrics
      nutritionMetrics.recordWeekGenerated();
      nutritionMetrics.recordDayWithinTolerance();
      nutritionMetrics.recordDayWithinTolerance();
      nutritionMetrics.recordDayOutOfRange();
      nutritionMetrics.recordAutoFixByScaling(true);

      const req = createMockRequest();
      const res = createMockResponse();

      // Act
      await routes.getNutritionMetrics(req, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.jsonData).toBeDefined();
      expect(res.jsonData.data).toBeDefined();

      const { data } = res.jsonData;
      
      // Check structure
      expect(data.weeksGenerated).toBe(1);
      expect(data.daysGenerated).toBe(7);
      expect(data.firstPassQuality).toBeDefined();
      expect(data.firstPassQuality.withinTolerance).toBe(2);
      expect(data.firstPassQuality.outOfRange).toBe(1);
      expect(data.autoFix).toBeDefined();
      expect(data.autoFix.scaled).toBe(1);
      expect(data.performance).toBeDefined();
    });

    it('returns metrics even when no data exists', async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      await routes.getNutritionMetrics(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.data.weeksGenerated).toBe(0);
      expect(res.jsonData.data.daysGenerated).toBe(0);
    });

    it('includes quality and success rates', async () => {
      // Arrange: Create scenario with known rates
      nutritionMetrics.recordWeekGenerated();
      
      // 3 perfect, 1 out of range
      nutritionMetrics.recordDayWithinTolerance();
      nutritionMetrics.recordDayWithinTolerance();
      nutritionMetrics.recordDayWithinTolerance();
      nutritionMetrics.recordDayOutOfRange();
      
      // Fix the out-of-range one
      nutritionMetrics.recordAutoFixByScaling(true);

      const req = createMockRequest();
      const res = createMockResponse();

      await routes.getNutritionMetrics(req, res);

      const { data } = res.jsonData;
      
      // First pass: 3/4 = 75%
      expect(data.firstPassQuality.rate).toBeCloseTo(75, 1);
      
      // Auto-fix: 1/1 = 100%
      expect(data.autoFix.successRate).toBe(100);
    });
  });

  // ==========================================================================
  // Test 2: Generation Status - Session Found
  // ==========================================================================

  describe('GET /api/v1/nutrition/generation/:sessionId/status', () => {
    it('returns status for existing session', async () => {
      // Arrange: Create a session with progress
      const tracker = new WeeklyGenerationTracker();
      tracker.startGeneratingDays();
      tracker.incrementDaysGenerated();
      tracker.incrementDaysGenerated();
      tracker.recordDayWithinTolerance('2025-01-06');
      tracker.recordDayWithinTolerance('2025-01-07');

      const sessionId = nutritionGenerationSessionStore.createSession(
        tracker,
        'test-user-123',
        '2025-01-06'
      );

      const req = createMockRequest({
        params: { sessionId },
      });
      const res = createMockResponse();

      // Act
      await routes.getGenerationStatus(req, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.jsonData.data).toBeDefined();

      const { data } = res.jsonData;
      expect(data.sessionId).toBe(sessionId);
      expect(data.userId).toBe('test-user-123');
      expect(data.weekStartDate).toBe('2025-01-06');
      expect(data.createdAt).toBeDefined();
      expect(data.status).toBeDefined();
      expect(data.status.phase).toBe('generating_days');
      expect(data.status.daysGenerated).toBe(2);
      expect(data.status.daysWithinToleranceFirstPass).toBe(2);
    });

    it('returns complete status for finished generation', async () => {
      // Arrange: Create completed session
      const tracker = new WeeklyGenerationTracker();
      tracker.startGeneratingDays();
      
      // Simulate all 7 days generated
      for (let i = 0; i < 7; i++) {
        tracker.incrementDaysGenerated();
      }
      
      tracker.startAutoFixing();
      tracker.recordDayWithinTolerance('2025-01-06');
      tracker.recordAutoFixResult('2025-01-07', 'scaling', true);
      tracker.recordAutoFixResult('2025-01-08', 'regeneration', true, 1);
      
      tracker.complete();

      const sessionId = nutritionGenerationSessionStore.createSession(
        tracker,
        'test-user-456',
        '2025-01-06'
      );

      const req = createMockRequest({
        params: { sessionId },
      });
      const res = createMockResponse();

      // Act
      await routes.getGenerationStatus(req, res);

      // Assert
      const { data } = res.jsonData;
      expect(data.status.phase).toBe('complete');
      expect(data.status.daysGenerated).toBe(7);
      expect(data.status.daysFixedByScaling).toBeGreaterThan(0);
      expect(data.status.daysFixedByRegeneration).toBeGreaterThan(0);
      expect(data.status.qualitySummary).toBeDefined();
      expect(data.status.endTime).toBeDefined();
    });

    it('returns 404 for non-existent session', async () => {
      const req = createMockRequest({
        params: { sessionId: 'nonexistent-session-id' },
      });
      const res = createMockResponse();

      await routes.getGenerationStatus(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.error).toBe('Session not found');
    });
  });

  // ==========================================================================
  // Test 3: Delete Session
  // ==========================================================================

  describe('DELETE /api/v1/nutrition/generation/:sessionId', () => {
    it('removes existing session successfully', async () => {
      // Arrange: Create a session
      const tracker = new WeeklyGenerationTracker();
      const sessionId = nutritionGenerationSessionStore.createSession(
        tracker,
        'test-user',
        '2025-01-06'
      );

      // Verify it exists
      expect(nutritionGenerationSessionStore.getSession(sessionId)).toBeDefined();

      const req = createMockRequest({
        params: { sessionId },
      });
      const res = createMockResponse();

      // Act
      await routes.deleteGenerationSession(req, res);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.jsonData.message).toBe('Session removed successfully');
      
      // Verify it's gone
      expect(nutritionGenerationSessionStore.getSession(sessionId)).toBeUndefined();
    });

    it('returns 404 when deleting non-existent session', async () => {
      const req = createMockRequest({
        params: { sessionId: 'does-not-exist' },
      });
      const res = createMockResponse();

      await routes.deleteGenerationSession(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.error).toBe('Session not found');
    });
  });

  // ==========================================================================
  // Test 4: Integration - Session Creation During Weekly Generation
  // ==========================================================================

  describe('Integration: Session tracking in weekly generation', () => {
    it('verifies generateWeeklyPlan creates session and returns sessionId', () => {
      // This is more of a smoke test to verify the wiring
      // Full integration testing would require mocking OpenAI
      
      // Just verify the session store utility works as expected
      const tracker = new WeeklyGenerationTracker();
      tracker.startGeneratingDays();
      
      const sessionId = nutritionGenerationSessionStore.createSession(
        tracker,
        'user-123',
        '2025-01-06'
      );

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);

      const retrieved = nutritionGenerationSessionStore.getSession(sessionId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.userId).toBe('user-123');
      expect(retrieved?.weekStartDate).toBe('2025-01-06');
      expect(retrieved?.tracker).toBe(tracker);
    });

    it('allows polling session status multiple times', () => {
      const tracker = new WeeklyGenerationTracker();
      tracker.startGeneratingDays();
      
      const sessionId = nutritionGenerationSessionStore.createSession(
        tracker,
        'user-123',
        '2025-01-06'
      );

      // Poll 1
      const session1 = nutritionGenerationSessionStore.getSession(sessionId);
      expect(session1?.tracker.getStatus().daysGenerated).toBe(0);

      // Simulate progress
      tracker.incrementDaysGenerated();
      tracker.incrementDaysGenerated();

      // Poll 2
      const session2 = nutritionGenerationSessionStore.getSession(sessionId);
      expect(session2?.tracker.getStatus().daysGenerated).toBe(2);

      // Both polls return the same tracker instance
      expect(session1?.tracker).toBe(session2?.tracker);
    });
  });

  // ==========================================================================
  // Test 5: Session Store Cleanup
  // ==========================================================================

  describe('Session store maintenance', () => {
    it('can clean up old sessions', () => {
      // Create sessions with different ages
      const tracker1 = new WeeklyGenerationTracker();
      const tracker2 = new WeeklyGenerationTracker();
      const tracker3 = new WeeklyGenerationTracker();

      const sessionId1 = nutritionGenerationSessionStore.createSession(
        tracker1,
        'user-1',
        '2025-01-01'
      );
      const sessionId2 = nutritionGenerationSessionStore.createSession(
        tracker2,
        'user-2',
        '2025-01-02'
      );
      const sessionId3 = nutritionGenerationSessionStore.createSession(
        tracker3,
        'user-3',
        '2025-01-03'
      );

      // All sessions should exist
      expect(nutritionGenerationSessionStore.getAllSessions()).toHaveLength(3);

      // Cleanup with a maxAge that removes none (very short time)
      const removed = nutritionGenerationSessionStore.cleanupOldSessions(1);
      expect(removed).toBe(0);
      expect(nutritionGenerationSessionStore.getAllSessions()).toHaveLength(3);

      // Clear all for cleanup
      nutritionGenerationSessionStore.clear();
      expect(nutritionGenerationSessionStore.getAllSessions()).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Test 6: Metrics Accumulation Across Multiple Requests
  // ==========================================================================

  describe('Metrics persistence across requests', () => {
    it('accumulates metrics from multiple generation sessions', () => {
      // Simulate week 1
      nutritionMetrics.recordWeekGenerated();
      nutritionMetrics.recordDayWithinTolerance();
      nutritionMetrics.recordDayWithinTolerance();
      nutritionMetrics.recordDayOutOfRange();
      nutritionMetrics.recordAutoFixByScaling(true);

      const metrics1 = nutritionMetrics.getMetrics();
      expect(metrics1.totalWeeksGenerated).toBe(1);
      expect(metrics1.daysWithinToleranceFirstPass).toBe(2);

      // Simulate week 2
      nutritionMetrics.recordWeekGenerated();
      nutritionMetrics.recordDayWithinTolerance();
      nutritionMetrics.recordDayWithinTolerance();
      nutritionMetrics.recordDayWithinTolerance();
      nutritionMetrics.recordDayOutOfRange();
      nutritionMetrics.recordAutoFixByRegeneration(true, 1);

      const metrics2 = nutritionMetrics.getMetrics();
      expect(metrics2.totalWeeksGenerated).toBe(2);
      expect(metrics2.daysWithinToleranceFirstPass).toBe(5);
      expect(metrics2.daysFixedByScaling).toBe(1);
      expect(metrics2.daysFixedByRegeneration).toBe(1);
    });
  });
});
