# Implementation Plan

- [x] 1. Clean up existing calculateHoldingValue function in selectors.ts
  - Ensure consistent live price vs manual price logic across all calculations
  - Separate live value calculation from manual value calculation clearly
  - Update function to always return both live value and manual value separately
  - Add clear documentation for when each value type should be used
  - _Requirements: 1.1, 1.2, 7.1, 7.2_

- [x] 2. Fix live vs manual value usage in selectHoldingsWithDerived
  - Ensure allocatedTotal uses live values consistently for all percentage calculations
  - Fix section totals and theme totals to use live values only
  - Update percentage calculations (pctOfTotal, pctOfSection, pctOfTheme) to use live values
  - Remove mixing of live and manual values in the same calculation
  - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 3. Separate target calculations from live calculations in selectors
  - Move target-related logic (targetThemeTotals calculation) into separate functions
  - Ensure target calculations only run when targetPortfolioValue is set
  - Create clear separation between live portfolio totals and target hierarchy
  - Update target value calculations to use proper hierarchy (Portfolio → Section → Theme)
  - _Requirements: 3.1, 3.2, 3.3, 7.3, 7.4_

- [x] 4. Fix section and theme target calculation hierarchy
  - Update target calculation to properly cascade: Portfolio → Section → Theme → Holding
  - Ensure section target = targetPortfolioValue × section percentage
  - Ensure theme target = section target × theme percentage (not portfolio percentage)
  - Fix holding target = theme target × holding percentage
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4_

- [x] 5. Implement percentage preservation logic in budget updates
  - Update portfolio store budget actions to preserve child percentages when parent changes
  - When section percentage changes, maintain theme percentage ratios within that section
  - When theme percentage changes, maintain holding percentage ratios within that theme
  - Add utility functions for proportional percentage adjustment
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 6. Add profit/loss calculations using existing trade data
  - Create calculateProfitLoss function using existing Trade interface
  - Calculate total gain/loss as (livePrice - avgCost) × quantity for each holding
  - Add day change calculations using existing dayChange and dayChangePercent fields
  - Integrate profit/loss data into HoldingDerived interface
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 7. Clean up selectBudgetRemaining to use proper live values
  - Ensure breakdown calculations use live values consistently
  - Fix theme percentage calculations to be relative to section totals (not portfolio)
  - Update budget remaining calculations to work with corrected hierarchy
  - Remove any mixing of live and target calculations in budget display
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4_

- [x] 8. Update calculations.ts utility functions for clarity
  - Add clear JSDoc comments explaining when to use each calculation function
  - Create separate functions for live vs target delta calculations
  - Add validation and error handling for edge cases (zero values, negative numbers)
  - Ensure all percentage calculations handle division by zero gracefully
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 9. Fix cache invalidation in selectHoldingsWithDerived
  - Update cache key generation to properly separate live and target data changes
  - Ensure cache invalidates when live prices update (but not when target settings change)
  - Ensure cache invalidates when target settings change (but not when live prices update)
  - Add separate caching for live calculations vs target calculations
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 10. Add comprehensive tests for cleaned up calculations
  - Write tests for live value calculations with and without live prices
  - Test target hierarchy calculations with various percentage combinations
  - Test percentage preservation when parent allocations change
  - Add edge case tests for zero values and missing data
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 3.1, 3.2, 3.3_

- [x] 11. Update UI components to clearly show live vs target separation
  - Ensure HoldingsGrid displays live values and target values in separate columns
  - Update AllocationManager to show live allocated values vs target values clearly
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 3.1, 3.2, 3.3_

- [ ] 12. Add validation and error handling for calculation inputs
  - Add validation for target percentages (must sum to reasonable totals)
  - Add warnings when live prices are missing or stale
  - Create user-friendly error messages for calculation issues
  - Add validation for budget inputs to prevent invalid percentage combinations
  - _Requirements: 7.1, 7.2, 7.3, 7.4_