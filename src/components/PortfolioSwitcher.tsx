import { useEffect, useState, type CSSProperties } from 'react';
import { usePortfolio } from '../state/portfolioStore';

const containerStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
  alignItems: 'center',
};

const portfolioTabsStyle: CSSProperties = {
  display: 'flex',
  gap: '0.25rem',
  alignItems: 'center',
  padding: '0.25rem',
  backgroundColor: '#f1f5f9',
  borderRadius: '0.75rem',
  border: '1px solid #e2e8f0',
};

const portfolioButtonStyle: CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: '0.5rem',
  border: 'none',
  background: 'transparent',
  color: '#64748b',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 500,
  transition: 'all 0.2s ease',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const activePortfolioButtonStyle: CSSProperties = {
  ...portfolioButtonStyle,
  background: '#fff',
  color: '#0f172a',
  fontWeight: 600,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
};

const portfolioCountStyle: CSSProperties = {
  fontSize: '0.75rem',
  color: '#94a3af',
  fontWeight: 400,
};

const actionButtonStyle: CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: '0.5rem',
  border: '1px solid #d1d5db',
  background: '#fff',
  color: '#374151',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 500,
};

const addButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  background: '#2563eb',
  borderColor: '#2563eb',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const destructiveButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  borderColor: '#dc2626',
  color: '#dc2626',
};

const PortfolioSwitcher = () => {
  const {
    portfolios,
    portfolio,
    setActivePortfolio,
    renamePortfolio,
    addPortfolio,
    removePortfolio,
    createDraftPortfolio,
    promoteDraftToActual,
  } = usePortfolio();
  const [draftName, setDraftName] = useState(portfolio.name);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingEditId, setPendingEditId] = useState<string | null>(null);

  useEffect(() => {
    setDraftName(portfolio.name);
    if (pendingEditId === portfolio.id) {
      setIsEditing(true);
      setPendingEditId(null);
    } else {
      setIsEditing(false);
    }
  }, [portfolio.id, portfolio.name, pendingEditId]);

  const handleRenameSubmit = () => {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === portfolio.name) {
      setDraftName(portfolio.name);
      setIsEditing(false);
      return;
    }

    renamePortfolio(portfolio.id, trimmed);
    setIsEditing(false);
  };

  const handleAdd = () => {
    const newId = addPortfolio();
    setPendingEditId(newId);
  };

  const handleCreateDraft = () => {
    if (portfolio.type === 'actual') {
      createDraftPortfolio(portfolio.id);
    }
  };

  const handlePromoteDraft = () => {
    if (portfolio.type === 'draft' && window.confirm('Replace actual portfolio with this draft? This cannot be undone.')) {
      promoteDraftToActual(portfolio.id);
    }
  };

  const handleDelete = () => {
    if (portfolios.length <= 1) {
      return;
    }

    if (window.confirm(`Remove "${portfolio.name}"? This cannot be undone.`)) {
      removePortfolio(portfolio.id);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={portfolioTabsStyle}>
        {portfolios.map((entry) => {
          const isActive = entry.id === portfolio.id;
          const currentPortfolio = portfolios.find(p => p.id === entry.id);
          const holdingCount = isActive ? portfolio.holdings.length : 0;
          const isDraft = currentPortfolio?.type === 'draft';
          
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setActivePortfolio(entry.id)}
              style={isActive ? activePortfolioButtonStyle : portfolioButtonStyle}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {entry.name}
                  {isDraft && (
                    <span style={{ 
                      fontSize: '0.6rem', 
                      backgroundColor: '#fbbf24', 
                      color: '#92400e',
                      padding: '0.1rem 0.3rem',
                      borderRadius: '0.25rem',
                      fontWeight: 600
                    }}>
                      DRAFT
                    </span>
                  )}
                </div>
                {isActive && (
                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.7rem', color: '#94a3af' }}>
                    <span>{holdingCount} holdings</span>
                    {isDraft && currentPortfolio?.parentId && (
                      <>
                        <span>•</span>
                        <span>Draft of {portfolios.find(p => p.id === currentPortfolio.parentId)?.name}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
        
        <button type="button" onClick={handleAdd} style={addButtonStyle}>
          <span>+</span>
          New portfolio
        </button>
      </div>

      {isEditing ? (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleRenameSubmit();
              }
              if (event.key === 'Escape') {
                setDraftName(portfolio.name);
                setIsEditing(false);
              }
            }}
            style={{ 
              padding: '0.5rem 0.75rem', 
              borderRadius: '0.5rem', 
              border: '1px solid #d1d5db', 
              minWidth: '12rem',
              fontSize: '0.875rem'
            }}
            autoFocus
          />
          <button type="button" onClick={handleRenameSubmit} style={actionButtonStyle}>
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setDraftName(portfolio.name);
              setIsEditing(false);
            }}
            style={destructiveButtonStyle}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setIsEditing(true)} style={actionButtonStyle}>
            Rename
          </button>
          
          {portfolio.type === 'actual' && (
            <button type="button" onClick={handleCreateDraft} style={actionButtonStyle}>
              Create Draft
            </button>
          )}
          

          
          {portfolio.type === 'draft' && (
            <button type="button" onClick={handlePromoteDraft} style={addButtonStyle}>
              Apply to Actual
            </button>
          )}
          

        </div>
      )}
    </div>
  );
};

export default PortfolioSwitcher;