import React, { useState, useEffect } from 'react';
import type { WorkoutSetState } from './types';

interface WarmupViewProps {
    sets: WorkoutSetState[];
    onUpdateSet: (setId: string, updates: Partial<WorkoutSetState>) => void;
    onComplete: () => void;
    onSwap: (stepId: string, newExerciseId: string) => void;
}

export const WarmupView: React.FC<WarmupViewProps> = ({ sets, onUpdateSet, onComplete, onSwap }) => {
    const activeSetIndex = sets.findIndex(s => s.status === 'pending');
    const activeSet = sets[activeSetIndex];
    const [timeLeft, setTimeLeft] = useState(activeSet?.durationSeconds || 0);
    const [timerActive, setTimerActive] = useState(false);

    useEffect(() => {
        if (activeSet) {
            setTimeLeft(activeSet.durationSeconds || 0);
            setTimerActive(false);
        } else {
            // All done
            onComplete();
        }
    }, [activeSet?.id]);

    useEffect(() => {
        if (!timerActive || timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleMarkComplete(activeSet.id);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [timerActive, timeLeft, activeSet]);

    const handleMarkComplete = (setId: string) => {
        onUpdateSet(setId, { status: 'completed' });
    };

    const handleStartTimer = () => {
        setTimerActive(true);
    };

    if (!activeSet) {
        return <div className="p-4 text-center text-white">Warmup Complete!</div>;
    }

    const totalTimeRemaining = sets
        .filter(s => s.status === 'pending')
        .reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Warmup</h2>
                <div className="text-slate-400 text-sm">
                    {formatTime(totalTimeRemaining)} remaining
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="text-center relative group">
                    <h3 className="text-3xl font-bold mb-2">{activeSet.exerciseName}</h3>
                    <p className="text-slate-400 cursor-help underline decoration-dotted">Why this step?</p>

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 rounded-lg text-sm text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-10">
                        Preparing your body for the specific demands of today's session to improve performance and reduce injury risk.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                    </div>
                </div>

                <div className="text-8xl font-mono font-bold text-blue-400">
                    {formatTime(timeLeft)}
                </div>

                <div className="flex gap-4 w-full max-w-xs">
                    {!timerActive ? (
                        <button
                            onClick={handleStartTimer}
                            className="flex-1 py-4 bg-blue-600 rounded-xl font-bold text-lg active:bg-blue-700 transition-colors"
                        >
                            Start
                        </button>
                    ) : (
                        <button
                            onClick={() => setTimerActive(false)}
                            className="flex-1 py-4 bg-slate-700 rounded-xl font-bold text-lg active:bg-slate-600 transition-colors"
                        >
                            Pause
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (confirm('Skipping warmup steps may reduce performance. Are you sure?')) {
                                handleMarkComplete(activeSet.id);
                            }
                        }}
                        className="flex-1 py-4 bg-slate-800 rounded-xl font-bold text-lg active:bg-slate-700 transition-colors"
                    >
                        Skip
                    </button>
                    <button
                        onClick={() => onSwap(activeSet.id, 'alternative-id')}
                        className="flex-1 py-4 bg-slate-800 rounded-xl font-bold text-lg active:bg-slate-700 transition-colors"
                    >
                        Swap
                    </button>
                </div>
            </div>

            <div className="mt-8">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Up Next</h4>
                <div className="space-y-2">
                    {sets.slice(activeSetIndex + 1).map(set => (
                        <div key={set.id} className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                            <span className="font-medium">{set.exerciseName}</span>
                            <span className="text-slate-400 text-sm">{set.durationSeconds}s</span>
                        </div>
                    ))}
                    {sets.slice(activeSetIndex + 1).length === 0 && (
                        <p className="text-slate-600 text-sm italic">Main workout starting soon...</p>
                    )}
                </div>
            </div>
        </div>
    );
};
