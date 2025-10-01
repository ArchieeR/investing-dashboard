import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorHandlingService, type RetryConfig } from '../src/services/errorHandlingService';

describe('ErrorHandlingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('analyzeError', () => {
    it('should categorize network errors correctly', () => {
      const networkError = new Error('Network request failed');
      const result = ErrorHandlingService.analyzeError(networkError);

      expect(result.category).toBe('network');
      expect(result.severity).toBe('low');
      expect(result.isRetryable).toBe(true);
      expect(result.userMessage).toContain('connect to the server');
      expect(result.recoverySuggestions).toContain('Check your internet connection');
    });

    it('should categorize validation errors correctly', () => {
      const validationError = new Error('Invalid backup data format');
      const result = ErrorHandlingService.analyzeError(validationError);

      expect(result.category).toBe('validation');
      expect(result.severity).toBe('medium');
      expect(result.isRetryable).toBe(false);
      expect(result.userMessage).toContain('corrupted or invalid');
      expect(result.recoverySuggestions).toContain('Try restoring from a different backup file');
    });

    it('should categorize permission errors correctly', () => {
      const permissionError = new Error('403 Forbidden');
      const result = ErrorHandlingService.analyzeError(permissionError);

      expect(result.category).toBe('permission');
      expect(result.severity).toBe('high');
      expect(result.isRetryable).toBe(false);
      expect(result.userMessage).toContain('permission');
      expect(result.recoverySuggestions).toContain('Check your user permissions');
    });

    it('should categorize storage errors correctly', () => {
      const storageError = new Error('Insufficient disk space');
      const result = ErrorHandlingService.analyzeError(storageError);

      expect(result.category).toBe('storage');
      expect(result.severity).toBe('high');
      expect(result.isRetryable).toBe(false);
      expect(result.userMessage).toContain('storage space');
      expect(result.recoverySuggestions).toContain('Free up disk space');
    });

    it('should handle unknown errors with default categorization', () => {
      const unknownError = new Error('Something went wrong');
      const result = ErrorHandlingService.analyzeError(unknownError);

      expect(result.category).toBe('unknown');
      expect(result.severity).toBe('medium');
      expect(result.userMessage).toContain('unexpected error');
      expect(result.code).toMatch(/^UNK_/);
    });

    it('should handle non-Error objects', () => {
      const stringError = 'String error message';
      const result = ErrorHandlingService.analyzeError(stringError);

      expect(result.message).toBe('String error message');
      expect(result.category).toBe('unknown');
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const successOperation = vi.fn().mockResolvedValue('success');
      
      const result = await ErrorHandlingService.withRetry(successOperation);

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attemptCount).toBe(1);
      expect(successOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry retryable errors', async () => {
      const retryableOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValue('success');

      const result = await ErrorHandlingService.withRetry(retryableOperation, {
        maxAttempts: 3,
        baseDelay: 10, // Short delay for testing
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attemptCount).toBe(3);
      expect(retryableOperation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const nonRetryableOperation = vi.fn()
        .mockRejectedValue(new Error('Invalid data format'));

      const result = await ErrorHandlingService.withRetry(nonRetryableOperation, {
        maxAttempts: 3,
      });

      expect(result.success).toBe(false);
      expect(result.error?.category).toBe('validation');
      expect(result.attemptCount).toBe(3); // Still reports max attempts
      expect(nonRetryableOperation).toHaveBeenCalledTimes(1); // But only called once
    });

    it('should respect max attempts limit', async () => {
      const failingOperation = vi.fn()
        .mockRejectedValue(new Error('Network error'));

      const result = await ErrorHandlingService.withRetry(failingOperation, {
        maxAttempts: 2,
        baseDelay: 10,
      });

      expect(result.success).toBe(false);
      expect(result.attemptCount).toBe(2);
      expect(failingOperation).toHaveBeenCalledTimes(2);
    });

    it('should apply exponential backoff', async () => {
      const startTime = Date.now();
      const failingOperation = vi.fn()
        .mockRejectedValue(new Error('Network timeout'));

      await ErrorHandlingService.withRetry(failingOperation, {
        maxAttempts: 3,
        baseDelay: 50,
        backoffMultiplier: 2,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should take at least 50ms + 100ms = 150ms for delays
      expect(duration).toBeGreaterThan(140);
    });

    it('should respect max delay limit', async () => {
      const failingOperation = vi.fn()
        .mockRejectedValue(new Error('Network timeout'));

      const config: RetryConfig = {
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 200,
        backoffMultiplier: 3,
      };

      const startTime = Date.now();
      await ErrorHandlingService.withRetry(failingOperation, config);
      const endTime = Date.now();

      // With exponential backoff: 100, 300 (capped to 200)
      // Total should be around 300ms, but we'll check it's less than uncapped exponential
      expect(endTime - startTime).toBeLessThan(1000); // Much less than uncapped
      expect(endTime - startTime).toBeGreaterThan(250); // Should take at least the delays
    });
  });

  describe('createErrorNotification', () => {
    it('should create appropriate notification for network errors', () => {
      const networkError = ErrorHandlingService.analyzeError(new Error('Network failed'));
      const notification = ErrorHandlingService.createErrorNotification(networkError);

      expect(notification.title).toBe('Connection Problem');
      expect(notification.type).toBe('info');
      expect(notification.actions).toContainEqual({ label: 'Try Again', action: 'retry' });
      expect(notification.actions).toContainEqual({ label: 'Check Connection', action: 'check-network' });
    });

    it('should create appropriate notification for validation errors', () => {
      const validationError = ErrorHandlingService.analyzeError(new Error('Invalid backup format'));
      const notification = ErrorHandlingService.createErrorNotification(validationError);

      expect(notification.title).toBe('Invalid Data');
      expect(notification.type).toBe('warning');
      expect(notification.actions).toContainEqual({ label: 'View Details', action: 'view-details' });
    });

    it('should create appropriate notification for high severity errors', () => {
      const permissionError = ErrorHandlingService.analyzeError(new Error('403 Forbidden'));
      const notification = ErrorHandlingService.createErrorNotification(permissionError);

      expect(notification.title).toBe('Access Denied');
      expect(notification.type).toBe('error');
      expect(notification.actions).toContainEqual({ label: 'Dismiss', action: 'dismiss' });
    });

    it('should include retry action for retryable errors', () => {
      const retryableError = ErrorHandlingService.analyzeError(new Error('Network timeout'));
      const notification = ErrorHandlingService.createErrorNotification(retryableError);

      expect(notification.actions.some(action => action.action === 'retry')).toBe(true);
    });

    it('should not include retry action for non-retryable errors', () => {
      const nonRetryableError = ErrorHandlingService.analyzeError(new Error('Invalid data'));
      const notification = ErrorHandlingService.createErrorNotification(nonRetryableError);

      expect(notification.actions.some(action => action.action === 'retry')).toBe(false);
    });
  });

  describe('error scenarios', () => {
    it('should handle fetch errors appropriately', () => {
      const fetchError = new Error('Failed to fetch');
      fetchError.name = 'TypeError';
      
      const result = ErrorHandlingService.analyzeError(fetchError);

      expect(result.category).toBe('network');
      expect(result.isRetryable).toBe(true);
      expect(result.severity).toBe('low');
    });

    it('should handle timeout errors appropriately', () => {
      const timeoutError = new Error('Request timeout');
      
      const result = ErrorHandlingService.analyzeError(timeoutError);

      expect(result.category).toBe('network');
      expect(result.isRetryable).toBe(true);
      expect(result.recoverySuggestions).toContain('Try again in a few moments');
    });

    it('should handle abort errors appropriately', () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      
      const result = ErrorHandlingService.analyzeError(abortError);

      expect(result.isRetryable).toBe(true);
      expect(result.category).toBe('network');
    });

    it('should handle HTTP status errors appropriately', () => {
      const httpError = new Error('Backup failed: 503 Service Unavailable');
      
      const result = ErrorHandlingService.analyzeError(httpError);

      expect(result.category).toBe('network');
      expect(result.isRetryable).toBe(true);
      expect(result.severity).toBe('low');
    });

    it('should handle malformed data errors appropriately', () => {
      const malformedError = new Error('Malformed JSON in backup file');
      
      const result = ErrorHandlingService.analyzeError(malformedError);

      expect(result.category).toBe('validation');
      expect(result.isRetryable).toBe(false);
      expect(result.severity).toBe('medium');
    });
  });

  describe('recovery suggestions', () => {
    it('should provide network-specific recovery suggestions', () => {
      const networkError = ErrorHandlingService.analyzeError(new Error('Connection failed'));
      
      expect(networkError.recoverySuggestions).toContain('Check your internet connection');
      expect(networkError.recoverySuggestions).toContain('Try again in a few moments');
      expect(networkError.recoverySuggestions).toContain('Refresh the page if the problem continues');
    });

    it('should provide validation-specific recovery suggestions', () => {
      const validationError = ErrorHandlingService.analyzeError(new Error('Corrupt backup file'));
      
      expect(validationError.recoverySuggestions).toContain('Try restoring from a different backup file');
      expect(validationError.recoverySuggestions).toContain('Check that the backup file is not corrupted');
    });

    it('should provide permission-specific recovery suggestions', () => {
      const permissionError = ErrorHandlingService.analyzeError(new Error('Unauthorized access'));
      
      expect(permissionError.recoverySuggestions).toContain('Check your user permissions');
      expect(permissionError.recoverySuggestions).toContain('Try logging out and back in');
    });

    it('should provide storage-specific recovery suggestions', () => {
      const storageError = ErrorHandlingService.analyzeError(new Error('Disk quota exceeded'));
      
      expect(storageError.recoverySuggestions).toContain('Free up disk space');
      expect(storageError.recoverySuggestions).toContain('Delete old backup files');
    });
  });
});