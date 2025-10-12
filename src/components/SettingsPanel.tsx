import { useState, useEffect, type CSSProperties, type DragEvent } from 'react';
import { usePortfolio } from '../state/portfolioStore';
import type { Exchange, AssetType } from '../state/types';
import BackupBrowser from './BackupBrowser';
import BackupButton from './BackupButton';
import BackupStatus from './BackupStatus';
import RestoreFromFileButton from './RestoreFromFileButton';
import DirectRestoreButton from './DirectRestoreButton';

// Styles
const containerStyle: CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '#f9fafb',
};

const sidebarStyle: CSSProperties = {
  width: '250px',
  backgroundColor: '#fff',
  borderRight: '1px solid #e5e7eb',
  padding: '2rem 0',
  position: 'sticky',
  top: 0,
  height: '100vh',
  overflowY: 'auto',
};

const contentStyle: CSSProperties = {
  flex: 1,
  padding: '2rem',
  maxWidth: '800px',
  margin: '0 auto',
};

const sidebarHeaderStyle: CSSProperties = {
  padding: '0 1.5rem',
  marginBottom: '2rem',
};

const sidebarTitleStyle: CSSProperties = {
  fontSize: '1.125rem',
  fontWeight: 600,
  color: '#1f2937',
  margin: 0,
};

const tabListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  padding: '0 1rem',
};

const tabButtonStyle: CSSProperties = {
  padding: '0.75rem 1rem',
  border: 'none',
  backgroundColor: 'transparent',
  color: '#6b7280',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 500,
  textAlign: 'left',
  borderRadius: '0.5rem',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const activeTabButtonStyle: CSSProperties = {
  ...tabButtonStyle,
  backgroundColor: '#3b82f6',
  color: '#fff',
  fontWeight: 600,
};

const headerStyle: CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 600,
  marginBottom: '2rem',
  color: '#1f2937',
  borderBottom: '2px solid #e5e7eb',
  paddingBottom: '0.5rem',
};

const sectionStyle: CSSProperties = {
  marginBottom: '2rem',
  padding: '1.5rem',
  backgroundColor: '#fff',
  borderRadius: '12px',
  border: '1px solid #e8eaed',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
};

const sectionHeaderStyle: CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 600,
  marginBottom: '1rem',
  color: '#374151',
};

const listContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const listItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem',
  backgroundColor: '#f9fafb',
  borderRadius: '0.25rem',
  border: '1px solid #d1d5db',
  cursor: 'grab',
  transition: 'all 0.2s ease',
};

const draggingItemStyle: CSSProperties = {
  ...listItemStyle,
  backgroundColor: '#eff6ff',
  border: '1px solid #3b82f6',
  cursor: 'grabbing',
  opacity: 0.8,
};

const dropZoneStyle: CSSProperties = {
  height: '2px',
  backgroundColor: '#3b82f6',
  borderRadius: '1px',
  margin: '0.25rem 0',
  opacity: 0,
  transition: 'opacity 0.2s ease',
};

const activeDropZoneStyle: CSSProperties = {
  ...dropZoneStyle,
  opacity: 1,
};

const dragHandleStyle: CSSProperties = {
  cursor: 'grab',
  color: '#9ca3af',
  fontSize: '1rem',
  padding: '0.25rem',
  userSelect: 'none',
};

const inputStyle: CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  border: '1px solid #dadce0',
  borderRadius: '8px',
  fontSize: '14px',
  transition: 'border-color 0.15s ease',
  outline: 'none',
};

const buttonStyle: CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none',
  fontSize: '14px',
  cursor: 'pointer',
  fontWeight: 500,
  transition: 'all 0.15s ease',
};

const addButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#1a73e8',
  color: '#fff',
};

const removeButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#ea4335',
  color: '#fff',
};

const editButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#fff',
  color: '#5f6368',
  border: '1px solid #dadce0',
};

const saveButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#1a73e8',
  color: '#fff',
  fontSize: '14px',
  padding: '10px 24px',
};

const addFormStyle: CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginTop: '1rem',
};

const backButtonStyle: CSSProperties = {
  position: 'fixed',
  bottom: '2rem',
  right: '2rem',
  ...saveButtonStyle,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
};

// Types and constants
type SettingsTab = 'general' | 'exchanges' | 'assets' | 'data';

