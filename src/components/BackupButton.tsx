import React, { useState, type CSSProperties } from 'react';
import { useBackup } from '../hooks/useBackup';
import { usePortfolio } from '../state/portfolioStore';
import ErrorNotification from './ErrorNotification';
import BackupErrorBoundary from './BackupErrorBoundary';

interface BackupButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  showLastBackupTime?: boolean;
}

const getButtonStyle = (variant: 'primary' | 'secondary', size: 'sm' | 'md' | 'lg', disabled: boolean): CSSProperties => {
  const baseStyle: CSSProperties = {
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: size === 'sm' ? '0.75rem' : size === 'md' ? '0.875rem' : '1rem',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.6 : 1,
  };

  const sizeStyles = {
    sm: { padding: '0.5rem 0.75rem' },
    md: { padding: '0.75rem 1rem' },
    lg: { padding: '1rem 1.5rem' },
  };

  const variantStyles = {
    primary: {
      backgroundColor: '#2563eb',
      color: '#fff',
    },
    secondary: {
      backgroundColor: '#f3f4f6',
      color: '#374151',
      border: '1px solid #d1d5db',
    },
  };

  return {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
};

const messageStyle: CSSProperties = {
  fontSize: '0.75rem',
  marginTop: '0.5rem',
  padding: '0.5rem',
  borderRadius: '0.375rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const successMessageStyle: CSSProperties = {
  ...messageStyle,
  backgroundColor: '#dcfce7',
  color: '#166534',
  border: '1px solid #bbf7d0',
};

const errorMessageStyle: CSSProperties = {
  ...messageStyle,
  backgroundColor: '#fef2f2',
  color: '#dc2626',
  border: '1px solid #fecaca',
};

const timestampStyle: CSSProperties = {
  fontSize: '0.75rem',
  color: '#6b7280',
  marginTop: '0.25rem',
};

const BackupButton: React.FC<BackupButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  showLastBackupTime = false,
}) => {
  const { createBackup, isBackingUp, lastBackupTime, backupError, errorDetails, clearError, retryLastBackup } = useBackup();
  const portfolioContext = usePortfolio();
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastBackupResult, setLastBackupResult] = useState<{ success: boolean; timestamp: string; error?: string; attemptCount?: number } | null>(null);

  // Get the full app state - we need to access the reducer state from the context
  // Since we don't have direct access to the full state, we'll construct it from available context
  const getAppState = () => {
    // This is a simplified approach - in a real implementation, we might need to
    // access the full state differently or modify the context to expose it
    return {
      portfolios: portfolioContext.portfolios,
      activePortfolioId: portfolioContext.portfolio.id,
      filters: portfolioContext.filters,
      playground: portfolioContext.playground,
      // Add the current portfolio data
      [portfolioContext.portfolio.id]: portfolioContext.portfolio,
    };
  };

  const handleBackup = async () => {
    try {
      clearError();
      setShowFeedback(false);
      
      const appState = getAppState();
      const result = await createBackup(appState as any);
      
      setLastBackupResult(result);
      setShowFeedback(true);
      
      // Auto-hide success message after 3 seconds
      if (result.success) {
        setTimeout(() => {
          setShowFeedback(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Backup failed:', error);
      setLastBackupResult({
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        attemptCount: 1,
      });
      setShowFeedback(true);
    }
  };

  const handleRetryBackup = async () => {
    try {
      setShowFeedback(false);
      const result = await retryLastBackup();
      setLastBackupResult(result);
      setShowFeedback(true);
      
      if (result.success) {
        setTimeout(() => {
          setShowFeedback(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Retry backup failed:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return timestamp;
      }
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const dismissMessage = () => {
    setShowFeedback(false);
    clearError();
  };

  return (
    <BackupErrorBoundary
      onError={(error, errorInfo) => {
        console.error('BackupButton error boundary caught:', error, errorInfo);
      }}
      maxRetries={2}
    >
      <div>
        <button
          onClick={handleBackup}
          disabled={isBackingUp}
          style={getButtonStyle(variant, size, isBackingUp)}
          title="Create an immediate backup of your portfolio data"
        >
          {isBackingUp ? (
            <>
              <span>⏳</span>
              Backing up...
            </>
          ) : (
            <>
              <span>💾</span>
              Backup Now
            </>
          )}
        </button>

        {showLastBackupTime && lastBackupTime && (
          <div style={timestampStyle}>
            Last backup: {formatTimestamp(lastBackupTime)}
          </div>
        )}

        {showFeedback && lastBackupResult && (
          <div style={lastBackupResult.success ? successMessageStyle : errorMessageStyle}>
            <span>{lastBackupResult.success ? '✅' : '❌'}</span>
            <div style={{ flex: 1 }}>
              {lastBackupResult.success ? (
                <>
                  <div>Backup created successfully!</div>
                  <div style={{ fontSize: '0.6875rem', opacity: 0.8 }}>
                    {formatTimestamp(lastBackupResult.timestamp)}
                    {lastBackupResult.attemptCount && lastBackupResult.attemptCount > 1 && (
                      <span> (after {lastBackupResult.attemptCount} attempts)</span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>Backup failed</div>
                  {lastBackupResult.error && (
                    <div style={{ fontSize: '0.6875rem', opacity: 0.8 }}>
                      {lastBackupResult.error}
                      {lastBackupResult.attemptCount && lastBackupResult.attemptCount > 1 && (
                        <span> (after {lastBackupResult.attemptCount} attempts)</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <button
              onClick={dismissMessage}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '0.25rem',
                color: 'inherit',
                opacity: 0.7,
              }}
              title="Dismiss"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* Enhanced error notification */}
        <ErrorNotification
          error={errorDetails}
          onRetry={handleRetryBackup}
          onDismiss={clearError}
          autoHide={true}
          autoHideDelay={8000}
          showRecoverySuggestions={true}
        />

        {/* Fallback for simple errors without detailed error info */}
        {backupError && !errorDetails && !showFeedback && (
          <div style={errorMessageStyle}>
            <span>❌</span>
            <div style={{ flex: 1 }}>
              <div>Backup Error</div>
              <div style={{ fontSize: '0.6875rem', opacity: 0.8 }}>
                {backupError}
              </div>
            </div>
            <button
              onClick={clearError}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '0.25rem',
                color: 'inherit',
                opacity: 0.7,
              }}
              title="Dismiss"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </BackupErrorBoundary>
  );
};

export default BackupButton;