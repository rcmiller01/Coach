import React from 'react';
import type { CoachSettings } from './settingsStorage';

interface SettingsViewProps {
  settings: CoachSettings;
  onUpdateSettings: (settings: CoachSettings) => void;
  onResetProfile: () => void;
  onClearHistory: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetProfile,
  onClearHistory,
}) => {
  const handleToggleFormCheck = () => {
    onUpdateSettings({
      ...settings,
      defaultFormCheckEnabled: !settings.defaultFormCheckEnabled,
    });
  };

  const handleResetProfileClick = () => {
    if (window.confirm('Are you sure you want to reset your profile? You will need to redo onboarding.')) {
      onResetProfile();
    }
  };

  const handleClearHistoryClick = () => {
    if (window.confirm('Are you sure you want to clear all workout history?')) {
      onClearHistory();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
          Settings
        </h1>

        {/* Form Check Preference */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Form Check Preferences
          </h2>
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="formCheckEnabled"
                checked={settings.defaultFormCheckEnabled}
                onChange={handleToggleFormCheck}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="formCheckEnabled" className="font-medium text-gray-900 cursor-pointer">
                Enable Form Check (camera + pose) by default
              </label>
              <p className="text-sm text-gray-600 mt-1">
                When enabled, the camera and pose detection will automatically start during workouts.
                You can still toggle it on/off during each session.
              </p>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Data Management
          </h2>
          
          <div className="space-y-4">
            {/* Clear History */}
            <div className="border-b border-gray-200 pb-4">
              <button
                onClick={handleClearHistoryClick}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors"
              >
                Clear Workout History
              </button>
              <p className="text-sm text-gray-600 mt-2">
                This only removes past workout logs. Your profile and current program will remain unchanged.
              </p>
            </div>

            {/* Reset Profile */}
            <div>
              <button
                onClick={handleResetProfileClick}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Reset Profile and Program
              </button>
              <p className="text-sm text-red-600 mt-2">
                ⚠️ Warning: You will need to redo onboarding. This will clear your profile, program, and preferences.
              </p>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            About
          </h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">App:</span> AI Workout Coach</p>
            <p><span className="font-medium">Version:</span> 1.0.0</p>
            <p><span className="font-medium">Storage:</span> All data stored locally in your browser</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
