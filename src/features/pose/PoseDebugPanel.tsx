import React from 'react';
import type { DerivedAngle } from './poseTypes';
import { evaluateRomForExercise } from '../rom/romEvaluator';
import { getPoseCoachingCue } from '../workout/poseCoaching';

interface PoseDebugPanelProps {
  exerciseId: string;
  exerciseName: string;
  angles: DerivedAngle[];
}

const PoseDebugPanel: React.FC<PoseDebugPanelProps> = ({ exerciseId, exerciseName, angles }) => {
  // Evaluate ROM for this exercise using the provided angles
  const romResult = evaluateRomForExercise(exerciseId, angles);
  
  // Get pose-based coaching cues
  const coachingCue = getPoseCoachingCue(exerciseId, romResult, angles);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Form Check (beta)</h3>
        <p className="text-sm text-gray-600">{exerciseName}</p>
      </div>

      <div className="space-y-2 mb-4">
        {angles.length > 0 ? (
          angles.map((angle, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 capitalize">{angle.name.replace(/_/g, ' ')}</span>
              <span className="font-mono font-medium text-blue-600">{angle.valueDeg}°</span>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-500 italic">
            Detecting pose... Move into frame to see angles.
          </p>
        )}
      </div>

      {/* ROM Check Section */}
      <div className="pt-3 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">ROM Check</h4>
        {romResult === null ? (
          <p className="text-xs text-gray-500">
            No ROM profile available for this exercise yet.
          </p>
        ) : (
          <div className="space-y-2">
            {romResult.overallStatus === 'ok' ? (
              <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded p-2">
                <span className="text-green-600 font-bold">✓</span>
                <p className="text-xs text-green-800">
                  Angles appear within the recommended range for this rep.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded p-2">
                  <span className="text-yellow-600 font-bold">⚠</span>
                  <p className="text-xs text-yellow-800 font-medium">
                    Some angles are outside recommended ranges:
                  </p>
                </div>
                {romResult.angles
                  .filter((angle) => angle.status === 'warn')
                  .map((angle, index) => (
                    <div key={index} className="pl-2 border-l-2 border-yellow-300">
                      <p className="text-xs text-gray-700">
                        <span className="font-medium capitalize">
                          {angle.name.replace(/_/g, ' ')}:
                        </span>{' '}
                        {angle.message}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Coaching Cues Section */}
      <div className="pt-3 border-t border-gray-200 mt-3">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Coaching Cues</h4>
        {coachingCue.primary === null ? (
          <p className="text-xs text-gray-500">
            No specific cues yet. Focus on moving with control and comfort.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded p-2">
              <span className="text-blue-600">💡</span>
              <div className="flex-1">
                <p className="text-xs text-blue-900 font-medium">
                  {coachingCue.primary}
                </p>
                {coachingCue.secondary && (
                  <p className="text-xs text-blue-700 mt-1">
                    {coachingCue.secondary}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PoseDebugPanel;
