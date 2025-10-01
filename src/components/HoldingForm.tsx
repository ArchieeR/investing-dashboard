import { useState, useEffect, type CSSProperties } from 'react';
import { usePortfolio } from '../state/portfolioStore';
import { createHolding, type Holding, type AssetType, type Exchange } from '../state/types';
import { fetchCompanyInfo } from '../services/companyLookup';

interface HoldingFormProps {
  onClose: () => void;
  initialHolding?: Partial<Holding>;
}

const formStyle: CSSProperties = {
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
  borderRadius: '0.75rem',
  padding: '2rem',
  width: '90%',
  maxWidth: '500px',
  maxHeight: '90vh',
  overflow: 'auto',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};

const headerStyle: CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 600,
  marginBottom: '1.5rem',
  color: '#0f172a',
};

const fieldStyle: CSSProperties = {
  marginBottom: '1rem',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#374151',
  marginBottom: '0.5rem',
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.5rem',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
};

const selectStyle: CSSProperties = {
  ...inputStyle,
  backgroundColor: '#fff',
};

const buttonStyle: CSSProperties = {
  padding: '0.75rem 1.5rem',
  borderRadius: '0.5rem',
  border: 'none',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer',
  marginRight: '0.5rem',
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
  fontSize: '0.75rem',
  color: '#6b7280',
  fontStyle: 'italic',
};

const HoldingForm = ({ onClose, initialHolding }: HoldingFormProps) => {
  const { portfolio, addHolding } = usePortfolio();
  
  // Form state
  const [ticker, setTicker] = useState(initialHolding?.ticker || '');
  const [name, setName] = useState(initialHolding?.name || '');
  const [section, setSection] = useState(initialHolding?.section || portfolio.lists.sections[0] || 'Core');
  const [theme, setTheme] = useState(initialHolding?.theme || portfolio.lists.themes[0] || 'All');
  const [assetType, setAssetType] = useState<AssetType>(initialHolding?.assetType || 'Stock');
  const [exchange, setExchange] = useState<Exchange>(initialHolding?.exchange || 'NYSE');
  const [account, setAccount] = useState(initialHolding?.account || portfolio.lists.accounts[0] || 'Brokerage');
  const [price, setPrice] = useState(initialHolding?.price?.toString() || '');
  const [qty, setQty] = useState(initialHolding?.qty?.toString() || '');
  const [targetPct, setTargetPct] = useState(initialHolding?.targetPct?.toString() || '');
  
  // Loading state for company lookup
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  const [companyLookupError, setCompanyLookupError] = useState('');

  // Auto-fetch company name when ticker changes
  useEffect(() => {
    const fetchCompanyName = async () => {
      if (!ticker.trim() || ticker.trim().length < 2) {
        setName('');
        return;
      }

      setIsLoadingCompany(true);
      setCompanyLookupError('');
      
      try {
        const companyInfo = await fetchCompanyInfo(ticker.trim(), exchange);
        if (companyInfo && companyInfo.name !== ticker.toUpperCase()) {
          setName(companyInfo.name);
        }
      } catch (error) {
        setCompanyLookupError('Could not fetch company name');
        console.warn('Company lookup failed:', error);
      } finally {
        setIsLoadingCompany(false);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(fetchCompanyName, 500);
    return () => clearTimeout(timeoutId);
  }, [ticker, exchange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticker.trim()) {
      alert('Please enter a ticker symbol');
      return;
    }

    const holding = createHolding({
      ticker: ticker.trim().toUpperCase(),
      name: name.trim() || ticker.trim().toUpperCase(),
      section,
      theme,
      assetType,
      exchange,
      account,
      price: parseFloat(price) || 0,
      qty: parseFloat(qty) || 0,
      targetPct: targetPct ? parseFloat(targetPct) : undefined,
    });

    addHolding(holding);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={formStyle} onClick={handleOverlayClick}>
      <div style={modalStyle}>
        <h2 style={headerStyle}>Add New Holding</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Ticker Symbol *</label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              style={inputStyle}
              placeholder="e.g. AAPL, VUKE.L"
              autoFocus
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              Company Name
              {isLoadingCompany && <span style={loadingStyle}> (fetching...)</span>}
              {companyLookupError && <span style={{ ...loadingStyle, color: '#dc2626' }}> ({companyLookupError})</span>}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              placeholder="Will auto-fill from ticker"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>Asset Type</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as AssetType)}
                style={selectStyle}
              >
                <option value="Stock">Stock</option>
                <option value="ETF">ETF</option>
                <option value="Fund">Fund</option>
                <option value="Bond">Bond</option>
                <option value="Crypto">Crypto</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Exchange</label>
              <select
                value={exchange}
                onChange={(e) => setExchange(e.target.value as Exchange)}
                style={selectStyle}
              >
                <option value="NYSE">NYSE</option>
                <option value="NASDAQ">NASDAQ</option>
                <option value="LSE">LSE</option>
                <option value="AMS">AMS (.AS)</option>
                <option value="XETRA">XETRA (.DE)</option>
                <option value="XC">XC</option>
                <option value="VI">Vienna (.VI)</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>Section</label>
              <select
                value={section}
                onChange={(e) => {
                  const selectedSection = e.target.value;
                  setSection(selectedSection);
                  
                  // When section changes, check if current theme is compatible
                  const themeSection = portfolio.lists.themeSections?.[theme];
                  if (theme && themeSection && themeSection !== selectedSection) {
                    // Current theme belongs to a different section, find a compatible theme
                    const compatibleTheme = portfolio.lists.themes.find(t =>
                      portfolio.lists.themeSections?.[t] === selectedSection
                    ) || portfolio.lists.themes[0] || 'All';
                    
                    setTheme(compatibleTheme);
                  }
                }}
                style={selectStyle}
              >
                {portfolio.lists.sections.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Theme</label>
              <select
                value={theme}
                onChange={(e) => {
                  const selectedTheme = e.target.value;
                  setTheme(selectedTheme);
                  
                  // When theme changes, automatically update section to match
                  const assignedSection = portfolio.lists.themeSections?.[selectedTheme];
                  if (assignedSection) {
                    setSection(assignedSection);
                  }
                }}
                style={selectStyle}
              >
                {portfolio.lists.themes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Account</label>
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              style={selectStyle}
            >
              {portfolio.lists.accounts.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={inputStyle}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={labelStyle}>Quantity</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                style={inputStyle}
                placeholder="0"
              />
            </div>

            <div>
              <label style={labelStyle}>Target % of Theme</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={targetPct}
                onChange={(e) => setTargetPct(e.target.value)}
                style={inputStyle}
                placeholder="Optional"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="button" onClick={onClose} style={secondaryButtonStyle}>
              Cancel
            </button>
            <button type="submit" style={primaryButtonStyle}>
              Add Holding
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HoldingForm;