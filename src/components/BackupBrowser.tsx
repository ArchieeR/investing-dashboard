import React, { useState, useEffect, type CSSProperties } from 'react';
import { RestoreService, type BackupMetadata, type RestoreResult } from '../services/restoreService';
import type { AppState } from '../state/types';

interface BackupBrowserProps {
  onRestore?: (restoredData: AppState) => void;
  onCancel?: () => void;
  showPreview?: boolean;
  maxHeight?: string;
}

interface BackupPreview {
  portfolioCount: number;
  holdingsCount: number;
  totalValue: number;
  currency: string;
  portfolios: Array<{
    name: string;
    holdingsCount: number;
    value: number;
  }>;
}

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  padding: '1rem',
  border: '1px solid #e5e7eb',
  borderRadius: '0.5rem',
  backgroundColor: '#fff',
  maxWidth: '800px',
  width: '100%',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: '0.5rem',
  borderBottom: '1px solid #e5e7eb',
};

const titleStyle: CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#111827',
  margin: 0,
};

const backupListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  maxHeight: '400px',
  overflowY: 'auto',
  border: '1px solid #e5e7eb',
  borderRadius: '0.375rem',
  padding: '0.5rem',
};

const backupItemStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  backgroundColor: '#f9fafb',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const selectedBackupItemStyle: CSSProperties = {
  ...backupItemStyle,
  backgroundColor: '#dbeafe',
  borderColor: '#3b82f6',
};

const backupInfoStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
};

const backupTimestampStyle: CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#111827',
};

const backupMetaStyle: CSSProperties = {
  fontSize: '0.75rem',
  color: '#6b7280',
};

const previewStyle: CSSProperties = {
  padding: '1rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  backgroundColor: '#f9fafb',
};

const previewTitleStyle: CSSProperties = {
  fontSize: '1rem',
  fontWeight: 500,
  color: '#111827',
  marginBottom: '0.75rem',
};

const previewContentStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
};

const previewSectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const previewLabelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 500,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const previewValueStyle: CSSProperties = {
  fontSize: '0.875rem',
  color: '#111827',
};

const buttonGroupStyle: CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  justifyContent: 'flex-end',
  paddingTop: '0.5rem',
  borderTop: '1px solid #e5e7eb',
};

const buttonStyle: CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
  transition: 'all 0.2s ease',
};

const primaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#2563eb',
  color: '#fff',
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#f3f4f6',
  color: '#374151',
  border: '1px solid #d1d5db',
};

const loadingStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  color: '#6b7280',
  fontSize: '0.875rem',
};

const errorStyle: CSSProperties = {
  padding: '1rem',
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '0.375rem',
  color: '#dc2626',
  fontSize: '0.875rem',
};

const emptyStateStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '3rem 1rem',
  color: '#6b7280',
  textAlign: 'center',
};

