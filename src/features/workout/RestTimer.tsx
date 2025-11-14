import React, { useState, useEffect, useRef } from 'react';

interface RestTimerProps {
  durationSeconds: number;
  isActive: boolean;
  onComplete?: () => void;
  onCancel?: () => void;
}

const RestTimer: React.FC<RestTimerProps> = ({
  durationSeconds,
  isActive,
  onComplete,
  onCancel,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(durationSeconds);
  const timerRef = useRef<number | null>(null);
  const hasCompletedRef = useRef(false);

  // Reset timer when isActive becomes true
  useEffect(() => {
    if (isActive) {
      setSecondsRemaining(durationSeconds);
      hasCompletedRef.current = false;
    }
  }, [isActive, durationSeconds]);

  // Countdown logic
  useEffect(() => {
    if (!isActive) {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Timer reached 0
          if (timerRef.current !== null) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          if (!hasCompletedRef.current && onComplete) {
            hasCompletedRef.current = true;
            onComplete();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, onComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancel = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (onCancel) {
      onCancel();
    }
  };

  if (!isActive) {
    return null;
  }

  const isComplete = secondsRemaining === 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700 mb-1">
            {isComplete ? 'Rest complete!' : 'Rest timer'}
          </p>
          <p className={`text-3xl font-bold ${isComplete ? 'text-green-600' : 'text-blue-600'}`}>
            {formatTime(secondsRemaining)}
          </p>
        </div>
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          {isComplete ? 'Continue' : 'Start next set'}
        </button>
      </div>
    </div>
  );
};

export default RestTimer;
