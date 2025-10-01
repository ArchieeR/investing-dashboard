# Design Document

## Overview

This design enhances the existing portfolio backup system by adding user-facing controls and automatic restore detection. The current system already handles automatic backups through the vite-plugin-portfolio-storage.js, which provides `/api/portfolio/save`, `/api/portfolio/load`, and `/api/portfolio/recover` endpoints with automatic backup creation every 60 seconds.

## Architecture

### Existing Infrastructure

1. **vite-plugin-portfolio-storage.js**: Handles automatic backups, file storage, and API endpoints
2. **storage.ts**: Manages state persistence with file system integration
3. **Backup Directory**: `./backups/` with timestamped backup files
4. **Main Data File**: `./portfolio-data.json` as primary storage

### New Components

1. **useBackup**: React hook for manual backup operations
2. **BackupButton**: UI component for immediate backup triggers
3. **BackupStatus**: Component showing backup status and timestamps
4. **useRestoreDetection**: Hook for detecting data loss and offering restoration
5. **BackupBrowser**: Component for browsing and selecting backup files

### Data Flow

```
Existing: Portfolio State Change → storage.ts → /api/portfolio/save → Automatic Backup (60s interval)
                                                                   ↓
New: User Action → BackupButton → useBackup → /api/portfolio/save → Immediate Backup
                                                                  ↓
New: App Load → useRestoreDetection → Check Empty Data → BackupBrowser → Restore
```

## Components and Interfaces

### BackupService

```typescript
interface BackupService {
  createBackup(portfolioData: PortfolioData): Promise<BackupResult>
  restoreFromBackup(): Promise<RestoreResult>
  getLatestBackup(): Promise<BackupMetadata | null>
  isBackupNeeded(currentData: PortfolioData): boolean
}

interface BackupResult {
  success: boolean
  timestamp: string
  filePath: string
  error?: string
}

interface RestoreResult {
  success: boolean
  restoredData?: PortfolioData
  error?: string
}

interface BackupMetadata {
  timestamp: string
  filePath: string
  portfolioCount: number
  holdingsCount: number
}
```

### BackupHook

```typescript
interface UseBackupReturn {
  createBackup: () => Promise<void>
  isBackingUp: boolean
  lastBackupTime: string | null
  backupError: string | null
}

function useBackup(): UseBackupReturn
```

### BackupButton Component

```typescript
interface BackupButtonProps {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  showLastBackupTime?: boolean
}
```

### RestoreDetector Component

```typescript
interface RestoreDetectorProps {
  portfolioData: PortfolioData
  onRestore?: (restoredData: PortfolioData) => void
}
```

## Data Models

### Backup File Structure

```typescript
interface BackupFile {
  metadata: {
    timestamp: string
    version: string
    portfolioCount: number
    totalHoldings: number
  }
  data: PortfolioData
}
```

### Backup Configuration

```typescript
interface BackupConfig {
  autoBackupEnabled: boolean
  debounceMs: number
  maxBackupFiles: number
  backupDirectory: string
}
```

## Error Handling

### Backup Failures
- Network/file system errors: Log error, show user notification, continue operation
- Invalid data: Validate before backup, show specific error message
- Storage full: Clean old backups, retry operation

### Restore Failures
- Corrupted backup file: Show error, offer manual file selection
- Missing backup: Show informative message, offer manual import
- Validation errors: Show specific validation failures

### Recovery Strategies
- Automatic retry with exponential backoff for transient failures
- Fallback to previous backup if latest is corrupted
- Manual intervention prompts for critical failures

## Testing Strategy

### Unit Tests
- BackupService methods with various data scenarios
- BackupHook state management and side effects
- File system operations with mocked storage
- Data validation and error handling

### Integration Tests
- End-to-end backup and restore workflow
- UI component interactions with backup system
- Performance testing with large portfolio datasets
- Error scenarios and recovery paths

### Performance Tests
- Backup creation time with various data sizes
- Memory usage during backup operations
- UI responsiveness during background backups
- Debouncing effectiveness with rapid changes

## Implementation Notes

### File Management
- Backup files stored in `backups/` directory
- Filename format: `portfolio-backup-{timestamp}.json`
- Automatic cleanup of old backups (keep last 5)

### State Integration
- Hook into existing portfolio state management
- Use React's useEffect for change detection
- Debounce rapid changes (500ms default)

### User Experience
- Non-blocking backup operations
- Clear feedback for manual operations
- Subtle indicators for automatic backups
- Prominent restore prompts when needed

### Security Considerations
- Validate backup file integrity before restore
- Sanitize file paths to prevent directory traversal
- Encrypt sensitive data in backups (future enhancement)