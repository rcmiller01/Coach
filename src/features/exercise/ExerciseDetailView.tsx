import React from 'react';
import { exerciseDetails } from './exerciseDetails';

interface ExerciseDetailViewProps {
  exerciseId: string;
  onClose: () => void;
}

const ExerciseDetailView: React.FC<ExerciseDetailViewProps> = ({ exerciseId, onClose }) => {
  const detail = exerciseDetails[exerciseId];

  if (!detail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Exercise details not found</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleSubstitute = () => {
    // Placeholder for substitution logic
    console.log('Substitute exercise for:', exerciseId);
    alert('Exercise substitution feature coming soon!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onClose}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mb-3"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {detail.metadata.name}
          </h1>
          
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {detail.metadata.primaryMuscle}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {detail.metadata.equipment}
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
              {detail.metadata.movement}
            </span>
          </div>
        </div>

        {/* Video Embed */}
        {detail.videoUrl && (
          <div className="mb-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="aspect-video">
              <iframe
                src={detail.videoUrl}
                title={`${detail.metadata.name} demonstration`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Technique Cues */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Technique Cues</h2>
          <ul className="space-y-2">
            {detail.cues.map((cue, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span className="text-gray-700">{cue}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Common Mistakes */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Common Mistakes</h2>
          <ul className="space-y-2">
            {detail.commonMistakes.map((mistake, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-0.5">✗</span>
                <span className="text-gray-700">{mistake}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Range of Motion */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Range of Motion</h2>
          <div className="mb-3">
            <span className="text-sm font-medium text-gray-700">Key Joints: </span>
            <span className="text-sm text-gray-600">
              {detail.rom.joints.join(', ')}
            </span>
          </div>
          <p className="text-gray-700">{detail.rom.notes}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSubstitute}
            className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
          >
            Substitute Exercise
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetailView;
