import { useMemo, type CSSProperties } from 'react';
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

const TradeHistory = () => {
  const { portfolio, trades = [] } = usePortfolio();

  const rows = useMemo(() => {
    if (!Array.isArray(trades) || trades.length === 0) {
      return [];
    }

    const holdingsById = new Map((portfolio.holdings ?? []).map((holding) => [holding.id, holding]));
    return [...trades]
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
        };
      });
  }, [portfolio.holdings, trades]);

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
      <h2 style={{ marginBottom: '0.35rem' }}>Trade History</h2>
      <p style={infoStyle}>Recent purchases and sales for this portfolio.</p>
      <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Holding</th>
              <th style={thStyle}>Ticker</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Quantity</th>
              <th style={thStyle}>Price</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td style={tdStyle}>{new Date(row.date).toLocaleDateString()}</td>
                <td style={tdStyle}>{row.name}</td>
                <td style={tdStyle}>{row.ticker}</td>
                <td style={{ ...tdStyle, textTransform: 'capitalize' }}>{row.type}</td>
                <td style={tdStyle}>{row.qty}</td>
                <td style={tdStyle}>{formatCurrency(row.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default TradeHistory;
