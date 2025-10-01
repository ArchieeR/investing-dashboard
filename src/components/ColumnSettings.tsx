import { useState, type CSSProperties } from 'react';
import { usePortfolio } from '../state/portfolioStore';
import type { VisibleColumns } from '../state/types';

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
  borderRadius: '1rem',
  padding: '1.5rem',
  maxWidth: '600px',
  width: '90vw',
  maxHeight: '80vh',
  overflowY: 'auto',
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

const sectionStyle: CSSProperties = {
  marginBottom: '1.5rem',
};

const sectionTitleStyle: CSSProperties = {
  margin: '0 0 0.75rem 0',
  fontSize: '1rem',
  fontWeight: 600,
  color: '#374151',
};

const checkboxGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '0.5rem',
};

const checkboxItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem',
  borderRadius: '0.5rem',
  border: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc',
};

const checkboxStyle: CSSProperties = {
  width: '1rem',
  height: '1rem',
  accentColor: '#2563eb',
};

const labelStyle: CSSProperties = {
  fontSize: '0.875rem',
  color: '#374151',
  cursor: 'pointer',
  userSelect: 'none',
};

const buttonGroupStyle: CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  justifyContent: 'flex-end',
  marginTop: '1.5rem',
  paddingTop: '1rem',
  borderTop: '1px solid #e2e8f0',
};

const buttonStyle: CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: '0.5rem',
  border: '1px solid #d1d5db',
  backgroundColor: '#fff',
  color: '#374151',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 500,
};

const primaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#2563eb',
  borderColor: '#2563eb',
  color: '#fff',
};

const columnLabels: Record<keyof VisibleColumns, string> = {
  section: 'Section',
  theme: 'Theme',
  assetType: 'Asset Type',
  name: 'Name',
  ticker: 'Ticker',
  exchange: 'Exchange',
  account: 'Account',
  price: 'Manual Price (Legacy)',
  livePrice: 'Live Price',
  avgCost: 'Avg Cost',
  qty: 'Quantity',
  value: 'Manual Value',
  liveValue: 'Live Value',
  costBasis: 'Cost Basis',
  dayChange: 'Day Change (£)',
  dayChangePercent: 'Day Change (%)',
  pctOfPortfolio: '% of Portfolio',
  pctOfSection: '% of Section',
  pctOfTheme: '% of Theme',
  targetPct: 'Target %',
  targetDelta: 'Target Δ',
  performance1d: '1D Performance',
  performance2d: '2D Performance',
  performance3d: '3D Performance',
  performance1w: '1W Performance',
  performance1m: '1M Performance',
  performance6m: '6M Performance',
  performanceYtd: 'YTD Performance',
  performance1y: '1Y Performance',
  performance2y: '2Y Performance',
  include: 'Include',
  actions: 'Actions',
};

const columnSections = {
  'Basic Info': ['section', 'theme', 'assetType', 'name', 'ticker', 'exchange', 'account'] as (keyof VisibleColumns)[],
  'Pricing': ['price', 'livePrice', 'avgCost'] as (keyof VisibleColumns)[],
  'Holdings': ['qty', 'value', 'liveValue', 'costBasis'] as (keyof VisibleColumns)[],
  'Daily Changes': ['dayChange', 'dayChangePercent'] as (keyof VisibleColumns)[],
  'Portfolio Metrics': ['pctOfPortfolio', 'pctOfSection', 'pctOfTheme', 'targetPct', 'targetDelta'] as (keyof VisibleColumns)[],
  'Performance': [
    'performance1d', 'performance2d', 'performance3d', 'performance1w', 
    'performance1m', 'performance6m', 'performanceYtd', 'performance1y', 'performance2y'
  ] as (keyof VisibleColumns)[],
  'Controls': ['include', 'actions'] as (keyof VisibleColumns)[],
};

interface ColumnSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ColumnSettings = ({ isOpen, onClose }: ColumnSettingsProps) => {
  const { portfolio, updatePortfolioSettings } = usePortfolio();
  const [localColumns, setLocalColumns] = useState<VisibleColumns>(() => {
    // Ensure we always have a complete VisibleColumns object
    const defaultColumns = Object.keys(columnLabels).reduce((acc, key) => {
      acc[key as keyof VisibleColumns] = false;
      return acc;
    }, {} as VisibleColumns);
    
    return { ...defaultColumns, ...portfolio.settings.visibleColumns };
  });

  if (!isOpen) return null;

  const handleColumnToggle = (column: keyof VisibleColumns) => {
    setLocalColumns(prev => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const handleSave = () => {
    updatePortfolioSettings({ visibleColumns: localColumns });
    onClose();
  };

  const handleCancel = () => {
    const defaultColumns = Object.keys(columnLabels).reduce((acc, key) => {
      acc[key as keyof VisibleColumns] = false;
      return acc;
    }, {} as VisibleColumns);
    
    setLocalColumns({ ...defaultColumns, ...portfolio.settings.visibleColumns });
    onClose();
  };

  const handleSelectAll = () => {
    const allTrue = Object.keys(columnLabels).reduce((acc, key) => {
      acc[key as keyof VisibleColumns] = true;
      return acc;
    }, {} as VisibleColumns);
    setLocalColumns(allTrue);
  };

  const handleSelectNone = () => {
    const allFalse = Object.keys(columnLabels).reduce((acc, key) => {
      acc[key as keyof VisibleColumns] = false;
      return acc;
    }, {} as VisibleColumns);
    setLocalColumns(allFalse);
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Column Visibility</h2>
          <button style={closeButtonStyle} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {Object.entries(columnSections).map(([sectionName, columns]) => (
          <div key={sectionName} style={sectionStyle}>
            <h3 style={sectionTitleStyle}>{sectionName}</h3>
            <div style={checkboxGridStyle}>
              {columns.map(column => (
                <label key={column} style={checkboxItemStyle}>
                  <input
                    type="checkbox"
                    checked={Boolean(localColumns[column])}
                    onChange={() => handleColumnToggle(column)}
                    style={checkboxStyle}
                  />
                  <span style={labelStyle}>{columnLabels[column]}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <div style={buttonGroupStyle}>
          <button style={buttonStyle} onClick={handleSelectNone}>
            Select None
          </button>
          <button style={buttonStyle} onClick={handleSelectAll}>
            Select All
          </button>
          <button style={buttonStyle} onClick={handleCancel}>
            Cancel
          </button>
          <button style={primaryButtonStyle} onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};