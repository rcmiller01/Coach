/**
 * GenerationProgress Component
 * 
 * Shows real-time meal plan generation progress with phase-specific UI.
 * Maps backend phases to user-friendly messages.
 */

import React from 'react';
import type { GenerationStatus, GenerationPhase } from './useGenerationStatus';

interface GenerationProgressProps {
  status: GenerationStatus | null;
  isPolling: boolean;
}

/**
 * Map backend phases to user-friendly text
 */
function getPhaseText(phase: GenerationPhase, status: GenerationStatus | null): string {
  if (!status) return 'Starting...';

  switch (phase) {
    case 'initializing':
      return 'Preparing your plan...';
    case 'generating_days':
      return `Building your 7-day plan... (${status.daysGenerated}/7 days ready)`;
    case 'auto_fixing':
      return `Tuning portions and macros... (${status.daysAutoFixed}/${status.totalDays} adjusted)`;
    case 'validating':
      return 'Double-checking macros...';
    case 'complete':
      return status.qualitySummary || 'Plan ready!';
    case 'error':
      return 'Generation failed';
    default:
      return 'Processing...';
  }
}

/**
 * Get progress percentage based on phase
 */
function getProgress(status: GenerationStatus | null): number {
  if (!status) return 0;

  const { phase, daysGenerated, daysAutoFixed, totalDays } = status;

  switch (phase) {
    case 'initializing':
      return 5;
    case 'generating_days':
      // 5% to 60%
      return 5 + (daysGenerated / totalDays) * 55;
    case 'auto_fixing':
      // 60% to 90%
      return 60 + (daysAutoFixed / totalDays) * 30;
    case 'validating':
      return 95;
    case 'complete':
      return 100;
    default:
      return 0;
  }
}

/**
 * Get color theme based on phase
 */
function getPhaseColor(phase: GenerationPhase): string {
  switch (phase) {
    case 'initializing':
    case 'generating_days':
      return 'blue';
    case 'auto_fixing':
      return 'amber';
    case 'validating':
      return 'green';
    case 'complete':
      return 'green';
    case 'error':
      return 'red';
    default:
      return 'gray';
  }
}

export function GenerationProgress({ status, isPolling }: GenerationProgressProps) {
  const progress = getProgress(status);
  const phase = status?.phase || 'initializing';
  const phaseText = getPhaseText(phase, status);
  const color = getPhaseColor(phase);

  // Color classes
  const progressBarClass = {
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500',
  }[color];

  const textClass = {
    blue: 'text-blue-700',
    amber: 'text-amber-700',
    green: 'text-green-700',
    red: 'text-red-700',
    gray: 'text-gray-700',
  }[color];

  const bgClass = {
    blue: 'bg-blue-50',
    amber: 'bg-amber-50',
    green: 'bg-green-50',
    red: 'bg-red-50',
    gray: 'bg-gray-50',
  }[color];

  return (
    <div className={`rounded-lg border ${bgClass} p-6 space-y-4`}>
      {/* Status Text */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className={`text-lg font-semibold ${textClass}`}>
            {phase === 'complete' ? '✅ Generation Complete' : '🔄 Generating Meal Plan'}
          </h3>
          <p className="text-sm text-gray-600">{phaseText}</p>
        </div>

        {/* Spinner or Checkmark */}
        {isPolling && phase !== 'complete' && (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current" />
        )}
        {phase === 'complete' && (
          <div className="text-4xl">✅</div>
        )}
        {phase === 'error' && (
          <div className="text-4xl">❌</div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden relative">
          <div
            className={`h-full ${progressBarClass} transition-all duration-500 ease-out absolute top-0 left-0`}
            {...({ style: { width: `${progress}%` } } as React.HTMLAttributes<HTMLDivElement>)}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{Math.round(progress)}% complete</span>
          {status && (
            <span>
              {status.daysGenerated}/{status.totalDays} days
            </span>
          )}
        </div>
      </div>

      {/* Quality Summary (when complete) */}
      {phase === 'complete' && status && (
        <div className="pt-2 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">First pass: </span>
              <span className="font-medium text-green-600">
                {status.daysWithinToleranceFirstPass} perfect
              </span>
            </div>
            {status.daysFixedByScaling > 0 && (
              <div>
                <span className="text-gray-600">Scaled: </span>
                <span className="font-medium text-amber-600">
                  {status.daysFixedByScaling}
                </span>
              </div>
            )}
            {status.daysFixedByRegeneration > 0 && (
              <div>
                <span className="text-gray-600">Regenerated: </span>
                <span className="font-medium text-blue-600">
                  {status.daysFixedByRegeneration}
                </span>
              </div>
            )}
            {status.daysStillOutOfRange > 0 && (
              <div>
                <span className="text-gray-600">Out of range: </span>
                <span className="font-medium text-red-600">
                  {status.daysStillOutOfRange}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {phase === 'error' && status?.error && (
        <div className="pt-2 border-t border-red-200">
          <p className="text-sm text-red-600">{status.error}</p>
        </div>
      )}
    </div>
  );
}
