import { AppState, Portfolio } from '../state/types';

/**
 * Backup file metadata interface
 */
export interface BackupMetadata {
  timestamp: string;
  filePath: string;
  portfolioCount: number;
  holdingsCount: number;
  totalValue?: number;
  fileSize?: number;
  isValid: boolean;
  error?: string;
}

/**
 * Backup file structure interface
 */
export interface BackupFile {
  metadata?: {
    timestamp: string;
    version?: string;
    portfolioCount: number;
    totalHoldings: number;
  };
  data?: AppState;
  // Legacy format support - direct AppState
  portfolios?: Portfolio[];
  activePortfolioId?: string;
  playground?: any;
  filters?: any;
}

/**
 * Backup validation result interface
 */
export interface BackupValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: BackupMetadata;
}

/**
 * Backup cleanup configuration
 */
export interface BackupCleanupConfig {
  maxBackupFiles?: number;
  maxAgeInDays?: number;
  keepPatterns?: string[];
  dryRun?: boolean;
}

/**
 * Parse backup filename to extract timestamp
 */
export function parseBackupFilename(filename: string): { timestamp: string | null; type: string } {
  // Handle different backup filename patterns
  const patterns = [
    /portfolio-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.json$/,
    /portfolio-backup-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.json$/,
    /portfolio-recovery-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.json$/,
    /portfolio-migration-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.json$/,
    /portfolio-pre-restore-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.json$/,
  ];

  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match) {
      // Convert filename timestamp format to ISO format
      const rawTimestamp = match[1];
      const timestamp = rawTimestamp.replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/, 'T$1:$2:$3.$4Z');
      
      if (filename.includes('recovery')) return { timestamp, type: 'recovery' };
      if (filename.includes('migration')) return { timestamp, type: 'migration' };
      if (filename.includes('pre-restore')) return { timestamp, type: 'pre-restore' };
      if (filename.includes('backup')) return { timestamp, type: 'backup' };
      return { timestamp, type: 'auto' };
    }
  }

  return { timestamp: null, type: 'unknown' };
}

/**
 * Validate backup file data structure
 */
