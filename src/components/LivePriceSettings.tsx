import { useState, type CSSProperties } from 'react';
import { usePortfolio } from '../state/portfolioStore';

const settingsContainerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '0.75rem 1rem',
  borderRadius: '0.5rem',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  fontSize: '0.875rem',
  flexWrap: 'wrap',
};

const toggleStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const checkboxStyle: CSSProperties = {
  width: '1rem',
  height: '1rem',
  accentColor: '#2563eb',
};

const selectStyle: CSSProperties = {
  padding: '0.25rem 0.5rem',
  borderRadius: '0.25rem',
  border: '1px solid #d1d5db',
  fontSize: '0.875rem',
  backgroundColor: '#fff',
};

const labelStyle: CSSProperties = {
  color: '#374151',
  fontWeight: 500,
};

export const LivePriceSettings = () => {
  const { portfolio, updatePortfolioSettings } = usePortfolio();
  const [localSettings, setLocalSettings] = useState({
    enableLivePrices: portfolio.settings.enableLivePrices,
    livePriceUpdateInterval: portfolio.settings.livePriceUpdateInterval,
  });

  const handleToggleLivePrices = (enabled: boolean) => {
    const newSettings = { ...localSettings, enableLivePrices: enabled };
    setLocalSettings(newSettings);
    updatePortfolioSettings(newSettings);
  };

  const handleUpdateInterval = (interval: number) => {
    const newSettings = { ...localSettings, livePriceUpdateInterval: interval };
    setLocalSettings(newSettings);
    updatePortfolioSettings(newSettings);
  };

  return (
    <div style={settingsContainerStyle}>
      <label style={toggleStyle}>
        <input
          type="checkbox"
          checked={localSettings.enableLivePrices}
          onChange={(e) => handleToggleLivePrices(e.target.checked)}
          style={checkboxStyle}
        />
        <span style={labelStyle}>Live Prices</span>
      </label>

      {localSettings.enableLivePrices && (
        <>
          <label style={toggleStyle}>
            <span style={labelStyle}>Update every:</span>
            <select
              value={localSettings.livePriceUpdateInterval}
              onChange={(e) => handleUpdateInterval(Number(e.target.value))}
              style={selectStyle}
            >
              <option value={1}>1 minute</option>
              <option value={2}>2 minutes</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
          </label>
        </>
      )}
    </div>
  );
};