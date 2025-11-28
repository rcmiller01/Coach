import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../lib/apiClient';

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

interface UseGenerationStatusProps {
  sessionId: string | null;
  onComplete?: (status: GenerationStatus) => void;
  onError?: (error: Error) => void;
}

export function useGenerationStatus({ sessionId, onComplete, onError }: UseGenerationStatusProps) {
  const [status, setStatus] = useState<GenerationStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const errorCount = useRef(0);

  useEffect(() => {
    if (!sessionId) {
      setStatus(null);
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    errorCount.current = 0;

    const pollStatus = async () => {
      try {
        // The API returns { data: { status: GenerationStatus } }
        const response = await apiClient.get<{ status: GenerationStatus }>(`/v1/nutrition/generation/${sessionId}/status`);
        const result = response.status;

        setStatus(result);

        if (result.phase === 'complete') {
          setIsPolling(false);
          onComplete?.(result);
        } else if (result.phase === 'error') {
          setIsPolling(false);
          onError?.(new Error(result.error || 'Generation failed'));
        }
      } catch (err) {
        console.error('Poll error:', err);
        errorCount.current++;

        // Stop polling after 5 consecutive errors
        if (errorCount.current >= 5) {
          setIsPolling(false);
          onError?.(new Error('Lost connection to generation server'));
        }
      }
    };

    // Initial poll
    pollStatus();

    // Poll every 1 second
    const interval = setInterval(pollStatus, 1000);

    return () => clearInterval(interval);
  }, [sessionId, onComplete, onError]);

  return { status, isPolling };
}
