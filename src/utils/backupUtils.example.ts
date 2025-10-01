/**
 * Example usage of backup utilities
 * This file demonstrates how to use the backup management utilities
 * in a real application context.
 */

import {
  BackupMetadata,
  BackupCleanupConfig,
  parseBackupFilename,
  validateBackupData,
  extractBackupMetadata,
  sortBackupsByTimestamp,
  filterBackupsByType,
  groupBackupsByDate,
  calculateBackupStats,
  determineBackupsToCleanup,
  formatFileSize,
  formatBackupTimestamp,
  createBackupSummary
} from './backupUtils';

/**
 * Example: Processing backup files from a directory listing
 */
export async function processBackupDirectory(backupFiles: string[]): Promise<{
  metadata: BackupMetadata[];
  stats: any;
  cleanupCandidates: BackupMetadata[];
}> {
  const metadata: BackupMetadata[] = [];
  
  // Process each backup file
  for (const filename of backupFiles) {
    try {
      // In a real app, you'd fetch the actual file content and size
      const mockFileContent = { portfolios: [], activePortfolioId: 'test' };
      const mockFileSize = Math.floor(Math.random() * 10000) + 1000;
      
      const backupMetadata = extractBackupMetadata(filename, mockFileContent, mockFileSize);
      metadata.push(backupMetadata);
    } catch (error) {
      console.warn(`Failed to process backup file ${filename}:`, error);
    }
  }
  
  // Sort by timestamp (newest first)
  const sortedMetadata = sortBackupsByTimestamp(metadata);
  
  // Calculate statistics
  const stats = calculateBackupStats(sortedMetadata);
  
  // Determine cleanup candidates
  const cleanupConfig: BackupCleanupConfig = {
    maxBackupFiles: 20,
    maxAgeInDays: 30,
    keepPatterns: ['recovery', 'migration', 'pre-restore']
  };
  const cleanupCandidates = determineBackupsToCleanup(sortedMetadata, cleanupConfig);
  
  return {
    metadata: sortedMetadata,
    stats,
    cleanupCandidates
  };
}

/**
 * Example: Creating a backup browser interface data
 */
export function createBackupBrowserData(metadata: BackupMetadata[]) {
  // Group by date for organized display
  const groupedByDate = groupBackupsByDate(metadata);
  
  // Filter by type for different views
  const autoBackups = filterBackupsByType(metadata, ['auto']);
  const manualBackups = filterBackupsByType(metadata, ['backup']);
  const recoveryBackups = filterBackupsByType(metadata, ['recovery', 'migration']);
  
  // Create display data
  const browserData = Object.entries(groupedByDate).map(([date, backups]) => ({
    date,
    displayDate: new Date(date).toLocaleDateString(),
    backups: backups.map(backup => ({
      ...backup,
      displayTimestamp: formatBackupTimestamp(backup.timestamp),
      displaySize: backup.fileSize ? formatFileSize(backup.fileSize) : 'Unknown',
      summary: createBackupSummary(backup),
      type: parseBackupFilename(backup.filePath).type
    }))
  }));
  
  return {
    groupedByDate: browserData,
    categories: {
      auto: autoBackups.length,
      manual: manualBackups.length,
      recovery: recoveryBackups.length
    },
    stats: calculateBackupStats(metadata)
  };
}

/**
 * Example: Validating a backup before restore
 */
export async function validateBackupForRestore(backupData: any): Promise<{
  canRestore: boolean;
  issues: string[];
  warnings: string[];
  metadata?: BackupMetadata;
}> {
  // Validate the backup data structure
  const validation = validateBackupData(backupData);
  
  if (!validation.isValid) {
    return {
      canRestore: false,
      issues: validation.errors,
      warnings: validation.warnings
    };
  }
  
  // Extract metadata for additional checks
  const metadata = extractBackupMetadata('temp-validation.json', backupData);
  
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // Additional validation checks
  if (metadata.portfolioCount === 0) {
    warnings.push('Backup contains no portfolios');
  }
  
  if (metadata.holdingsCount === 0) {
    warnings.push('Backup contains no holdings');
  }
  
  if (metadata.totalValue === 0) {
    warnings.push('Backup has zero total value');
  }
  
  // Check for very old backup
  const backupAge = Date.now() - new Date(metadata.timestamp).getTime();
  const daysOld = backupAge / (1000 * 60 * 60 * 24);
  
  if (daysOld > 90) {
    warnings.push(`Backup is ${Math.floor(daysOld)} days old`);
  }
  
  return {
    canRestore: issues.length === 0,
    issues,
    warnings,
    metadata
  };
}

