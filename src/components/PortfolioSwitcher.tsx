import { useEffect, useState, type CSSProperties } from 'react';
import { usePortfolio } from '../state/portfolioStore';

const containerStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.6rem',
  alignItems: 'center',
};

const selectStyle: CSSProperties = {
  padding: '0.45rem 0.75rem',
  borderRadius: '0.6rem',
  border: '1px solid #cbd5f5',
  fontSize: '0.95rem',
};

const buttonStyle: CSSProperties = {
  padding: '0.45rem 0.9rem',
  borderRadius: '0.6rem',
  border: '1px solid #cbd5f5',
  background: '#fff',
  color: '#0f172a',
  cursor: 'pointer',
};

const destructiveButtonStyle: CSSProperties = {
  ...buttonStyle,
  borderColor: '#f97316',
  color: '#c2410c',
};

const PortfolioSwitcher = () => {
  const {
    portfolios,
    portfolio,
    setActivePortfolio,
    renamePortfolio,
    addPortfolio,
    removePortfolio,
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

  const handleDelete = () => {
    if (portfolios.length <= 1) {
      return;
    }

    if (window.confirm(`Remove “${portfolio.name}”? This cannot be undone.`)) {
      removePortfolio(portfolio.id);
    }
  };

  return (
    <div style={containerStyle}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
        Portfolio
        <select
          value={portfolio.id}
          onChange={(event) => setActivePortfolio(event.target.value)}
          style={selectStyle}
        >
          {portfolios.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </select>
      </label>
      {isEditing ? (
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
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
            style={{ padding: '0.45rem 0.6rem', borderRadius: '0.6rem', border: '1px solid #cbd5f5', minWidth: '13rem' }}
            autoFocus
          />
          <button type="button" onClick={handleRenameSubmit} style={buttonStyle}>
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
        <button type="button" onClick={() => setIsEditing(true)} style={buttonStyle}>
          Rename
        </button>
      )}
      <button type="button" onClick={handleAdd} style={buttonStyle}>
        Add Portfolio
      </button>
      <button
        type="button"
        onClick={handleDelete}
        style={{ ...destructiveButtonStyle, opacity: portfolios.length <= 1 ? 0.5 : 1 }}
        disabled={portfolios.length <= 1}
      >
        Delete
      </button>
    </div>
  );
};

export default PortfolioSwitcher;