const TABS: Array<{ id: SettingsTab; label: string; icon: string }> = [
  { id: 'general', label: 'General Settings', icon: '⚙️' },
  { id: 'exchanges', label: 'Exchanges', icon: '🏛️' },
  { id: 'assets', label: 'Asset Types', icon: '📊' },
  { id: 'data', label: 'Data Management', icon: '💾' },
];

interface SettingsPanelProps {
  onBack?: () => void;
}

export const SettingsPanel = ({ onBack }: SettingsPanelProps = {}) => {
  const { portfolio, addListItem, removeListItem, renameListItem, updatePortfolioSettings, reorderList, importHoldings, restorePortfolioBackup } = usePortfolio();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const [newExchange, setNewExchange] = useState('');
  const [newAssetType, setNewAssetType] = useState('');
  const [editingItem, setEditingItem] = useState<{ type: string; index: number; value: string } | null>(null);
  
  // Drag and drop state
  const [dragState, setDragState] = useState<{ type: 'sections' | 'themes' | 'accounts'; index: number } | null>(null);
  const [dragOver, setDragOver] = useState<{ type: 'sections' | 'themes' | 'accounts'; index: number } | null>(null);
  
  // CSV import/export state
  const [importAccount, setImportAccount] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  
  // Backup/restore state
  const [showBackupBrowser, setShowBackupBrowser] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  
  // Portfolio settings state
  const [settings, setSettings] = useState({
    currency: portfolio.settings.currency,
    lockTotal: portfolio.settings.lockTotal,
    enableLivePrices: portfolio.settings.enableLivePrices,
    livePriceUpdateInterval: portfolio.settings.livePriceUpdateInterval,
  });
  
  // Editable exchanges and asset types (stored in localStorage for now)
  const [exchanges, setExchanges] = useState<Array<{ value: string; label: string; description: string }>>(() => {
    const saved = localStorage.getItem('portfolio-exchanges');
    return saved ? JSON.parse(saved) : [
      { value: 'LSE', label: 'London Stock Exchange', description: 'UK stocks and ETFs (adds .L suffix)' },
      { value: 'NYSE', label: 'New York Stock Exchange', description: 'US large-cap stocks' },
      { value: 'NASDAQ', label: 'NASDAQ', description: 'US tech and growth stocks' },
      { value: 'AMS', label: 'Amsterdam Stock Exchange', description: 'Dutch stocks and ETFs (adds .AS suffix)' },
      { value: 'XETRA', label: 'XETRA (German Exchange)', description: 'German stocks and ETFs (adds .DE suffix)' },
      { value: 'XC', label: 'XC Exchange', description: 'European exchange (no suffix)' },
      { value: 'VI', label: 'Vienna Stock Exchange', description: 'Austrian stocks and ETFs (adds .VI suffix)' },
      { value: 'Other', label: 'Other Exchange', description: 'Custom or international exchanges' },
    ];
  });
  
  const [assetTypes, setAssetTypes] = useState<Array<{ value: string; description: string }>>(() => {
    const saved = localStorage.getItem('portfolio-asset-types');
    return saved ? JSON.parse(saved) : [
      { value: 'ETF', description: 'Exchange-traded funds' },
      { value: 'Stock', description: 'Individual company shares' },
      { value: 'Crypto', description: 'Cryptocurrency holdings' },
      { value: 'Cash', description: 'Cash and cash equivalents' },
      { value: 'Bond', description: 'Government and corporate bonds' },
      { value: 'Fund', description: 'Mutual funds and unit trusts' },
      { value: 'Other', description: 'Other investment types' },
    ];
  });
  
  // Track if settings have changed
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const hasChanges = 
      settings.currency !== portfolio.settings.currency ||
      settings.lockTotal !== portfolio.settings.lockTotal ||
      settings.enableLivePrices !== portfolio.settings.enableLivePrices ||
      settings.livePriceUpdateInterval !== portfolio.settings.livePriceUpdateInterval;
    
    setHasUnsavedChanges(hasChanges);
  }, [settings, portfolio.settings]);

  // Save exchanges and asset types to localStorage
  useEffect(() => {
    localStorage.setItem('portfolio-exchanges', JSON.stringify(exchanges));
  }, [exchanges]);

  useEffect(() => {
    localStorage.setItem('portfolio-asset-types', JSON.stringify(assetTypes));
  }, [assetTypes]);

  // Handlers


  const handleAddExchange = () => {
    if (newExchange.trim()) {
      const code = newExchange.trim().toUpperCase();
      if (!exchanges.find(e => e.value === code)) {
        setExchanges([...exchanges, {
          value: code,
          label: code,
          description: 'Custom exchange'
        }]);
        setNewExchange('');
      }
    }
  };

  const handleAddAssetType = () => {
    if (newAssetType.trim()) {
      const type = newAssetType.trim();
      if (!assetTypes.find(a => a.value === type)) {
        setAssetTypes([...assetTypes, {
          value: type,
          description: 'Custom asset type'
        }]);
        setNewAssetType('');
      }
    }
  };

  const handleRename = (type: 'sections' | 'themes' | 'accounts', oldValue: string, newValue: string) => {
    if (newValue.trim() && newValue !== oldValue) {
      renameListItem(type, oldValue, newValue.trim());
    }
    setEditingItem(null);
  };

  const handleRemove = (type: 'sections' | 'themes' | 'accounts', value: string) => {
    if (window.confirm(`Remove "${value}"? This will update all holdings using this ${type.slice(0, -1)}.`)) {
      removeListItem(type, value);
    }
  };

  const handleRemoveExchange = (value: string) => {
    if (exchanges.length > 1 && window.confirm(`Remove exchange "${value}"?`)) {
      setExchanges(exchanges.filter(e => e.value !== value));
    }
  };

  const handleRemoveAssetType = (value: string) => {
    if (assetTypes.length > 1 && window.confirm(`Remove asset type "${value}"?`)) {
      setAssetTypes(assetTypes.filter(a => a.value !== value));
    }
  };

  const handleSaveSettings = () => {
    updatePortfolioSettings(settings);
    setHasUnsavedChanges(false);
  };

  const updateSetting = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Drag and drop handlers
  const handleDragStart = (type: 'sections' | 'themes' | 'accounts', index: number) => (event: DragEvent<HTMLDivElement>) => {
    console.log(`Drag start: ${type} at index ${index}`);
    setDragState({ type, index });
    setDragOver({ type, index });
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', `${type}:${index}`);
    }
  };

  const handleDragOver = (type: 'sections' | 'themes' | 'accounts', index: number) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!dragState || dragState.type !== type) {
      return;
    }
    setDragOver({ type, index });
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (type: 'sections' | 'themes' | 'accounts', index: number) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    console.log(`Drop: ${type} from ${dragState?.index} to ${index}`);
    if (!dragState || dragState.type !== type) {
      console.log('Drop cancelled: invalid drag state');
      return;
    }

    if (dragState.index !== index) {
      console.log(`Calling reorderList(${type}, ${dragState.index}, ${index})`);
      reorderList(type, dragState.index, index);
    }
    setDragState(null);
    setDragOver(null);
  };

  const handleDragEnd = () => {
    console.log('Drag end');
    setDragState(null);
    setDragOver(null);
  };

  // CSV import/export functions
  const handleExport = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const rows = portfolio.holdings.map(({ id: _id, ...rest }) => ({ ...rest }));
    // We'll need to import the CSV utility functions
    const csvContent = rows.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    ).join('\n');
    
    const headers = Object.keys(rows[0] || {}).join(',');
    const csv = headers + '\n' + csvContent;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const safeName = portfolio.name.replace(/\s+/g, '-').toLowerCase();
    anchor.href = url;
    anchor.download = `${safeName || 'portfolio'}-holdings.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : new TextDecoder().decode(reader.result as ArrayBuffer);
        // Simple CSV parsing - in production you'd use the proper CSV utility
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        const rows = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',');
          const row: any = {};
          headers.forEach((header, index) => {
            row[header.trim()] = values[index]?.trim() || '';
          });
          return row;
        });
        
        importHoldings(rows, importAccount || undefined);
        setImportError(null);
      } catch (error) {
        setImportError(error instanceof Error ? error.message : 'Failed to import CSV');
      } finally {
        event.target.value = '';
      }
    };

    reader.onerror = () => {
      setImportError('Failed to read CSV file');
      event.target.value = '';
    };

    reader.readAsText(file);
  };

  // Backup and restore functions
  const handleCreateBackup = () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupData = {
        portfolios: [portfolio], // Just current portfolio for now
        activePortfolioId: portfolio.id,
        playground: { enabled: false },
        filters: {},
        timestamp,
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const safeName = portfolio.name.replace(/\s+/g, '-').toLowerCase();
      anchor.href = url;
      anchor.download = `${safeName}-backup-${timestamp}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      
      alert('Backup file downloaded successfully! This is a local copy - use "Create Server Backup" above to create backups visible in the backup browser.');
    } catch (error) {
      alert('Failed to create backup: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleRestoreFromFile = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = typeof reader.result === 'string' ? reader.result : new TextDecoder().decode(reader.result as ArrayBuffer);
          const backupData = JSON.parse(text);
          
          // Validate backup structure
          if (!backupData.portfolios || !Array.isArray(backupData.portfolios)) {
            throw new Error('Invalid backup file: missing portfolios data');
          }
          
          if (backupData.portfolios.length === 0) {
            throw new Error('Invalid backup file: no portfolios found');
          }
          
          const portfolioToRestore = backupData.portfolios[0];
          
          // Validate portfolio structure
          if (!portfolioToRestore.lists || !portfolioToRestore.holdings) {
            throw new Error('Invalid backup file: incomplete portfolio data');
          }
          
          if (window.confirm(`Restore backup from ${backupData.timestamp || 'unknown date'}? This will replace your current portfolio data and cannot be undone.`)) {
            restorePortfolioBackup(portfolioToRestore);
            alert('Portfolio restored successfully!');
          }
          
          setRestoreError(null);
        } catch (error) {
          setRestoreError(error instanceof Error ? error.message : 'Failed to restore backup');
        }
      };

      reader.onerror = () => {
        setRestoreError('Failed to read backup file');
      };

      reader.readAsText(file);
    };
    
    input.click();
  };

  // Render functions
  const renderEditableList = (
    title: string,
    items: string[],
    type: 'sections' | 'themes' | 'accounts',
    newValue: string,
    setNewValue: (value: string) => void,
    onAdd: () => void
  ) => (
    <div style={sectionStyle}>
      <div style={sectionHeaderStyle}>
        {title}
        <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 400, marginTop: '0.25rem' }}>
          Drag items to reorder them. This affects the order in your holdings table.
        </div>
      </div>
      <div style={listContainerStyle}>
        {items.map((item, index) => {
          const isDragging = dragState?.type === type && dragState.index === index;
          
          return (
            <div 
              key={`${item}`}
              style={isDragging ? draggingItemStyle : listItemStyle}
              draggable={!editingItem}
              onDragStart={handleDragStart(type, index)}
              onDragOver={handleDragOver(type, index)}
              onDrop={handleDrop(type, index)}
              onDragEnd={handleDragEnd}
            >
              <span 
                style={dragHandleStyle}
                onMouseDown={(e) => e.stopPropagation()}
              >
                ⋮⋮
              </span>
              
              {editingItem?.type === type && editingItem?.index === index ? (
                <input
                  style={inputStyle}
                  value={editingItem.value}
                  onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRename(type, item, editingItem.value);
                    }
                    if (e.key === 'Escape') {
                      setEditingItem(null);
                    }
                  }}
                  onBlur={() => handleRename(type, item, editingItem.value)}
                  autoFocus
                />
              ) : (
                <span style={{ flex: 1, padding: '0.5rem' }}>{item}</span>
              )}
              
              <button
                style={editButtonStyle}
                onClick={() => setEditingItem({ type, index, value: item })}
                disabled={isDragging}
              >
                Edit
              </button>
              <button
                style={removeButtonStyle}
                onClick={() => handleRemove(type, item)}
                disabled={isDragging}
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
      
      <div style={addFormStyle}>
        <input
          style={inputStyle}
          placeholder={`Add new ${type.slice(0, -1)}...`}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onAdd();
            }
          }}
        />
        <button style={addButtonStyle} onClick={onAdd}>
          Add
        </button>
      </div>
    </div>
  );

  const renderGeneralSettings = () => (
    <div>
      <h2 style={headerStyle}>General Settings</h2>
      
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Portfolio Settings</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Base Currency
            </label>
            <select 
              style={inputStyle} 
              value={settings.currency}
              onChange={(e) => updateSetting('currency', e.target.value as 'GBP')}
            >
              <option value="GBP">GBP (British Pound)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Live Price Updates
            </label>
            <select 
              style={inputStyle} 
              value={settings.livePriceUpdateInterval}
              onChange={(e) => updateSetting('livePriceUpdateInterval', Number(e.target.value))}
            >
              <option value={1}>Every 1 minute</option>
              <option value={5}>Every 5 minutes</option>
              <option value={10}>Every 10 minutes</option>
              <option value={15}>Every 15 minutes</option>
              <option value={30}>Every 30 minutes</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={settings.enableLivePrices}
                onChange={(e) => updateSetting('enableLivePrices', e.target.checked)}
                style={{ width: '1rem', height: '1rem' }}
              />
              Enable Live Prices
            </label>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={settings.lockTotal}
                onChange={(e) => updateSetting('lockTotal', e.target.checked)}
                style={{ width: '1rem', height: '1rem' }}
              />
              Lock Total Value
            </label>
          </div>
        </div>

        {hasUnsavedChanges && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            backgroundColor: '#fef3c7', 
            borderRadius: '0.5rem',
            border: '1px solid #f59e0b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#92400e', fontSize: '0.875rem' }}>
              You have unsaved changes
            </span>
            <button style={addButtonStyle} onClick={handleSaveSettings}>
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );


  const renderExchangesSettings = () => (
    <div>
      <h2 style={headerStyle}>Exchanges</h2>
      
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Available Exchanges</div>
        <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
          Manage the exchanges available for your holdings. These affect how tickers are formatted for live price data.
        </p>
        
        <div style={listContainerStyle}>
          {exchanges.map((exchange, index) => (
            <div key={exchange.value} style={listItemStyle}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{exchange.label}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{exchange.description}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Code: {exchange.value}</div>
              </div>
              <button
                style={removeButtonStyle}
                onClick={() => handleRemoveExchange(exchange.value)}
                disabled={exchanges.length <= 1}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        
        <div style={addFormStyle}>
          <input
            style={inputStyle}
            placeholder="Add exchange code (e.g., TSX, ASX)..."
            value={newExchange}
            onChange={(e) => setNewExchange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddExchange();
              }
            }}
          />
          <button style={addButtonStyle} onClick={handleAddExchange}>
            Add Exchange
          </button>
        </div>
      </div>
    </div>
  );

  const renderAssetsSettings = () => (
    <div>
      <h2 style={headerStyle}>Asset Types</h2>
      
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Available Asset Types</div>
        <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
          Manage the asset types available for categorizing your holdings.
        </p>
        
        <div style={listContainerStyle}>
          {assetTypes.map((assetType, index) => (
            <div key={assetType.value} style={listItemStyle}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{assetType.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{assetType.description}</div>
              </div>
              <button
                style={removeButtonStyle}
                onClick={() => handleRemoveAssetType(assetType.value)}
                disabled={assetTypes.length <= 1}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        
        <div style={addFormStyle}>
          <input
            style={inputStyle}
            placeholder="Add asset type (e.g., REIT, Commodity)..."
            value={newAssetType}
            onChange={(e) => setNewAssetType(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddAssetType();
              }
            }}
          />
          <button style={addButtonStyle} onClick={handleAddAssetType}>
            Add Asset Type
          </button>
        </div>
      </div>
    </div>
  );

  const renderDataSettings = () => (
    <div>
      <h2 style={headerStyle}>Data Management</h2>
      
      {/* CSV Import/Export */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>CSV Import & Export</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Import Holdings</h4>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
              Upload a CSV file to import holdings into your portfolio
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                Import Account (optional)
              </label>
              <input
                type="text"
                value={importAccount}
                onChange={(e) => setImportAccount(e.target.value)}
                placeholder="e.g. ISA, SIPP"
                style={inputStyle}
              />
            </div>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleImport}
              style={{ marginBottom: '0.5rem' }}
            />
            {importError && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontSize: '0.875rem' }}>
                {importError}
              </p>
            )}
          </div>
          
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Export Holdings</h4>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
              Download your portfolio data as CSV or JSON
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
              <button style={addButtonStyle} onClick={handleExport}>
                Export as CSV
              </button>
              <button style={editButtonStyle} onClick={() => {
                const dataStr = JSON.stringify(portfolio, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                const safeName = portfolio.name.replace(/\s+/g, '-').toLowerCase();
                anchor.href = url;
                anchor.download = `${safeName || 'portfolio'}-data.json`;
                document.body.appendChild(anchor);
                anchor.click();
                document.body.removeChild(anchor);
                URL.revokeObjectURL(url);
              }}>
                Export as JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backup & Reset */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Backup & Reset</div>
        
        {/* Backup Status and Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start', marginBottom: '2rem' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Create Server Backup</h4>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
              Create a backup that will be saved to the server and appear in the backup browser below
            </p>
            <BackupButton variant="primary" size="md" showLastBackupTime={true} />
          </div>
          
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Backup Status</h4>
            <BackupStatus variant="detailed" showRetryButton={true} autoRefresh={true} />
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Download Local Copy</h4>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
              Download a JSON file backup to your computer for offline storage
            </p>
            <button style={addButtonStyle} onClick={handleCreateBackup}>
              Download Backup File
            </button>
          </div>
          
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Restore Your Backup</h4>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
              Restore your portfolio-backup-restore.json data directly
            </p>
            <DirectRestoreButton
              onError={(error) => setRestoreError(error)}
            />
            {restoreError && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontSize: '0.875rem' }}>
                {restoreError}
              </p>
            )}
          </div>

          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Restore from File</h4>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
              Upload any backup file to restore your portfolio data
            </p>
            <RestoreFromFileButton
              onError={(error) => setRestoreError(error)}
              style={editButtonStyle}
            >
              Select Backup File
            </RestoreFromFileButton>
            {restoreError && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontSize: '0.875rem' }}>
                {restoreError}
              </p>
            )}
          </div>

          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Reset Data</h4>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
              Clear all portfolio data
            </p>
            <button 
              style={removeButtonStyle}
              onClick={() => {
                if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
                  alert('Reset functionality would go here');
                }
              }}
            >
              Reset All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBackupManagement = () => (
    <div>
      <h2 style={headerStyle}>Backup Management</h2>
      
      {/* Backup Status and Controls */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Backup Status</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Current Status</h4>
            <BackupStatus variant="detailed" showRetryButton={true} autoRefresh={true} />
          </div>
          
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Download Local Copy</h4>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
              Download a JSON file backup to your computer for offline storage
            </p>
            <button style={addButtonStyle} onClick={handleCreateBackup}>
              Download Backup File
            </button>
          </div>
        </div>
      </div>

      {/* Restore Options */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Restore from Backup</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Restore from File</h4>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
              Upload any backup file (like portfolio-backup-restore.json) to restore your portfolio data.
            </p>
            <RestoreFromFileButton
              onError={(error) => setRestoreError(error)}
              style={addButtonStyle}
            >
              📁 Select Backup File
            </RestoreFromFileButton>
            {restoreError && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontSize: '0.875rem' }}>
                {restoreError}
              </p>
            )}
          </div>
          
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Browse Server Backups</h4>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
              Browse and restore from automatic backup files stored on the server.
            </p>
            {!showBackupBrowser ? (
              <button 
                style={editButtonStyle}
                onClick={() => setShowBackupBrowser(true)}
              >
                🔍 Browse Backup Files
              </button>
            ) : (
              <div>
                <BackupBrowser
                  onRestore={(restoredData) => {
                    // Handle restore
                    if (restorePortfolioBackup && restoredData.portfolios && restoredData.portfolios.length > 0) {
                      restorePortfolioBackup(restoredData.portfolios[0]);
                      setShowBackupBrowser(false);
                      alert('Portfolio restored successfully from backup!');
                    }
                  }}
                  onCancel={() => setShowBackupBrowser(false)}
                  showPreview={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backup Settings */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Backup Settings</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Automatic Backups</h4>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
              Automatic backups are enabled and run every 60 seconds when data changes.
            </p>
            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: '#f0f9ff', 
              border: '1px solid #0ea5e9', 
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              color: '#0c4a6e'
            }}>
              ✓ Automatic backups are active
            </div>
          </div>
          
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Backup Location</h4>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
              Backups are stored in the ./backups/ directory
            </p>
            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: '#f9fafb', 
              border: '1px solid #d1d5db', 
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              color: '#6b7280',
              fontFamily: 'monospace'
            }}>
              ./backups/portfolio-*.json
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralSettings();
      case 'exchanges': return renderExchangesSettings();
      case 'assets': return renderAssetsSettings();
      case 'data': return renderDataSettings();

      default: return renderGeneralSettings();
    }
  };

  return (
    <div style={containerStyle}>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div style={sidebarHeaderStyle}>
          <h1 style={sidebarTitleStyle}>Settings</h1>
        </div>
        
        <div style={tabListStyle}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              style={activeTab === tab.id ? activeTabButtonStyle : tabButtonStyle}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {renderContent()}
      </div>

      {/* Back Button */}
      <button style={backButtonStyle} onClick={onBack || (() => window.history.back())}>
        Back to Portfolio
      </button>
    </div>
  );
};