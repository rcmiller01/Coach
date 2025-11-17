import React, { useState } from 'react';
import CameraPreview from '../../pose/CameraPreview';
import PoseDebugPanel from '../../pose/PoseDebugPanel';
import type { DerivedAngle } from '../../pose/poseTypes';

interface FormCheckSectionProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onVideoReady: (video: HTMLVideoElement) => void;
  onError: (error: string | null) => void;
  cameraError: string | null;
  liveAngles: DerivedAngle[];
  currentExerciseId?: string;
  currentExerciseName?: string;
  repCountingEnabled: boolean;
  currentRepCount: number;
  onToggleRepCounting: (enabled: boolean) => void;
  onApplyReps: (count: number) => void;
  onResetCounter: () => void;
  repPhase?: string;
}

/**
 * FormCheckSection - Collapsible camera and form check controls
 * Mobile-first design with toggle header
 */
const FormCheckSection: React.FC<FormCheckSectionProps> = ({
  isEnabled,
  onToggle,
  onVideoReady,
  onError,
  cameraError,
  liveAngles,
  currentExerciseId,
  currentExerciseName,
  repCountingEnabled,
  currentRepCount,
  onToggleRepCounting,
  onApplyReps,
  onResetCounter,
  repPhase,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800">
      {/* Header - Always visible */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-lg">📹</div>
          <div>
            <div className="text-sm font-semibold text-white">Form Check</div>
            <div className="text-xs text-slate-400">
              {isEnabled ? (isExpanded ? 'Camera active' : 'Tap to view') : 'Enable camera'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isEnabled && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 active:bg-slate-700"
            >
              {isExpanded ? 'Hide' : 'Show'}
            </button>
          )}
          <button
            onClick={() => {
              const newState = !isEnabled;
              onToggle(newState);
              if (!newState) {
                setIsExpanded(false);
              } else {
                setIsExpanded(true);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isEnabled
                ? 'bg-blue-600 text-white active:bg-blue-700'
                : 'bg-slate-700 text-slate-300 active:bg-slate-600'
            }`}
          >
            {isEnabled ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isEnabled && isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Camera preview */}
          <div className="aspect-[4/3] w-full rounded-lg overflow-hidden bg-slate-950">
            <CameraPreview 
              isActive={true}
              onError={onError}
              onVideoReady={onVideoReady}
            />
          </div>

          {cameraError && (
            <div className="bg-red-950 border border-red-800 rounded-lg p-3">
              <p className="text-xs text-red-300">{cameraError}</p>
            </div>
          )}

          {/* Rep counting controls */}
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-white">Auto Count Reps</div>
              <button
                onClick={() => onToggleRepCounting(!repCountingEnabled)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  repCountingEnabled
                    ? 'bg-green-600 text-white active:bg-green-700'
                    : 'bg-slate-700 text-slate-300 active:bg-slate-600'
                }`}
              >
                {repCountingEnabled ? 'Counting' : 'Start'}
              </button>
            </div>

            {repCountingEnabled && (
              <div className="space-y-2">
                <div className="bg-green-950 border border-green-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-green-400">{currentRepCount}</div>
                      <div className="text-xs text-green-300 mt-0.5">reps</div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => onApplyReps(currentRepCount)}
                        className="px-4 py-2 bg-green-600 active:bg-green-700 text-white text-xs font-medium rounded-lg"
                      >
                        Apply
                      </button>
                      <button
                        onClick={onResetCounter}
                        className="px-4 py-2 bg-slate-700 active:bg-slate-600 text-slate-300 text-xs font-medium rounded-lg"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                  {repPhase && (
                    <div className="mt-2 text-xs text-green-400">
                      Phase: <span className="font-medium">{repPhase}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pose debug panel */}
          {currentExerciseId && currentExerciseName && (
            <PoseDebugPanel
              exerciseId={currentExerciseId}
              exerciseName={currentExerciseName}
              angles={liveAngles}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default FormCheckSection;
