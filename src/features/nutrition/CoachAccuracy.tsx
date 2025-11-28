/**
 * CoachAccuracy Component
 * 
 * Displays nutrition generation metrics for developers/admins.
 * Shows first-pass quality, auto-fix success rates, and quality indicators.
 */

import { useState, useEffect } from 'react';

interface NutritionMetrics {
  totalWeeksGenerated: number;
  daysWithinToleranceFirstPass: number;
  daysFixedByScaling: number;
  daysFixedByRegeneration: number;
  daysStillOutOfRange: number;
  totalRegenerationAttempts: number;
  successfulRegenerations: number;
  totalDays: number;
  firstPassQuality: {
    count: number;
    rate: number;
  };
  autoFix: {
    successCount: number;
    successRate: number;
  };
  regeneration: {
    successCount: number;
    successRate: number;
  };
}

/**
 * Get color theme based on rate
 */
function getRateColor(rate: number): 'green' | 'yellow' | 'red' {
  if (rate >= 0.8) return 'green';
  if (rate >= 0.6) return 'yellow';
  return 'red';
}

/**
 * Get quality label based on rate
 */
function getQualityLabel(rate: number): string {
  if (rate >= 0.8) return 'Coach is dialed in ✨';
  if (rate >= 0.6) return 'Good performance';
  return 'Prompts/config might need love ⚠️';
}

export function CoachAccuracy() {
  const [metrics, setMetrics] = useState<NutritionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v1/nutrition/metrics');

        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }

        const { data } = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Refresh metrics every 30 seconds when panel is expanded
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isExpanded) {
      interval = setInterval(fetchMetrics, 30000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isExpanded]);

  if (loading && !metrics) {
    return (
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <div className="text-sm text-slate-400">Loading metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <div className="text-sm text-red-400">Failed to load metrics</div>
      </div>
    );
  }

  if (!metrics || metrics.totalWeeksGenerated === 0) {
    return (
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <div className="text-sm text-slate-400">No generation data yet</div>
      </div>
    );
  }

  const firstPassColor = getRateColor(metrics.firstPassQuality.rate);
  const autoFixColor = getRateColor(metrics.autoFix.successRate);
  const regenerationColor = getRateColor(metrics.regeneration.successRate);

  // Color class mapping
  const colorClasses = {
    green: {
      bg: 'bg-green-900/30',
      border: 'border-green-800/50',
      text: 'text-green-300',
    },
    yellow: {
      bg: 'bg-amber-900/30',
      border: 'border-amber-800/50',
      text: 'text-amber-300',
    },
    red: {
      bg: 'bg-red-900/30',
      border: 'border-red-800/50',
      text: 'text-red-300',
    },
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-850 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h3 className="text-sm font-semibold text-slate-100">Coach Accuracy</h3>
        </div>
        <span className="text-xs text-slate-400">
          {isExpanded ? '▼' : '▶'} {metrics.totalWeeksGenerated} weeks
        </span>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Overall Quality Label */}
          <div className={`p-3 rounded-lg border ${colorClasses[firstPassColor].bg} ${colorClasses[firstPassColor].border}`}>
            <div className={`text-sm font-medium ${colorClasses[firstPassColor].text}`}>
              {getQualityLabel(metrics.firstPassQuality.rate)}
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* First Pass Quality */}
            <div className={`p-3 rounded-lg border ${colorClasses[firstPassColor].bg} ${colorClasses[firstPassColor].border}`}>
              <div className={`text-2xl font-bold ${colorClasses[firstPassColor].text}`}>
                {Math.round(metrics.firstPassQuality.rate * 100)}%
              </div>
              <div className="text-xs text-slate-400 mt-1">First Pass</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {metrics.firstPassQuality.count}/{metrics.totalDays} days
              </div>
            </div>

            {/* Auto-Fix Success */}
            <div className={`p-3 rounded-lg border ${colorClasses[autoFixColor].bg} ${colorClasses[autoFixColor].border}`}>
              <div className={`text-2xl font-bold ${colorClasses[autoFixColor].text}`}>
                {Math.round(metrics.autoFix.successRate * 100)}%
              </div>
              <div className="text-xs text-slate-400 mt-1">Auto-Fix</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {metrics.autoFix.successCount} fixed
              </div>
            </div>

            {/* Regeneration Success */}
            <div className={`p-3 rounded-lg border ${colorClasses[regenerationColor].bg} ${colorClasses[regenerationColor].border}`}>
              <div className={`text-2xl font-bold ${colorClasses[regenerationColor].text}`}>
                {Math.round(metrics.regeneration.successRate * 100)}%
              </div>
              <div className="text-xs text-slate-400 mt-1">Regen</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {metrics.successfulRegenerations}/{metrics.totalRegenerationAttempts}
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Perfect on first pass:</span>
              <span className="text-green-400">{metrics.daysWithinToleranceFirstPass}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Fixed by scaling:</span>
              <span className="text-amber-400">{metrics.daysFixedByScaling}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Fixed by regeneration:</span>
              <span className="text-blue-400">{metrics.daysFixedByRegeneration}</span>
            </div>
            {metrics.daysStillOutOfRange > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Still out of range:</span>
                <span className="text-red-400">{metrics.daysStillOutOfRange}</span>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => {
              setLoading(true);
              fetch('/api/v1/nutrition/metrics')
                .then(res => res.json())
                .then(({ data }) => setMetrics(data))
                .catch(err => setError(err))
                .finally(() => setLoading(false));
            }}
            disabled={loading}
            className="w-full px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-850 text-slate-300 text-xs rounded transition-colors"
          >
            {loading ? '⏳ Refreshing...' : '🔄 Refresh Metrics'}
          </button>
        </div>
      )}
    </div>
  );
}
