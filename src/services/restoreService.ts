import type { AppState } from '../state/types';

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
  message?: string;
}

export interface RestoreValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Service for handling portfolio data restoration from backup files.
 * Provides data validation, error handling, and automatic restore functionality.
 */
export class RestoreService {
  /**
   * Validates backup data structure and content
   */
  static validateBackupData(data: any): RestoreValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    if (!data || typeof data !== 'object') {
      errors.push('Backup data is not a valid object');
      return { isValid: false, errors, warnings };
    }

    // Check for required top-level properties
    if (!Array.isArray(data.portfolios)) {
      errors.push('Backup data missing portfolios array');
    } else {
      // Validate portfolios structure
      data.portfolios.forEach((portfolio: any, index: number) => {
        if (!portfolio || typeof portfolio !== 'object') {
          errors.push(`Portfolio ${index} is not a valid object`);
          return;
        }

        if (!portfolio.id || typeof portfolio.id !== 'string') {
          errors.push(`Portfolio ${index} missing valid id`);
        }

        if (!portfolio.name || typeof portfolio.name !== 'string') {
          errors.push(`Portfolio ${index} missing valid name`);
        }

        if (!Array.isArray(portfolio.holdings)) {
          errors.push(`Portfolio ${index} missing holdings array`);
        } else {
          // Validate holdings structure
          portfolio.holdings.forEach((holding: any, holdingIndex: number) => {
            if (!holding || typeof holding !== 'object') {
              warnings.push(`Portfolio ${index}, holding ${holdingIndex} is not a valid object`);
              return;
            }

            if (!holding.id || typeof holding.id !== 'string') {
              warnings.push(`Portfolio ${index}, holding ${holdingIndex} missing valid id`);
            }

            if (typeof holding.price !== 'number' || holding.price < 0) {
              warnings.push(`Portfolio ${index}, holding ${holdingIndex} has invalid price`);
            }

            if (typeof holding.qty !== 'number' || holding.qty < 0) {
              warnings.push(`Portfolio ${index}, holding ${holdingIndex} has invalid quantity`);
            }
          });
        }

        if (!portfolio.settings || typeof portfolio.settings !== 'object') {
          warnings.push(`Portfolio ${index} missing settings object`);
        }

        if (!portfolio.lists || typeof portfolio.lists !== 'object') {
          warnings.push(`Portfolio ${index} missing lists object`);
        }
      });
    }

    if (typeof data.activePortfolioId !== 'string') {
      warnings.push('Missing or invalid activePortfolioId');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Fetches available backup files from the server
   */
  static async getAvailableBackups(): Promise<BackupMetadata[]> {
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
        timestamp: backup.timestamp || '',
        filePath: backup.filePath || '',
        portfolioCount: backup.portfolioCount || 0,
        holdingsCount: backup.holdingsCount || 0,
      })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to fetch available backups:', error);
      throw error;
    }
  }

  /**
   * Restores portfolio data from a specific backup file
   */
  static async restoreFromBackup(filePath: string): Promise<RestoreResult> {
    try {
      if (!filePath || typeof filePath !== 'string') {
        return {
          success: false,
          error: 'Invalid file path provided',
        };
      }

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

      // Validate the restored data
      const validation = this.validateBackupData(result.data);
      if (!validation.isValid) {
        throw new Error(`Restored data validation failed: ${validation.errors.join(', ')}`);
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Restore completed with warnings:', validation.warnings);
      }

      return {
        success: true,
        restoredData: result.data as AppState,
        message: result.message || `Successfully restored from ${filePath}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown restore error';
      console.error('Restore failed:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Restores from the most recent backup file
   */
  static async restoreFromLatest(): Promise<RestoreResult> {
    try {
      const availableBackups = await this.getAvailableBackups();
      
      if (availableBackups.length === 0) {
        return {
          success: false,
          error: 'No backup files available for restoration',
        };
      }

      const latestBackup = availableBackups[0];
      console.log(`Attempting to restore from latest backup: ${latestBackup.filePath}`);
      
      return await this.restoreFromBackup(latestBackup.filePath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore from latest backup';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Checks if portfolio data appears to be empty and needs restoration
   */
  static isPortfolioEmpty(data: AppState): boolean {
    if (!data.portfolios || data.portfolios.length === 0) {
      return true;
    }

    // Check if all portfolios have no meaningful holdings (excluding cash buffer)
    const hasAnyHoldings = data.portfolios.some(portfolio => 
      portfolio.holdings && 
      portfolio.holdings.length > 0 && 
      portfolio.holdings.some(holding => 
        holding.assetType !== 'Cash' || holding.name !== 'Cash buffer'
      )
    );

    return !hasAnyHoldings;
  }

  /**
   * Performs automatic restore if portfolio is empty and backups are available
   */
  static async performAutoRestore(currentData: AppState): Promise<RestoreResult | null> {
    try {
      // Only attempt auto-restore if portfolio is empty
      if (!this.isPortfolioEmpty(currentData)) {
        return null;
      }

      console.log('Empty portfolio detected, checking for available backups...');
      
      const availableBackups = await this.getAvailableBackups();
      
      if (availableBackups.length === 0) {
        console.log('No backups available for auto-restore');
        return null;
      }

      console.log(`Found ${availableBackups.length} backup(s), attempting auto-restore from latest...`);
      
      const result = await this.restoreFromLatest();
      
      if (result.success) {
        console.log('Auto-restore completed successfully');
      } else {
        console.error('Auto-restore failed:', result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Auto-restore check failed';
      console.error('Auto-restore error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}