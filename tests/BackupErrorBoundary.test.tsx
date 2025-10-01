import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackupErrorBoundary } from '../src/components/BackupErrorBoundary';

// Mock component that can throw errors
const ThrowError: React.FC<{ shouldThrow: boolean; errorMessage?: string }> = ({ 
  shouldThrow, 
  errorMessage = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>No error</div>;
};

describe('BackupErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when there is no error', () => {
    render(
      <BackupErrorBoundary>
        <ThrowError shouldThrow={false} />
      </BackupErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should render error UI when child component throws', () => {
    render(
      <BackupErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Network error" />
      </BackupErrorBoundary>
    );

    expect(screen.getByText(/Temporary Issue/)).toBeInTheDocument();
    expect(screen.getByText(/Network error/)).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = vi.fn();
    
    render(
      <BackupErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} errorMessage="Test error" />
      </BackupErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('should show retry button for retryable errors', () => {
    render(
      <BackupErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Network timeout" />
      </BackupErrorBoundary>
    );

    expect(screen.getByText('Retry Automatically')).toBeInTheDocument();
  });

  it('should show try again button for non-transient retryable errors', () => {
    render(
      <BackupErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Connection failed" />
      </BackupErrorBoundary>
    );

    expect(screen.getByText('Retry Automatically')).toBeInTheDocument();
  });

  it('should not show retry button when max retries reached', () => {
    const { rerender } = render(
      <BackupErrorBoundary maxRetries={1}>
        <ThrowError shouldThrow={true} errorMessage="Network error" />
      </BackupErrorBoundary>
    );

    // First error - should show retry
    expect(screen.getByText('Retry Automatically')).toBeInTheDocument();

    // Click retry
    fireEvent.click(screen.getByText('Retry Automatically'));

    // Rerender with error again (simulating retry failure)
    rerender(
      <BackupErrorBoundary maxRetries={1}>
        <ThrowError shouldThrow={true} errorMessage="Network error" />
      </BackupErrorBoundary>
    );

    // Should not show retry button after max retries
    expect(screen.queryByText('Retry Automatically')).not.toBeInTheDocument();
  });

  it('should show refresh page button', () => {
    render(
      <BackupErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Test error" />
      </BackupErrorBoundary>
    );

    expect(screen.getByText('Refresh Page')).toBeInTheDocument();
  });

  it('should display retry count information', () => {
    render(
      <BackupErrorBoundary maxRetries={3}>
        <ThrowError shouldThrow={true} errorMessage="Network error" />
      </BackupErrorBoundary>
    );

    expect(screen.getByText('Attempt 1 of 4')).toBeInTheDocument();
  });

  it('should handle retry functionality', async () => {
    let shouldThrow = true;
    
    const TestComponent = () => (
      <BackupErrorBoundary>
        <ThrowError shouldThrow={shouldThrow} errorMessage="Network error" />
      </BackupErrorBoundary>
    );

    const { rerender } = render(<TestComponent />);

    // Should show error initially
    expect(screen.getByText(/Network error/)).toBeInTheDocument();
    
    // Click retry
    const retryButton = screen.getByText('Retry Automatically');
    fireEvent.click(retryButton);

    // Simulate successful retry
    shouldThrow = false;
    rerender(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  it('should categorize errors correctly', () => {
    // Test high severity error
    render(
      <BackupErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Permission denied" />
      </BackupErrorBoundary>
    );

    expect(screen.getByText('🚨')).toBeInTheDocument();
    expect(screen.getByText('Critical Error')).toBeInTheDocument();
  });

  it('should show appropriate recovery suggestions', () => {
    render(
      <BackupErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Network connection failed" />
      </BackupErrorBoundary>
    );

    expect(screen.getByText('Check your internet connection')).toBeInTheDocument();
    expect(screen.getByText('Try again in a few moments')).toBeInTheDocument();
  });

  it('should use custom fallback when provided', () => {
    const customFallback = (error: Error, retry: () => void, retryCount: number) => (
      <div>
        <div>Custom error: {error.message}</div>
        <div>Retry count: {retryCount}</div>
        <button onClick={retry}>Custom Retry</button>
      </div>
    );

    render(
      <BackupErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} errorMessage="Custom error message" />
      </BackupErrorBoundary>
    );

    expect(screen.getByText('Custom error: Custom error message')).toBeInTheDocument();
    expect(screen.getByText('Retry count: 0')).toBeInTheDocument();
    expect(screen.getByText('Custom Retry')).toBeInTheDocument();
  });

  it('should handle validation errors appropriately', () => {
    render(
      <BackupErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Invalid backup data format" />
      </BackupErrorBoundary>
    );

    expect(screen.getByText('⚠️')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Check that your portfolio data is valid')).toBeInTheDocument();
  });

  it('should handle storage errors appropriately', () => {
    render(
      <BackupErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Insufficient storage space" />
      </BackupErrorBoundary>
    );

    expect(screen.getByText('🚨')).toBeInTheDocument();
    expect(screen.getByText('Critical Error')).toBeInTheDocument();
    expect(screen.getByText('Ensure you have sufficient storage space')).toBeInTheDocument();
  });

  it('should auto-retry transient errors', async () => {
    vi.useFakeTimers();
    
    render(
      <BackupErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Network timeout" />
      </BackupErrorBoundary>
    );

    // Should show error initially
    expect(screen.getByText(/Network timeout/)).toBeInTheDocument();

    // Fast-forward time to trigger auto-retry
    vi.advanceTimersByTime(1000);

    vi.useRealTimers();
  });

  it('should clean up timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    
    const { unmount } = render(
      <BackupErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Network error" />
      </BackupErrorBoundary>
    );

    unmount();

    // clearTimeout should be called during cleanup
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('should handle unknown error types gracefully', () => {
    render(
      <BackupErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Something unexpected happened" />
      </BackupErrorBoundary>
    );

    expect(screen.getByText('⚠️')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Refresh the page and try again')).toBeInTheDocument();
  });
});