/**
 * Example: Cleanup recommendation system
 */
export function generateCleanupRecommendations(metadata: BackupMetadata[]): {
  recommendations: string[];
  cleanupCandidates: BackupMetadata[];
  spaceToReclaim: number;
} {
  const stats = calculateBackupStats(metadata);
  const recommendations: string[] = [];
  
  // Conservative cleanup config
  const cleanupConfig: BackupCleanupConfig = {
    maxBackupFiles: 25,
    maxAgeInDays: 60,
    keepPatterns: ['recovery', 'migration', 'pre-restore']
  };
  
  const cleanupCandidates = determineBackupsToCleanup(metadata, cleanupConfig);
  
  // Calculate space to reclaim
  const spaceToReclaim = cleanupCandidates.reduce(
    (sum, backup) => sum + (backup.fileSize || 0), 
    0
  );
  
  // Generate recommendations
  if (stats.totalBackups > 30) {
    recommendations.push(`You have ${stats.totalBackups} backup files. Consider cleaning up old backups.`);
  }
  
  if (stats.invalidBackups > 0) {
    recommendations.push(`${stats.invalidBackups} backup files are corrupted and should be removed.`);
  }
  
  if (cleanupCandidates.length > 0) {
    recommendations.push(
      `${cleanupCandidates.length} backup files can be safely removed to free up ${formatFileSize(spaceToReclaim)}.`
    );
  }
  
  if (stats.totalSize > 100 * 1024 * 1024) { // 100MB
    recommendations.push(
      `Backup directory is using ${formatFileSize(stats.totalSize)}. Consider archiving old backups.`
    );
  }
  
  const autoBackups = filterBackupsByType(metadata, ['auto']);
  const manualBackups = filterBackupsByType(metadata, ['backup']);
  
  if (autoBackups.length === 0 && manualBackups.length > 0) {
    recommendations.push('Only manual backups found. Ensure automatic backup system is working.');
  }
  
  return {
    recommendations,
    cleanupCandidates,
    spaceToReclaim
  };
}

/**
 * Example: Backup health monitoring
 */
export function monitorBackupHealth(metadata: BackupMetadata[]): {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  lastBackup?: BackupMetadata;
} {
  const stats = calculateBackupStats(metadata);
  const issues: string[] = [];
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  
  // Find most recent backup
  const sortedBackups = sortBackupsByTimestamp(metadata);
  const lastBackup = sortedBackups[0];
  
  if (!lastBackup) {
    return {
      status: 'critical',
      issues: ['No backups found']
    };
  }
  
  // Check backup recency
  const timeSinceLastBackup = Date.now() - new Date(lastBackup.timestamp).getTime();
  const hoursSinceLastBackup = timeSinceLastBackup / (1000 * 60 * 60);
  
  if (hoursSinceLastBackup > 24) {
    status = 'critical';
    issues.push(`Last backup was ${Math.floor(hoursSinceLastBackup)} hours ago`);
  } else if (hoursSinceLastBackup > 6) {
    status = 'warning';
    issues.push(`Last backup was ${Math.floor(hoursSinceLastBackup)} hours ago`);
  }
  
  // Check for invalid backups
  if (stats.invalidBackups > 0) {
    if (stats.invalidBackups / stats.totalBackups > 0.2) {
      status = 'critical';
      issues.push(`${stats.invalidBackups} of ${stats.totalBackups} backups are corrupted`);
    } else {
      status = 'warning';
      issues.push(`${stats.invalidBackups} backup files are corrupted`);
    }
  }
  
  // Check if last backup is valid
  if (!lastBackup.isValid) {
    status = 'critical';
    issues.push('Most recent backup is corrupted');
  }
  
  return {
    status,
    issues,
    lastBackup
  };
}