import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorNotification } from '../src/components/ErrorNotification';
import type { ErrorDetails } from '../src/services/errorHandlingService';

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

const mockNetworkError: ErrorDetails = {
  code: 'NET_123',
  message: 'Network request failed',
  userMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
  severity: 'low',
  category: 'network',
  isRetryable: true,
  recoverySuggestions: [
    'Check your internet connection',
    'Try again in a few moments',
    'Refresh the page if the problem continues',
  ],
};

const mockValidationError: ErrorDetails = {
  code: 'VAL_456',
  message: 'Invalid backup data format',
  userMessage: 'The backup file appears to be corrupted or invalid. Please try a different backup file.',
  severity: 'medium',
  category: 'validation',
  isRetryable: false,
  recoverySuggestions: [
    'Try restoring from a different backup file',
    'Check that the backup file is not corrupted',
    'Create a new backup if possible',
  ],
};

const mockPermissionError: ErrorDetails = {
  code: 'PER_789',
  message: '403 Forbidden',
  userMessage: 'You don\'t have permission to perform this operation. Please check your access rights.',
  severity: 'high',
  category: 'permission',
  isRetryable: false,
  recoverySuggestions: [
    'Check your user permissions',
    'Try logging out and back in',
    'Contact your administrator',
  ],
};

describe('ErrorNotification', () => {
  const mockOnRetry = vi.fn();
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockWindowOpen.mockClear();
  });

  it('should not render when error is null', () => {
    render(
      <ErrorNotification
        error={null}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.queryByText('Connection Problem')).not.toBeInTheDocument();
  });

  it('should render network error notification correctly', () => {
    render(
      <ErrorNotification
        error={mockNetworkError}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Connection Problem')).toBeInTheDocument();
    expect(screen.getByText(mockNetworkError.userMessage)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Check Connection')).toBeInTheDocument();
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });

  it('should render validation error notification correctly', () => {
    render(
      <ErrorNotification
        error={mockValidationError}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Invalid Data')).toBeInTheDocument();
    expect(screen.getByText(mockValidationError.userMessage)).toBeInTheDocument();
    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument(); // Not retryable
  });

  it('should render permission error notification correctly', () => {
    render(
      <ErrorNotification
        error={mockPermissionError}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText(mockPermissionError.userMessage)).toBeInTheDocument();
    expect(screen.getByText('🚨')).toBeInTheDocument();
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument(); // Not retryable
  });

  it('should call onRetry when retry button is clicked', () => {
    render(
      <ErrorNotification
        error={mockNetworkError}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    fireEvent.click(screen.getByText('Try Again'));
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('should call onDismiss when dismiss button is clicked', () => {
    render(
      <ErrorNotification
        error={mockNetworkError}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    fireEvent.click(screen.getByText('Dismiss'));
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('should call onDismiss when close button is clicked', () => {
    render(
      <ErrorNotification
        error={mockNetworkError}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    fireEvent.click(screen.getByLabelText('Close notification'));
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('should open network help when check connection is clicked', () => {
    render(
      <ErrorNotification
        error={mockNetworkError}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    fireEvent.click(screen.getByText('Check Connection'));
    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://support.google.com/chrome/answer/95617',
      '_blank'
    );
  });

  it('should toggle details when view details is clicked', () => {
    render(
      <ErrorNotification
        error={mockValidationError}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    // Details should not be visible initially
    expect(screen.queryByText('Error Code:')).not.toBeInTheDocument();

    // Click view details
    fireEvent.click(screen.getByText('View Details'));

    // Details should now be visible
    expect(screen.getByText('Error Code:')).toBeInTheDocument();
    expect(screen.getByText(mockValidationError.code)).toBeInTheDocument();
    expect(screen.getByText('Category:')).toBeInTheDocument();
    expect(screen.getByText(mockValidationError.category)).toBeInTheDocument();
    expect(screen.getByText('Technical Details:')).toBeInTheDocument();
    expect(screen.getByText(mockValidationError.message)).toBeInTheDocument();

    // Click view details again to hide
    fireEvent.click(screen.getByText('View Details'));
    expect(screen.queryByText('Error Code:')).not.toBeInTheDocument();
  });

  it('should show recovery suggestions when enabled', () => {
    render(
      <ErrorNotification
        error={mockNetworkError}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
        showRecoverySuggestions={true}
      />
    );

    expect(screen.getByText('Recovery Suggestions:')).toBeInTheDocument();
    expect(screen.getByText('Check your internet connection')).toBeInTheDocument();
    expect(screen.getByText('Try again in a few moments')).toBeInTheDocument();
    expect(screen.getByText('Refresh the page if the problem continues')).toBeInTheDocument();
  });

  it('should hide recovery suggestions when disabled', () => {
    render(
      <ErrorNotification
        error={mockNetworkError}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
        showRecoverySuggestions={false}
      />
    );

    expect(screen.queryByText('Recovery Suggestions:')).not.toBeInTheDocument();
    expect(screen.queryByText('Check your internet connection')).not.toBeInTheDocument();
  });

  it('should auto-hide for low severity errors when enabled', async () => {
    vi.useFakeTimers();

    render(
      <ErrorNotification
        error={mockNetworkError}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
        autoHide={true}
        autoHideDelay={1000}
      />
    );

    // Should be visible initially
    expect(screen.getByText('Connection Problem')).toBeInTheDocument();

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should trigger dismiss after delay
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('should not auto-hide for high severity errors', async () => {
    vi.useFakeTimers();

    render(
      <ErrorNotification
        error={mockPermissionError}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
        autoHide={true}
        autoHideDelay={3000}
      />
    );

    // Should be visible initially
    expect(screen.getByText('Access Denied')).toBeInTheDocument();

    // Fast-forward time
    vi.advanceTimersByTime(3000);

    // Should NOT auto-dismiss for high severity
    expect(mockOnDismiss).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should handle fade out animation', () => {
    render(
      <ErrorNotification
        error={mockNetworkError}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    // Click dismiss - this should call onDismiss immediately now
    fireEvent.click(screen.getByText('Dismiss'));

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('should handle button hover effects', () => {
    render(
      <ErrorNotification
        error={mockNetworkError}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    const retryButton = screen.getByText('Try Again');
    const dismissButton = screen.getByText('Dismiss');

    // Test hover effects (these would normally be handled by CSS, but we can test the event handlers)
    fireEvent.mouseOver(retryButton);
    fireEvent.mouseOut(retryButton);
    fireEvent.mouseOver(dismissButton);
    fireEvent.mouseOut(dismissButton);

    // No errors should be thrown
    expect(retryButton).toBeInTheDocument();
    expect(dismissButton).toBeInTheDocument();
  });

  it('should handle close button hover effects', () => {
    render(
      <ErrorNotification
        error={mockNetworkError}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    const closeButton = screen.getByLabelText('Close notification');

    fireEvent.mouseOver(closeButton);
    fireEvent.mouseOut(closeButton);

    expect(closeButton).toBeInTheDocument();
  });

  it('should not show recovery suggestions when list is empty', () => {
    const errorWithoutSuggestions: ErrorDetails = {
      ...mockNetworkError,
      recoverySuggestions: [],
    };

    render(
      <ErrorNotification
        error={errorWithoutSuggestions}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
        showRecoverySuggestions={true}
      />
    );

    expect(screen.queryByText('Recovery Suggestions:')).not.toBeInTheDocument();
  });
});