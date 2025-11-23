/**
 * Hook for polling meal plan generation status
 * 
 * Polls /api/v1/nutrition/generation/:sessionId/status every second
 * and stops when generation is complete.
 */

import { useState, useEffect, useRef } from 'react';

export type GenerationPhase =
  | 'initializing'
  | 'generating_days'
  | 'auto_fixing'
  | 'validating'
  | 'complete'
  | 'error';

export interface GenerationStatus {
  phase: GenerationPhase;
  daysGenerated: number;
  daysAutoFixed: number;
  totalDays: number;
  daysWithinToleranceFirstPass: number;
  daysFixedByScaling: number;
  daysFixedByRegeneration: number;
  daysStillOutOfRange: number;
  qualitySummary: string;
  startTime: Date;
  endTime?: Date;
  error?: string;
}

export interface GenerationSessionData {
  sessionId: string;
  userId: string;
  weekStartDate: string;
  createdAt: Date;
  status: GenerationStatus;
}

interface UseGenerationStatusOptions {
  sessionId: string | null;
  pollInterval?: number; // ms, default 1000
  onComplete?: (status: GenerationStatus) => void;
  onError?: (error: Error) => void;
}

interface UseGenerationStatusResult {
  status: GenerationStatus | null;
  isPolling: boolean;
  error: Error | null;
}

export function useGenerationStatus({
  sessionId,
  pollInterval = 1000,
  onComplete,
  onError,
}: UseGenerationStatusOptions): UseGenerationStatusResult {
  const [status, setStatus] = useState<GenerationStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    // Reset state when sessionId changes
    if (sessionId) {
      setStatus(null);
      setError(null);
      setIsPolling(true);
      hasCompletedRef.current = false;
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !isPolling || hasCompletedRef.current) {
      return;
    }

    const pollStatus = async () => {
      try {
        const response = await fetch(
          `/api/v1/nutrition/generation/${sessionId}/status`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Generation session not found');
          }
          throw new Error('Failed to fetch generation status');
        }

        const { data } = await response.json();
        const newStatus: GenerationStatus = data.status;

        setStatus(newStatus);

        // Check if generation is complete
        if (newStatus.phase === 'complete' || newStatus.phase === 'error') {
          setIsPolling(false);
          hasCompletedRef.current = true;

          if (newStatus.phase === 'complete' && onComplete) {
            onComplete(newStatus);
          } else if (newStatus.phase === 'error' && onError) {
            onError(new Error(newStatus.error || 'Generation failed'));
          }

          // Stop polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setIsPolling(false);

        if (onError) {
          onError(errorObj);
        }

        // Stop polling on error
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    };

    // Initial poll immediately
    pollStatus();

    // Set up interval for subsequent polls
    pollIntervalRef.current = setInterval(pollStatus, pollInterval);

    // Cleanup on unmount or when sessionId changes
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [sessionId, isPolling, pollInterval, onComplete, onError]);

  return {
    status,
    isPolling,
    error,
  };
}
