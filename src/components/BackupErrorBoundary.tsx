import React, { Component, ReactNode } from 'react';

interface BackupErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

interface BackupErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void, retryCount: number) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
}

/**
 * Error boundary specifically designed for backup and restore operations.
 * Provides retry functionality and user-friendly error messages.
 */
export class BackupErrorBoundary extends Component<BackupErrorBoundaryProps, BackupErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: BackupErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<BackupErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Log error for debugging
    console.error('BackupErrorBoundary caught an error:', error, errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  private handleAutoRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      return;
    }

    // Auto-retry after a delay for transient errors
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
    
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  private isTransientError = (error: Error): boolean => {
    const transientErrorPatterns = [
      /network/i,
      /fetch/i,
      /timeout/i,
      /connection/i,
      /temporary/i,
      /503/,
      /502/,
      /504/,
    ];

    return transientErrorPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  };

  private getErrorSeverity = (error: Error): 'low' | 'medium' | 'high' => {
    const message = error.message.toLowerCase();
    
    // Network/temporary errors are low severity
    if (this.isTransientError(error)) {
      return 'low';
    }

    // Permission and storage errors are high severity
    if (message.includes('permission') || message.includes('denied') ||
        message.includes('forbidden') || message.includes('unauthorized') ||
        message.includes('storage') || message.includes('space')) {
      return 'high';
    }

    // Validation errors are medium severity
    if (message.includes('validation') || message.includes('invalid') ||
        message.includes('backup data format')) {
      return 'medium';
    }

    // Unknown errors are medium severity by default
    return 'medium';
  };

  private getRecoverySuggestions = (error: Error): string[] => {
    const suggestions: string[] = [];
    const message = error.message.toLowerCase();

    if (this.isTransientError(error)) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try again in a few moments');
      suggestions.push('Refresh the page if the problem persists');
    } else if (message.includes('validation') || message.includes('invalid') || message.includes('backup data format')) {
      suggestions.push('Check that your portfolio data is valid');
      suggestions.push('Try restoring from a different backup file');
      suggestions.push('Contact support if the issue continues');
    } else if (message.includes('storage') || message.includes('space')) {
      suggestions.push('Ensure you have sufficient storage space');
      suggestions.push('Check file permissions');
      suggestions.push('Try creating a manual backup');
    } else if (message.includes('backup') && message.includes('failed')) {
      suggestions.push('Ensure you have sufficient storage space');
      suggestions.push('Check file permissions');
      suggestions.push('Try creating a manual backup');
    } else if (message.includes('restore') && message.includes('failed')) {
      suggestions.push('Verify the backup file is not corrupted');
      suggestions.push('Try restoring from a different backup');
      suggestions.push('Check that the backup file exists');
    } else {
      suggestions.push('Refresh the page and try again');
      suggestions.push('Check the browser console for more details');
      suggestions.push('Contact support if the problem persists');
    }

    return suggestions;
  };

  private renderDefaultFallback = (error: Error, retry: () => void, retryCount: number) => {
    const { maxRetries = 3 } = this.props;
    const severity = this.getErrorSeverity(error);
    const suggestions = this.getRecoverySuggestions(error);
    const canRetry = retryCount < maxRetries;
    const isTransient = this.isTransientError(error);

    const containerStyle: React.CSSProperties = {
      padding: '1.5rem',
      borderRadius: '0.5rem',
      border: '1px solid',
      backgroundColor: severity === 'high' ? '#fef2f2' : severity === 'medium' ? '#fef3c7' : '#f0f9ff',
      borderColor: severity === 'high' ? '#fecaca' : severity === 'medium' ? '#fde68a' : '#bae6fd',
      color: severity === 'high' ? '#dc2626' : severity === 'medium' ? '#d97706' : '#0369a1',
    };

    const iconStyle: React.CSSProperties = {
      fontSize: '1.5rem',
      marginBottom: '0.5rem',
    };

    const titleStyle: React.CSSProperties = {
      fontSize: '1.125rem',
      fontWeight: 600,
      marginBottom: '0.5rem',
    };

    const messageStyle: React.CSSProperties = {
      fontSize: '0.875rem',
      marginBottom: '1rem',
      lineHeight: '1.5',
    };

    const suggestionListStyle: React.CSSProperties = {
      fontSize: '0.75rem',
      marginBottom: '1rem',
      paddingLeft: '1rem',
    };

    const buttonContainerStyle: React.CSSProperties = {
      display: 'flex',
      gap: '0.75rem',
      alignItems: 'center',
    };

    const retryButtonStyle: React.CSSProperties = {
      backgroundColor: severity === 'high' ? '#dc2626' : severity === 'medium' ? '#d97706' : '#2563eb',
      color: '#fff',
      border: 'none',
      borderRadius: '0.375rem',
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      fontWeight: 500,
      cursor: canRetry ? 'pointer' : 'not-allowed',
      opacity: canRetry ? 1 : 0.5,
      transition: 'background-color 0.2s ease',
    };

    const refreshButtonStyle: React.CSSProperties = {
      backgroundColor: 'transparent',
      color: 'inherit',
      border: '1px solid currentColor',
      borderRadius: '0.375rem',
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
    };

    const retryInfoStyle: React.CSSProperties = {
      fontSize: '0.75rem',
      opacity: 0.8,
    };

    return (
      <div style={containerStyle}>
        <div style={iconStyle}>
          {severity === 'high' ? '🚨' : severity === 'medium' ? '⚠️' : 'ℹ️'}
        </div>
        
        <div style={titleStyle}>
          {severity === 'high' ? 'Critical Error' : severity === 'medium' ? 'Warning' : 'Temporary Issue'}
        </div>
        
        <div style={messageStyle}>
          {isTransient 
            ? 'A temporary error occurred while processing your backup or restore operation.'
            : 'An error occurred during the backup or restore operation.'
          }
        </div>

        <div style={messageStyle}>
          <strong>Error details:</strong> {error.message}
        </div>

        {suggestions.length > 0 && (
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
              Suggested actions:
            </div>
            <ul style={suggestionListStyle}>
              {suggestions.map((suggestion, index) => (
                <li key={index} style={{ marginBottom: '0.25rem' }}>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={buttonContainerStyle}>
          {canRetry && (
            <button
              onClick={retry}
              style={retryButtonStyle}
              onMouseOver={(e) => {
                if (canRetry) {
                  e.currentTarget.style.opacity = '0.9';
                }
              }}
              onMouseOut={(e) => {
                if (canRetry) {
                  e.currentTarget.style.opacity = '1';
                }
              }}
            >
              {isTransient ? 'Retry Automatically' : 'Try Again'}
            </button>
          )}
          
          <button
            onClick={() => window.location.reload()}
            style={refreshButtonStyle}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Refresh Page
          </button>

          <div style={retryInfoStyle}>
            Attempt {retryCount + 1} of {maxRetries + 1}
          </div>
        </div>
      </div>
    );
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Auto-retry for transient errors
      if (this.isTransientError(error) && retryCount === 0) {
        this.handleAutoRetry();
      }

      if (fallback) {
        return fallback(error, this.handleRetry, retryCount);
      }

      return this.renderDefaultFallback(error, this.handleRetry, retryCount);
    }

    return children;
  }
}

export default BackupErrorBoundary;