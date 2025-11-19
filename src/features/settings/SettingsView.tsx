import React, { useState } from 'react';
import type { CoachSettings } from './settingsStorage';
import { ConfirmationModal } from './ConfirmationModal';
import ReminderSettingsSection from './ReminderSettingsSection';
import type { MealReminderSettings } from '../nutrition/nutritionTypes';
import {
  exportTrainingData,
  downloadBackup,
  copyBackupToClipboard,
  resetProgramData,
  getResetSummary,
} from './backupExport';
import { runDiagnostics, getDiagnosticsSummary } from './diagnostics';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import type { ProgramMultiWeek } from '../program/types';
import type { WorkoutHistoryEntry } from '../history/types';
import type { DietTargets } from '../nutrition/dietEngine';
import type { DailyFoodTotals } from '../nutrition/foodLog';

interface SettingsViewProps {
  settings: CoachSettings;
  onUpdateSettings: (settings: CoachSettings) => void;
  onResetProfile: () => void;
  onClearHistory: () => void;
  onDataReset?: () => void; // Callback to refresh app state after reset
  // Diagnostic data
  program?: ProgramMultiWeek | null;
  history?: WorkoutHistoryEntry[];
  dietTargets?: DietTargets | null;
  foodLog?: Record<string, DailyFoodTotals>;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetProfile,
  onClearHistory,
  onDataReset,
  program = null,
  history = [],
  dietTargets = null,
  foodLog = {},
}) => {
  const [showResetModal, setShowResetModal] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'copied' | 'downloaded'>('idle');
  const [showDevTools, setShowDevTools] = useState(false);
  const [showProgramJson, setShowProgramJson] = useState(false);
  const [showBlocksJson, setShowBlocksJson] = useState(false);
  const [devCopyStatus, setDevCopyStatus] = useState<'idle' | 'copied'>('idle');

  // Run diagnostics
  const diagnosticIssues = runDiagnostics(program, history, dietTargets, foodLog);
  const diagnosticSummary = getDiagnosticsSummary(program, history, foodLog);

  const handleToggleFormCheck = () => {
    onUpdateSettings({
      ...settings,
      defaultFormCheckEnabled: !settings.defaultFormCheckEnabled,
    });
  };

  const handleUpdateMealReminders = (mealReminders: MealReminderSettings) => {
    onUpdateSettings({
      ...settings,
      mealReminders,
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

  const handleExportDownload = () => {
    downloadBackup();
    setExportStatus('downloaded');
    setTimeout(() => setExportStatus('idle'), 3000);
  };

  const handleExportCopy = async () => {
    const success = await copyBackupToClipboard();
    if (success) {
      setExportStatus('copied');
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  };

  const handleResetProgram = () => {
    resetProgramData();
    setShowResetModal(false);
    // Notify parent to refresh app state
    onDataReset?.();
    // Force page reload to clear all state
    window.location.reload();
  };

  const handleCopyProgramJson = async () => {
    if (!program) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(program, null, 2));
      setDevCopyStatus('copied');
      setTimeout(() => setDevCopyStatus('idle'), 2000);
    } catch {
      // Silent fail
    }
  };

  const handleCopyCurrentWeekJson = async () => {
    if (!program) return;
    const currentWeek = program.weeks[program.currentWeekIndex];
    try {
      await navigator.clipboard.writeText(JSON.stringify(currentWeek, null, 2));
      setDevCopyStatus('copied');
      setTimeout(() => setDevCopyStatus('idle'), 2000);
    } catch {
      // Silent fail
    }
  };

  const handleCopyCurrentBlockJson = async () => {
    if (!program || !program.blocks) return;
    const currentBlock = program.blocks.find(
      block => 
        program.currentWeekIndex >= block.startWeekIndex &&
        (block.endWeekIndex === null || program.currentWeekIndex <= block.endWeekIndex)
    );
    try {
      await navigator.clipboard.writeText(JSON.stringify(currentBlock, null, 2));
      setDevCopyStatus('copied');
      setTimeout(() => setDevCopyStatus('idle'), 2000);
    } catch {
      // Silent fail
    }
  };

  const resetSummary = getResetSummary();

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

        {/* Meal Reminders */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-4">
          <ReminderSettingsSection
            settings={settings.mealReminders || { timesPerDay: 0 }}
            onChange={handleUpdateMealReminders}
          />
        </div>

        {/* Developer Diagnostics */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-4">
          <DiagnosticsPanel issues={diagnosticIssues} summary={diagnosticSummary} />
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Backup & Export
          </h2>
          
          <div className="space-y-4">
            {/* Export Training Data */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex gap-2 mb-2">
                <button
                  onClick={handleExportDownload}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  📥 Download Backup
                </button>
                <button
                  onClick={handleExportCopy}
                  className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition-colors"
                >
                  📋 Copy to Clipboard
                </button>
              </div>
              {exportStatus === 'downloaded' && (
                <p className="text-sm text-green-600 font-medium">
                  ✓ Backup downloaded successfully!
                </p>
              )}
              {exportStatus === 'copied' && (
                <p className="text-sm text-green-600 font-medium">
                  ✓ Backup copied to clipboard!
                </p>
              )}
              <p className="text-sm text-gray-600 mt-2">
                Export all training data (program, history, diet, food log) to a JSON file.
                Keep this safe as a backup before resetting or when migrating devices.
              </p>
            </div>

            {/* Reset Program Data */}
            <div className="border-b border-gray-200 pb-4">
              <button
                onClick={() => setShowResetModal(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
              >
                🔄 Reset Program Data
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Clear program, history, and food log while keeping your onboarding profile.
                You can quickly regenerate a new program from your saved profile.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Current data: {resetSummary.programWeeks} weeks, {resetSummary.historyEntries} workouts, {resetSummary.foodLogDays} days of food logs
              </p>
            </div>

            {/* Clear History (existing) */}
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

            {/* Reset Profile (existing) */}
            <div>
              <button
                onClick={handleResetProfileClick}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Reset Everything
              </button>
              <p className="text-sm text-red-600 mt-2">
                ⚠️ Warning: Complete reset. You will need to redo onboarding from scratch.
              </p>
            </div>
          </div>
        </div>

        {/* Developer Tools */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Developer Tools
            </h2>
            <button
              onClick={() => setShowDevTools(!showDevTools)}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded transition-colors"
            >
              {showDevTools ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showDevTools && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Advanced tools for inspecting raw program state and debugging issues.
              </p>

              {/* Quick copy buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={handleCopyCurrentWeekJson}
                  disabled={!program}
                  className="px-3 py-2 bg-purple-100 hover:bg-purple-200 disabled:bg-gray-100 disabled:text-gray-400 text-purple-700 text-sm font-medium rounded-lg transition-colors"
                >
                  📋 Copy Current Week JSON
                </button>
                <button
                  onClick={handleCopyCurrentBlockJson}
                  disabled={!program}
                  className="px-3 py-2 bg-purple-100 hover:bg-purple-200 disabled:bg-gray-100 disabled:text-gray-400 text-purple-700 text-sm font-medium rounded-lg transition-colors"
                >
                  📋 Copy Current Block JSON
                </button>
                <button
                  onClick={handleCopyProgramJson}
                  disabled={!program}
                  className="px-3 py-2 bg-purple-100 hover:bg-purple-200 disabled:bg-gray-100 disabled:text-gray-400 text-purple-700 text-sm font-medium rounded-lg transition-colors"
                >
                  📋 Copy Full Program JSON
                </button>
              </div>

              {devCopyStatus === 'copied' && (
                <p className="text-sm text-green-600 font-medium mb-4">
                  ✓ Copied to clipboard!
                </p>
              )}

              {/* Current Week JSON Inspector */}
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowProgramJson(!showProgramJson)}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-left font-medium text-gray-900 transition-colors flex items-center justify-between"
                >
                  <span>Current Week + Block Structure</span>
                  <span>{showProgramJson ? '▼' : '▶'}</span>
                </button>
                {showProgramJson && program && (
                  <div className="p-4 bg-gray-50 max-h-96 overflow-auto">
                    <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap">
                      {JSON.stringify({
                        currentWeekIndex: program.currentWeekIndex,
                        currentWeek: program.weeks[program.currentWeekIndex],
                        totalWeeks: program.weeks.length,
                        currentBlock: program.blocks?.find(
                          block => 
                            program.currentWeekIndex >= block.startWeekIndex &&
                            (block.endWeekIndex === null || program.currentWeekIndex <= block.endWeekIndex)
                        ),
                      }, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* All Blocks JSON Inspector */}
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowBlocksJson(!showBlocksJson)}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-left font-medium text-gray-900 transition-colors flex items-center justify-between"
                >
                  <span>All Training Blocks</span>
                  <span>{showBlocksJson ? '▼' : '▶'}</span>
                </button>
                {showBlocksJson && program && (
                  <div className="p-4 bg-gray-50 max-h-96 overflow-auto">
                    <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap">
                      {JSON.stringify(program.blocks || [], null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* localStorage Keys */}
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  localStorage Keys
                </h4>
                <ul className="text-xs text-gray-600 space-y-1 font-mono">
                  <li>• coach-profile (OnboardingState)</li>
                  <li>• coach-multi-week-program (ProgramMultiWeek)</li>
                  <li>• ai_coach_workout_history (WorkoutHistoryEntry[])</li>
                  <li>• coach-diet-targets (DietTargets)</li>
                  <li>• ai_coach_food_log_v1 (DailyFoodTotals map)</li>
                  <li>• coach-settings (CoachSettings)</li>
                </ul>
                <p className="text-xs text-gray-500 mt-3">
                  💡 Use browser DevTools → Application → localStorage to inspect directly
                </p>
              </div>
            </div>
          )}
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

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResetModal}
        title="Reset Program Data?"
        message={
          <div className="space-y-2">
            <p>This will permanently delete:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>{resetSummary.programWeeks} weeks of training program</li>
              <li>{resetSummary.historyEntries} workout history entries</li>
              <li>{resetSummary.foodLogDays} days of food logs</li>
              {resetSummary.hasDietTargets && <li>Current diet targets</li>}
            </ul>
            <p className="font-medium mt-3">Your onboarding profile will be preserved.</p>
            <p className="text-sm text-gray-600">
              💡 Tip: Export a backup first to save your data!
            </p>
          </div>
        }
        confirmLabel="Reset Program"
        cancelLabel="Cancel"
        isDangerous={true}
        onConfirm={handleResetProgram}
        onCancel={() => setShowResetModal(false)}
      />
    </div>
  );
};

export default SettingsView;
