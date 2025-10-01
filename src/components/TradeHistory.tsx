import { useMemo, useState, type CSSProperties } from 'react';
import { usePortfolio } from '../state/portfolioStore';

const containerStyle: CSSProperties = {
  marginTop: '2rem',
};

const formatCurrency = (value: number): string => `£${value.toFixed(2)}`;

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: '720px',
};

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '0.75rem',
  textTransform: 'uppercase',
  fontSize: '0.7rem',
  letterSpacing: '0.05em',
  color: '#475569',
  borderBottom: '1px solid #e2e8f0',
};

const tdStyle: CSSProperties = {
  padding: '0.7rem',
  borderBottom: '1px solid #e2e8f0',
  fontSize: '0.9rem',
};

const infoStyle: CSSProperties = {
  margin: '0.5rem 0 0',
  color: '#64748b',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
  flexWrap: 'wrap',
  gap: '1rem',
};

const filtersStyle: CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  alignItems: 'center',
  flexWrap: 'wrap',
};

const selectStyle: CSSProperties = {
  padding: '0.35rem 0.5rem',
  borderRadius: '0.5rem',
  border: '1px solid #d1d5db',
  fontSize: '0.875rem',
  backgroundColor: '#fff',
};

const summaryStyle: CSSProperties = {
  display: 'flex',
  gap: '1.5rem',
  marginBottom: '1rem',
  fontSize: '0.875rem',
  color: '#374151',
  flexWrap: 'wrap',
};

const summaryItemStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
};

const summaryLabelStyle: CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#6b7280',
  fontWeight: 600,
};

const summaryValueStyle: CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  color: '#111827',
};

const TradeHistory = () => {
  const { portfolio, trades = [] } = usePortfolio();
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
  const [filterTicker, setFilterTicker] = useState<string>('');

  const { rows, summary } = useMemo(() => {
    if (!Array.isArray(trades) || trades.length === 0) {
      return { rows: [], summary: { totalTrades: 0, totalBuys: 0, totalSells: 0, totalValue: 0 } };
    }

    const holdingsById = new Map((portfolio.holdings ?? []).map((holding) => [holding.id, holding]));
    let allRows = [...trades]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((trade) => {
        const holding = holdingsById.get(trade.holdingId);
        return {
          id: trade.id,
          name: holding?.name ?? 'Unknown holding',
          ticker: holding?.ticker ?? '—',
          type: trade.type,
          date: trade.date,
          qty: trade.qty,
          price: trade.price,
          value: trade.qty * trade.price,
        };
      });

    // Apply filters
    if (filterType !== 'all') {
      allRows = allRows.filter(row => row.type === filterType);
    }
    if (filterTicker) {
      allRows = allRows.filter(row => 
        row.ticker.toLowerCase().includes(filterTicker.toLowerCase()) ||
        row.name.toLowerCase().includes(filterTicker.toLowerCase())
      );
    }

    // Calculate summary
    const summary = {
      totalTrades: trades.length,
      totalBuys: trades.filter(t => t.type === 'buy').length,
      totalSells: trades.filter(t => t.type === 'sell').length,
      totalValue: trades.reduce((sum, t) => sum + (t.qty * t.price), 0),
    };

    return { rows: allRows, summary };
  }, [portfolio.holdings, trades, filterType, filterTicker]);

  const uniqueTickers = useMemo(() => {
    const tickers = new Set<string>();
    portfolio.holdings.forEach(h => {
      if (h.ticker && h.ticker.trim()) {
        tickers.add(h.ticker);
      }
    });
    return Array.from(tickers).sort();
  }, [portfolio.holdings]);

  if (rows.length === 0) {
    return (
      <section style={containerStyle}>
        <h2 style={{ marginBottom: '0.35rem' }}>Trade History</h2>
        <p style={infoStyle}>No trades recorded yet. Use “Record trade” on a holding to get started.</p>
      </section>
    );
  }

  return (
    <section style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0 }}>Trade History</h2>
          <p style={infoStyle}>Recent purchases and sales for this portfolio.</p>
        </div>
        
        <div style={filtersStyle}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'buy' | 'sell')}
            style={selectStyle}
          >
            <option value="all">All Types</option>
            <option value="buy">Buys Only</option>
            <option value="sell">Sells Only</option>
          </select>
          
          <select
            value={filterTicker}
            onChange={(e) => setFilterTicker(e.target.value)}
            style={selectStyle}
          >
            <option value="">All Holdings</option>
            {uniqueTickers.map(ticker => (
              <option key={ticker} value={ticker}>{ticker}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={summaryStyle}>
        <div style={summaryItemStyle}>
          <span style={summaryLabelStyle}>Total Trades</span>
          <span style={summaryValueStyle}>{summary.totalTrades}</span>
        </div>
        <div style={summaryItemStyle}>
          <span style={summaryLabelStyle}>Buys</span>
          <span style={summaryValueStyle}>{summary.totalBuys}</span>
        </div>
        <div style={summaryItemStyle}>
          <span style={summaryLabelStyle}>Sells</span>
          <span style={summaryValueStyle}>{summary.totalSells}</span>
        </div>
        <div style={summaryItemStyle}>
          <span style={summaryLabelStyle}>Total Value</span>
          <span style={summaryValueStyle}>{formatCurrency(summary.totalValue)}</span>
        </div>
        {rows.length !== summary.totalTrades && (
          <div style={summaryItemStyle}>
            <span style={summaryLabelStyle}>Showing</span>
            <span style={summaryValueStyle}>{rows.length} of {summary.totalTrades}</span>
          </div>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Holding</th>
              <th style={thStyle}>Ticker</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Quantity</th>
              <th style={thStyle}>Price</th>
              <th style={thStyle}>Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '1.5rem', color: '#6b7280' }}>
                  No trades match the current filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td style={tdStyle}>{new Date(row.date).toLocaleDateString()}</td>
                  <td style={tdStyle}>{row.name}</td>
                  <td style={tdStyle}>{row.ticker}</td>
                  <td style={{ 
                    ...tdStyle, 
                    textTransform: 'capitalize',
                    color: row.type === 'buy' ? '#10b981' : '#ef4444',
                    fontWeight: 600,
                  }}>
                    {row.type}
                  </td>
                  <td style={tdStyle}>{row.qty.toFixed(4)}</td>
                  <td style={tdStyle}>{formatCurrency(row.price)}</td>
                  <td style={tdStyle}>{formatCurrency(row.value)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default TradeHistory;
