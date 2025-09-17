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
  const pct = `${pctDiff >= 0 ? '+' : ''}${pctDiff.toFixed(2)}%`;
  return `${currency} / ${pct}`;
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
const quickAddFormStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  flexWrap: 'wrap',
};
const quickAddInputStyle: CSSProperties = {
  padding: '0.45rem 0.75rem',
  borderRadius: '999px',
  border: '1px solid #cbd5f5',
  fontSize: '0.9rem',
  minWidth: '8.5rem',
};
const quickAddButtonStyle: CSSProperties = {
  padding: '0.45rem 0.9rem',
  borderRadius: '999px',
  border: 'none',
  background: '#1d4ed8',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
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
    filters,
    budgets,
    addHolding,
    duplicateHolding,
    updateHolding,
    deleteHolding,
    setTotal,
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
  const [importError, setImportError] = useState<string | null>(null);
  const [importAccount, setImportAccount] = useState<string>('');
  const [newHoldingTicker, setNewHoldingTicker] = useState('');
  const [newHoldingName, setNewHoldingName] = useState('');
  const [quickAddError, setQuickAddError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tradeForm, setTradeForm] = useState<
    | {
        holdingId: string;
        type: 'buy' | 'sell';
        date: string;
        price: string;
        qty: string;
      }
    | null
  >(null);
  const [tradeError, setTradeError] = useState<string | null>(null);

  useEffect(() => {
    setTotalDraft(totalValue.toFixed(2));
  }, [totalValue]);

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

  const handleQuickAdd = () => {
    const ticker = newHoldingTicker.trim().toUpperCase();
    const name = newHoldingName.trim();

    if (!ticker) {
      setQuickAddError('Enter a ticker to add a holding.');
      return;
    }

    const exists = portfolio.holdings.some(
      (holding) => holding.ticker.trim().toUpperCase() === ticker
    );
    if (exists) {
      setQuickAddError('That ticker already exists in your holdings.');
      return;
    }

    addHolding({
      ticker,
      name: name || ticker,
      assetType: 'Stock',
    });
    setQuickAddError(null);
    setNewHoldingTicker('');
    setNewHoldingName('');
  };

  const handleQuickAddSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleQuickAdd();
  };

  const handleFilterChange = (key: keyof typeof filters) => (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setFilter(key, value === '' ? undefined : value);
  };

  const handleExport = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const rows = portfolio.holdings.map(({ id: _id, ...rest }) => ({ ...rest }));
    const csv = holdingsToCsv(rows);
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
  }, [portfolio.holdings, portfolio.name]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : new TextDecoder().decode(reader.result as ArrayBuffer);
        const rows = parseHoldingsCsv(text);
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

  const openTradeForm = (holding: Holding) => {
    setTradeError(null);
    setTradeForm({
      holdingId: holding.id,
      type: 'buy',
      date: new Date().toISOString().slice(0, 10),
      price: holding.price > 0 ? holding.price.toString() : '',
      qty: '',
    });
  };

  const submitTradeForm = () => {
    if (!tradeForm) {
      return;
    }

    const qty = Number.parseFloat(tradeForm.qty);
    const price = Number.parseFloat(tradeForm.price);

    if (!Number.isFinite(qty) || qty <= 0) {
      setTradeError('Enter a valid quantity');
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setTradeError('Enter a valid price');
      return;
    }

    setTradeError(null);
    recordTrade(tradeForm.holdingId, {
      type: tradeForm.type,
      date: tradeForm.date,
      price,
      qty,
    });
    setTradeForm(null);
  };

  const filteredHoldings = derivedHoldings.filter(({ holding }) => {
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
      updateHolding(id, { [field]: event.target.value } as Partial<Holding>);
    };

  const handleNumberChange = (id: string, field: keyof Holding) => (event: ChangeEvent<HTMLInputElement>) => {
    updateHolding(id, { [field]: asNumber(event.target.value) } as Partial<Holding>);
  };

  const handleTargetChange = (id: string) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim();
    updateHolding(id, {
      targetPct: value === '' ? undefined : asNumber(value),
    });
  };

  const handleValueChange = (holding: Holding) => (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = asNumber(event.target.value);
    const qty = calculateQtyFromValue(nextValue, holding.price);
    updateHolding(holding.id, { qty });
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
      const qty = calculateQtyFromValue(nextValue, holding.price);
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
      const qty = calculateQtyFromValue(nextValue, holding.price);
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
      group.totalValue += item.value;
      group.percentOfTotal += item.pctOfTotal;
    });

    return Array.from(groups.values());
  }, [sortedHoldings, viewMode, budgets.accounts, budgets.themes, portfolio.lists.themeSections, totalValue]);

  return (
    <section>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <header style={headerContainerStyle}>
        <div style={headerTopRowStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <h2 style={{ margin: 0 }}>Holdings</h2>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#475569',
                fontSize: '0.9rem',
              }}
            >
              Total value
              <input
                type="number"
                step="0.01"
                value={totalDraft}
                onChange={handleTotalChange}
                onBlur={commitTotal}
                {...numberInput}
              />
            </label>
            {hasFilters ? (
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>Active filters: {filterBadge}</p>
            ) : (
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>No filters applied</p>
            )}
          </div>
          <form style={quickAddFormStyle} onSubmit={handleQuickAddSubmit}>
            <span style={{ fontSize: '0.85rem', color: '#475569' }}>Quick add</span>
            <input
              value={newHoldingTicker}
              onChange={(event) => {
                setNewHoldingTicker(event.target.value.toUpperCase());
                if (quickAddError) {
                  setQuickAddError(null);
                }
              }}
              placeholder="Ticker"
              style={{ ...quickAddInputStyle, textTransform: 'uppercase' }}
            />
            <input
              value={newHoldingName}
              onChange={(event) => {
                setNewHoldingName(event.target.value);
                if (quickAddError) {
                  setQuickAddError(null);
                }
              }}
              placeholder="Name (optional)"
              style={quickAddInputStyle}
            />
            <button type="submit" style={quickAddButtonStyle}>
              Add holding
            </button>
          </form>
        </div>
        {quickAddError ? (
          <p style={{ margin: 0, color: '#b91c1c', fontSize: '0.8rem' }}>{quickAddError}</p>
        ) : null}
        <div style={actionButtonsContainerStyle}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            Import account
            <input
              type="text"
              value={importAccount}
              onChange={(event) => setImportAccount(event.target.value)}
              placeholder="e.g. ISA"
              style={{ ...quickAddInputStyle, borderRadius: '0.6rem' }}
            />
          </label>
          <button type="button" onClick={handleImportClick} style={actionButtonStyle}>
            Upload CSV
          </button>
          <button type="button" onClick={handleExport} style={actionButtonStyle}>
            Download CSV
          </button>
        </div>
      </header>

      {importError ? (
        <p style={{ margin: '0 0 1rem', color: '#b91c1c', fontSize: '0.85rem' }}>{importError}</p>
      ) : null}

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
              {[
                'Section',
                'Theme',
                'Asset Type',
                'Name',
                'Ticker',
                'Account',
                'Price',
                'Avg Cost',
                'Qty',
                'Value',
                'Cost Basis',
                '% of Portfolio',
                '% of Section',
                'Target %',
                'Target Δ (£ / %)',
                'Include',
                'Actions',
              ].map((heading) => (
                <th key={heading} style={thStyle}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupData.length === 0 ? (
              <tr>
                <td colSpan={17} style={{ textAlign: 'center', padding: '1.75rem', color: '#64748b' }}>
                  {hasFilters
                    ? 'No holdings match current filters.'
                    : 'No holdings yet. Use Quick add to get started.'}
                </td>
              </tr>
            ) : (
              groupData.map((group) => (
                <Fragment key={group.key}>
                  <tr>
                    <td colSpan={17} style={{ padding: '0.75rem', background: group.colors.header }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 700 }}>
                          {group.label}
                          {group.section ? ` · ${group.section}` : ''}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                          {formatCurrency(group.totalValue)} · {group.percentOfTotal.toFixed(2)}% of portfolio
                          {group.targetPercent !== undefined
                            ? ` · Target ${group.targetPercent.toFixed(2)}%`
                            : group.targetAmount !== undefined
                              ? ` · Target ${formatCurrency(group.targetAmount)}`
                              : ''}
                          {group.targetPercent !== undefined && group.targetPercent > 0
                            ? ` · ${(group.percentOfTotal / group.targetPercent * 100).toFixed(0)}% of target`
                            : group.targetAmount !== undefined && group.targetAmount > 0
                              ? ` · ${(group.totalValue / group.targetAmount * 100).toFixed(0)}% of target`
                              : ''}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {group.holdings.map(({ holding, value, pctOfTotal, pctOfSection, sectionTotal, targetValueDiff, targetPctDiff }) => {
                    const showTrade = tradeForm?.holdingId === holding.id;
                    return (
                      <Fragment key={holding.id}>
                        <tr
                          style={{
                            opacity: holding.include ? 1 : 0.6,
                            backgroundColor: holding.include ? group.colors.row : '#f8fafc',
                          }}
                        >
                      <td style={tdStyle}>
                        <select
                          value={holding.section}
                          onChange={handleSelectChange(holding.id, 'section')}
                          style={selectStyle}
                        >
                          {lists.sections.map((section) => (
                            <option key={section} value={section} title={section}>
                              {getSectionAbbreviation(section)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={tdStyle}>
                        <select
                          value={holding.theme}
                          onChange={handleSelectChange(holding.id, 'theme')}
                          style={themeSelectStyle}
                        >
                          {sortedThemes.map((theme) => (
                            <option key={theme} value={theme}>
                              {theme}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={tdStyle}>
                        <select
                          value={holding.assetType}
                          onChange={handleSelectChange(holding.id, 'assetType')}
                          style={selectStyle}
                        >
                          {['ETF', 'Stock', 'Crypto', 'Cash', 'Bond', 'Fund', 'Other'].map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={tdStyle}>
                        <input value={holding.name} onChange={handleTextChange(holding.id, 'name')} style={nameInputStyle} />
                      </td>
                      <td style={tdStyle}>
                        <input value={holding.ticker} onChange={handleTextChange(holding.id, 'ticker')} style={tickerInputStyle} />
                      </td>
                      <td style={tdStyle}>
                        <select
                          value={holding.account}
                          onChange={handleSelectChange(holding.id, 'account')}
                          style={selectStyle}
                        >
                          {lists.accounts.map((account) => (
                            <option key={account} value={account}>
                              {account}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="number"
                          step="0.01"
                          value={holding.price}
                          onChange={handleNumberChange(holding.id, 'price')}
                          {...numberInput}
                          style={numericInputStyle}
                        />
                      </td>
                      <td style={{ ...tdStyle, color: '#475569' }}>
                        {formatCurrency(holding.avgCost ?? holding.price ?? 0)}
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="number"
                          step="0.01"
                          value={holding.qty}
                          onChange={handleNumberChange(holding.id, 'qty')}
                          {...numberInput}
                          style={numericInputStyle}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="number"
                          step="0.01"
                          value={value.toFixed(2)}
                          onChange={handleValueChange(holding)}
                          {...numberInput}
                          style={numericInputStyle}
                        />
                      </td>
                      <td style={{ ...tdStyle, color: '#475569' }}>
                        {formatCurrency((holding.avgCost ?? holding.price ?? 0) * holding.qty)}
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="number"
                          value={pctOfTotal.toFixed(2)}
                          onChange={handlePortfolioShareChange(holding, value)}
                          {...percentInput}
                          style={numericInputStyle}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="number"
                          value={pctOfSection.toFixed(2)}
                          onChange={handleSectionShareChange(holding, value, sectionTotal)}
                          {...percentInput}
                          style={numericInputStyle}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="number"
                          step="0.1"
                          value={holding.targetPct ?? ''}
                          onChange={handleTargetChange(holding.id)}
                          {...numberInput}
                          style={targetInputStyle}
                        />
                      </td>
                      <td style={{ ...tdStyle, color: '#475569' }}>{formatTargetDiff(targetValueDiff, targetPctDiff)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={holding.include}
                          onChange={(event) => updateHolding(holding.id, { include: event.target.checked })}
                        />
                      </td>
                      <td style={tdStyle}>
                        <div style={actionCellStyle}>
                          <button
                            type="button"
                            onClick={() => duplicateHolding(holding.id)}
                            style={inlineButtonStyle}
                          >
                            Duplicate
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteHolding(holding.id)}
                            style={inlineButtonStyle}
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => openTradeForm(holding)}
                            style={inlineButtonStyle}
                          >
                            Record trade
                          </button>
                        </div>
                      </td>
                        </tr>
                        {showTrade ? (
                          <tr>
                            <td colSpan={17} style={{ padding: '0.75rem', background: '#f8fafc' }}>
                          <div
                            style={{
                              display: 'flex',
                              gap: '0.75rem',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                            }}
                          >
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem' }}>
                              Type
                              <select
                                value={tradeForm.type}
                                onChange={(event) =>
                                  setTradeForm((prev) =>
                                    prev ? { ...prev, type: event.target.value as 'buy' | 'sell' } : prev
                                  )
                                }
                                style={{ padding: '0.45rem 0.6rem', borderRadius: '0.6rem', border: '1px solid #cbd5f5' }}
                              >
                                <option value="buy">Buy</option>
                                <option value="sell">Sell</option>
                              </select>
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem' }}>
                              Date
                              <input
                                type="date"
                                value={tradeForm.date}
                                onChange={(event) =>
                                  setTradeForm((prev) => (prev ? { ...prev, date: event.target.value } : prev))
                                }
                                style={{ padding: '0.45rem 0.6rem', borderRadius: '0.6rem', border: '1px solid #cbd5f5' }}
                              />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem' }}>
                              Quantity
                              <input
                                type="number"
                                min="0"
                                step="0.0001"
                                value={tradeForm.qty}
                                onChange={(event) =>
                                  setTradeForm((prev) => (prev ? { ...prev, qty: event.target.value } : prev))
                                }
                                style={{
                                  padding: '0.45rem 0.6rem',
                                  borderRadius: '0.6rem',
                                  border: '1px solid #cbd5f5',
                                  minWidth: '7rem',
                                }}
                              />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem' }}>
                              Price
                              <input
                                type="number"
                                min="0"
                                step="0.0001"
                                value={tradeForm.price}
                                onChange={(event) =>
                                  setTradeForm((prev) => (prev ? { ...prev, price: event.target.value } : prev))
                                }
                                style={{
                                  padding: '0.45rem 0.6rem',
                                  borderRadius: '0.6rem',
                                  border: '1px solid #cbd5f5',
                                  minWidth: '7rem',
                                }}
                              />
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={submitTradeForm}
                                style={primaryActionButtonStyle}
                              >
                                Save trade
                              </button>
                              <button
                                type="button"
                                onClick={() => setTradeForm(null)}
                                style={actionButtonStyle}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                          {tradeError ? (
                            <p style={{ margin: '0.5rem 0 0', color: '#b91c1c', fontSize: '0.8rem' }}>{tradeError}</p>
                          ) : null}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default HoldingsGrid;
