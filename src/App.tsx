import { type CSSProperties } from 'react';
import HoldingsGrid from './components/HoldingsGrid';
import InsightsPanel from './components/InsightsPanel';
import PortfolioSwitcher from './components/PortfolioSwitcher';
import TradeHistory from './components/TradeHistory';
import { PortfolioProvider, usePortfolio } from './state/portfolioStore';

const playgroundContainerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: '0.6rem',
  marginBottom: '1.5rem',
  flexWrap: 'wrap',
};

const playgroundButtonStyle: CSSProperties = {
  padding: '0.42rem 0.9rem',
  borderRadius: '999px',
  fontSize: '0.85rem',
  cursor: 'pointer',
};

const playgroundPrimaryButtonStyle: CSSProperties = {
  ...playgroundButtonStyle,
  background: '#1d4ed8',
  color: '#fff',
  border: 'none',
};

const playgroundSecondaryButtonStyle: CSSProperties = {
  ...playgroundButtonStyle,
  border: '1px solid #cbd5f5',
  background: 'transparent',
  color: '#1e3a8a',
};

const PlaygroundControls = () => {
  const { playground, setPlaygroundEnabled, restorePlayground } = usePortfolio();
  const isActive = playground.enabled;
  const hasSnapshot = Boolean(playground.snapshot);

  return (
    <section style={playgroundContainerStyle}>
      <button
        type="button"
        style={isActive ? playgroundSecondaryButtonStyle : playgroundPrimaryButtonStyle}
        onClick={() => setPlaygroundEnabled(!isActive)}
      >
        {isActive ? 'Exit Playground' : 'Enter Playground'}
      </button>
      <button
        type="button"
        style={{
          ...playgroundSecondaryButtonStyle,
          opacity: isActive && hasSnapshot ? 1 : 0.5,
          cursor: isActive && hasSnapshot ? 'pointer' : 'not-allowed',
        }}
        onClick={restorePlayground}
        disabled={!isActive || !hasSnapshot}
      >
        Restore Snapshot
      </button>
    </section>
  );
};

const AppContent = () => (
  <main style={{ padding: '2rem', margin: '0 auto', maxWidth: '1440px' }}>
    <header style={{ marginBottom: '2rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Portfolio Manager</h1>
      <p style={{ margin: 0, color: '#475569' }}>
        Manage holdings, targets, and breakdowns across your portfolios.
      </p>
      <div style={{ marginTop: '1rem' }}>
        <PortfolioSwitcher />
      </div>
    </header>
    <PlaygroundControls />
    <HoldingsGrid />
    <InsightsPanel />
    <TradeHistory />
  </main>
);

function App() {
  return (
    <PortfolioProvider>
      <AppContent />
    </PortfolioProvider>
  );
}

export default App;
