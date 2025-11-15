import type { DiagnosticIssue, DiagnosticSeverity } from './diagnostics';

interface DiagnosticsPanelProps {
  issues: DiagnosticIssue[];
  summary: {
    weekCount: number;
    blockCount: number;
    sessionCount: number;
    foodDayCount: number;
  };
}

/**
 * DiagnosticsPanel - Developer diagnostics display
 * 
 * Purpose:
 * - Show app state summary (weeks, blocks, sessions, food days)
 * - Display integrity issues grouped by severity
 * - Help developers/advanced users debug state problems
 * 
 * Design: Read-only panel with color-coded issue list
 */
export function DiagnosticsPanel({ issues, summary }: DiagnosticsPanelProps) {
  // Group issues by severity
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const infos = issues.filter(i => i.severity === 'info');

  // Get severity styling
  const getSeverityStyle = (severity: DiagnosticSeverity): string => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-300 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-300 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-300 text-blue-800';
    }
  };

  const getSeverityIcon = (severity: DiagnosticSeverity): string => {
    switch (severity) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
    }
  };

  const getSeverityBadge = (severity: DiagnosticSeverity): string => {
    switch (severity) {
      case 'error':
        return 'bg-red-600 text-white';
      case 'warning':
        return 'bg-yellow-600 text-white';
      case 'info':
        return 'bg-blue-600 text-white';
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        Developer Diagnostics
      </h3>

      {/* Summary Stats */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4 text-sm text-gray-700 flex-wrap">
          <div>
            <span className="font-medium">Weeks:</span> {summary.weekCount}
          </div>
          <span className="text-gray-400">·</span>
          <div>
            <span className="font-medium">Blocks:</span> {summary.blockCount}
          </div>
          <span className="text-gray-400">·</span>
          <div>
            <span className="font-medium">Sessions:</span> {summary.sessionCount}
          </div>
          <span className="text-gray-400">·</span>
          <div>
            <span className="font-medium">Food days:</span> {summary.foodDayCount}
          </div>
        </div>
      </div>

      {/* Issues Summary Badges */}
      {issues.length > 0 && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          {errors.length > 0 && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-red-600 text-white">
              {errors.length} Error{errors.length !== 1 ? 's' : ''}
            </span>
          )}
          {warnings.length > 0 && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-600 text-white">
              {warnings.length} Warning{warnings.length !== 1 ? 's' : ''}
            </span>
          )}
          {infos.length > 0 && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-600 text-white">
              {infos.length} Info
            </span>
          )}
        </div>
      )}

      {/* Issues List */}
      {issues.length === 0 ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <div className="text-2xl mb-2">✅</div>
          <p className="font-medium text-green-800">No issues detected</p>
          <p className="text-sm text-green-700 mt-1">
            All integrity checks passed successfully
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Errors first */}
          {errors.map(issue => (
            <div
              key={issue.id}
              className={`p-3 border rounded-lg ${getSeverityStyle('error')}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{getSeverityIcon('error')}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityBadge('error')}`}>
                      ERROR
                    </span>
                  </div>
                  <p className="text-sm">{issue.message}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Warnings second */}
          {warnings.map(issue => (
            <div
              key={issue.id}
              className={`p-3 border rounded-lg ${getSeverityStyle('warning')}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{getSeverityIcon('warning')}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityBadge('warning')}`}>
                      WARNING
                    </span>
                  </div>
                  <p className="text-sm">{issue.message}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Info last */}
          {infos.map(issue => (
            <div
              key={issue.id}
              className={`p-3 border rounded-lg ${getSeverityStyle('info')}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{getSeverityIcon('info')}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityBadge('info')}`}>
                      INFO
                    </span>
                  </div>
                  <p className="text-sm">{issue.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          💡 <span className="font-medium">Tip:</span> If you see errors, try exporting a backup, 
          then use "Reset Program Data" to start fresh. Your onboarding profile will be preserved.
        </p>
      </div>
    </div>
  );
}
