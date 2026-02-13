import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger, log, setUserContext, clearUserContext } from "./logger";

describe("Logger Service", () => {
  const consoleSpy = {
    log: vi.spyOn(console, "log").mockImplementation(() => {}),
    error: vi.spyOn(console, "error").mockImplementation(() => {}),
    warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
    debug: vi.spyOn(console, "debug").mockImplementation(() => {}),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearUserContext();
  });

  describe("log()", () => {
    it("logs info events to console", () => {
      log({
        message: "Test message",
        feature: "dashboard",
        classification: "system",
        severity: "info",
      });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        ""
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("[dashboard]"),
        ""
      );
    });

    it("logs error events to console.error", () => {
      log({
        message: "Error occurred",
        feature: "auth",
        classification: "error",
        severity: "error",
      });

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR]"),
        ""
      );
    });

    it("logs warning events to console.warn", () => {
      log({
        message: "Warning message",
        feature: "portfolio",
        classification: "system",
        severity: "warning",
      });

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining("[WARNING]"),
        ""
      );
    });

    it("includes page in log output when provided", () => {
      log({
        message: "Page event",
        feature: "etf-search",
        page: "etf-screener",
        classification: "navigation",
        severity: "info",
      });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("[etf-search:etf-screener]"),
        ""
      );
    });

    it("includes data in log output", () => {
      const testData = { userId: "123", action: "click" };

      log({
        message: "User action",
        feature: "dashboard",
        classification: "user-action",
        severity: "info",
        data: testData,
      });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.any(String),
        testData
      );
    });
  });

  describe("logger convenience methods", () => {
    it("logger.info() logs with info severity", () => {
      logger.info("dashboard", "Dashboard loaded");

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        ""
      );
    });

    it("logger.warn() logs with warning severity", () => {
      logger.warn("portfolio", "Deprecated feature used");

      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it("logger.userAction() logs user actions", () => {
      logger.userAction("etf-search", "Searched for VOO");

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("[user-action]"),
        ""
      );
    });

    it("logger.pageView() logs page views", () => {
      logger.pageView("dashboard", "dashboard");

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("[navigation]"),
        ""
      );
    });

    it("logger.dataFetch() logs data fetches", () => {
      logger.dataFetch("etf-detail", "ETF holdings");

      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining("[data-fetch]"),
        ""
      );
    });
  });

  describe("setUserContext()", () => {
    it("sets user context without throwing", () => {
      expect(() => {
        setUserContext({
          id: "user-123",
          email: "test@example.com",
          displayName: "Test User",
          plan: "pro",
        });
      }).not.toThrow();
    });

    it("clears user context without throwing", () => {
      setUserContext({ id: "user-123" });

      expect(() => {
        clearUserContext();
      }).not.toThrow();
    });
  });
});
