import { type CSSProperties, useState } from 'react';
import { FilterBar } from '../components/FilterBar';

const pageStyle: CSSProperties = {
  padding: '2rem',
  maxWidth: '1440px',
  margin: '0 auto',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '2rem',
  flexWrap: 'wrap',
  gap: '1rem',
};

const titleSectionStyle: CSSProperties = {
  flex: 1,
};

const titleStyle: CSSProperties = {
  fontSize: '2rem',
  fontWeight: 700,
  color: 'var(--gray-900)',
  margin: '0 0 0.5rem 0',
};

const subtitleStyle: CSSProperties = {
  fontSize: '1rem',
  color: 'var(--gray-600)',
  margin: 0,
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: '1.5rem',
};

const etfCardStyle: CSSProperties = {
  background: 'white',
  borderRadius: 'var(--radius-lg)',
  padding: '1.5rem',
  boxShadow: 'var(--shadow-sm)',
  border: '1px solid var(--gray-200)',
  transition: 'all 0.15s ease',
  cursor: 'pointer',
};

const etfHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1rem',
};

const etfTitleStyle: CSSProperties = {
  fontSize: '1.125rem',
  fontWeight: 600,
  color: 'var(--gray-900)',
  margin: '0 0 0.25rem 0',
};

const etfTickerStyle: CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--gray-600)',
  fontFamily: 'monospace',
};

const etfExpenseStyle: CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'var(--primary-600)',
};

const etfMetricsStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '0.75rem',
  marginBottom: '1rem',
};

const metricStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
};

const metricLabelStyle: CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--gray-600)',
  fontWeight: 500,
};

const metricValueStyle: CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'var(--gray-900)',
};

const etfTagsStyle: CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

const mockETFs = [
  {
    ticker: 'VWRL',
    name: 'Vanguard FTSE All-World UCITS ETF',
    expense: '0.22%',
    aum: '£8.2B',
    yield: '1.8%',
    region: 'Global',
    category: 'Equity',
    tags: ['Core', 'Diversified', 'Low Cost'],
  },
  {
    ticker: 'EQQQ',
    name: 'Invesco EQQQ NASDAQ-100 UCITS ETF',
    expense: '0.30%',
    aum: '£4.1B',
    yield: '0.7%',
    region: 'US',
    category: 'Technology',
    tags: ['Growth', 'Tech', 'Satellite'],
  },
  {
    ticker: 'VUKE',
    name: 'Vanguard FTSE 100 UCITS ETF',
    expense: '0.09%',
    aum: '£2.8B',
    yield: '3.4%',
    region: 'UK',
    category: 'Equity',
    tags: ['UK', 'Dividend', 'Low Cost'],
  },
  {
    ticker: 'AGGG',
    name: 'iShares Core Global Aggregate Bond UCITS ETF',
    expense: '0.10%',
    aum: '£1.9B',
    yield: '2.1%',
    region: 'Global',
    category: 'Bond',
    tags: ['Fixed Income', 'Defensive', 'Core'],
  },
  {
    ticker: 'VMID',
    name: 'Vanguard FTSE 250 UCITS ETF',
    expense: '0.10%',
    aum: '£1.2B',
    yield: '2.8%',
    region: 'UK',
    category: 'Mid Cap',
    tags: ['UK', 'Mid Cap', 'Value'],
  },
  {
    ticker: 'SPYG',
    name: 'SPDR S&P 500 Growth ETF',
    expense: '0.04%',
    aum: '£15.3B',
    yield: '0.6%',
    region: 'US',
    category: 'Growth',
    tags: ['US', 'Growth', 'Large Cap'],
  },
];

export const ETFExplorer = () => {
  const [filters, setFilters] = useState({
    region: '',
    category: '',
    expense: '',
  });
  const [searchValue, setSearchValue] = useState('');

  const filterOptions = [
    {
      id: 'region',
      label: 'Region',
      value: filters.region,
      options: [
        { value: '', label: 'All Regions' },
        { value: 'global', label: 'Global' },
        { value: 'us', label: 'US' },
        { value: 'uk', label: 'UK' },
        { value: 'europe', label: 'Europe' },
      ],
      onChange: (value: string) => setFilters(prev => ({ ...prev, region: value })),
    },
    {
      id: 'category',
      label: 'Category',
      value: filters.category,
      options: [
        { value: '', label: 'All Categories' },
        { value: 'equity', label: 'Equity' },
        { value: 'bond', label: 'Bond' },
        { value: 'technology', label: 'Technology' },
        { value: 'growth', label: 'Growth' },
      ],
      onChange: (value: string) => setFilters(prev => ({ ...prev, category: value })),
    },
    {
      id: 'expense',
      label: 'Expense Ratio',
      value: filters.expense,
      options: [
        { value: '', label: 'Any Expense' },
        { value: 'low', label: 'Low (<0.15%)' },
        { value: 'medium', label: 'Medium (0.15-0.50%)' },
        { value: 'high', label: 'High (>0.50%)' },
      ],
      onChange: (value: string) => setFilters(prev => ({ ...prev, expense: value })),
    },
  ];

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div style={titleSectionStyle}>
          <h1 style={titleStyle}>ETF Explorer</h1>
          <p style={subtitleStyle}>
            Discover and analyze ETFs with comprehensive filtering and detailed insights.
          </p>
        </div>
      </header>

      <FilterBar
        filters={filterOptions}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search ETF name or ticker..."
      />

      <div style={gridStyle}>
        {mockETFs.map((etf) => (
          <div
            key={etf.ticker}
            style={etfCardStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div style={etfHeaderStyle}>
              <div>
                <h3 style={etfTitleStyle}>{etf.name}</h3>
                <p style={etfTickerStyle}>{etf.ticker}</p>
              </div>
              <div style={etfExpenseStyle}>{etf.expense}</div>
            </div>

            <div style={etfMetricsStyle}>
              <div style={metricStyle}>
                <span style={metricLabelStyle}>AUM</span>
                <span style={metricValueStyle}>{etf.aum}</span>
              </div>
              <div style={metricStyle}>
                <span style={metricLabelStyle}>Yield</span>
                <span style={metricValueStyle}>{etf.yield}</span>
              </div>
              <div style={metricStyle}>
                <span style={metricLabelStyle}>Region</span>
                <span style={metricValueStyle}>{etf.region}</span>
              </div>
              <div style={metricStyle}>
                <span style={metricLabelStyle}>Category</span>
                <span style={metricValueStyle}>{etf.category}</span>
              </div>
            </div>

            <div style={etfTagsStyle}>
              {etf.tags.map((tag) => (
                <span key={tag} className="badge badge-primary">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};