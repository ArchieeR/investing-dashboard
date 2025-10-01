import React, { useState, useEffect, type CSSProperties } from 'react';
import { useBackup } from '../hooks/useBackup';
import { usePortfolio } from '../state/portfolioStore';

interface BackupStatusProps {
  variant?: 'compact' | 'detailed';
  showRetryButton?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

const containerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem',
  borderRadius: '0.5rem',
  border: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
  fontSize: '0.875rem',
};

const compactContainerStyle: CSSProperties = {
  ...containerStyle,
  padding: '0.5rem',
  fontSize: '0.75rem',
  gap: '0.5rem',
};

const statusIndicatorStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontWeight: 500,
};

const timestampStyle: CSSProperties = {
  color: '#6b7280',
  fontSize: '0.75rem',
};

const compactTimestampStyle: CSSProperties = {
  ...timestampStyle,
  fontSize: '0.6875rem',
};

const errorStyle: CSSProperties = {
  color: '#dc2626',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const loadingStyle: CSSProperties = {
  color: '#2563eb',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const successStyle: CSSProperties = {
  color: '#059669',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const retryButtonStyle: CSSProperties = {
  backgroundColor: '#dc2626',
  color: '#fff',
  border: 'none',
  borderRadius: '0.375rem',
  padding: '0.375rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

const spinnerStyle: CSSProperties = {
  display: 'inline-block',
  width: '1rem',
  height: '1rem',
  border: '2px solid #e5e7eb',
  borderTop: '2px solid #2563eb',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

// Add CSS animation for spinner
const spinnerKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const BackupStatus: React.FC<BackupStatusProps> = ({
  variant = 'detailed',
  showRetryButton = true,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds default
}) => {
  const { createBackup, isBackingUp, lastBackupTime, backupError, clearError } = useBackup();
  const portfolioContext = usePortfolio();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Add spinner CSS to document head
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = spinnerKeyframes;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const getAppState = () => {
    return {
      portfolios: portfolioContext.portfolios,
      activePortfolioId: portfolioContext.portfolio.id,
      filters: portfolioContext.filters,
      playground: portfolioContext.playground,
      [portfolioContext.portfolio.id]: portfolioContext.portfolio,
    };
  };

  const handleRetry = async () => {
    try {
      clearError();
      const appState = getAppState();
      await createBackup(appState as any);
    } catch (error) {
      console.error('Retry backup failed:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) {
        return 'Just now';
      } else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return 'Unknown';
    }
  };

  const formatFullTimestamp = (timestamp: string) => {
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

  const getStatusContent = () => {
    if (isBackingUp) {
      return (
        <div style={loadingStyle}>
          <div style={spinnerStyle}></div>
          <span>Backing up...</span>
        </div>
      );
    }

    if (backupError) {
      return (
        <div style={errorStyle}>
          <span>❌</span>
          <div>
            <div>Backup failed</div>
            {variant === 'detailed' && (
              <div style={{ fontSize: '0.6875rem', opacity: 0.8, marginTop: '0.25rem' }}>
                {backupError}
              </div>
            )}
          </div>
          {showRetryButton && (
            <button
              onClick={handleRetry}
              style={retryButtonStyle}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#b91c1c';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626';
              }}
              title="Retry backup operation"
            >
              Retry
            </button>
          )}
        </div>
      );
    }

    if (lastBackupTime) {
      return (
        <div style={successStyle}>
          <span>✅</span>
          <div>
            <div>Backup up to date</div>
            <div style={variant === 'compact' ? compactTimestampStyle : timestampStyle}>
              {formatTimestamp(lastBackupTime)}
              {variant === 'detailed' && (
                <span title={formatFullTimestamp(lastBackupTime)} style={{ marginLeft: '0.5rem' }}>
                  ({formatFullTimestamp(lastBackupTime)})
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={statusIndicatorStyle}>
        <span>⚠️</span>
        <div>
          <div>No backup information</div>
          <div style={variant === 'compact' ? compactTimestampStyle : timestampStyle}>
            Status unknown
          </div>
        </div>
      </div>
    );
  };

  const containerStyleToUse = variant === 'compact' ? compactContainerStyle : containerStyle;
  const titleAttribute = variant === 'compact' ? 'Backup status - click for details' : undefined;

  return (
    <div 
      style={containerStyleToUse}
      title={titleAttribute}
    >
      {getStatusContent()}
      {autoRefresh && variant === 'detailed' && (
        <div style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: '#9ca3af' }}>
          Auto-refresh enabled
        </div>
      )}
    </div>
  );
};

export default BackupStatus;