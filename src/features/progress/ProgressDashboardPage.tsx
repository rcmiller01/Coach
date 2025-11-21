import { useState, useEffect } from 'react';
import { fetchWeekSummary, fetchTrends, type WeekSummary, type TrendsData } from '../../api/progressApiClient';

/**
 * Progress Dashboard Page
 * Displays weekly workout completion, nutrition adherence, and weight trends
 */
export default function ProgressDashboardPage() {
    const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null);
    const [trends, setTrends] = useState<TrendsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadProgressData();
    }, []);

    const loadProgressData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current week start (Monday)
            const now = new Date();
            const dayOfWeek = now.getDay();
            const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            const monday = new Date(now.setDate(diff));
            const weekStart = monday.toISOString().split('T')[0];

            // Get date 4 weeks ago for trends
            const fourWeeksAgo = new Date();
            fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
            const startDate = fourWeeksAgo.toISOString().split('T')[0];
            const endDate = new Date().toISOString().split('T')[0];

            // Fetch data in parallel
            const [summaryData, trendsData] = await Promise.all([
                fetchWeekSummary(weekStart),
                fetchTrends(startDate, endDate),
            ]);

            setWeekSummary(summaryData);
            setTrends(trendsData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load progress data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-400">Loading progress...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-red-400">Error: {error}</div>
            </div>
        );
    }

    const hasData = weekSummary && (weekSummary.workouts.sessionsCompleted > 0 || weekSummary.nutrition.daysLogged > 0);

    return (
        <div className="min-h-screen bg-slate-950">
            <div className="max-w-4xl mx-auto px-4 py-6">
                <h1 className="text-3xl font-bold text-slate-100 mb-6">Progress Dashboard</h1>

                {!hasData ? (
                    <div className="bg-slate-900 rounded-lg p-8 border border-slate-800 text-center">
                        <p className="text-slate-400 text-lg">No progress data yet. Start tracking your workouts and nutrition!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Coach Notes */}
                        {weekSummary?.insights && weekSummary.insights.length > 0 && (
                            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg p-6 border border-blue-800/30">
                                <h2 className="text-xl font-semibold text-blue-100 mb-4 flex items-center gap-2">
                                    <span>🧠</span> Coach Notes
                                </h2>
                                <ul className="space-y-3">
                                    {weekSummary.insights.map((insight, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-slate-300">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                            <span>{insight}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Weekly Summary */}
                        <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
                            <h2 className="text-xl font-semibold text-slate-100 mb-4">This Week</h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800 rounded-lg p-4">
                                    <div className="text-slate-400 text-sm mb-1">Workouts Completed</div>
                                    <div className="text-3xl font-bold text-blue-400">{weekSummary?.workouts.sessionsCompleted || 0}</div>
                                    {weekSummary?.workouts.completionRate !== undefined && (
                                        <div className="text-xs text-slate-500 mt-1">
                                            {Math.round(weekSummary.workouts.completionRate * 100)}% completion rate
                                        </div>
                                    )}
                                </div>

                                <div className="bg-slate-800 rounded-lg p-4">
                                    <div className="text-slate-400 text-sm mb-1">Days Logged</div>
                                    <div className="text-3xl font-bold text-green-400">{weekSummary?.nutrition.daysLogged || 0}</div>
                                </div>

                                <div className="bg-slate-800 rounded-lg p-4">
                                    <div className="text-slate-400 text-sm mb-1">Avg Calories</div>
                                    <div className="text-3xl font-bold text-purple-400">{weekSummary?.nutrition.avgCaloriesActual || 0}</div>
                                    {weekSummary?.nutrition.avgCaloriesDelta !== undefined && (
                                        <div className={`text-xs mt-1 ${weekSummary.nutrition.avgCaloriesDelta > 0 ? 'text-orange-400' : 'text-blue-400'}`}>
                                            {weekSummary.nutrition.avgCaloriesDelta > 0 ? '+' : ''}{weekSummary.nutrition.avgCaloriesDelta} vs target
                                        </div>
                                    )}
                                </div>

                                <div className="bg-slate-800 rounded-lg p-4">
                                    <div className="text-slate-400 text-sm mb-1">Avg Protein (g)</div>
                                    <div className="text-3xl font-bold text-orange-400">{weekSummary?.nutrition.avgProteinActual || 0}</div>
                                </div>
                            </div>
                        </div>

                        {/* Weight Trends */}
                        {trends && trends.weights.length > 0 && (
                            <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
                                <h2 className="text-xl font-semibold text-slate-100 mb-4">Weight Trend (Last 4 Weeks)</h2>

                                <div className="mb-4">
                                    <div className="text-sm text-slate-400 mb-2">
                                        Trend: <span className={`font-semibold ${trends.trend === 'increasing' ? 'text-orange-400' :
                                            trends.trend === 'decreasing' ? 'text-blue-400' :
                                                'text-slate-400'
                                            }`}>
                                            {trends.trend === 'increasing' ? '↗ Increasing' :
                                                trends.trend === 'decreasing' ? '↘ Decreasing' :
                                                    '→ Stable'}
                                        </span>
                                    </div>
                                </div>

                                {/* Simple weight chart */}
                                <div className="space-y-2">
                                    {trends.weights.map((entry, idx) => (
                                        <div key={entry.date} className="flex items-center gap-3">
                                            <div className="text-sm text-slate-400 w-24">{entry.date}</div>
                                            <div className="flex-1 bg-slate-800 rounded-full h-8 relative overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all"
                                                    style={{ width: `${Math.min((entry.weight / 300) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <div className="text-lg font-semibold text-slate-200 w-20 text-right">
                                                {entry.weight} lbs
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
