import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useBackup } from '../src/hooks/useBackup';
import type { AppState } from '../src/state/types';

// Mock the ErrorHandlingService
vi.mock('../src/services/errorHandlingService', () => ({
  ErrorHandlingService: {
    withRetry: vi.fn(),
    analyzeError: vi.fn(),
  },
}));

const mockErrorHandlingService = vi.mocked(await import('../src/services/errorHandlingService')).ErrorHandlingService;

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockPortfolioData: AppState = {
  portfolios: [
    {
      id: 'test-portfolio',
      name: 'Test Portfolio',
      holdings: [],
      settings: { currency: 'GBP' },
      lists: { watchlist: [], sold: [] },
    },
  ],
  activePortfolioId: 'test-portfolio',
  filters: {},
  playground: { enabled: false },
};

describe('useBackup (Enhanced)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create backup successfully with retry service', async () => {
    const mockResult = { success: true };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });

    mockErrorHandlingService.withRetry.mockResolvedValue({
      success: true,
      data: mockResult,
      attemptCount: 1,
    });

    const { result } = renderHook(() => useBackup());

    let backupResult;
    await act(async () => {
      backupResult = await result.current.createBackup(mockPortfolioData);
    });

    expect(backupResult.success).toBe(true);
    expect(backupResult.attemptCount).toBe(1);
    expect(result.current.isBackingUp).toBe(false);
    expect(result.current.lastBackupTime).toBeTruthy();
    expect(result.current.backupError).toBeNull();
  });

  it('should handle backup failure with error details', async () => {
    const mockErrorDetails = {
      code: 'NET_123',
      message: 'Network request failed',
      userMessage: 'Unable to connect to the server',
      severity: 'low' as const,
      category: 'network' as const,
      isRetryable: true,
      recoverySuggestions: ['Check your internet connection'],
    };

    mockErrorHandlingService.withRetry.mockResolvedValue({
      success: false,
      error: mockErrorDetails,
      attemptCount: 3,
    });

    const { result } = renderHook(() => useBackup());

    let backupResult;
    await act(async () => {
      backupResult = await result.current.createBackup(mockPortfolioData);
    });

    expect(backupResult.success).toBe(false);
    expect(backupResult.error).toBe(mockErrorDetails.userMessage);
    expect(backupResult.errorDetails).toEqual(mockErrorDetails);
    expect(backupResult.attemptCount).toBe(3);
    expect(result.current.backupError).toBe(mockErrorDetails.userMessage);
    expect(result.current.errorDetails).toEqual(mockErrorDetails);
  });

  it('should handle abort errors correctly', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';

    mockErrorHandlingService.withRetry.mockRejectedValue(abortError);

    const { result } = renderHook(() => useBackup());

    let backupResult;
    await act(async () => {
      backupResult = await result.current.createBackup(mockPortfolioData);
    });

    expect(backupResult.success).toBe(false);
    expect(backupResult.error).toBe('Backup cancelled');
  });

  it('should handle unexpected errors with error analysis', async () => {
    const unexpectedError = new Error('Unexpected error');
    const mockErrorDetails = {
      code: 'UNK_456',
      message: 'Unexpected error',
      userMessage: 'An unexpected error occurred',
      severity: 'medium' as const,
      category: 'unknown' as const,
      isRetryable: false,
      recoverySuggestions: ['Refresh the page and try again'],
    };

    mockErrorHandlingService.withRetry.mockRejectedValue(unexpectedError);
    mockErrorHandlingService.analyzeError.mockReturnValue(mockErrorDetails);

    const { result } = renderHook(() => useBackup());

    let backupResult;
    await act(async () => {
      backupResult = await result.current.createBackup(mockPortfolioData);
    });

    expect(backupResult.success).toBe(false);
    expect(backupResult.error).toBe(mockErrorDetails.userMessage);
    expect(backupResult.errorDetails).toEqual(mockErrorDetails);
    expect(mockErrorHandlingService.analyzeError).toHaveBeenCalledWith(unexpectedError);
  });

  it('should pass retry config to withRetry', async () => {
    const mockResult = { success: true };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });

    mockErrorHandlingService.withRetry.mockResolvedValue({
      success: true,
      data: mockResult,
      attemptCount: 1,
    });

    const { result } = renderHook(() => useBackup());

    const customRetryConfig = {
      maxAttempts: 5,
      baseDelay: 2000,
    };

    await act(async () => {
      await result.current.createBackup(mockPortfolioData, customRetryConfig);
    });

    expect(mockErrorHandlingService.withRetry).toHaveBeenCalledWith(
      expect.any(Function),
      customRetryConfig
    );
  });

  it('should clear errors correctly', async () => {
    const mockErrorDetails = {
      code: 'NET_123',
      message: 'Network error',
      userMessage: 'Connection failed',
      severity: 'low' as const,
      category: 'network' as const,
      isRetryable: true,
      recoverySuggestions: [],
    };

    mockErrorHandlingService.withRetry.mockResolvedValue({
      success: false,
      error: mockErrorDetails,
      attemptCount: 1,
    });

    const { result } = renderHook(() => useBackup());

    // Create an error
    await act(async () => {
      await result.current.createBackup(mockPortfolioData);
    });

    expect(result.current.backupError).toBeTruthy();
    expect(result.current.errorDetails).toBeTruthy();

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.backupError).toBeNull();
    expect(result.current.errorDetails).toBeNull();
  });

  it('should retry last backup operation', async () => {
    // First, create a backup to store the portfolio data
    const mockResult = { success: true };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });

    mockErrorHandlingService.withRetry.mockResolvedValue({
      success: true,
      data: mockResult,
      attemptCount: 1,
    });

    const { result } = renderHook(() => useBackup());

    // Initial backup
    await act(async () => {
      await result.current.createBackup(mockPortfolioData);
    });

    // Reset mocks for retry
    mockErrorHandlingService.withRetry.mockClear();
    mockErrorHandlingService.withRetry.mockResolvedValue({
      success: true,
      data: mockResult,
      attemptCount: 2,
    });

    // Retry last backup
    let retryResult;
    await act(async () => {
      retryResult = await result.current.retryLastBackup();
    });

    expect(retryResult.success).toBe(true);
    expect(retryResult.attemptCount).toBe(2);
    expect(mockErrorHandlingService.withRetry).toHaveBeenCalledTimes(1);
  });

  it('should handle retry when no previous backup data exists', async () => {
    const mockErrorDetails = {
      code: 'UNK_789',
      message: 'No previous backup data available for retry',
      userMessage: 'No previous backup data available for retry',
      severity: 'medium' as const,
      category: 'unknown' as const,
      isRetryable: false,
      recoverySuggestions: [],
    };

    mockErrorHandlingService.analyzeError.mockReturnValue(mockErrorDetails);

    const { result } = renderHook(() => useBackup());

    let retryResult;
    await act(async () => {
      retryResult = await result.current.retryLastBackup();
    });

    expect(retryResult.success).toBe(false);
    expect(retryResult.error).toBe(mockErrorDetails.userMessage);
    expect(retryResult.errorDetails).toEqual(mockErrorDetails);
  });

  it('should cancel previous backup operation when starting new one', async () => {
    const mockResult = { success: true };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });

    mockErrorHandlingService.withRetry.mockImplementation(async (operation) => {
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        success: true,
        data: await operation(),
        attemptCount: 1,
      };
    });

    const { result } = renderHook(() => useBackup());

    // Start first backup
    const firstBackupPromise = act(async () => {
      return result.current.createBackup(mockPortfolioData);
    });

    // Start second backup before first completes
    const secondBackupPromise = act(async () => {
      return result.current.createBackup(mockPortfolioData);
    });

    const [firstResult, secondResult] = await Promise.all([
      firstBackupPromise,
      secondBackupPromise,
    ]);

    // Both should complete, but the abort controller should have been reset
    expect(secondResult.success).toBe(true);
  });


});