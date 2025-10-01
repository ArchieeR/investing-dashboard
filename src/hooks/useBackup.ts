import { useState, useCallback, useRef, useEffect } from 'react';
import { ErrorHandlingService, type ErrorDetails, type RetryConfig } from '../services/errorHandlingService';
import type { AppState } from '../state/types';

export interface BackupResult {
  success: boolean;
  timestamp: string;
  error?: string;
  errorDetails?: ErrorDetails;
  attemptCount?: number;
}

export interface UseBackupReturn {
  createBackup: (portfolioData: AppState, retryConfig?: Partial<RetryConfig>) => Promise<BackupResult>;
  isBackingUp: boolean;
  lastBackupTime: string | null;
  backupError: string | null;
  errorDetails: ErrorDetails | null;
  clearError: () => void;
  retryLastBackup: () => Promise<BackupResult>;
}

/**
 * Hook for manual backup operations that interfaces with the existing /api/portfolio/save endpoint.
 * Provides immediate backup triggering that bypasses the 60-second interval restriction.
 * Enhanced with comprehensive error handling and retry mechanisms.
 */
export function useBackup(): UseBackupReturn {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => {
    // Initialize from localStorage to share state across components
    try {
      return localStorage.getItem('lastBackupTime');
    } catch {
      return null;
    }
  });
  const [backupError, setBackupError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [lastPortfolioData, setLastPortfolioData] = useState<AppState | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Listen for localStorage changes to sync backup time across components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lastBackupTime' && e.newValue !== lastBackupTime) {
        setLastBackupTime(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [lastBackupTime]);

  const createBackup = useCallback(async (
    portfolioData: AppState, 
    retryConfig?: Partial<RetryConfig>
  ): Promise<BackupResult> => {
    // Store portfolio data for potential retry
    setLastPortfolioData(portfolioData);
    
    // Cancel any existing backup operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsBackingUp(true);
    setBackupError(null);
    setErrorDetails(null);

    const backupOperation = async () => {
      // Create new abort controller for this operation
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const response = await fetch('/api/portfolio/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state: portfolioData }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Backup failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Backup operation failed');
      }

      return result;
    };

    try {
      const retryResult = await ErrorHandlingService.withRetry(backupOperation, retryConfig);
      
      if (retryResult.success) {
        const timestamp = new Date().toISOString();
        setLastBackupTime(timestamp);
        // Save to localStorage to share across components
        try {
          localStorage.setItem('lastBackupTime', timestamp);
        } catch {
          // Ignore localStorage errors
        }
        
        return {
          success: true,
          timestamp,
          attemptCount: retryResult.attemptCount,
        };
      } else {
        // Handle retry failure
        const errorDetails = retryResult.error!;
        setBackupError(errorDetails.userMessage);
        setErrorDetails(errorDetails);
        
        return {
          success: false,
          timestamp: new Date().toISOString(),
          error: errorDetails.userMessage,
          errorDetails,
          attemptCount: retryResult.attemptCount,
        };
      }
    } catch (error) {
      // Handle unexpected errors (like AbortError)
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          timestamp: new Date().toISOString(),
          error: 'Backup cancelled',
        };
      }

      const errorDetails = ErrorHandlingService.analyzeError(error);
      setBackupError(errorDetails.userMessage);
      setErrorDetails(errorDetails);
      
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: errorDetails.userMessage,
        errorDetails,
        attemptCount: 1,
      };
    } finally {
      setIsBackingUp(false);
      abortControllerRef.current = null;
    }
  }, []);

  const clearError = useCallback(() => {
    setBackupError(null);
    setErrorDetails(null);
  }, []);

  const retryLastBackup = useCallback(async (): Promise<BackupResult> => {
    if (!lastPortfolioData) {
      const errorDetails = ErrorHandlingService.analyzeError(new Error('No previous backup data available for retry'));
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: errorDetails.userMessage,
        errorDetails,
        attemptCount: 1,
      };
    }

    return createBackup(lastPortfolioData);
  }, [lastPortfolioData, createBackup]);

  return {
    createBackup,
    isBackingUp,
    lastBackupTime,
    backupError,
    errorDetails,
    clearError,
    retryLastBackup,
  };
}