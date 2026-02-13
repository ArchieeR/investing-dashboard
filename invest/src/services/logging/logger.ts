/**
 * Logging Service
 * Structured logging with Sentry integration for production
 */

import * as Sentry from "@sentry/nextjs";
import type {
  LogEvent,
  ErrorEvent,
  PerformanceEvent,
  UserContext,
  Severity,
  FeatureId,
  PageId,
  LogClassification,
} from "./types";

// Check if we're in production
const isProduction = process.env.NODE_ENV === "production";

// Current user context (set by auth)
let currentUser: UserContext | null = null;

/**
 * Set the current user context for all logs
 */
export function setUserContext(user: UserContext | null): void {
  currentUser = user;

  if (isProduction && user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.displayName,
    });
    Sentry.setTag("user.plan", user.plan ?? "free");
  } else if (isProduction) {
    Sentry.setUser(null);
  }
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext(): void {
  setUserContext(null);
}

/**
 * Map our severity to Sentry severity
 */
function toSentrySeverity(
  severity: Severity
): "debug" | "info" | "warning" | "error" | "fatal" {
  return severity;
}

/**
 * Format log for console output
 */
function formatConsoleLog(event: LogEvent): string {
  const parts = [
    `[${event.severity.toUpperCase()}]`,
    `[${event.feature}${event.page ? `:${event.page}` : ""}]`,
    `[${event.classification}]`,
    event.message,
  ];
  return parts.join(" ");
}

/**
 * Log an event
 */
export function log(event: LogEvent): void {
  const formattedMessage = formatConsoleLog(event);

  // Always log to console in development
  if (!isProduction) {
    const consoleMethod =
      event.severity === "error" || event.severity === "fatal"
        ? console.error
        : event.severity === "warning"
          ? console.warn
          : event.severity === "debug"
            ? console.debug
            : console.log;

    consoleMethod(formattedMessage, event.data ?? "");
    return;
  }

  // In production, send to Sentry
  Sentry.withScope((scope) => {
    scope.setLevel(toSentrySeverity(event.severity));
    scope.setTag("feature", event.feature);
    scope.setTag("classification", event.classification);

    if (event.page) {
      scope.setTag("page", event.page);
    }

    if (event.tags) {
      Object.entries(event.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (event.data) {
      scope.setContext("data", event.data);
    }

    Sentry.captureMessage(event.message, toSentrySeverity(event.severity));
  });
}

/**
 * Log an error with full stack trace
 */
export function logError(event: ErrorEvent): void {
  const formattedMessage = formatConsoleLog(event);

  if (!isProduction) {
    console.error(formattedMessage, event.error, event.data ?? "");
    return;
  }

  Sentry.withScope((scope) => {
    scope.setLevel(toSentrySeverity(event.severity));
    scope.setTag("feature", event.feature);
    scope.setTag("classification", "error");

    if (event.page) {
      scope.setTag("page", event.page);
    }

    if (event.tags) {
      Object.entries(event.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (event.data) {
      scope.setContext("data", event.data);
    }

    scope.setContext("errorInfo", {
      message: event.message,
      feature: event.feature,
      page: event.page,
    });

    Sentry.captureException(event.error);
  });
}

/**
 * Track performance metrics
 */
export function logPerformance(event: PerformanceEvent): void {
  if (!isProduction) {
    console.debug(
      `[PERF] [${event.feature}${event.page ? `:${event.page}` : ""}] ${event.name}: ${event.duration}ms`
    );
    return;
  }

  Sentry.withScope((scope) => {
    scope.setTag("feature", event.feature);

    if (event.page) {
      scope.setTag("page", event.page);
    }

    if (event.tags) {
      Object.entries(event.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    // Use Sentry's performance monitoring
    const transaction = Sentry.startInactiveSpan({
      name: event.name,
      op: "measure",
    });
    transaction?.end();
  });
}

// Convenience methods for common log patterns

export const logger = {
  debug: (
    feature: FeatureId,
    message: string,
    data?: Record<string, unknown>
  ) => {
    log({
      message,
      feature,
      classification: "system",
      severity: "debug",
      data,
    });
  },

  info: (feature: FeatureId, message: string, data?: Record<string, unknown>) =>
    log({
      message,
      feature,
      classification: "system",
      severity: "info",
      data,
    }),

  warn: (feature: FeatureId, message: string, data?: Record<string, unknown>) =>
    log({
      message,
      feature,
      classification: "system",
      severity: "warning",
      data,
    }),

  error: (feature: FeatureId, error: Error, data?: Record<string, unknown>) =>
    logError({
      message: error.message,
      feature,
      classification: "error",
      severity: "error",
      error,
      data,
    }),

  fatal: (feature: FeatureId, error: Error, data?: Record<string, unknown>) =>
    logError({
      message: error.message,
      feature,
      classification: "error",
      severity: "fatal",
      error,
      data,
    }),

  userAction: (
    feature: FeatureId,
    action: string,
    data?: Record<string, unknown>
  ) =>
    log({
      message: action,
      feature,
      classification: "user-action",
      severity: "info",
      data,
    }),

  pageView: (feature: FeatureId, page: PageId) =>
    log({
      message: `Page view: ${page}`,
      feature,
      page,
      classification: "navigation",
      severity: "info",
    }),

  dataFetch: (
    feature: FeatureId,
    resource: string,
    data?: Record<string, unknown>
  ) =>
    log({
      message: `Fetching: ${resource}`,
      feature,
      classification: "data-fetch",
      severity: "debug",
      data,
    }),

  dataMutation: (
    feature: FeatureId,
    action: string,
    data?: Record<string, unknown>
  ) =>
    log({
      message: action,
      feature,
      classification: "data-mutation",
      severity: "info",
      data,
    }),
};

export type { FeatureId, PageId, LogClassification, Severity, UserContext };
