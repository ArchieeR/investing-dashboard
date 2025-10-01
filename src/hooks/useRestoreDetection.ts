import { useState, useEffect, useCallback } from 'react';
import { ErrorHandlingService, type ErrorDetails, type RetryConfig } from '../services/errorHandlingService';
import type { AppState, Portfolio } from '../state/types';

export interface BackupMetadata {
  timestamp: string;
  filePath: string;
  portfolioCount: number;
  holdingsCount: number;
}

export interface RestoreResult {
  success: boolean;
  restoredData?: AppState;
  error?: string;
  errorDetails?: ErrorDetails;
  attemptCount?: number;
}

export interface UseRestoreDetectionReturn {
  shouldShowRestorePrompt: boolean;
  availableBackups: BackupMetadata[];
  isCheckingBackups: boolean;
  restoreFromLatest: (retryConfig?: Partial<RetryConfig>) => Promise<RestoreResult>;
  restoreFromBackup: (filePath: string, retryConfig?: Partial<RetryConfig>) => Promise<RestoreResult>;
  dismissRestorePrompt: () => void;
  checkError: string | null;
  errorDetails: ErrorDetails | null;
  retryLastRestore: () => Promise<RestoreResult>;
}

/**
 * Hook that detects when portfolio data is empty and offers restoration from available backups.
 * Checks for empty portfolio data on app load and provides restoration functionality.
 */
export function useRestoreDetection(portfolioData: AppState): UseRestoreDetectionReturn {
  const [shouldShowRestorePrompt, setShouldShowRestorePrompt] = useState(false);
  const [availableBackups, setAvailableBackups] = useState<BackupMetadata[]>([]);
  const [isCheckingBackups, setIsCheckingBackups] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [lastRestoreFilePath, setLastRestoreFilePath] = useState<string | null>(null);

  /**
   * Determines if the portfolio data is considered "empty" and needs restoration
   */
  const isPortfolioEmpty = useCallback((data: AppState): boolean => {
    if (!data.portfolios || data.portfolios.length === 0) {
      return true;
    }

    // Check if all portfolios have no holdings (excluding cash buffer)
    const hasAnyHoldings = data.portfolios.some(portfolio => 
      portfolio.holdings && 
      portfolio.holdings.length > 0 && 
      portfolio.holdings.some(holding => 
        holding.assetType !== 'Cash' || holding.name !== 'Cash buffer'
      )
    );

    return !hasAnyHoldings;
  }, []);

  /**
   * Fetches available backup files from the server
   */
  const fetchAvailableBackups = useCallback(async (): Promise<BackupMetadata[]> => {
    try {
      const response = await fetch('/api/portfolio/backups');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch backups: ${response.status} ${response.statusText}`);
      }

      const backups = await response.json();
      
      if (!Array.isArray(backups)) {
        throw new Error('Invalid backup list format');
      }

      return backups.map((backup: any) => ({
        timestamp: backup.timestamp || backup.filePath?.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/)?.[1] || '',
        filePath: backup.filePath || '',
        portfolioCount: backup.portfolioCount || 0,
        holdingsCount: backup.holdingsCount || 0,
      })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to fetch available backups:', error);
      throw error;
    }
  }, []);

  /**
   * Restores portfolio data from a specific backup file with retry logic
   */
  const restoreFromBackup = useCallback(async (
    filePath: string, 
    retryConfig?: Partial<RetryConfig>
  ): Promise<RestoreResult> => {
    setLastRestoreFilePath(filePath);
    setCheckError(null);
    setErrorDetails(null);

    const restoreOperation = async () => {
      const response = await fetch('/api/portfolio/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Restore failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Restore operation failed');
      }

      return result;
    };

    try {
      const retryResult = await ErrorHandlingService.withRetry(restoreOperation, retryConfig);
      
      if (retryResult.success) {
        return {
          success: true,
          restoredData: retryResult.data.data,
          attemptCount: retryResult.attemptCount,
        };
      } else {
        const errorDetails = retryResult.error!;
        setCheckError(errorDetails.userMessage);
        setErrorDetails(errorDetails);
        
        return {
          success: false,
          error: errorDetails.userMessage,
          errorDetails,
          attemptCount: retryResult.attemptCount,
        };
      }
    } catch (error) {
      const errorDetails = ErrorHandlingService.analyzeError(error);
      setCheckError(errorDetails.userMessage);
      setErrorDetails(errorDetails);
      
      return {
        success: false,
        error: errorDetails.userMessage,
        errorDetails,
        attemptCount: 1,
      };
    }
  }, []);

  /**
   * Restores from the most recent backup file with retry logic
   */
  const restoreFromLatest = useCallback(async (retryConfig?: Partial<RetryConfig>): Promise<RestoreResult> => {
    if (availableBackups.length === 0) {
      const errorDetails = ErrorHandlingService.analyzeError(new Error('No backup files available'));
      return {
        success: false,
        error: errorDetails.userMessage,
        errorDetails,
        attemptCount: 1,
      };
    }

    const latestBackup = availableBackups[0];
    return restoreFromBackup(latestBackup.filePath, retryConfig);
  }, [availableBackups, restoreFromBackup]);

  /**
   * Dismisses the restore prompt
   */
  const dismissRestorePrompt = useCallback(() => {
    setShouldShowRestorePrompt(false);
  }, []);

  /**
   * Retry the last restore operation
   */
  const retryLastRestore = useCallback(async (): Promise<RestoreResult> => {
    if (!lastRestoreFilePath) {
      return restoreFromLatest();
    }
    return restoreFromBackup(lastRestoreFilePath);
  }, [lastRestoreFilePath, restoreFromLatest, restoreFromBackup]);

  /**
   * Check for empty portfolio and available backups on mount and when portfolio data changes
   */
  useEffect(() => {
    const checkForRestore = async () => {
      setIsCheckingBackups(true);
      setCheckError(null);
      setErrorDetails(null);

      const checkOperation = async () => {
        // Only show restore prompt if portfolio is empty
        if (!isPortfolioEmpty(portfolioData)) {
          setShouldShowRestorePrompt(false);
          return { backups: [] };
        }

        // Fetch available backups
        const backups = await fetchAvailableBackups();
        return { backups };
      };

      try {
        const retryResult = await ErrorHandlingService.withRetry(checkOperation, {
          maxAttempts: 2,
          baseDelay: 1000,
        });

        if (retryResult.success) {
          const backups = retryResult.data!.backups;
          setAvailableBackups(backups);
          setShouldShowRestorePrompt(backups.length > 0);
        } else {
          const errorDetails = retryResult.error!;
          setCheckError(errorDetails.userMessage);
          setErrorDetails(errorDetails);
          setShouldShowRestorePrompt(false);
        }
      } catch (error) {
        const errorDetails = ErrorHandlingService.analyzeError(error);
        setCheckError(errorDetails.userMessage);
        setErrorDetails(errorDetails);
        setShouldShowRestorePrompt(false);
      } finally {
        setIsCheckingBackups(false);
      }
    };

    checkForRestore();
  }, [portfolioData, isPortfolioEmpty, fetchAvailableBackups]);

  return {
    shouldShowRestorePrompt,
    availableBackups,
    isCheckingBackups,
    restoreFromLatest,
    restoreFromBackup,
    dismissRestorePrompt,
    checkError,
    errorDetails,
    retryLastRestore,
  };
}