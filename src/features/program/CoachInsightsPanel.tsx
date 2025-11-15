/**
 * Coach Insights Panel
 * 
 * Displays rule-based coaching messages derived from weekly metrics
 */

import type { CoachInsight, InsightSeverity } from './coachInsights';

interface CoachInsightsPanelProps {
  insights: CoachInsight[];
  maxDisplay?: number;
}

export function CoachInsightsPanel({ 
  insights, 
  maxDisplay = 3 
}: CoachInsightsPanelProps) {
  const displayedInsights = insights.slice(0, maxDisplay);

  if (displayedInsights.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Coach Insights
        </h3>
        <p className="text-sm text-gray-500">
          No specific notes this week. Keep training consistently!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Coach Insights
      </h3>
      
      <div className="space-y-4">
        {displayedInsights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  );
}

interface InsightCardProps {
  insight: CoachInsight;
}

function InsightCard({ insight }: InsightCardProps) {
  const { bgColor, borderColor, textColor } = getSeverityColors(insight.severity);

  return (
    <div
      className={`rounded-md border-l-4 ${borderColor} ${bgColor} p-4`}
    >
      <h4 className={`mb-1 text-sm font-semibold ${textColor}`}>
        {insight.title}
      </h4>
      <p className="text-sm text-gray-700">
        {insight.message}
      </p>
    </div>
  );
}

function getSeverityColors(severity: InsightSeverity): {
  bgColor: string;
  borderColor: string;
  textColor: string;
} {
  switch (severity) {
    case 'critical':
      return {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-500',
        textColor: 'text-red-900',
      };
    case 'warning':
      return {
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-500',
        textColor: 'text-orange-900',
      };
    case 'success':
      return {
        bgColor: 'bg-green-50',
        borderColor: 'border-green-500',
        textColor: 'text-green-900',
      };
    case 'info':
      return {
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-500',
        textColor: 'text-blue-900',
      };
  }
}
