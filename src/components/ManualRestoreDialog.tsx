import React, { useState, useEffect } from 'react';
import { useManualRestore } from '../hooks/useManualRestore';
import type { BackupMetadata } from '../services/restoreService';
import type { AppState } from '../state/types';

interface ManualRestoreDialogProps {
  isOpen: boolean;
  onRestore: (restoredData: AppState) => void;
  onCancel: () => void;
  currentPortfolioData?: AppState;
}

interface BackupPreview {
  portfolioCount: number;
  holdingsCount: number;
  totalValue: number;
  currency: string;
  portfolios: Array<{
    name: string;
    holdingsCount: number;
    type: string;
  }>;
  lastModified: string;
}

const ManualRestoreDialog: React.FC<ManualRestoreDialogProps> = ({
  isOpen,
  onRestore,
  onCancel,
  currentPortfolioData,
}) => {
  const { restoreFromBackup, getAvailableBackups, isRestoring, restoreError, clearError } = useManualRestore();
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(null);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [backupsError, setBackupsError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadBackups();
      clearError();
    }
  }, [isOpen, clearError]);

  const loadBackups = async () => {
    try {
      setIsLoadingBackups(true);
      setBackupsError(null);
      const availableBackups = await getAvailableBackups();
      setBackups(availableBackups);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load backups';
      setBackupsError(errorMessage);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const generatePreview = async (backup: BackupMetadata) => {
    try {
      setIsLoadingPreview(true);
      
      // For now, generate preview from metadata
      // In a full implementation, we might fetch the actual backup content
      const preview: BackupPreview = {
        portfolioCount: backup.portfolioCount,
        holdingsCount: backup.holdingsCount,
        totalValue: 0, // Would need to calculate from actual data
        currency: 'GBP', // Default, would need to read from backup
        portfolios: [], // Would need to read from actual backup data
        lastModified: backup.timestamp,
      };
      
      setPreview(preview);
    } catch (error) {
      console.error('Failed to generate preview:', error);
      setPreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleBackupSelect = (backup: BackupMetadata) => {
    setSelectedBackup(backup);
    generatePreview(backup);
    setShowConfirmation(false);
  };

  const handleRestoreConfirm = () => {
    setShowConfirmation(true);
  };

  const handleRestoreExecute = async () => {
    if (!selectedBackup) return;

    try {
      const result = await restoreFromBackup(selectedBackup.filePath);
      
      if (result.success && result.restoredData) {
        onRestore(result.restoredData);
      }
      // Error handling is managed by the hook
    } catch (error) {
      // Error handling is managed by the hook
      console.error('Restore execution failed:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      // Parse the timestamp format from backup files: 2025-09-23T21-24-33-089Z
      const cleanTimestamp = timestamp.replace(/-(\d{2})-(\d{2})-(\d{3})Z$/, ':$1:$2.$3Z');
      const date = new Date(cleanTimestamp);
      
      if (isNaN(date.getTime())) {
        // Fallback: try parsing as ISO string directly
        const fallbackDate = new Date(timestamp);
        if (isNaN(fallbackDate.getTime())) {
          return timestamp;
        }
        return fallbackDate.toLocaleString();
      }
      
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    try {
      const cleanTimestamp = timestamp.replace(/-(\d{2})-(\d{2})-(\d{3})Z$/, ':$1:$2.$3Z');
      const date = new Date(cleanTimestamp);
      
      if (isNaN(date.getTime())) {
        return 'Unknown time';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) {
        return 'Just now';
      } else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
      } else {
        return `${diffDays} days ago`;
      }
    } catch {
      return 'Unknown time';
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Manual Restore from Backup</h2>
          <button
            onClick={onCancel}
            disabled={isRestoring}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Backup List */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Available Backups</h3>
              <p className="text-sm text-gray-600 mt-1">
                Select a backup file to restore from
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingBackups ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading backups...</div>
                </div>
              ) : backupsError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-red-700 text-sm">
                    <strong>Error:</strong> {backupsError}
                  </div>
                  <button
                    onClick={loadBackups}
                    className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
                  >
                    Retry
                  </button>
                </div>
              ) : backups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📁</div>
                  <div className="font-medium">No Backup Files Found</div>
                  <div className="text-sm mt-1">No backup files are available for restoration.</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {backups.map((backup) => (
                    <div
                      key={backup.filePath}
                      onClick={() => handleBackupSelect(backup)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedBackup?.filePath === backup.filePath
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-900">
                        {formatTimestamp(backup.timestamp)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {backup.portfolioCount} portfolio{backup.portfolioCount === 1 ? '' : 's'} • {' '}
                        {backup.holdingsCount} holding{backup.holdingsCount === 1 ? '' : 's'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatRelativeTime(backup.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preview and Actions */}
          <div className="w-1/2 flex flex-col">
            {selectedBackup ? (
              <>
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">Backup Preview</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Review the backup contents before restoring
                  </p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {isLoadingPreview ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-gray-500">Loading preview...</div>
                    </div>
                  ) : preview ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Portfolios
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            {preview.portfolioCount}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Total Holdings
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            {preview.holdingsCount}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          File Path
                        </div>
                        <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                          {selectedBackup.filePath}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Created
                        </div>
                        <div className="text-sm text-gray-900">
                          {formatTimestamp(selectedBackup.timestamp)}
                        </div>
                      </div>

                      {showConfirmation && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800">
                                Confirm Restore Operation
                              </h3>
                              <div className="mt-2 text-sm text-yellow-700">
                                <p>
                                  This will replace your current portfolio data with the selected backup. 
                                  A backup of your current state will be created automatically before restoration.
                                </p>
                                {currentPortfolioData && (
                                  <p className="mt-2">
                                    <strong>Current data:</strong> {currentPortfolioData.portfolios.length} portfolio{currentPortfolioData.portfolios.length === 1 ? '' : 's'}, {' '}
                                    {currentPortfolioData.portfolios.reduce((sum, p) => sum + p.holdings.length, 0)} holding{currentPortfolioData.portfolios.reduce((sum, p) => sum + p.holdings.length, 0) === 1 ? '' : 's'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-sm">Unable to generate preview</div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-4">👈</div>
                  <div className="font-medium">Select a Backup</div>
                  <div className="text-sm mt-1">Choose a backup file from the list to see its preview</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          {restoreError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="text-red-700 text-sm">
                <strong>Restore Error:</strong> {restoreError}
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              disabled={isRestoring}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            
            {selectedBackup && !showConfirmation && (
              <button
                onClick={handleRestoreConfirm}
                disabled={isRestoring}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Restore from This Backup
              </button>
            )}
            
            {selectedBackup && showConfirmation && (
              <button
                onClick={handleRestoreExecute}
                disabled={isRestoring}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRestoring ? 'Restoring...' : 'Confirm Restore'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualRestoreDialog;