import { useState, useCallback } from 'react';
import { RestoreService, type BackupMetadata, type RestoreResult } from '../services/restoreService';
import type { AppState } from '../state/types';

export interface ManualRestoreResult extends RestoreResult {
  preRestoreBackupCreated?: boolean;
}

export interface UseManualRestoreReturn {
  restoreFromBackup: (filePath: string) => Promise<ManualRestoreResult>;
  getAvailableBackups: () => Promise<BackupMetadata[]>;
  isRestoring: boolean;
  restoreError: string | null;
  clearError: () => void;
}

/**
 * Hook for manual restore operations from specific backup files.
 * Provides restore functionality with pre-restore backup creation and validation.
 */
export function useManualRestore(): UseManualRestoreReturn {
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const restoreFromBackup = useCallback(async (filePath: string): Promise<ManualRestoreResult> => {
    if (!filePath || typeof filePath !== 'string') {
      const error = 'Invalid file path provided';
      setRestoreError(error);
      return {
        success: false,
        error,
      };
    }

    setIsRestoring(true);
    setRestoreError(null);

    try {
      // The vite plugin automatically creates pre-restore backups,
      // so we just need to call the restore service
      const result = await RestoreService.restoreFromBackup(filePath);
      
      if (!result.success) {
        setRestoreError(result.error || 'Restore operation failed');
        return {
          ...result,
          preRestoreBackupCreated: false,
        };
      }

      return {
        ...result,
        preRestoreBackupCreated: true, // The vite plugin handles this
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown restore error';
      setRestoreError(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        preRestoreBackupCreated: false,
      };
    } finally {
      setIsRestoring(false);
    }
  }, []);

  const getAvailableBackups = useCallback(async (): Promise<BackupMetadata[]> => {
    try {
      setRestoreError(null);
      return await RestoreService.getAvailableBackups();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch backups';
      setRestoreError(errorMessage);
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setRestoreError(null);
  }, []);

  return {
    restoreFromBackup,
    getAvailableBackups,
    isRestoring,
    restoreError,
    clearError,
  };
}