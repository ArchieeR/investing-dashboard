import React, { useState } from 'react';
import { useRestoreDetection, type RestoreResult } from '../hooks/useRestoreDetection';
import { RestoreDialog } from './RestoreDialog';
import type { AppState } from '../state/types';

export interface RestoreDetectorProps {
  portfolioData: AppState;
  onRestore?: (restoredData: AppState) => void;
}

/**
 * Component that automatically detects when portfolio data is empty and offers restoration.
 * Integrates restore detection logic with user interface for confirmation and selection.
 */
export function RestoreDetector({ portfolioData, onRestore }: RestoreDetectorProps) {
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  const {
    shouldShowRestorePrompt,
    availableBackups,
    isCheckingBackups,
    restoreFromLatest,
    restoreFromBackup,
    dismissRestorePrompt,
    checkError,
  } = useRestoreDetection(portfolioData);

  const handleRestore = async (filePath?: string): Promise<RestoreResult> => {
    setIsRestoring(true);
    setRestoreSuccess(false);

    try {
      const result = filePath 
        ? await restoreFromBackup(filePath)
        : await restoreFromLatest();

      if (result.success && result.restoredData) {
        setRestoreSuccess(true);
        dismissRestorePrompt();
        
        // Call the onRestore callback if provided
        if (onRestore) {
          onRestore(result.restoredData);
        }
      }

      return result;
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCancel = () => {
    dismissRestorePrompt();
  };

  // Show loading state while checking for backups
  if (isCheckingBackups) {
    return (
      <div className="fixed top-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg z-40">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-blue-700 text-sm">Checking for backups...</span>
        </div>
      </div>
    );
  }

  // Show error state if backup check failed
  if (checkError) {
    return (
      <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-700 text-sm font-medium">Backup Check Failed</p>
            <p className="text-red-600 text-xs mt-1">{checkError}</p>
          </div>
          <button
            onClick={dismissRestorePrompt}
            className="ml-4 text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  // Show success message after restore
  if (restoreSuccess) {
    return (
      <div className="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-40">
        <div className="flex items-center">
          <div className="text-green-600 mr-3">✓</div>
          <span className="text-green-700 text-sm">Portfolio data restored successfully!</span>
        </div>
      </div>
    );
  }

  return (
    <RestoreDialog
      isOpen={shouldShowRestorePrompt}
      availableBackups={availableBackups}
      onRestore={handleRestore}
      onCancel={handleCancel}
      isRestoring={isRestoring}
    />
  );
}