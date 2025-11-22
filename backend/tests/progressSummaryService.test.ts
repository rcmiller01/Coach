import { describe, it, expect } from 'vitest';
import { ProgressSummaryService } from '../services/progressSummaryService';

describe('ProgressSummaryService', () => {
    describe('volume filtering', () => {
        it('should exclude warmup sets from volume metrics', () => {
            const mockSessions = [
                {
                    id: 1,
                    userId: 'test-user',
                    date: '2025-01-01',
                    sets: [
                        { id: 1, isWarmup: true, reps: 10, weightLbs: 50 },
                        { id: 2, isWarmup: true, reps: 10, weightLbs: 60 },
                        { id: 3, isWarmup: false, reps: 5, weightLbs: 200 },
                        { id: 4, isWarmup: false, reps: 5, weightLbs: 200 },
                        { id: 5, isWarmup: false, reps: 5, weightLbs: 200 },
                    ]
                },
                {
                    id: 2,
                    userId: 'test-user',
                    date: '2025-01-03',
                    sets: [
                        { id: 6, isWarmup: true, reps: 10, weightLbs: 50 },
                        { id: 7, isWarmup: false, reps: 5, weightLbs: 150 },
                        { id: 8, isWarmup: false, reps: 5, weightLbs: 150 },
                    ]
                }
            ];

            const service = new ProgressSummaryService(null as any);
            const metrics = (service as any).computeWorkoutMetrics(mockSessions);

            // Only non-warmup sets should be counted
            expect(metrics.setsCompleted).toBe(5); // 3 from session 1, 2 from session 2
            expect(metrics.sessionsCompleted).toBe(2);
            expect(metrics.warmupCompletedSessions).toBe(2); // Both sessions had warmups
        });

        it('should handle sessions with only warmup sets', () => {
            const mockSessions = [
                {
                    id: 1,
                    userId: 'test-user',
                    date: '2025-01-01',
                    sets: [
                        { id: 1, isWarmup: true, reps: 10, weightLbs: 50 },
                        { id: 2, isWarmup: true, reps: 10, weightLbs: 60 },
                    ]
                }
            ];

            const service = new ProgressSummaryService(null as any);
            const metrics = (service as any).computeWorkoutMetrics(mockSessions);

            // No working sets
            expect(metrics.setsCompleted).toBeUndefined(); // No working sets completed
            expect(metrics.sessionsCompleted).toBe(1);
            expect(metrics.warmupCompletedSessions).toBe(1);
        });

        it('should handle sessions with no warmup sets', () => {
            const mockSessions = [
                {
                    id: 1,
                    userId: 'test-user',
                    date: '2025-01-01',
                    sets: [
                        { id: 1, isWarmup: false, reps: 5, weightLbs: 200 },
                        { id: 2, isWarmup: false, reps: 5, weightLbs: 200 },
                    ]
                }
            ];

            const service = new ProgressSummaryService(null as any);
            const metrics = (service as any).computeWorkoutMetrics(mockSessions);

            expect(metrics.setsCompleted).toBe(2);
            expect(metrics.sessionsCompleted).toBe(1);
            expect(metrics.warmupCompletedSessions).toBeUndefined(); // No sessions with warmups
        });

        it('should handle empty sessions gracefully', () => {
            const mockSessions: any[] = [];

            const service = new ProgressSummaryService(null as any);
            const metrics = (service as any).computeWorkoutMetrics(mockSessions);

            expect(metrics.sessionsCompleted).toBe(0);
            expect(metrics.setsCompleted).toBeUndefined();
            expect(metrics.warmupCompletedSessions).toBeUndefined();
        });
    });

    describe('warmup adherence', () => {
        it('should track sessions with warmups completed', () => {
            const mockSessions = [
                {
                    id: 1,
                    sets: [
                        { id: 1, isWarmup: true },
                        { id: 2, isWarmup: false },
                    ]
                },
                {
                    id: 2,
                    sets: [
                        { id: 3, isWarmup: true },
                        { id: 4, isWarmup: false },
                    ]
                },
                {
                    id: 3,
                    sets: [
                        { id: 5, isWarmup: false },
                    ]
                }
            ];

            const service = new ProgressSummaryService(null as any);
            const metrics = (service as any).computeWorkoutMetrics(mockSessions);

            expect(metrics.sessionsCompleted).toBe(3);
            expect(metrics.warmupCompletedSessions).toBe(2); // 2 sessions with warmups
        });
    });
});
