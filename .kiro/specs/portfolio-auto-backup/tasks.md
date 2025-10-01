# Implementation Plan

- [x] 1. Create backup service hook for API integration
  - Create useBackup hook that interfaces with existing `/api/portfolio/save` endpoint
  - Add manual backup trigger that bypasses the 60-second interval
  - Implement backup status tracking and error handling
  - Write unit tests for hook functionality
  - _Requirements: 1.1, 1.2, 1.3, 2.2, 2.3_

- [x] 2. Build manual backup button component
  - Create BackupButton component with loading states and feedback
  - Add immediate backup triggering via the useBackup hook
  - Implement success/error message display with timestamps
  - Write component tests for user interactions
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_

- [x] 3. Create backup status display component
  - Build BackupStatus component showing last backup time and current status
  - Add loading indicators for backup operations in progress
  - Implement error status display with retry functionality
  - Write tests for status display and updates
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. Implement restore detection service
  - Create useRestoreDetection hook that checks for empty portfolio data on app load
  - Add logic to detect available backup files and offer restoration
  - Implement restore confirmation dialog and user prompts
  - Write tests for restore detection scenarios
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 5. Build automatic restore functionality
  - Create restore service that loads data from most recent backup file
  - Add data validation and error handling for corrupted backups
  - Implement UI refresh after successful restoration
  - Write integration tests for restore workflow
  - _Requirements: 3.2, 3.3, 3.4_

- [x] 6. Create backup file browser component
  - Build BackupBrowser component that lists available backup files with timestamps
  - Add backup file preview functionality showing portfolio summary
  - Implement backup file selection and confirmation dialogs
  - Write tests for file browsing and selection
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Implement manual restore from specific backup
  - Add restore functionality for user-selected backup files
  - Create pre-restore backup of current state before restoration
  - Implement restore confirmation with backup preview
  - Write tests for manual restore workflow
  - _Requirements: 4.2, 4.3, 4.4_

- [x] 8. Integrate backup UI into main portfolio interface
  - Add BackupButton and BackupStatus to portfolio header/toolbar
  - Integrate RestoreDetector into main App component
  - Add backup management section to settings panel
  - Write end-to-end tests for complete user workflows
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 9. Add comprehensive error handling and user feedback
  - Implement error boundaries for backup/restore operations
  - Create user-friendly error messages with specific recovery suggestions
  - Add retry mechanisms for failed backup/restore operations
  - Write tests for error scenarios and recovery paths
  - _Requirements: 1.3, 2.3, 3.4_

- [x] 10. Create backup management utilities
  - Add utility functions for backup file parsing and validation
  - Implement backup metadata extraction (timestamp, portfolio count, etc.)
  - Create backup file cleanup and organization helpers
  - Write utility tests and performance benchmarks
  - _Requirements: 2.4, 4.1, 4.2_