# Requirements Document

## Introduction

This feature adds a "Live % of Theme" column to the portfolio grid that shows the real-time percentage allocation of each theme based on current market prices, complementing the existing "Target % of Theme" column which shows planned allocations.

## Requirements

### Requirement 1

**User Story:** As a portfolio manager, I want to see the live percentage allocation of each theme based on current market prices, so that I can compare actual vs target theme allocations in real-time.

#### Acceptance Criteria

1. WHEN viewing the portfolio grid THEN the system SHALL display a "Live % of Theme" column next to the existing "Target % of Theme" column
2. WHEN a holding has a theme assigned THEN the system SHALL calculate the live theme percentage using current market values (livePrice * quantity)
3. WHEN a holding does not have a theme assigned THEN the system SHALL display "-" in the Live % of Theme column
4. WHEN live prices are not available THEN the system SHALL fall back to using the base price for calculations

### Requirement 2

**User Story:** As a portfolio manager, I want the live theme percentages to update automatically when market prices change, so that I always see current allocation data.

#### Acceptance Criteria

1. WHEN live prices update THEN the system SHALL automatically recalculate all live theme percentages
2. WHEN the portfolio composition changes THEN the system SHALL recalculate live theme percentages for all affected themes
3. WHEN displaying percentages THEN the system SHALL format them to one decimal place (e.g., "12.5%")

### Requirement 3

**User Story:** As a portfolio manager, I want to control the visibility of the Live % of Theme column, so that I can customize my grid view according to my preferences.

#### Acceptance Criteria

1. WHEN accessing column visibility settings THEN the system SHALL include a toggle for "Live % of Theme"
2. WHEN the Live % of Theme column is enabled by default THEN new users SHALL see this column without additional configuration
3. WHEN toggling column visibility THEN the system SHALL immediately show or hide the Live % of Theme column
4. WHEN saving settings THEN the system SHALL persist the Live % of Theme column visibility preference

### Requirement 4

**User Story:** As a portfolio manager, I want the live theme percentage calculation to be accurate across all holdings in the same theme, so that I can trust the allocation data for decision making.

#### Acceptance Criteria

1. WHEN calculating live theme percentage THEN the system SHALL sum all holdings with the same theme using their current market values
2. WHEN calculating the portfolio total THEN the system SHALL use current market values for all holdings
3. WHEN multiple holdings share the same theme THEN the system SHALL display the same percentage for all holdings in that theme
4. WHEN the total portfolio value is zero THEN the system SHALL display "-" for all theme percentages