const BackupBrowser: React.FC<BackupBrowserProps> = ({
  onRestore,
  onCancel,
  showPreview = true,
  maxHeight = '600px',
}) => {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(null);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const availableBackups = await RestoreService.getAvailableBackups();
      setBackups(availableBackups);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load backups';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePreview = async (backup: BackupMetadata) => {
    try {
      // For now, we'll generate a preview from the metadata
      // In a full implementation, we might fetch the actual backup content
      const preview: BackupPreview = {
        portfolioCount: backup.portfolioCount,
        holdingsCount: backup.holdingsCount,
        totalValue: 0, // Would need to calculate from actual data
        currency: 'GBP', // Default, would need to read from backup
        portfolios: [], // Would need to read from actual backup data
      };
      
      setPreview(preview);
    } catch (err) {
      console.error('Failed to generate preview:', err);
      setPreview(null);
    }
  };

  const handleBackupSelect = (backup: BackupMetadata) => {
    setSelectedBackup(backup);
    if (showPreview) {
      generatePreview(backup);
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;

    try {
      setIsRestoring(true);
      setError(null);
      
      const result: RestoreResult = await RestoreService.restoreFromBackup(selectedBackup.filePath);
      
      if (result.success && result.restoredData) {
        onRestore?.(result.restoredData);
      } else {
        setError(result.error || 'Restore operation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Restore failed';
      setError(errorMessage);
    } finally {
      setIsRestoring(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      // Parse the timestamp format from backup files: 2025-09-23T21-24-33-089Z
      const cleanTimestamp = timestamp.replace(/-(\d{2})-(\d{2})-(\d{3})Z$/, ':$1:$2.$3Z');
      const date = new Date(cleanTimestamp);
      
      if (isNaN(date.getTime())) {
        // Fallback: try parsing as ISO string directly
        const fallbackDate = new Date(timestamp);
        if (isNaN(fallbackDate.getTime())) {
          return timestamp;
        }
        return fallbackDate.toLocaleString();
      }
      
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    try {
      // Parse the timestamp format from backup files: 2025-09-23T21-24-33-089Z
      const cleanTimestamp = timestamp.replace(/-(\d{2})-(\d{2})-(\d{3})Z$/, ':$1:$2.$3Z');
      const date = new Date(cleanTimestamp);
      
      if (isNaN(date.getTime())) {
        // Fallback: try parsing as ISO string directly
        const fallbackDate = new Date(timestamp);
        if (isNaN(fallbackDate.getTime())) {
          return 'Unknown time';
        }
        return formatRelativeTimeFromDate(fallbackDate);
      }
      
      return formatRelativeTimeFromDate(date);
    } catch {
      return 'Unknown time';
    }
  };

  const formatRelativeTimeFromDate = (date: Date) => {
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
      return `${diffDays} days ago`;
    }
  };

  if (isLoading) {
    return (
      <div style={{ ...containerStyle, maxHeight }}>
        <div style={loadingStyle}>
          <span>Loading backup files...</span>
        </div>
      </div>
    );
  }

  if (error && backups.length === 0) {
    return (
      <div style={{ ...containerStyle, maxHeight }}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>Backup Browser</h3>
          {onCancel && (
            <button
              onClick={onCancel}
              style={secondaryButtonStyle}
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>
        <div style={errorStyle}>
          <strong>Error loading backups:</strong> {error}
        </div>
        <div style={buttonGroupStyle}>
          <button onClick={loadBackups} style={primaryButtonStyle}>
            Retry
          </button>
          {onCancel && (
            <button onClick={onCancel} style={secondaryButtonStyle}>
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...containerStyle, maxHeight }}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>Backup Browser</h3>
        {onCancel && (
          <button
            onClick={onCancel}
            style={secondaryButtonStyle}
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div style={errorStyle}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {!backups || backups.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>No Backup Files Found</h4>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            No backup files are available for restoration.
          </p>
        </div>
      ) : (
        <>
          <div style={backupListStyle}>
            {backups.map((backup) => (
              <div
                key={backup.filePath}
                style={selectedBackup?.filePath === backup.filePath ? selectedBackupItemStyle : backupItemStyle}
                onClick={() => handleBackupSelect(backup)}
                onMouseOver={(e) => {
                  if (selectedBackup?.filePath !== backup.filePath) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedBackup?.filePath !== backup.filePath) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Select backup from ${formatTimestamp(backup.timestamp)}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleBackupSelect(backup);
                  }
                }}
              >
                <div style={backupInfoStyle}>
                  <div style={backupTimestampStyle}>
                    {formatTimestamp(backup.timestamp)}
                  </div>
                  <div style={backupMetaStyle}>
                    {backup.portfolioCount} portfolio{backup.portfolioCount === 1 ? '' : 's'} • {backup.holdingsCount} holding{backup.holdingsCount === 1 ? '' : 's'}
                  </div>
                  <div style={backupMetaStyle}>
                    {formatRelativeTime(backup.timestamp)}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {backup.filePath}
                </div>
              </div>
            ))}
          </div>

          {showPreview && selectedBackup && preview && (
            <div style={previewStyle}>
              <div style={previewTitleStyle}>Backup Preview</div>
              <div style={previewContentStyle}>
                <div style={previewSectionStyle}>
                  <div style={previewLabelStyle}>Portfolios</div>
                  <div style={previewValueStyle}>{preview.portfolioCount}</div>
                </div>
                <div style={previewSectionStyle}>
                  <div style={previewLabelStyle}>Total Holdings</div>
                  <div style={previewValueStyle}>{preview.holdingsCount}</div>
                </div>
                <div style={previewSectionStyle}>
                  <div style={previewLabelStyle}>File</div>
                  <div style={previewValueStyle}>{selectedBackup.filePath}</div>
                </div>
                <div style={previewSectionStyle}>
                  <div style={previewLabelStyle}>Created</div>
                  <div style={previewValueStyle}>{formatTimestamp(selectedBackup.timestamp)}</div>
                </div>
              </div>
            </div>
          )}

          <div style={buttonGroupStyle}>
            <button
              onClick={handleRestore}
              disabled={!selectedBackup || isRestoring}
              style={{
                ...primaryButtonStyle,
                opacity: !selectedBackup || isRestoring ? 0.6 : 1,
                cursor: !selectedBackup || isRestoring ? 'not-allowed' : 'pointer',
              }}
            >
              {isRestoring ? 'Restoring...' : 'Restore Selected'}
            </button>
            {onCancel && (
              <button onClick={onCancel} style={secondaryButtonStyle}>
                Cancel
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BackupBrowser;