# Feature Spec: Analytics Dashboard

## 1. Overview
A dedicated view for deep-dive portfolio analysis, separating "Day-to-day Management" (Dashboard) from "Deep Insight" (Analytics).

## 2. Key Metrics
*   **Risk:** Sharpe Ratio, Sortino Ratio, Beta (vs S&P 500 / MSCI World).
*   **Attribution:** Total Return contribution by Asset Class / Theme.
*   **Overlap:** ETF intersection analysis (e.g. "You have 12% in Microsoft across 4 ETFs").

## 3. Component Architecture
*   `src/components/features/analytics/RiskMetrics.tsx`
*   `src/components/features/analytics/OverlapMatrix.tsx`
*   `src/components/features/analytics/ExposureBreakdown.tsx`
