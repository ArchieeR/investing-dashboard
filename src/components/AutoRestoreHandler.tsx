import React, { useState } from 'react';
import { useAutoRestore } from '../hooks/useAutoRestore';
import type { AppState } from '../state/types';

export interface AutoRestoreHandlerProps {
  portfolioData: AppState;
  onRestoreComplete: (restoredData: AppState) => void;
  showNotifications?: boolean;
}

/**
 * Component that handles automatic restore functionality with user feedback.
 * Provides notifications and error handling for restore operations.
 */
export function AutoRestoreHandler({ 
  portfolioData, 
  onRestoreComplete, 
  showNotifications = true 
}: AutoRestoreHandlerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  
  const {
    isCheckingRestore,
    restoreResult,
    availableBackups,
    performRestore,
    clearRestoreResult,
    checkError,
  } = useAutoRestore(portfolioData, onRestoreComplete);

  const handleDismiss = () => {
    setIsDismissed(true);
    clearRestoreResult();
  };

  const handleRetry = async () => {
    setIsDismissed(false);
    await performRestore();
  };

  // Don't show notifications if disabled or dismissed
  if (!showNotifications || isDismissed) {
    return null;
  }

  // Show loading state while checking for restore
  if (isCheckingRestore) {
    return (
      <div className="fixed top-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg z-50 max-w-sm">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
          <div>
            <p className="text-blue-700 text-sm font-medium">Checking for backups...</p>
            <p className="text-blue-600 text-xs mt-1">Looking for portfolio data to restore</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if restore check failed
  if (checkError && !restoreResult) {
    return (
      <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50 max-w-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-red-700 text-sm font-medium">Backup Check Failed</p>
            <p className="text-red-600 text-xs mt-1">{checkError}</p>
            <button
              onClick={handleRetry}
              className="mt-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
            >
              Retry
            </button>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-2 text-red-400 hover:text-red-600 text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  // Show success message after successful restore
  if (restoreResult?.success) {
    return (
      <div className="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50 max-w-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <div className="text-green-600 mr-3 mt-0.5">✓</div>
            <div>
              <p className="text-green-700 text-sm font-medium">Portfolio Restored</p>
              <p className="text-green-600 text-xs mt-1">
                {restoreResult.message || 'Your portfolio data has been restored successfully'}
              </p>
              {availableBackups.length > 0 && (
                <p className="text-green-600 text-xs mt-1">
                  Restored {availableBackups[0]?.portfolioCount || 0} portfolios with{' '}
                  {availableBackups[0]?.holdingsCount || 0} holdings
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-2 text-green-400 hover:text-green-600 text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  // Show error message after failed restore
  if (restoreResult?.error) {
    return (
      <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50 max-w-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-red-700 text-sm font-medium">Restore Failed</p>
            <p className="text-red-600 text-xs mt-1">{restoreResult.error}</p>
            <div className="mt-2 space-x-2">
              <button
                onClick={handleRetry}
                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
              >
                Retry
              </button>
              {availableBackups.length > 1 && (
                <button
                  onClick={() => {
                    // Could trigger manual backup selection dialog here
                    console.log('Manual backup selection not implemented yet');
                  }}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                >
                  Choose Backup
                </button>
              )}
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-2 text-red-400 hover:text-red-600 text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  // No notification needed
  return null;
}