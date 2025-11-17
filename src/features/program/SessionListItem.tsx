import type { ProgramDay } from './types';

interface SessionListItemProps {
  day: ProgramDay;
  dayLabel: string;
  status: 'done' | 'today' | 'upcoming';
  onStart: () => void;
}

/**
 * SessionListItem - Compact session card for mobile program view
 */
export function SessionListItem({ day, dayLabel, status, onStart }: SessionListItemProps) {
  const focusLabels: Record<string, string> = {
    upper: 'Upper Body',
    lower: 'Lower Body',
    full: 'Full Body',
    conditioning: 'Conditioning',
    other: 'Training',
  };

  const sessionName = focusLabels[day.focus] || 'Training';
  const totalExercises = day.exercises.length;
  const totalSets = day.exercises.reduce((sum, ex) => sum + ex.sets, 0);

  const statusConfig = {
    done: {
      bgColor: 'bg-green-950',
      borderColor: 'border-green-800',
      textColor: 'text-green-400',
      label: '✓ Done',
    },
    today: {
      bgColor: 'bg-blue-950',
      borderColor: 'border-blue-600',
      textColor: 'text-blue-400',
      label: 'Today',
    },
    upcoming: {
      bgColor: 'bg-slate-900',
      borderColor: 'border-slate-800',
      textColor: 'text-slate-400',
      label: 'Upcoming',
    },
  };

  const config = statusConfig[status];

  return (
    <button
      onClick={onStart}
      className={`w-full ${config.bgColor} border ${config.borderColor} rounded-lg p-4 text-left active:bg-slate-800 transition-colors`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Day label */}
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
            {dayLabel}
          </div>
          
          {/* Session name */}
          <h3 className="text-lg font-semibold text-white mb-1 truncate">
            {sessionName}
          </h3>
          
          {/* Meta info */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{totalExercises} exercises</span>
            <span>·</span>
            <span>{totalSets} sets</span>
          </div>
        </div>

        {/* Status badge + arrow */}
        <div className="flex flex-col items-end gap-2">
          <span className={`text-xs font-medium ${config.textColor}`}>
            {config.label}
          </span>
          <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
}
