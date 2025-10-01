import { type CSSProperties, useEffect, useState } from 'react';
import HoldingsGrid from './components/HoldingsGrid';
import { PortfolioBreakdown } from './components/PortfolioBreakdown';
import { AllocationManager } from './components/AllocationManager';
import PortfolioSwitcher from './components/PortfolioSwitcher';
import TradeHistory from './components/TradeHistory';
import { LivePriceStatus } from './components/LivePriceStatus';
import { LivePriceSettings } from './components/LivePriceSettings';
import { SettingsPanel } from './components/SettingsPanel';
import { TradeForm } from './components/TradeForm';
import HoldingForm from './components/HoldingForm';
import BackupButton from './components/BackupButton';
import BackupStatus from './components/BackupStatus';
import { RestoreDetector } from './components/RestoreDetector';
import { PortfolioProvider, usePortfolio } from './state/portfolioStore';
import { useLivePrices } from './hooks/useLivePrices';

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

const PlaygroundControls = ({ onAddTrade, onAddHolding }: { onAddTrade: () => void; onAddHolding: () => void }) => {
  const { playground, setPlaygroundEnabled, restorePlayground } = usePortfolio();
  const isActive = playground.enabled;
  const hasSnapshot = Boolean(playground.snapshot);

  return (
    <section style={playgroundContainerStyle}>
      <button
        type="button"
        style={playgroundPrimaryButtonStyle}
        onClick={onAddHolding}
      >
        + Add Holding
      </button>
      <button
        type="button"
        style={playgroundPrimaryButtonStyle}
        onClick={onAddTrade}
      >
        + Add Trade
      </button>
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

const AppContent = () => {
  const { portfolio, allPortfolios, updateLivePrices, restoreFullBackup } = usePortfolio();
  const [currentPage, setCurrentPage] = useState<'portfolio' | 'settings'>('portfolio');
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [showHoldingForm, setShowHoldingForm] = useState(false);
  const livePriceData = useLivePrices(
    portfolio.holdings,
    portfolio.settings.enableLivePrices,
    portfolio.settings.livePriceUpdateInterval
  );

  // Update portfolio with live price data (only when quotes actually change)
  useEffect(() => {
    if (livePriceData.quotes.size > 0 && livePriceData.lastUpdated) {
      const priceMap = new Map();
      livePriceData.quotes.forEach((quote, ticker) => {
        // Debug logging to see what we're getting
        console.log(`🔍 Raw quote data for ${ticker}:`, {
          originalPrice: quote.regularMarketPrice,
          originalCurrency: quote.currency,
          convertedPriceGBP: quote.priceGBP,
          conversionRate: quote.conversionRate,
          shouldBeGBP: ticker.endsWith('.L') ? (quote.regularMarketPrice * 0.01) : 'N/A',
          ticker: ticker
        });
        
        priceMap.set(ticker, {
          price: quote.priceGBP, // GBP converted price for calculations
          change: quote.changeGBP, // GBP converted change for calculations
          changePercent: quote.regularMarketChangePercent,
          updated: quote.lastUpdated,
          originalPrice: quote.regularMarketPrice, // Original price for display
          originalCurrency: quote.currency, // Original currency for display
          conversionRate: quote.conversionRate,
        });
      });
      updateLivePrices(priceMap);
    }
  }, [livePriceData.lastUpdated, updateLivePrices]); // Only depend on lastUpdated, not the entire quotes map

  if (currentPage === 'settings') {
    return <SettingsPanel onBack={() => setCurrentPage('portfolio')} />;
  }

  // Get the full app state for RestoreDetector
  const getAppState = () => {
    return {
      portfolios: allPortfolios, // All portfolios, not just current one
      activePortfolioId: portfolio.id,
      filters: {}, // Add filters if available from context
      playground: { enabled: false }, // Add playground state if available
    };
  };

  const handleRestore = (restoredData: any) => {
    // Handle the restored data by updating the full app state
    if (restoreFullBackup && restoredData) {
      restoreFullBackup(restoredData);
    }
  };

  return (
    <>
      <RestoreDetector 
        portfolioData={getAppState() as any}
        onRestore={handleRestore}
      />
      <main style={{ padding: '2rem', margin: '0 auto', maxWidth: '1440px' }}>
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>Portfolio Manager</h1>
          <p style={{ margin: 0, color: '#475569' }}>
            Manage holdings, targets, and breakdowns across your portfolios.
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <PortfolioSwitcher />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <BackupButton variant="secondary" size="sm" />
              <BackupStatus variant="compact" />
              <button
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
                onClick={() => setCurrentPage('settings')}
              >
                ⚙️ Settings
              </button>
              <LivePriceSettings />
              {portfolio.settings.enableLivePrices && (
                <LivePriceStatus data={livePriceData} onRefresh={livePriceData.refreshPrices} />
              )}
            </div>
          </div>
        </header>
      <PlaygroundControls 
        onAddTrade={() => setShowTradeForm(true)} 
        onAddHolding={() => setShowHoldingForm(true)}
      />
      <HoldingsGrid />
      <AllocationManager />
      <PortfolioBreakdown />
      <TradeHistory />
      
      <TradeForm
        isOpen={showTradeForm}
        onClose={() => setShowTradeForm(false)}
        initialTicker=""
        initialHoldingId=""
      />
      
      {showHoldingForm && (
        <HoldingForm onClose={() => setShowHoldingForm(false)} />
      )}
      </main>
    </>
  );
};

function App() {
  return (
    <PortfolioProvider>
      <AppContent />
    </PortfolioProvider>
  );
}

export default App;
