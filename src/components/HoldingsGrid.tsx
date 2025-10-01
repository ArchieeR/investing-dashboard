import {
  ChangeEvent,
  FormEvent,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { usePortfolio } from '../state/portfolioStore';
import type { Holding } from '../state/types';
import { calculateQtyFromValue, calculateValueForShare } from '../utils/calculations';
import { holdingsToCsv, parseHoldingsCsv } from '../utils/csv';
import { ColumnSettings } from './ColumnSettings';


const numberInput = {
  inputMode: 'decimal' as const,
};

const percentInput = {
  inputMode: 'decimal' as const,
  min: 0,
  max: 99.99,
  step: 0.1,
};

const formatCurrency = (value: number): string => `£${value.toFixed(2)}`;

const formatTargetDiff = (valueDiff?: number, pctDiff?: number): string => {
  if (valueDiff === undefined || pctDiff === undefined) {
    return '—';
  }

  const currency = `${valueDiff >= 0 ? '+' : '-'}£${Math.abs(valueDiff).toFixed(2)}`;
  const pct = `${pctDiff >= 0 ? '+' : ''}${formatNumber(Math.abs(pctDiff))}%`;
  return `${currency} / ${pct}`;
};

const formatNumber = (value: number): string => {
  // Handle edge cases
  if (!Number.isFinite(value) || value === null || value === undefined) {
    return '0';
  }
  // Remove unnecessary trailing zeros and decimal point
  return value % 1 === 0 ? value.toString() : value.toFixed(1);
};

const formatPercentage = (value: number): string => {
  const color = value >= 0 ? '#10b981' : '#ef4444';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatNumber(value)}%`;
};

const formatLivePriceWithCurrency = (holding: Holding): { text: string; hasData: boolean } => {
  if (!holding.originalLivePrice || !holding.originalCurrency) {
    return { text: '—', hasData: false };
  }

  // Display in original currency
  let text: string;
  switch (holding.originalCurrency) {
    case 'USD':
      text = `$${holding.originalLivePrice.toFixed(2)}`;
      break;
    case 'GBP':
      text = `£${holding.originalLivePrice.toFixed(2)}`;
      break;
    case 'GBX':
      // Yahoo Finance returns pence as whole numbers (e.g., 33190 pence)
      // Display as readable pence (e.g., 331.90p)
      text = `${(holding.originalLivePrice / 100).toFixed(2)}p`;
      break;
    case 'EUR':
      text = `€${holding.originalLivePrice.toFixed(2)}`;
      break;
    default:
      text = `${holding.originalLivePrice.toFixed(2)} ${holding.originalCurrency}`;
  }

  return { text, hasData: true };
};

const formatDayChangeWithCurrency = (holding: Holding): { text: string; hasData: boolean } => {
  if (holding.dayChange === undefined || !holding.conversionRate || !holding.originalCurrency) {
    return { text: '—', hasData: false };
  }

  // Convert GBP change back to original currency for display
  let originalChange: number;

  if (holding.originalCurrency === 'GBX') {
    originalChange = holding.dayChange;
  } else {
    originalChange = holding.dayChange / holding.conversionRate;
  }

  const sign = originalChange >= 0 ? '+' : '';

  let text: string;
  switch (holding.originalCurrency) {
    case 'USD':
      text = `${sign}${Math.abs(originalChange).toFixed(2)}`;
      break;
    case 'GBP':
      text = `${sign}£${Math.abs(originalChange).toFixed(2)}`;
      break;
    case 'GBX':
      text = `${sign}${(Math.abs(originalChange) / 100).toFixed(2)}p`;
      break;
    case 'EUR':
      text = `${sign}€${Math.abs(originalChange).toFixed(2)}`;
      break;
    default:
      text = `${sign}${Math.abs(originalChange).toFixed(2)} ${holding.originalCurrency}`;
      break;
  }

  return { text, hasData: true };
};

const renderTableCell = (
  key: string,
  content: React.ReactNode,
  style: CSSProperties = tdStyle
): React.ReactNode => {
  return (
    <td key={key} style={style}>
      {content}
    </td>
  );
};

const renderHoldingCells = (
  holding: Holding,
  derivedData: {
    value: number;
    liveValue: number;
    dayChangeValue: number;
    pctOfTotal: number;
    pctOfSection: number;
    sectionTotal: number;
    pctOfTheme: number;
    targetValue?: number;
    targetValueDiff?: number;
    targetPctDiff?: number;
  },
  visibleColumns: any,
  handlers: {
    handleSelectChange: (id: string, field: keyof Holding) => (event: ChangeEvent<HTMLSelectElement>) => void;
    handleTextChange: (id: string, field: keyof Holding) => (event: ChangeEvent<HTMLInputElement>) => void;
    handleNumberChange: (id: string, field: keyof Holding) => (event: ChangeEvent<HTMLInputElement>) => void;
    handleTargetChange: (id: string) => (event: ChangeEvent<HTMLInputElement>) => void;

    handlePortfolioShareChange: (holding: Holding, currentValue: number) => (event: ChangeEvent<HTMLInputElement>) => void;
    handleSectionShareChange: (holding: Holding, currentValue: number, sectionTotal: number) => (event: ChangeEvent<HTMLInputElement>) => void;
    duplicateHolding: (id: string) => void;
    deleteHolding: (id: string) => void;
    openTradeForm: (holding: Holding) => void;
    updateHolding: (id: string, patch: Partial<Holding>) => void;
  },
  lists: any,
  sortedThemes: string[]
) => {
  const cells: React.ReactNode[] = [];
  const { value, liveValue, dayChangeValue, pctOfTotal, pctOfSection, sectionTotal, pctOfTheme, targetValue, targetValueDiff, targetPctDiff } = derivedData;

  if (visibleColumns.section) {
    cells.push(renderTableCell('section',
      <select
        key={`${holding.id}-section-${holding.section}`}
        value={holding.section}
        onChange={handlers.handleSelectChange(holding.id, 'section')}
        style={selectStyle}
      >
        {lists.sections.map((section: string) => (
          <option key={section} value={section} title={section}>
            {getSectionAbbreviation(section)}
          </option>
        ))}
      </select>
    ));
  }

  if (visibleColumns.theme) {
    cells.push(renderTableCell('theme',
      <select
        key={`${holding.id}-theme-${holding.theme}`}
        value={holding.theme}
        onChange={handlers.handleSelectChange(holding.id, 'theme')}
        style={themeSelectStyle}
      >
        {sortedThemes.map((theme) => (
          <option key={theme} value={theme}>
            {theme}
          </option>
        ))}
      </select>
    ));
  }

  if (visibleColumns.assetType) {
    cells.push(renderTableCell('assetType',
      <select
        key={`${holding.id}-assetType-${holding.assetType}`}
        value={holding.assetType}
        onChange={handlers.handleSelectChange(holding.id, 'assetType')}
        style={selectStyle}
      >
        {['ETF', 'Stock', 'Crypto', 'Cash', 'Bond', 'Fund', 'Other'].map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    ));
  }

  if (visibleColumns.name) {
    cells.push(renderTableCell('name',
      <input value={holding.name} onChange={handlers.handleTextChange(holding.id, 'name')} style={nameInputStyle} />
    ));
  }

  if (visibleColumns.ticker) {
    cells.push(renderTableCell('ticker',
      <input value={holding.ticker} onChange={handlers.handleTextChange(holding.id, 'ticker')} style={tickerInputStyle} />
    ));
  }

  if (visibleColumns.exchange) {
    cells.push(renderTableCell('exchange',
      <select
        key={`${holding.id}-exchange-${holding.exchange}`}
        value={holding.exchange}
        onChange={handlers.handleSelectChange(holding.id, 'exchange')}
        style={selectStyle}
      >
        <option value="LSE">LSE</option>
        <option value="NYSE">NYSE</option>
        <option value="NASDAQ">NASDAQ</option>
        <option value="AMS">AMS (.AS)</option>
        <option value="XETRA">XETRA (.DE)</option>
        <option value="XC">XC</option>
        <option value="VI">Vienna (.VI)</option>
        <option value="Other">Other</option>
      </select>
    ));
  }

  if (visibleColumns.account) {
    cells.push(renderTableCell('account',
      <select
        key={`${holding.id}-account-${holding.account}`}
        value={holding.account}
        onChange={handlers.handleSelectChange(holding.id, 'account')}
        style={selectStyle}
      >
        {lists.accounts.map((account: string) => (
          <option key={account} value={account}>
            {account}
          </option>
        ))}
      </select>
    ));
  }

  if (visibleColumns.price) {
    cells.push(renderTableCell('price',
      <input
        type="number"
        step="0.01"
        value={holding.price === 0 ? '' : holding.price}
        onChange={handlers.handleNumberChange(holding.id, 'price')}
        {...numberInput}
        style={numericInputStyle}
      />
    ));
  }

  if (visibleColumns.livePrice) {
    const priceData = formatLivePriceWithCurrency(holding);
    cells.push(renderTableCell('livePrice',
      <span style={{
        color: priceData.hasData ? '#475569' : '#ef4444',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem'
      }}>
        {priceData.text}
        {!priceData.hasData && (
          <span
            style={{
              fontSize: '0.75rem',
              color: '#ef4444'
            }}
            title="No live price data available"
          >
            ⚠️
          </span>
        )}
      </span>
    ));
  }

  if (visibleColumns.avgCost) {
    cells.push(renderTableCell('avgCost',
      <span style={{ color: '#475569' }}>
        {formatCurrency(holding.avgCost ?? holding.price ?? 0)}
      </span>
    ));
  }

  if (visibleColumns.qty) {
    cells.push(renderTableCell('qty',
      <input
        type="number"
        step="0.01"
        value={holding.qty === 0 ? '' : holding.qty}
        onChange={handlers.handleNumberChange(holding.id, 'qty')}
        {...numberInput}
        style={numericInputStyle}
      />
    ));
  }

  if (visibleColumns.value) {
    cells.push(renderTableCell('value',
      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
        {formatCurrency(value)} 
        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}> (Legacy)</span>
      </span>
    ));
  }

  if (visibleColumns.liveValue) {
    cells.push(renderTableCell('liveValue',
      <span style={{ 
        color: '#059669', 
        fontWeight: 500
      }}>
        {formatCurrency(liveValue)}
      </span>
    ));
  }

  if (visibleColumns.costBasis) {
    cells.push(renderTableCell('costBasis',
      <span style={{ color: '#475569' }}>
        {formatCurrency((holding.avgCost ?? holding.price ?? 0) * holding.qty)}
      </span>
    ));
  }

  if (visibleColumns.dayChange) {
    const changeData = formatDayChangeWithCurrency(holding);
    const hasData = changeData.hasData;
    cells.push(renderTableCell('dayChange',
      <span style={{
        color: hasData ? (dayChangeValue >= 0 ? '#10b981' : '#ef4444') : '#ef4444',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem'
      }}>
        {changeData.text}
        {!hasData && (
          <span
            style={{
              fontSize: '0.75rem',
              color: '#ef4444'
            }}
            title="No day change data available"
          >
            ⚠️
          </span>
        )}
      </span>
    ));
  }

  if (visibleColumns.dayChangePercent) {
    const hasPercentData = holding.dayChangePercent !== undefined;
    cells.push(renderTableCell('dayChangePercent',
      <span style={{
        color: hasPercentData ? ((holding.dayChangePercent ?? 0) >= 0 ? '#10b981' : '#ef4444') : '#ef4444',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem'
      }}>
        {hasPercentData ? formatPercentage(holding.dayChangePercent) : '—'}
        {!hasPercentData && (
          <span
            style={{
              fontSize: '0.75rem',
              color: '#ef4444'
            }}
            title="No day change percentage data available"
          >
            ⚠️
          </span>
        )}
      </span>
    ));
  }

  if (visibleColumns.pctOfPortfolio) {
    cells.push(renderTableCell('pctOfPortfolio',
      <span style={{ color: '#475569' }}>
        {formatNumber(pctOfTotal || 0)}%
      </span>
    ));
  }

  if (visibleColumns.pctOfSection) {
    cells.push(renderTableCell('pctOfSection',
      <input
        type="number"
        value={formatNumber(pctOfSection || 0)}
        onChange={handlers.handleSectionShareChange(holding, value, sectionTotal)}
        {...percentInput}
        style={numericInputStyle}
      />
    ));
  }

  if (visibleColumns.pctOfTheme) {
    cells.push(renderTableCell('pctOfTheme',
      <span style={{ color: '#475569' }}>
        {formatNumber(pctOfTheme)}%
      </span>
    ));
  }

  if (visibleColumns.targetPct) {
    cells.push(renderTableCell('targetPct',
      <input
        type="number"
        value={holding.targetPct && holding.targetPct > 0 ? formatNumber(holding.targetPct) : ''}
        onChange={handlers.handleTargetChange(holding.id)}
        {...percentInput}
        style={targetInputStyle}
        placeholder="—"
      />
    ));
  }

  if (visibleColumns.targetDelta) {
    cells.push(renderTableCell('targetDelta',
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
        <span style={{ 
          fontSize: '0.875rem', 
          color: targetValue !== undefined ? '#7c3aed' : '#9ca3af',
          fontWeight: targetValue !== undefined ? 500 : 400
        }}>
          {targetValue !== undefined ? formatCurrency(targetValue) : '—'}
        </span>
        {targetValueDiff !== undefined && (
          <span style={{ 
            fontSize: '0.75rem', 
            color: targetValueDiff >= 0 ? '#059669' : '#dc2626',
            fontWeight: 500
          }}>
            {targetValueDiff >= 0 ? '+' : ''}{formatCurrency(targetValueDiff)}
          </span>
        )}
      </div>
    ));
  }

  // Performance columns (placeholder for now)
  if (visibleColumns.performance1d) {
    cells.push(renderTableCell('performance1d', <span style={{ color: '#6b7280' }}>—</span>));
  }
  if (visibleColumns.performance2d) {
    cells.push(renderTableCell('performance2d', <span style={{ color: '#6b7280' }}>—</span>));
  }
  if (visibleColumns.performance3d) {
    cells.push(renderTableCell('performance3d', <span style={{ color: '#6b7280' }}>—</span>));
  }
  if (visibleColumns.performance1w) {
    cells.push(renderTableCell('performance1w', <span style={{ color: '#6b7280' }}>—</span>));
  }
  if (visibleColumns.performance1m) {
    cells.push(renderTableCell('performance1m', <span style={{ color: '#6b7280' }}>—</span>));
  }
  if (visibleColumns.performance6m) {
    cells.push(renderTableCell('performance6m', <span style={{ color: '#6b7280' }}>—</span>));
  }
  if (visibleColumns.performanceYtd) {
    cells.push(renderTableCell('performanceYtd', <span style={{ color: '#6b7280' }}>—</span>));
  }
  if (visibleColumns.performance1y) {
    cells.push(renderTableCell('performance1y', <span style={{ color: '#6b7280' }}>—</span>));
  }
  if (visibleColumns.performance2y) {
    cells.push(renderTableCell('performance2y', <span style={{ color: '#6b7280' }}>—</span>));
  }

  if (visibleColumns.include) {
    cells.push(renderTableCell('include',
      <input
        type="checkbox"
        checked={holding.include}
        onChange={(event) => handlers.updateHolding(holding.id, { include: event.target.checked })}
        style={{ width: '1rem', height: '1rem' }}
      />
    ));
  }

  if (visibleColumns.actions) {
    cells.push(renderTableCell('actions',
      <div style={actionCellStyle}>
        <button
          type="button"
          onClick={() => handlers.duplicateHolding(holding.id)}
          style={inlineButtonStyle}
        >
          Duplicate
        </button>
        <button
          type="button"
          onClick={() => handlers.deleteHolding(holding.id)}
          style={inlineButtonStyle}
        >
          Delete
        </button>
        <button
          type="button"
          onClick={() => handlers.openTradeForm(holding)}
          style={inlineButtonStyle}
        >
          Record trade
        </button>
      </div>
    ));
  }

  return cells;
};

const asNumber = (value: string): number => {
  if (value.trim() === '') {
    return 0;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const asShare = (value: string): number => {
  const pct = asNumber(value);
  if (pct <= 0) {
    return 0;
  }

  return pct / 100;
};

const clampShare = (share: number): number => {
  if (!Number.isFinite(share) || share <= 0) {
    return 0;
  }

  return Math.min(share, 0.9999);
};

const selectStyle: CSSProperties = { minWidth: '4rem' };
const themeSelectStyle: CSSProperties = { minWidth: '4.5rem' };
const tickerInputStyle: CSSProperties = { width: '4.2rem' };
const nameInputStyle: CSSProperties = { width: '9rem' };
const numericInputStyle: CSSProperties = { width: '4.4rem' };
const targetInputStyle: CSSProperties = { width: '3.8rem' };
const actionCellStyle: CSSProperties = { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' };
const inlineButtonStyle: CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'none',
  color: '#1d4ed8',
  cursor: 'pointer',
  fontSize: '0.85rem',
};
const headerContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  marginBottom: '1.5rem',
};
const headerTopRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: '1rem',
  flexWrap: 'wrap',
};

const actionButtonsContainerStyle: CSSProperties = {
  display: 'flex',
  gap: '0.6rem',
  alignItems: 'center',
  flexWrap: 'wrap',
};
const actionButtonStyle: CSSProperties = {
  padding: '0.42rem 0.85rem',
  borderRadius: '999px',
  border: '1px solid #cbd5f5',
  background: 'transparent',
  color: '#1e3a8a',
  cursor: 'pointer',
  fontSize: '0.85rem',
};
const primaryActionButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  background: '#1d4ed8',
  border: 'none',
  color: '#fff',
};
const filtersContainerStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '0.85rem',
  marginBottom: '1.25rem',
};
const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: '1020px',
};
const thStyle: CSSProperties = {
  padding: '0.75rem 0.6rem',
  fontSize: '0.7rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#1f2937',
  textAlign: 'left',
  borderBottom: '1px solid #e2e8f0',
  background: 'transparent',
};
const tdStyle: CSSProperties = {
  padding: '0.65rem 0.6rem',
  borderBottom: '1px solid #e2e8f0',
  verticalAlign: 'middle',
};
const filtersLabelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  fontSize: '0.85rem',
  color: '#475569',
  gap: '0.35rem',
};



const getSectionAbbreviation = (section: string): string => section.charAt(0).toUpperCase();

const HoldingsGrid = () => {
  const {
    portfolio,
    derivedHoldings,
    totalValue,
    targetPortfolioValue,
    filters,
    budgets,
    addHolding,
    duplicateHolding,
    updateHolding,
    deleteHolding,
    setTotal,
    setTargetPortfolioValue,
    setFilter,
    importHoldings,
    recordTrade,

  } =
    usePortfolio();

  const lists = portfolio.lists;
  const sectionOrder = useMemo(() => {
    const order = new Map<string, number>();
    lists.sections.forEach((value, index) => {
      order.set(value, index);
    });
    return order;
  }, [lists.sections]);

  const themeOrder = useMemo(() => {
    const order = new Map<string, number>();
    lists.themes.forEach((value, index) => {
      order.set(value, index);
    });
    return order;
  }, [lists.themes]);

  const accountOrder = useMemo(() => {
    const order = new Map<string, number>();
    lists.accounts.forEach((value, index) => {
      order.set(value, index);
    });
    return order;
  }, [lists.accounts]);

  const sortedThemes = useMemo(() => [...lists.themes], [lists.themes]);
  const [viewMode, setViewMode] = useState<'theme' | 'account'>('theme');

  const getGroupColors = (index: number) => {
    const hue = (index * 67) % 360;
    return {
      header: `hsla(${hue}, 70%, 94%, 0.45)`,
      row: `hsla(${hue}, 75%, 98%, 0.65)`,
    };
  };

  const [totalDraft, setTotalDraft] = useState(totalValue.toFixed(2));
  const [targetPortfolioValueDraft, setTargetPortfolioValueDraft] = useState(targetPortfolioValue.toFixed(2));

  const [showColumnSettings, setShowColumnSettings] = useState(false);

  useEffect(() => {
    setTotalDraft(totalValue.toFixed(2));
  }, [totalValue]);

  useEffect(() => {
    setTargetPortfolioValueDraft(targetPortfolioValue.toFixed(2));
  }, [targetPortfolioValue]);

  const handleTotalChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTotalDraft(event.target.value);
  };

  const commitTotal = () => {
    const next = asNumber(totalDraft);
    if (next > 0) {
      setTotal(next);
    } else {
      setTotalDraft(totalValue.toFixed(2));
    }
  };

  const handleTargetPortfolioValueChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTargetPortfolioValueDraft(event.target.value);
  };

  const commitTargetPortfolioValue = () => {
    const next = asNumber(targetPortfolioValueDraft);
    if (next >= 0) {
      setTargetPortfolioValue(next);
    } else {
      setTargetPortfolioValueDraft(targetPortfolioValue.toFixed(2));
    }
  };



  const handleFilterChange = (key: keyof typeof filters) => (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setFilter(key, value === '' ? undefined : value);
  };



  const openTradeForm = (holding: Holding) => {
    // This functionality will be handled by the main app now
    console.log('Open trade form for holding:', holding.ticker);
  };

  const filteredHoldings = useMemo(() => {
    return derivedHoldings.filter(({ holding }) => {
      if (filters.section && holding.section !== filters.section) {
        return false;
      }
      if (filters.theme && holding.theme !== filters.theme) {
        return false;
      }
      if (filters.account && holding.account !== filters.account) {
        return false;
      }
      return true;
    });
  }, [derivedHoldings, filters.section, filters.theme, filters.account]);

  const hasFilters = Boolean(filters.section || filters.theme || filters.account);
  const filterBadge = hasFilters
    ? [
      filters.section ? `Section: ${filters.section}` : null,
      filters.theme ? `Theme: ${filters.theme}` : null,
      filters.account ? `Account: ${filters.account}` : null,
    ]
      .filter(Boolean)
      .join(' • ')
    : '';

  const handleTextChange = (id: string, field: keyof Holding) => (event: ChangeEvent<HTMLInputElement>) => {
    updateHolding(id, { [field]: event.target.value } as Partial<Holding>);
  };

  const handleSelectChange = (id: string, field: keyof Holding) =>
    (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;

      if (field === 'theme') {
        // When theme changes, automatically update section to match
        const assignedSection = portfolio.lists.themeSections?.[value];
        if (assignedSection) {
          updateHolding(id, {
            theme: value,
            section: assignedSection
          });
        } else {
          // If theme has no assigned section, just update theme
          updateHolding(id, { [field]: value } as Partial<Holding>);
        }
      } else if (field === 'section') {
        // When section changes, check if current theme is compatible
        const currentHolding = portfolio.holdings.find(h => h.id === id);
        const currentTheme = currentHolding?.theme;
        const themeSection = currentTheme ? portfolio.lists.themeSections?.[currentTheme] : undefined;

        if (currentTheme && themeSection && themeSection !== value) {
          // Current theme belongs to a different section, need to find a compatible theme
          // Find the first theme that belongs to the new section, or default to first theme
          const compatibleTheme = portfolio.lists.themes.find(theme =>
            portfolio.lists.themeSections?.[theme] === value
          ) || portfolio.lists.themes[0] || 'All';

          updateHolding(id, {
            section: value,
            theme: compatibleTheme
          });
        } else {
          // Theme is compatible or no theme assigned, just update section
          updateHolding(id, { [field]: value } as Partial<Holding>);
        }
      } else {
        updateHolding(id, { [field]: value } as Partial<Holding>);
      }
    };

  const handleNumberChange = (id: string, field: keyof Holding) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // Allow empty values to be stored as 0, but let the input remain empty during editing
    updateHolding(id, { [field]: value === '' ? 0 : asNumber(value) } as Partial<Holding>);
  };

  const handleTargetChange = (id: string) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim();
    const numValue = value === '' ? undefined : asNumber(value);
    // Cap target percentage at 100%
    const cappedValue = numValue !== undefined ? Math.min(numValue, 100) : undefined;
    updateHolding(id, {
      targetPct: cappedValue,
    });
  };

  const getEffectivePrice = (holding: Holding): number => {
    // Use live price if available, otherwise fall back to manual price
    return holding.livePrice !== undefined ? holding.livePrice : holding.price;
  };





  const handlePortfolioShareChange = (holding: Holding, currentValue: number) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const share = clampShare(asShare(event.target.value));
      if (share <= 0) {
        updateHolding(holding.id, { qty: 0 });
        return;
      }

      const others = holding.include ? Math.max(totalValue - currentValue, 0) : totalValue;
      const nextValue = calculateValueForShare(others, share);
      const effectivePrice = getEffectivePrice(holding);
      const qty = calculateQtyFromValue(nextValue, effectivePrice);
      updateHolding(holding.id, { qty });
    };

  const handleSectionShareChange = (holding: Holding, currentValue: number, sectionTotal: number) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const share = clampShare(asShare(event.target.value));
      if (share <= 0) {
        updateHolding(holding.id, { qty: 0 });
        return;
      }

      const others = holding.include ? Math.max(sectionTotal - currentValue, 0) : sectionTotal;
      const nextValue = calculateValueForShare(others, share);
      const effectivePrice = getEffectivePrice(holding);
      const qty = calculateQtyFromValue(nextValue, effectivePrice);
      updateHolding(holding.id, { qty });
    };

  const sortedHoldings = useMemo(() => {
    const getIndex = (map: Map<string, number>, key: string) =>
      map.get(key) ?? Number.MAX_SAFE_INTEGER;

    const clone = [...filteredHoldings];
    clone.sort((a, b) => {
      const sectionDiff =
        getIndex(sectionOrder, a.holding.section) - getIndex(sectionOrder, b.holding.section);
      if (sectionDiff !== 0) {
        return sectionDiff;
      }

      const themeDiff =
        getIndex(themeOrder, a.holding.theme) - getIndex(themeOrder, b.holding.theme);
      if (themeDiff !== 0) {
        return themeDiff;
      }

      const accountDiff =
        getIndex(accountOrder, a.holding.account) - getIndex(accountOrder, b.holding.account);
      if (accountDiff !== 0) {
        return accountDiff;
      }

      return a.holding.name.localeCompare(b.holding.name);
    });
    return clone;
  }, [filteredHoldings, sectionOrder, themeOrder, accountOrder]);

  const visibleColumns = portfolio.settings.visibleColumns;

  const tableHeaders = useMemo(() => {
    const headers: Array<{ key: string; label: string }> = [];

    if (visibleColumns.section) headers.push({ key: 'section', label: 'Section' });
    if (visibleColumns.theme) headers.push({ key: 'theme', label: 'Theme' });
    if (visibleColumns.assetType) headers.push({ key: 'assetType', label: 'Asset Type' });
    if (visibleColumns.name) headers.push({ key: 'name', label: 'Name' });
    if (visibleColumns.ticker) headers.push({ key: 'ticker', label: 'Ticker' });
    if (visibleColumns.exchange) headers.push({ key: 'exchange', label: 'Exchange' });
    if (visibleColumns.account) headers.push({ key: 'account', label: 'Account' });
    if (visibleColumns.price) headers.push({ key: 'price', label: 'Manual Price (Legacy)' });
    if (visibleColumns.livePrice) headers.push({ key: 'livePrice', label: 'Live Price' });
    if (visibleColumns.avgCost) headers.push({ key: 'avgCost', label: 'Avg Cost' });
    if (visibleColumns.qty) headers.push({ key: 'qty', label: 'Qty' });
    if (visibleColumns.value) headers.push({ key: 'value', label: 'Manual Value (Legacy)' });
    if (visibleColumns.liveValue) headers.push({ key: 'liveValue', label: 'Live Value' });
    if (visibleColumns.costBasis) headers.push({ key: 'costBasis', label: 'Cost Basis' });
    if (visibleColumns.dayChange) headers.push({ key: 'dayChange', label: 'Day Change' });
    if (visibleColumns.dayChangePercent) headers.push({ key: 'dayChangePercent', label: 'Day Change (%)' });
    if (visibleColumns.pctOfPortfolio) headers.push({ key: 'pctOfPortfolio', label: '% of Portfolio' });
    if (visibleColumns.pctOfSection) headers.push({ key: 'pctOfSection', label: '% of Section' });
    if (visibleColumns.pctOfTheme) headers.push({ key: 'pctOfTheme', label: '% of Theme' });
    if (visibleColumns.targetPct) headers.push({ key: 'targetPct', label: 'Target % of Theme' });
    if (visibleColumns.targetDelta) headers.push({ key: 'targetDelta', label: 'Target Value & Δ' });

    // Performance columns
    if (visibleColumns.performance1d) headers.push({ key: 'performance1d', label: '1D' });
    if (visibleColumns.performance2d) headers.push({ key: 'performance2d', label: '2D' });
    if (visibleColumns.performance3d) headers.push({ key: 'performance3d', label: '3D' });
    if (visibleColumns.performance1w) headers.push({ key: 'performance1w', label: '1W' });
    if (visibleColumns.performance1m) headers.push({ key: 'performance1m', label: '1M' });
    if (visibleColumns.performance6m) headers.push({ key: 'performance6m', label: '6M' });
    if (visibleColumns.performanceYtd) headers.push({ key: 'performanceYtd', label: 'YTD' });
    if (visibleColumns.performance1y) headers.push({ key: 'performance1y', label: '1Y' });
    if (visibleColumns.performance2y) headers.push({ key: 'performance2y', label: '2Y' });

    if (visibleColumns.include) headers.push({ key: 'include', label: 'Include' });
    if (visibleColumns.actions) headers.push({ key: 'actions', label: 'Actions' });

    return headers;
  }, [visibleColumns]);

  const groupData = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        label: string;
        section?: string;
        holdings: typeof sortedHoldings;
        totalValue: number;
        percentOfTotal: number;
        targetPercent?: number;
        targetAmount?: number;
        colors: { header: string; row: string };
      }
    >();

    sortedHoldings.forEach((item, index) => {
      const groupingKey = viewMode === 'theme' ? item.holding.theme : item.holding.account;
      const label = groupingKey || (viewMode === 'theme' ? 'Uncategorised theme' : 'Uncategorised account');
      if (!groups.has(label)) {
        const budgetSource = viewMode === 'theme' ? budgets.themes?.[label] : budgets.accounts?.[label];
        let targetPercent = budgetSource?.percent;
        let targetAmount = budgetSource?.amount;

        if (viewMode === 'theme') {
          // Simple hierarchy: Portfolio → Section → Theme
          const themeSection = portfolio.lists.themeSections?.[label];
          const sectionBudget = themeSection ? budgets.sections?.[themeSection] : undefined;

          if (sectionBudget?.percent && budgetSource?.percentOfSection) {
            // Theme % of (Section % of Portfolio Target)
            const sectionTarget = (sectionBudget.percent / 100) * targetPortfolioValue;
            targetAmount = (budgetSource.percentOfSection / 100) * sectionTarget;
          } else if (budgetSource?.amount) {
            // Fixed amount for theme
            targetAmount = budgetSource.amount;
          } else {
            targetAmount = 0;
          }
        }

        if (!targetPercent && targetAmount && totalValue > 0) {
          targetPercent = (targetAmount / totalValue) * 100;
        }

        groups.set(label, {
          key: label,
          label,
          section: viewMode === 'theme' ? portfolio.lists.themeSections?.[label] : undefined,
          holdings: [],
          totalValue: 0,
          percentOfTotal: 0,
          targetPercent,
          targetAmount,
          colors: getGroupColors(groups.size),
        });
      }

      const group = groups.get(label)!;
      group.holdings.push(item);
      group.totalValue += item.liveValue; // Use live value instead of legacy manual value
      group.percentOfTotal += item.pctOfTotal;
    });

    return Array.from(groups.values());
  }, [sortedHoldings, viewMode, budgets.accounts, budgets.themes, portfolio.lists.themeSections, totalValue]);

  return (
    <section>

      <header style={headerContainerStyle}>
        <div style={headerTopRowStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <h2 style={{ margin: 0 }}>Holdings</h2>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#475569',
                  fontSize: '0.9rem',
                }}
              >
                Allocated Value
                <span style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.375rem',
                  fontWeight: 600,
                  color: '#0f172a'
                }}>
                  {formatCurrency(totalValue)}
                </span>
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#475569',
                  fontSize: '0.9rem',
                }}
              >
                Target Portfolio Value
                <input
                  type="number"
                  step="0.01"
                  value={targetPortfolioValueDraft}
                  onChange={handleTargetPortfolioValueChange}
                  onBlur={commitTargetPortfolioValue}
                  {...numberInput}
                  style={{
                    padding: '0.25rem 0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    width: '8rem'
                  }}
                />
              </label>
            </div>
            {hasFilters ? (
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>Active filters: {filterBadge}</p>
            ) : (
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>No filters applied</p>
            )}
          </div>
        </div>
        <div style={actionButtonsContainerStyle}>
          <button
            type="button"
            onClick={async () => {
              const ticker = prompt('Enter ticker symbol:');
              if (ticker && ticker.trim()) {
                let name = ticker.trim();

                // Try to auto-fill company name
                try {
                  const { fetchCompanyInfo } = await import('../services/companyLookup');
                  const companyInfo = await fetchCompanyInfo(ticker.trim(), 'LSE'); // Default to LSE
                  if (companyInfo && companyInfo.name !== ticker.toUpperCase()) {
                    name = companyInfo.name;
                  }
                } catch (error) {
                  console.warn('Company lookup failed:', error);
                }

                // Allow user to override the auto-filled name
                const finalName = prompt('Enter holding name (optional):', name) || name;

                addHolding({
                  ticker: ticker.trim().toUpperCase(),
                  name: finalName.trim(),
                  assetType: 'Stock',
                });
              }
            }}
            style={primaryActionButtonStyle}
          >
            + Add Holding
          </button>
          <button type="button" onClick={() => setShowColumnSettings(true)} style={actionButtonStyle}>
            Columns
          </button>

        </div>
      </header>



      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '0.85rem', color: '#475569' }}>Group view:</span>
        {[
          { value: 'theme', label: 'By Theme' },
          { value: 'account', label: 'By Account' },
        ].map((option) => {
          const active = viewMode === option.value;
          return (
            <button
              key={option.value}
              type="button"
              style={{
                padding: '0.35rem 1rem',
                borderRadius: '999px',
                border: active ? '1px solid #1d4ed8' : '1px solid #cbd5f5',
                background: active ? '#1d4ed8' : '#fff',
                color: active ? '#fff' : '#0f172a',
                cursor: 'pointer',
                fontWeight: 600,
                boxShadow: active ? '0 1px 3px rgba(29, 78, 216, 0.35)' : 'none',
              }}
              onClick={() => setViewMode(option.value as 'theme' | 'account')}
              aria-pressed={active}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div style={filtersContainerStyle}>
        <label style={filtersLabelStyle}>
          Section
          <select value={filters.section ?? ''} onChange={handleFilterChange('section')} style={selectStyle}>
            <option value="">All</option>
            {lists.sections.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </label>
        <label style={filtersLabelStyle}>
          Theme
          <select value={filters.theme ?? ''} onChange={handleFilterChange('theme')} style={themeSelectStyle}>
            <option value="">All</option>
            {sortedThemes.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
        </label>
        <label style={filtersLabelStyle}>
          Account
          <select value={filters.account ?? ''} onChange={handleFilterChange('account')} style={selectStyle}>
            <option value="">All</option>
            {lists.accounts.map((account) => (
              <option key={account} value={account}>
                {account}
              </option>
            ))}
          </select>
        </label>
      </div>



      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {tableHeaders.map((header) => (
                <th key={header.key} style={thStyle}>
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupData.length === 0 ? (
              <tr>
                <td colSpan={tableHeaders.length} style={{ textAlign: 'center', padding: '1.75rem', color: '#64748b' }}>
                  {hasFilters
                    ? 'No holdings match current filters.'
                    : 'No holdings yet. Use Quick add to get started.'}
                </td>
              </tr>
            ) : (
              groupData.map((group) => (
                <Fragment key={group.key}>
                  <tr>
                    {tableHeaders.map((header, index) => (
                      <td key={header.key} style={{ padding: '0.4rem 0.6rem', background: group.colors.header }}>
                        {index === 0 ? (
                          // First column: show theme name
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {group.label}
                          </span>
                        ) : header.key === 'pctOfTheme' ? (
                          // % of Theme column: show actual percentage of target theme total
                          <span style={{ color: '#475569', fontSize: '0.85rem' }}>
                            {group.targetAmount && group.targetAmount > 0
                              ? `${Math.round((group.totalValue / group.targetAmount) * 100)}%`
                              : '—'
                            }
                          </span>
                        ) : header.key === 'liveValue' ? (
                          // Live Value column: show theme total
                          <span style={{ color: '#475569', fontSize: '0.85rem' }}>
                            {formatCurrency(group.totalValue)}
                          </span>
                        ) : header.key === 'targetDelta' ? (
                          // Target Value column: show target total
                          <span style={{ color: '#475569', fontSize: '0.85rem' }}>
                            {group.targetAmount && group.targetAmount > 0
                              ? formatCurrency(group.targetAmount)
                              : '—'
                            }
                          </span>
                        ) : header.key === 'targetPct' ? (
                          // Target % of Theme column: show 100% as target should add up to 100%
                          <span style={{ color: '#475569', fontSize: '0.85rem' }}>
                            100%
                          </span>
                        ) : (
                          // Other columns: empty
                          ''
                        )}
                      </td>
                    ))}
                  </tr>
                  {group.holdings.map(({ holding, value, liveValue, dayChangeValue, pctOfTotal, pctOfSection, sectionTotal, pctOfTheme, targetValue, targetValueDiff, targetPctDiff }) => {
                    const cells = renderHoldingCells(
                      holding,
                      { value, liveValue, dayChangeValue, pctOfTotal, pctOfSection, sectionTotal, pctOfTheme, targetValue, targetValueDiff, targetPctDiff },
                      visibleColumns,
                      {
                        handleSelectChange,
                        handleTextChange,
                        handleNumberChange,
                        handleTargetChange,

                        handlePortfolioShareChange,
                        handleSectionShareChange,
                        duplicateHolding,
                        deleteHolding,
                        openTradeForm,
                        updateHolding,
                      },
                      lists,
                      sortedThemes
                    );

                    return (
                      <Fragment key={holding.id}>
                        <tr
                          style={{
                            opacity: holding.include ? 1 : 0.6,
                            backgroundColor: holding.include ? group.colors.row : '#f8fafc',
                          }}
                        >
                          {cells}
                        </tr>
                      </Fragment>
                    );
                  })}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ColumnSettings
        isOpen={showColumnSettings}
        onClose={() => setShowColumnSettings(false)}
      />


    </section>
  );
};

export default HoldingsGrid;
