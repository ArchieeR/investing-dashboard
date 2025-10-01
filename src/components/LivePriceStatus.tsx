import { type CSSProperties } from 'react';
import type { LivePriceData } from '../hooks/useLivePrices';

const statusContainerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.5rem 0.75rem',
  borderRadius: '0.5rem',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  fontSize: '0.875rem',
};

const statusDotStyle: CSSProperties = {
  width: '0.5rem',
  height: '0.5rem',
  borderRadius: '50%',
  flexShrink: 0,
};

const refreshButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#2563eb',
  cursor: 'pointer',
  fontSize: '0.875rem',
  padding: '0.25rem 0.5rem',
  borderRadius: '0.25rem',
  textDecoration: 'underline',
};

const refreshButtonDisabledStyle: CSSProperties = {
  ...refreshButtonStyle,
  color: '#9ca3af',
  cursor: 'not-allowed',
  textDecoration: 'none',
};

interface LivePriceStatusProps {
  data: LivePriceData;
  onRefresh: () => void;
}

export const LivePriceStatus = ({ data, onRefresh }: LivePriceStatusProps) => {
  const { isLoading, lastUpdated, error, quotes } = data;

  const getStatusColor = (): string => {
    if (error) return '#ef4444'; // red
    if (isLoading) return '#f59e0b'; // amber
    if (lastUpdated) return '#10b981'; // green
    return '#6b7280'; // gray
  };

  const getStatusText = (): string => {
    if (error) return `Error: ${error}`;
    if (isLoading) return 'Updating prices...';
    if (lastUpdated) {
      const quotesCount = quotes.size;
      const timeAgo = Math.round((Date.now() - lastUpdated.getTime()) / 60000);
      
      // Show currency info if we have quotes
      const currencies = new Set<string>();
      quotes.forEach(quote => {
        if (quote.currency) currencies.add(quote.currency);
      });
      
      const currencyInfo = currencies.size > 0 ? ` (${Array.from(currencies).join(', ')} → GBP)` : '';
      return `${quotesCount} prices updated ${timeAgo}m ago${currencyInfo}`;
    }
    return 'No price data';
  };

  return (
    <div style={statusContainerStyle}>
      <div
        style={{
          ...statusDotStyle,
          backgroundColor: getStatusColor(),
        }}
      />
      <span style={{ color: '#374151' }}>{getStatusText()}</span>
      <button
        style={isLoading ? refreshButtonDisabledStyle : refreshButtonStyle}
        onClick={onRefresh}
        disabled={isLoading}
      >
        {isLoading ? 'Updating...' : 'Refresh'}
      </button>
    </div>
  );
};