export function validateBackupData(data: any): BackupValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Backup data is not a valid object');
    return { isValid: false, errors, warnings };
  }

  // Check for required top-level properties
  if (!data.portfolios || !Array.isArray(data.portfolios)) {
    errors.push('Missing or invalid portfolios array');
  }

  if (typeof data.activePortfolioId !== 'string') {
    errors.push('Missing or invalid activePortfolioId');
  }

  // Validate portfolios structure
  if (data.portfolios && Array.isArray(data.portfolios)) {
    data.portfolios.forEach((portfolio: any, index: number) => {
      if (!portfolio || typeof portfolio !== 'object') {
        errors.push(`Portfolio at index ${index} is not a valid object`);
        return;
      }

      // Required portfolio fields
      const requiredFields = ['id', 'name', 'type', 'holdings', 'settings'];
      requiredFields.forEach(field => {
        if (!(field in portfolio)) {
          errors.push(`Portfolio at index ${index} missing required field: ${field}`);
        }
      });

      // Validate holdings array
      if (portfolio.holdings && !Array.isArray(portfolio.holdings)) {
        errors.push(`Portfolio at index ${index} has invalid holdings array`);
      }

      // Validate settings object
      if (portfolio.settings && typeof portfolio.settings !== 'object') {
        errors.push(`Portfolio at index ${index} has invalid settings object`);
      }
    });
  }

  // Check for playground state
  if (data.playground && typeof data.playground !== 'object') {
    warnings.push('Invalid playground state structure');
  }

  // Check for filters
  if (data.filters && typeof data.filters !== 'object') {
    warnings.push('Invalid filters structure');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Extract metadata from backup file data
 */
export function extractBackupMetadata(
  filename: string, 
  data: any, 
  fileSize?: number
): BackupMetadata {
  const { timestamp, type } = parseBackupFilename(filename);
  const validation = validateBackupData(data);
  
  let portfolioCount = 0;
  let holdingsCount = 0;
  let totalValue = 0;

  if (validation.isValid && data.portfolios) {
    portfolioCount = data.portfolios.length;
    holdingsCount = data.portfolios.reduce((sum: number, portfolio: any) => {
      return sum + (portfolio.holdings ? portfolio.holdings.length : 0);
    }, 0);

    // Calculate total portfolio value if possible
    try {
      totalValue = data.portfolios.reduce((sum: number, portfolio: any) => {
        if (!portfolio.holdings) return sum;
        
        const portfolioValue = portfolio.holdings.reduce((pSum: number, holding: any) => {
          if (!holding.include) return pSum;
          const value = (holding.livePrice || holding.price || 0) * (holding.qty || 0);
          return pSum + value;
        }, 0);
        
        return sum + portfolioValue;
      }, 0);
    } catch (error) {
      // If calculation fails, leave totalValue as 0
    }
  }

  return {
    timestamp: timestamp || new Date().toISOString(),
    filePath: filename,
    portfolioCount,
    holdingsCount,
    totalValue: totalValue > 0 ? totalValue : undefined,
    fileSize,
    isValid: validation.isValid,
    error: validation.errors.length > 0 ? validation.errors.join('; ') : undefined
  };
}

/**
 * Sort backup metadata by timestamp (newest first)
 */
export function sortBackupsByTimestamp(backups: BackupMetadata[]): BackupMetadata[] {
  return [...backups].sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Filter backups by type based on filename patterns
 */
export function filterBackupsByType(
  backups: BackupMetadata[], 
  types: string[]
): BackupMetadata[] {
  return backups.filter(backup => {
    const { type } = parseBackupFilename(backup.filePath);
    return types.includes(type);
  });
}

/**
 * Group backups by date for organization
 */
export function groupBackupsByDate(backups: BackupMetadata[]): Record<string, BackupMetadata[]> {
  const groups: Record<string, BackupMetadata[]> = {};
  
  backups.forEach(backup => {
    const date = new Date(backup.timestamp).toISOString().split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(backup);
  });
  
  return groups;
}

/**
 * Calculate backup statistics
 */
export interface BackupStats {
  totalBackups: number;
  validBackups: number;
  invalidBackups: number;
  totalSize: number;
  averageSize: number;
  oldestBackup?: string;
  newestBackup?: string;
  typeBreakdown: Record<string, number>;
}

export function calculateBackupStats(backups: BackupMetadata[]): BackupStats {
  const validBackups = backups.filter(b => b.isValid);
  const invalidBackups = backups.filter(b => !b.isValid);
  
  const totalSize = backups.reduce((sum, backup) => sum + (backup.fileSize || 0), 0);
  const averageSize = backups.length > 0 ? totalSize / backups.length : 0;
  
  const sortedByTime = sortBackupsByTimestamp(backups);
  const oldestBackup = sortedByTime.length > 0 ? sortedByTime[sortedByTime.length - 1].timestamp : undefined;
  const newestBackup = sortedByTime.length > 0 ? sortedByTime[0].timestamp : undefined;
  
  const typeBreakdown: Record<string, number> = {};
  backups.forEach(backup => {
    const { type } = parseBackupFilename(backup.filePath);
    typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
  });
  
  return {
    totalBackups: backups.length,
    validBackups: validBackups.length,
    invalidBackups: invalidBackups.length,
    totalSize,
    averageSize,
    oldestBackup,
    newestBackup,
    typeBreakdown
  };
}

/**
 * Determine which backup files should be cleaned up
 */
export function determineBackupsToCleanup(
  backups: BackupMetadata[], 
  config: BackupCleanupConfig = {}
): BackupMetadata[] {
  const {
    maxBackupFiles = 20,
    maxAgeInDays = 30,
    keepPatterns = ['recovery', 'migration', 'pre-restore']
  } = config;
  
  const toCleanup: BackupMetadata[] = [];
  const sortedBackups = sortBackupsByTimestamp(backups);
  
  // Always keep backups matching certain patterns
  const protectedBackups = sortedBackups.filter(backup => {
    const { type } = parseBackupFilename(backup.filePath);
    return keepPatterns.includes(type);
  });
  
  const regularBackups = sortedBackups.filter(backup => {
    const { type } = parseBackupFilename(backup.filePath);
    return !keepPatterns.includes(type);
  });
  
  // Remove backups exceeding max count (keep newest)
  if (regularBackups.length > maxBackupFiles) {
    const excessBackups = regularBackups.slice(maxBackupFiles);
    toCleanup.push(...excessBackups);
  }
  
  // Remove backups older than max age (only regular backups, not protected ones)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);
  
  const oldBackups = regularBackups.filter(backup => {
    const backupDate = new Date(backup.timestamp);
    return backupDate < cutoffDate;
  });
  
  // Add old backups to cleanup list (avoid duplicates)
  oldBackups.forEach(backup => {
    if (!toCleanup.find(b => b.filePath === backup.filePath)) {
      toCleanup.push(backup);
    }
  });
  
  return toCleanup;
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format timestamp for display
 */
export function formatBackupTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return timestamp;
    }
    return date.toLocaleString();
  } catch (error) {
    return timestamp;
  }
}

/**
 * Create a backup summary for display
 */
export function createBackupSummary(metadata: BackupMetadata): string {
  const parts = [];
  
  if (metadata.portfolioCount > 0) {
    parts.push(`${metadata.portfolioCount} portfolio${metadata.portfolioCount !== 1 ? 's' : ''}`);
  }
  
  if (metadata.holdingsCount > 0) {
    parts.push(`${metadata.holdingsCount} holding${metadata.holdingsCount !== 1 ? 's' : ''}`);
  }
  
  if (metadata.totalValue && metadata.totalValue > 0) {
    parts.push(`£${metadata.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
  }
  
  if (metadata.fileSize) {
    parts.push(formatFileSize(metadata.fileSize));
  }
  
  return parts.join(', ') || 'Empty backup';
}