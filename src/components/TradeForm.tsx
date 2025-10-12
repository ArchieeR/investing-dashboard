import { useState, type CSSProperties, type FormEvent } from 'react';
import { usePortfolio } from '../state/portfolioStore';
import type { TradeType } from '../state/types';

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle: CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '16px',
  padding: '1.5rem',
  maxWidth: '500px',
  width: '90vw',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid #e2e8f0',
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#0f172a',
};

const closeButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer',
  color: '#64748b',
  padding: '0.25rem',
  borderRadius: '0.25rem',
};

const formStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const fieldStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const labelStyle: CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#374151',
};

const inputStyle: CSSProperties = {
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid #dadce0',
  fontSize: '14px',
  backgroundColor: '#fff',
  transition: 'border-color 0.15s ease',
  outline: 'none',
};

const selectStyle: CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

const buttonGroupStyle: CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  justifyContent: 'flex-end',
  marginTop: '1rem',
  paddingTop: '1rem',
  borderTop: '1px solid #e8eaed',
};

const buttonStyle: CSSProperties = {
  padding: '10px 24px',
  borderRadius: '8px',
  border: '1px solid #dadce0',
  backgroundColor: '#fff',
  color: '#5f6368',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'all 0.15s ease',
};

const primaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#1a73e8',
  borderColor: '#1a73e8',
  color: '#fff',
};

const errorStyle: CSSProperties = {
  color: '#dc2626',
  fontSize: '0.875rem',
  marginTop: '0.25rem',
};

interface TradeFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialTicker?: string;
  initialHoldingId?: string;
}

export const TradeForm = ({ isOpen, onClose, initialTicker = '', initialHoldingId }: TradeFormProps) => {
  const { portfolio, recordTrade, addHolding } = usePortfolio();
  const [formData, setFormData] = useState({
    ticker: initialTicker,
    type: 'buy' as TradeType,
    date: new Date().toISOString().slice(0, 10),
    price: '',
    qty: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.ticker.trim()) {
        throw new Error('Ticker is required');
      }
      
      const price = parseFloat(formData.price);
      if (!price || price <= 0) {
        throw new Error('Price must be a positive number');
      }

      const qty = parseFloat(formData.qty);
      if (!qty || qty <= 0) {
        throw new Error('Quantity must be a positive number');
      }

      if (!formData.date) {
        throw new Error('Date is required');
      }

      // Find or create holding
      let holdingId = initialHoldingId;
      if (!holdingId) {
        const existingHolding = portfolio.holdings.find(
          h => h.ticker.toLowerCase() === formData.ticker.toLowerCase()
        );
        
        if (existingHolding) {
          holdingId = existingHolding.id;
        } else {
          // Auto-create the holding for new tickers
          console.log(`Creating new holding for ticker: ${formData.ticker}`);
          holdingId = addHolding({
            ticker: formData.ticker.toUpperCase(),
            name: formData.ticker.toUpperCase(), // Use ticker as name initially
            assetType: 'Stock', // Default to Stock
            price: formData.price, // Use trade price as initial price
            qty: 0, // Start with 0 quantity, trade will update this
          });
        }
      }

      // Record the trade
      recordTrade(holdingId, {
        type: formData.type,
        date: formData.date,
        price,
        qty,
      });

      // Reset form and close
      setFormData({
        ticker: '',
        type: 'buy',
        date: new Date().toISOString().slice(0, 10),
        price: '',
        qty: '',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record trade');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      ticker: initialTicker,
      type: 'buy',
      date: new Date().toISOString().slice(0, 10),
      price: '',
      qty: '',
    });
    setError(null);
    onClose();
  };

  const availableTickers = portfolio.holdings
    .filter(h => h.ticker && h.ticker.trim() !== '')
    .map(h => h.ticker)
    .sort();

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Record Trade</h2>
          <button style={closeButtonStyle} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form style={formStyle} onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Ticker</label>
            {initialTicker ? (
              <input
                type="text"
                value={formData.ticker}
                readOnly
                style={{ ...inputStyle, backgroundColor: '#f9fafb', color: '#6b7280' }}
              />
            ) : (
              <div>
                <input
                  type="text"
                  value={formData.ticker}
                  onChange={(e) => setFormData(prev => ({ ...prev, ticker: e.target.value.toUpperCase() }))}
                  placeholder="Enter ticker (e.g. AAPL, MSFT)"
                  style={inputStyle}
                  required
                />
                {availableTickers.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      Existing tickers:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {availableTickers.slice(0, 8).map(ticker => (
                        <button
                          key={ticker}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, ticker }))}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            backgroundColor: formData.ticker === ticker ? '#3b82f6' : '#f1f5f9',
                            color: formData.ticker === ticker ? '#fff' : '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                          }}
                        >
                          {ticker}
                        </button>
                      ))}
                      {availableTickers.length > 8 && (
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', padding: '0.25rem' }}>
                          +{availableTickers.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as TradeType }))}
              style={selectStyle}
              required
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              style={inputStyle}
              required
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              style={inputStyle}
              placeholder="0.00"
              required
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Quantity</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.qty}
              onChange={(e) => setFormData(prev => ({ ...prev, qty: e.target.value }))}
              style={inputStyle}
              placeholder="0"
              required
            />
          </div>

          {error && <div style={errorStyle}>{error}</div>}

          <div style={buttonGroupStyle}>
            <button type="button" style={buttonStyle} onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" style={primaryButtonStyle} disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};