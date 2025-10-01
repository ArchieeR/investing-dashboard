# Requirements Document

## Introduction

This feature enhances the existing portfolio backup system by adding UI controls and automatic restore detection. The current system already handles automatic backups via the vite plugin, but lacks user-facing controls and automatic restore capabilities when data loss is detected.

## Requirements

### Requirement 1

**User Story:** As a portfolio manager, I want a manual save button to immediately force a backup of my current portfolio state, so that I can create backups at critical moments without waiting for the automatic interval.

#### Acceptance Criteria

1. WHEN I click the manual save button THEN the system SHALL immediately trigger a backup via the existing `/api/portfolio/save` endpoint
2. WHEN the save operation completes successfully THEN the system SHALL show a confirmation message with timestamp
3. WHEN the save operation fails THEN the system SHALL show an error message with details
4. WHEN I save manually THEN the backup SHALL bypass the 60-second interval restriction

### Requirement 2

**User Story:** As a portfolio manager, I want to see backup status information, so that I know when my data was last saved and if backups are working properly.

#### Acceptance Criteria

1. WHEN I view the portfolio interface THEN the system SHALL display the last backup timestamp
2. WHEN a backup operation is in progress THEN the system SHALL show a loading indicator
3. WHEN backup operations fail THEN the system SHALL show error status with retry options
4. WHEN the system starts THEN the system SHALL check and display the current backup status

### Requirement 3

**User Story:** As a portfolio manager, I want the system to detect when my portfolio has been wiped and offer to restore from backup, so that I can quickly recover my data without manual intervention.

#### Acceptance Criteria

1. WHEN the system loads and detects empty portfolio data but backups exist THEN the system SHALL show a restore prompt
2. WHEN I confirm the restore operation THEN the system SHALL load data from the most recent backup file
3. WHEN the restore completes successfully THEN the system SHALL show a confirmation message and refresh the UI
4. IF the restore operation fails THEN the system SHALL show an error message and offer manual backup file selection

### Requirement 4

**User Story:** As a portfolio manager, I want to manually restore from a specific backup file, so that I can recover from any point in time if needed.

#### Acceptance Criteria

1. WHEN I access the restore interface THEN the system SHALL show a list of available backup files with timestamps
2. WHEN I select a specific backup file THEN the system SHALL preview the backup contents before restoration
3. WHEN I confirm restoration from a specific backup THEN the system SHALL replace current data with the selected backup
4. WHEN restoration is complete THEN the system SHALL create a pre-restore backup of the current state