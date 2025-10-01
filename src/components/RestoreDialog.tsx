import React, { useState } from 'react';
import type { BackupMetadata, RestoreResult } from '../hooks/useRestoreDetection';

export interface RestoreDialogProps {
  isOpen: boolean;
  availableBackups: BackupMetadata[];
  onRestore: (filePath?: string) => Promise<RestoreResult>;
  onCancel: () => void;
  isRestoring?: boolean;
}

/**
 * Dialog component for confirming portfolio restoration from backup files.
 * Allows users to restore from the latest backup or select a specific backup file.
 */
export function RestoreDialog({ 
  isOpen, 
  availableBackups, 
  onRestore, 
  onCancel, 
  isRestoring = false 
}: RestoreDialogProps) {
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleRestoreLatest = async () => {
    setRestoreError(null);
    const result = await onRestore();
    
    if (!result.success) {
      setRestoreError(result.error || 'Restore failed');
    }
  };

  const handleRestoreSelected = async () => {
    if (!selectedBackup) {
      return;
    }

    setRestoreError(null);
    const result = await onRestore(selectedBackup);
    
    if (!result.success) {
      setRestoreError(result.error || 'Restore failed');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const latestBackup = availableBackups[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Restore Portfolio Data</h2>
        
        <p className="text-gray-600 mb-6">
          Your portfolio appears to be empty, but we found backup files. 
          Would you like to restore your data?
        </p>

        {restoreError && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-red-700 text-sm">{restoreError}</p>
          </div>
        )}

        {latestBackup && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Latest Backup</h3>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm">
                <strong>Date:</strong> {formatTimestamp(latestBackup.timestamp)}
              </p>
              <p className="text-sm">
                <strong>Portfolios:</strong> {latestBackup.portfolioCount}
              </p>
              <p className="text-sm">
                <strong>Holdings:</strong> {latestBackup.holdingsCount}
              </p>
            </div>
            <button
              onClick={handleRestoreLatest}
              disabled={isRestoring}
              className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRestoring ? 'Restoring...' : 'Restore Latest Backup'}
            </button>
          </div>
        )}

        {availableBackups.length > 1 && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Other Available Backups</h3>
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded">
              {availableBackups.slice(1).map((backup) => (
                <label
                  key={backup.filePath}
                  className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <input
                    type="radio"
                    name="backup"
                    value={backup.filePath}
                    checked={selectedBackup === backup.filePath}
                    onChange={(e) => setSelectedBackup(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {formatTimestamp(backup.timestamp)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {backup.portfolioCount} portfolios, {backup.holdingsCount} holdings
                    </p>
                  </div>
                </label>
              ))}
            </div>
            {selectedBackup && (
              <button
                onClick={handleRestoreSelected}
                disabled={isRestoring}
                className="mt-3 w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRestoring ? 'Restoring...' : 'Restore Selected Backup'}
              </button>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isRestoring}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}