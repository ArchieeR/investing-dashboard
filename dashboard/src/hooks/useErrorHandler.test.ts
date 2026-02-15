import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useErrorHandler, retryWithBackoff, delay } from './useErrorHandler';

vi.mock('@/services/logging', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/components/shared/Toast', () => ({
  toast: vi.fn(),
}));

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns handleError function', () => {
    const { result } = renderHook(() => useErrorHandler());
    expect(typeof result.current.handleError).toBe('function');
  });

  it('categorises network errors correctly', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = new TypeError('fetch');
    const categorised = result.current.handleError(error);
    expect(categorised.category).toBe('network');
  });

  it('categorises validation errors correctly', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = new Error('Invalid email format');
    const categorised = result.current.handleError(error);
    expect(categorised.category).toBe('validation');
    expect(categorised.severity).toBe('low');
  });

  it('categorises unknown errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    const categorised = result.current.handleError('string error');
    expect(categorised.category).toBe('unknown');
    expect(categorised.severity).toBe('medium');
  });
});

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('returns result on first successful attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await retryWithBackoff(fn, 3, 100, 1000);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure', async () => {
    vi.useRealTimers();
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const result = await retryWithBackoff(fn, 3, 10, 100);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after max retries', async () => {
    vi.useRealTimers();
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));

    await expect(retryWithBackoff(fn, 2, 10, 100)).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });
});

describe('delay', () => {
  it('resolves after specified time', async () => {
    vi.useFakeTimers();
    const promise = delay(1000);
    vi.advanceTimersByTime(1000);
    await expect(promise).resolves.toBeUndefined();
  });
});
