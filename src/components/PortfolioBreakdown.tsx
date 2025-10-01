import { useMemo, useState, type CSSProperties } from 'react';
import { usePortfolio } from '../state/portfolioStore';

const containerStyle: CSSProperties = {
  marginTop: '2rem',
  padding: '1.5rem',
  backgroundColor: '#fff',
  borderRadius: '0.75rem',
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
};

const headerStyle: CSSProperties = {
  marginBottom: '1.5rem',
};

const titleStyle: CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  marginBottom: '0.5rem',
  color: '#1f2937',
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: '#6b7280',
  fontSize: '0.875rem',
};

const contentStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '2rem',
  alignItems: 'start',
};

const chartContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
};

const svgStyle: CSSProperties = {
  maxWidth: '280px',
  height: '280px',
};

const legendStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  minWidth: '200px',
};

const legendItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.5rem',
  borderRadius: '0.5rem',
  backgroundColor: '#f9fafb',
};

const colorBoxStyle: CSSProperties = {
  width: '16px',
  height: '16px',
  borderRadius: '3px',
  flexShrink: 0,
};

const labelStyle: CSSProperties = {
  flex: 1,
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#374151',
};

const valueStyle: CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#1f2937',
};

const percentStyle: CSSProperties = {
  fontSize: '0.75rem',
  color: '#6b7280',
  marginLeft: '0.25rem',
};

const tabsStyle: CSSProperties = {
  display: 'flex',
  gap: '0.25rem',
  marginBottom: '1.5rem',
  padding: '0.25rem',
  backgroundColor: '#f1f5f9',
  borderRadius: '0.5rem',
  border: '1px solid #e2e8f0',
};

const tabStyle: CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: '0.25rem',
  border: 'none',
  background: 'transparent',
  color: '#64748b',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 500,
  transition: 'all 0.2s ease',
};

const activeTabStyle: CSSProperties = {
  ...tabStyle,
  background: '#fff',
  color: '#0f172a',
  fontWeight: 600,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
};

const formatCurrency = (value: number): string => `£${value.toFixed(2)}`;

// Generate consistent colors for pie chart segments
const generateColors = (count: number): string[] => {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#ec4899', // pink
    '#6b7280', // gray
  ];
  
  // If we need more colors, generate variations
  if (count <= colors.length) {
    return colors.slice(0, count);
  }
  
  const result = [...colors];
  for (let i = colors.length; i < count; i++) {
    const baseColor = colors[i % colors.length];
    // Create variations by adjusting lightness
    const variation = i < colors.length * 2 ? '80' : '60';
    result.push(baseColor + variation);
  }
  
  return result;
};

interface BreakdownData {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

type BreakdownType = 'sections' | 'themes' | 'accounts' | 'assetTypes';

export const PortfolioBreakdown = () => {
  const { portfolio, derivedHoldings, totalValue, filters } = usePortfolio();
  const [activeTab, setActiveTab] = useState<BreakdownType>('sections');

  const hasFilters = Boolean(filters.section || filters.theme || filters.account);

  const breakdownData = useMemo(() => {
    const includedHoldings = derivedHoldings.filter(({ holding }) => holding.include);
    
    const calculateBreakdown = (getKey: (holding: any) => string): BreakdownData[] => {
      const groups = new Map<string, number>();
      
      includedHoldings.forEach(({ holding, value }) => {
        const key = getKey(holding);
        groups.set(key, (groups.get(key) || 0) + value);
      });
      
      const total = Array.from(groups.values()).reduce((sum, value) => sum + value, 0);
      const colors = generateColors(groups.size);
      
      return Array.from(groups.entries())
        .map(([label, value], index) => ({
          label,
          value,
          percentage: total > 0 ? (value / total) * 100 : 0,
          color: colors[index],
        }))
        .sort((a, b) => b.value - a.value); // Sort by value descending
    };

    return {
      sections: calculateBreakdown((holding) => holding.section || 'Uncategorized'),
      themes: calculateBreakdown((holding) => holding.theme || 'Uncategorized'),
      accounts: calculateBreakdown((holding) => holding.account || 'Uncategorized'),
      assetTypes: calculateBreakdown((holding) => holding.assetType || 'Other'),
    };
  }, [derivedHoldings]);

  const currentData = breakdownData[activeTab];

  // Create SVG pie chart
  const createPieChart = (data: BreakdownData[]) => {
    if (data.length === 0) {
      return null;
    }

    const radius = 120;
    const centerX = 140;
    const centerY = 140;
    
    let currentAngle = -90; // Start at top
    
    const paths = data.map((item) => {
      const startAngle = currentAngle;
      const endAngle = currentAngle + (item.percentage / 100) * 360;
      currentAngle = endAngle;
      
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      const largeArcFlag = item.percentage > 50 ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      return (
        <path
          key={item.label}
          d={pathData}
          fill={item.color}
          stroke="#fff"
          strokeWidth="2"
        />
      );
    });
    
    return (
      <svg width="280" height="280" style={svgStyle}>
        {paths}
      </svg>
    );
  };

  const getTabLabel = (type: BreakdownType): string => {
    switch (type) {
      case 'sections': return 'Sections';
      case 'themes': return 'Themes';
      case 'accounts': return 'Accounts';
      case 'assetTypes': return 'Asset Types';
    }
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h2 style={titleStyle}>Portfolio Breakdown</h2>
        <p style={descriptionStyle}>
          Visual breakdown of your portfolio by different categories (total: {formatCurrency(totalValue)}).
          {hasFilters ? ' Current grid filters do not affect these charts.' : ''}
        </p>
      </header>

      <div style={tabsStyle}>
        {(['sections', 'themes', 'accounts', 'assetTypes'] as BreakdownType[]).map((type) => (
          <button
            key={type}
            style={activeTab === type ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab(type)}
          >
            {getTabLabel(type)}
          </button>
        ))}
      </div>

      <div style={contentStyle}>
        <div style={chartContainerStyle}>
          {createPieChart(currentData)}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {getTabLabel(activeTab)} Breakdown
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937' }}>
              {currentData.length} {currentData.length === 1 ? 'category' : 'categories'}
            </div>
          </div>
        </div>

        <div style={legendStyle}>
          {currentData.map((item) => (
            <div key={item.label} style={legendItemStyle}>
              <div style={{ ...colorBoxStyle, backgroundColor: item.color }} />
              <div style={labelStyle}>{item.label}</div>
              <div>
                <span style={valueStyle}>{formatCurrency(item.value)}</span>
                <span style={percentStyle}>({item.percentage.toFixed(1)}%)</span>
              </div>
            </div>
          ))}
          
          {currentData.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              color: '#6b7280', 
              fontSize: '0.875rem',
              padding: '2rem',
            }}>
              No data to display. Add some holdings to see the breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};