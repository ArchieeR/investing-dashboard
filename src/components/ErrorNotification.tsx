import React, { useState, useEffect } from 'react';
import { ErrorHandlingService, type ErrorDetails } from '../services/errorHandlingService';

interface ErrorNotificationProps {
  error: ErrorDetails | null;
  onRetry?: () => void;
  onDismiss: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  showRecoverySuggestions?: boolean;
}

/**
 * Enhanced error notification component that displays user-friendly error messages
 * with recovery suggestions and action buttons.
 */
export function ErrorNotification({
  error,
  onRetry,
  onDismiss,
  autoHide = false,
  autoHideDelay = 5000,
  showRecoverySuggestions = true,
}: ErrorNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      
      if (autoHide && error.severity === 'low') {
        const timer = setTimeout(() => {
          onDismiss();
          setShowDetails(false);
        }, autoHideDelay);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [error, autoHide, autoHideDelay, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss();
      setShowDetails(false);
    }, 300); // Allow fade out animation
  };

  const handleImmediateDismiss = () => {
    onDismiss();
    setShowDetails(false);
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const handleCheckNetwork = () => {
    // Open network settings or provide guidance
    window.open('https://support.google.com/chrome/answer/95617', '_blank');
  };

  const handleViewDetails = () => {
    setShowDetails(!showDetails);
  };

  if (!error || !isVisible) {
    return null;
  }

  const notification = ErrorHandlingService.createErrorNotification(error);
  
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '1rem',
    right: '1rem',
    maxWidth: '400px',
    backgroundColor: '#fff',
    borderRadius: '0.5rem',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
    border: '1px solid',
    borderColor: notification.type === 'error' ? '#fecaca' : 
                 notification.type === 'warning' ? '#fde68a' : '#bae6fd',
    zIndex: 1000,
    transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.3s ease-in-out',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: notification.type === 'error' ? '#fef2f2' : 
                     notification.type === 'warning' ? '#fefbf2' : '#f0f9ff',
  };

  const titleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: notification.type === 'error' ? '#dc2626' : 
           notification.type === 'warning' ? '#d97706' : '#0369a1',
    marginBottom: '0.5rem',
  };

  const messageStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#374151',
    lineHeight: '1.5',
  };

  const contentStyle: React.CSSProperties = {
    padding: '1rem',
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem',
    flexWrap: 'wrap',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: 500,
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: notification.type === 'error' ? '#dc2626' : 
                     notification.type === 'warning' ? '#d97706' : '#2563eb',
    color: '#fff',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: '1px solid #d1d5db',
  };

  const detailsStyle: React.CSSProperties = {
    marginTop: '1rem',
    padding: '0.75rem',
    backgroundColor: '#f9fafb',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    color: '#6b7280',
  };

  const suggestionListStyle: React.CSSProperties = {
    marginTop: '0.5rem',
    paddingLeft: '1rem',
    fontSize: '0.75rem',
    color: '#6b7280',
  };

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '0.75rem',
    right: '0.75rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
    fontSize: '1.25rem',
    padding: '0.25rem',
    borderRadius: '0.25rem',
    transition: 'color 0.2s ease',
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'error':
        return '🚨';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const renderActionButton = (action: { label: string; action: string }) => {
    const isPrimary = action.action === 'retry' || action.action === 'check-network';
    const style = isPrimary ? primaryButtonStyle : secondaryButtonStyle;

    const handleClick = () => {
      switch (action.action) {
        case 'retry':
          handleRetry();
          break;
        case 'check-network':
          handleCheckNetwork();
          break;
        case 'view-details':
          handleViewDetails();
          break;
        case 'dismiss':
          handleImmediateDismiss();
          break;
        default:
          break;
      }
    };

    return (
      <button
        key={action.action}
        onClick={handleClick}
        style={style}
        onMouseOver={(e) => {
          if (isPrimary) {
            e.currentTarget.style.opacity = '0.9';
          } else {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }
        }}
        onMouseOut={(e) => {
          if (isPrimary) {
            e.currentTarget.style.opacity = '1';
          } else {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {action.label}
      </button>
    );
  };

  return (
    <div style={containerStyle}>
      <button
        onClick={handleImmediateDismiss}
        style={closeButtonStyle}
        onMouseOver={(e) => {
          e.currentTarget.style.color = '#6b7280';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = '#9ca3af';
        }}
        aria-label="Close notification"
      >
        ✕
      </button>

      <div style={headerStyle}>
        <div style={titleStyle}>
          <span>{getIcon()}</span>
          {notification.title}
        </div>
        <div style={messageStyle}>
          {notification.message}
        </div>
      </div>

      <div style={contentStyle}>
        <div style={actionsStyle}>
          {notification.actions.map(renderActionButton)}
        </div>

        {showDetails && (
          <div style={detailsStyle}>
            <div><strong>Error Code:</strong> {error.code}</div>
            <div><strong>Category:</strong> {error.category}</div>
            <div><strong>Technical Details:</strong> {error.message}</div>
          </div>
        )}

        {showRecoverySuggestions && error.recoverySuggestions.length > 0 && (
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, marginTop: '1rem', marginBottom: '0.5rem' }}>
              Recovery Suggestions:
            </div>
            <ul style={suggestionListStyle}>
              {error.recoverySuggestions.map((suggestion, index) => (
                <li key={index} style={{ marginBottom: '0.25rem' }}>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default ErrorNotification;