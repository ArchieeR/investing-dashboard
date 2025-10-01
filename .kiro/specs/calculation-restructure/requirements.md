# Requirements Document

## Introduction

The portfolio manager currently has a complex and messy calculation structure that needs to be restructured into two clear, separate calculation systems: live calculations based on actual holdings and theoretical target calculations for portfolio planning. The current implementation mixes these concepts, making it difficult to understand and maintain.

## Requirements

### Requirement 1: Live Value Calculations

**User Story:** As a portfolio manager, I want accurate live value calculations based on my actual holdings, so that I can see the current state of my investments.

#### Acceptance Criteria

1. WHEN a holding has a live price THEN the system SHALL calculate live value as live price × quantity
2. WHEN a holding does not have a live price THEN the system SHALL fall back to manual price × quantity
3. WHEN calculating total allocated value THEN the system SHALL sum all live values of holdings with include=true
4. WHEN calculating percentage of portfolio THEN the system SHALL use live value / total allocated value × 100
5. WHEN calculating section totals THEN the system SHALL sum live values of all holdings in that section
6. WHEN calculating percentage of section THEN the system SHALL use holding live value / section total live value × 100
7. WHEN calculating theme totals THEN the system SHALL sum live values of all holdings in that theme
8. WHEN calculating percentage of theme THEN the system SHALL use holding live value / theme total live value × 100

### Requirement 2: Profit/Loss Calculations

**User Story:** As an investor, I want to see profit/loss calculations based on my purchase history, so that I can track investment performance.

#### Acceptance Criteria

1. WHEN a holding has purchase history THEN the system SHALL calculate total gain as (live price - purchase price) × quantity for each purchase
2. WHEN a holding has multiple purchases THEN the system SHALL aggregate gains across all purchase transactions
3. WHEN displaying profit/loss THEN the system SHALL show both absolute gain/loss and percentage gain/loss
4. WHEN a holding has no live price THEN the system SHALL use manual price for profit/loss calculations

### Requirement 3: Target Portfolio System

**User Story:** As a portfolio planner, I want a separate theoretical calculation system for target allocations, so that I can experiment with portfolio changes without affecting live calculations.

#### Acceptance Criteria

1. WHEN setting target portfolio value THEN the system SHALL use this as the basis for all target calculations
2. WHEN target portfolio value is set THEN the system SHALL maintain separation from live calculations
3. WHEN target portfolio value changes THEN the system SHALL recalculate all dependent target values
4. WHEN no target portfolio value is set THEN the system SHALL not display target-related calculations

### Requirement 4: Section Target Calculations

**User Story:** As a portfolio manager, I want to set target percentages for sections and see calculated target values, so that I can plan portfolio allocation at the section level.

#### Acceptance Criteria

1. WHEN setting a section percentage THEN the system SHALL calculate target section value as target portfolio value × section percentage
2. WHEN section percentage changes THEN the system SHALL recalculate target section value but preserve theme percentages within that section
3. WHEN displaying section allocation THEN the system SHALL show allocated live value, target percentage, and calculated target value
4. WHEN section target value changes THEN the system SHALL update theme target values proportionally

### Requirement 5: Theme Target Calculations

**User Story:** As a portfolio manager, I want to set target percentages for themes within sections and see calculated target values, so that I can plan detailed portfolio allocation.

#### Acceptance Criteria

1. WHEN setting a theme percentage THEN the system SHALL calculate target theme value as target section value × theme percentage
2. WHEN theme percentage changes THEN the system SHALL recalculate target theme value but preserve other theme percentages
3. WHEN displaying theme allocation THEN the system SHALL show allocated live value, target percentage, and calculated target value
4. WHEN parent section percentage changes THEN the system SHALL update theme target values while preserving theme percentage ratios

### Requirement 6: Holding Target Calculations

**User Story:** As an investor, I want to set target percentages for individual holdings within themes and see calculated target values, so that I can plan specific stock allocations.

#### Acceptance Criteria

1. WHEN setting a holding target percentage THEN the system SHALL calculate target holding value as target theme value × holding percentage
2. WHEN holding target percentage changes THEN the system SHALL recalculate target holding value
3. WHEN displaying holding targets THEN the system SHALL show current live value, target percentage, target value, and difference
4. WHEN theme target value changes THEN the system SHALL update holding target values while preserving holding percentage ratios

### Requirement 7: Calculation Independence

**User Story:** As a user, I want live and target calculations to be completely independent, so that changes to one system don't affect the other.

#### Acceptance Criteria

1. WHEN live prices update THEN the system SHALL only affect live calculations, not target calculations
2. WHEN target percentages change THEN the system SHALL only affect target calculations, not live calculations
3. WHEN quantities change THEN the system SHALL update both live and target calculations independently
4. WHEN holdings are added or removed THEN the system SHALL update both calculation systems separately

### Requirement 8: Hierarchical Percentage Preservation

**User Story:** As a portfolio manager, I want percentage relationships to be preserved when parent allocations change, so that my relative allocation preferences are maintained.

#### Acceptance Criteria

1. WHEN a section percentage changes THEN the system SHALL preserve theme percentage ratios within that section
2. WHEN a theme percentage changes THEN the system SHALL preserve holding percentage ratios within that theme
3. WHEN target portfolio value changes THEN the system SHALL preserve all percentage relationships
4. WHEN recalculating due to parent changes THEN the system SHALL only update calculated values, not user-set percentages