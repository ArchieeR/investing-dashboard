import { useState, useEffect, useCallback } from 'react';
import { RestoreService, type RestoreResult, type BackupMetadata } from '../services/restoreService';
import type { AppState } from '../state/types';

export interface UseAutoRestoreReturn {
  isCheckingRestore: boolean;
  restoreResult: RestoreResult | null;
  availableBackups: BackupMetadata[];
  performRestore: (filePath?: string) => Promise<RestoreResult>;
  clearRestoreResult: () => void;
  checkError: string | null;
}

/**
 * Hook that handles automatic restore functionality with UI integration.
 * Checks for empty portfolio data and provides restoration capabilities.
 */
export function useAutoRestore(
  portfolioData: AppState,
  onRestoreComplete?: (restoredData: AppState) => void
): UseAutoRestoreReturn {
  const [isCheckingRestore, setIsCheckingRestore] = useState(false);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const [availableBackups, setAvailableBackups] = useState<BackupMetadata[]>([]);
  const [checkError, setCheckError] = useState<string | null>(null);

  /**
   * Performs restore operation from specific backup or latest
   */
  const performRestore = useCallback(async (filePath?: string): Promise<RestoreResult> => {
    setIsCheckingRestore(true);
    setCheckError(null);

    try {
      const result = filePath 
        ? await RestoreService.restoreFromBackup(filePath)
        : await RestoreService.restoreFromLatest();

      setRestoreResult(result);

      if (result.success && result.restoredData && onRestoreComplete) {
        // Trigger UI refresh with restored data
        onRestoreComplete(result.restoredData);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Restore operation failed';
      const failureResult: RestoreResult = {
        success: false,
        error: errorMessage,
      };
      
      setRestoreResult(failureResult);
      setCheckError(errorMessage);
      
      return failureResult;
    } finally {
      setIsCheckingRestore(false);
    }
  }, [onRestoreComplete]);

  /**
   * Clears the current restore result
   */
  const clearRestoreResult = useCallback(() => {
    setRestoreResult(null);
    setCheckError(null);
  }, []);

  /**
   * Check for auto-restore conditions on portfolio data changes
   */
  useEffect(() => {
    const checkAutoRestore = async () => {
      setIsCheckingRestore(true);
      setCheckError(null);

      try {
        // Fetch available backups first
        const backups = await RestoreService.getAvailableBackups();
        setAvailableBackups(backups);

        // Only attempt auto-restore if portfolio is empty and we have backups
        if (RestoreService.isPortfolioEmpty(portfolioData) && backups.length > 0) {
          console.log('Auto-restore conditions met, performing automatic restoration...');
          
          const result = await RestoreService.performAutoRestore(portfolioData);
          
          if (result) {
            setRestoreResult(result);
            
            if (result.success && result.restoredData && onRestoreComplete) {
              // Trigger UI refresh with restored data
              onRestoreComplete(result.restoredData);
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to check for auto-restore';
        setCheckError(errorMessage);
        console.error('Auto-restore check failed:', errorMessage);
      } finally {
        setIsCheckingRestore(false);
      }
    };

    // Only run auto-restore check if we haven't already restored successfully
    if (!restoreResult?.success) {
      checkAutoRestore();
    }
  }, [portfolioData, onRestoreComplete, restoreResult?.success]);

  return {
    isCheckingRestore,
    restoreResult,
    availableBackups,
    performRestore,
    clearRestoreResult,
    checkError,
  };
}