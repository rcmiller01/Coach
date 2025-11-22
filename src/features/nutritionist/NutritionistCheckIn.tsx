import React, { useState } from 'react';
import { type NutritionistResult } from './types';

export const NutritionistCheckIn: React.FC = () => {
    const [result, setResult] = useState<NutritionistResult | null>(null);
    const [loading, setLoading] = useState(false);

    const runCheckIn = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/nutritionist/check-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ period: '14d' }),
            });
            const data = await res.json();
            setResult(data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!result) {
        return (
            <div className="p-6 bg-white rounded-xl shadow-sm border text-center">
                <h2 className="text-xl font-bold mb-2">Time for a Check-in?</h2>
                <p className="text-gray-500 mb-4">Review your last 14 days and tune your plan.</p>
                <button
                    onClick={runCheckIn}
                    disabled={loading}
                    className="px-4 py-2 bg-black text-white rounded"
                >
                    {loading ? 'Analyzing...' : 'Start 14-Day Check-in'}
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border space-y-4">
            <h2 className="text-xl font-bold text-green-700">Plan Updated!</h2>

            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Nutritionist Notes</h3>
                <ul className="list-disc pl-5 space-y-1">
                    {result.notes.map((note, i) => (
                        <li key={i} className="text-gray-700">{note}</li>
                    ))}
                </ul>
                {result.notes.length === 0 && <p className="text-gray-500 italic">No specific changes needed. Keep it up!</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded">
                    <div className="text-sm text-gray-500">Daily Calories</div>
                    <div className="text-xl font-bold">{result.config.calorieTarget}</div>
                </div>
                <div className="p-3 border rounded">
                    <div className="text-sm text-gray-500">Meals / Day</div>
                    <div className="text-xl font-bold">{result.config.mealsPerDay}</div>
                </div>
            </div>

            <button onClick={() => setResult(null)} className="w-full py-2 text-gray-500">Close</button>
        </div>
    );
};
