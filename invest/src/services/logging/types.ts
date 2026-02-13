/**
 * Logging Service Types
 * Structured logging with Sentry integration
 */

// Feature IDs - Add new features here as they're built
export type FeatureId =
  | "auth"
  | "dashboard"
  | "portfolio"
  | "etf-search"
  | "etf-detail"
  | "research-hub"
  | "settings"
  | "onboarding";

// Page IDs - Specific pages/routes
export type PageId =
  | "home"
  | "login"
  | "register"
  | "dashboard"
  | "portfolio-overview"
  | "etf-screener"
  | "etf-detail"
  | "research-macro"
  | "research-news"
  | "research-earnings"
  | "settings-profile"
  | "settings-preferences";

// Log classifications
export type LogClassification =
  | "user-action" // User-initiated actions (clicks, form submits)
  | "navigation" // Route changes, page views
  | "data-fetch" // API calls, data loading
  | "data-mutation" // Create, update, delete operations
  | "auth" // Authentication events
  | "error" // Errors and exceptions
  | "performance" // Performance metrics
  | "business" // Business logic events
  | "system"; // System-level events

// Severity levels (aligned with Sentry)
export type Severity = "debug" | "info" | "warning" | "error" | "fatal";

// User context for logging
export interface UserContext {
  id?: string;
  email?: string;
  displayName?: string;
  plan?: "free" | "pro" | "enterprise";
}

// Base log event structure
export interface LogEvent {
  message: string;
  feature: FeatureId;
  page?: PageId;
  classification: LogClassification;
  severity: Severity;
  data?: Record<string, unknown>;
  tags?: Record<string, string>;
}

// Error event with stack trace
export interface ErrorEvent extends LogEvent {
  error: Error;
  classification: "error";
  severity: "error" | "fatal";
}

// Performance event
export interface PerformanceEvent {
  name: string;
  feature: FeatureId;
  page?: PageId;
  duration: number;
  tags?: Record<string, string>;
}
