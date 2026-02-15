import { describe, it, expect } from 'vitest';
import {
  CASH_BUFFER_NAME,
  CASH_BUFFER_PRICE,
  CASH_SECTION,
  IMPORTED_LABEL,
  createEmptyLists,
  createDefaultVisibleColumns,
  createEmptyPortfolio,
  createHolding,
  createInitialState,
  getActivePortfolio,
  generatePortfolioId,
  generateTradeId,
} from './factory';

describe('constants', () => {
  it('has correct constant values', () => {
    expect(CASH_BUFFER_NAME).toBe('Cash buffer');
    expect(CASH_BUFFER_PRICE).toBe(1);
    expect(CASH_SECTION).toBe('Cash');
    expect(IMPORTED_LABEL).toBe('Imported');
  });
});

describe('createEmptyLists', () => {
  it('creates default lists with Core/Satellite/Cash sections', () => {
    const lists = createEmptyLists();
    expect(lists.sections).toEqual(['Core', 'Satellite', 'Cash']);
    expect(lists.themes).toEqual(['All', 'Cash']);
    expect(lists.accounts).toEqual(['Brokerage']);
    expect(lists.themeSections).toEqual({ All: 'Core', Cash: 'Cash' });
  });
});

describe('createDefaultVisibleColumns', () => {
  it('returns default column visibility', () => {
    const cols = createDefaultVisibleColumns();
    expect(cols.name).toBe(true);
    expect(cols.ticker).toBe(true);
    expect(cols.price).toBe(false);
    expect(cols.livePrice).toBe(true);
    expect(cols.include).toBe(true);
    expect(cols.actions).toBe(true);
  });
});

describe('createEmptyPortfolio', () => {
  it('creates a portfolio with correct defaults', () => {
    const p = createEmptyPortfolio('test-id', 'My Portfolio');
    expect(p.id).toBe('test-id');
    expect(p.name).toBe('My Portfolio');
    expect(p.type).toBe('actual');
    expect(p.parentId).toBeUndefined();
    expect(p.holdings).toEqual([]);
    expect(p.trades).toEqual([]);
    expect(p.settings.currency).toBe('GBP');
    expect(p.settings.lockTotal).toBe(false);
    expect(p.settings.enableLivePrices).toBe(true);
    expect(p.budgets).toEqual({ sections: {}, accounts: {}, themes: {} });
    expect(p.createdAt).toBeInstanceOf(Date);
    expect(p.updatedAt).toBeInstanceOf(Date);
  });

  it('creates a draft portfolio with parent', () => {
    const p = createEmptyPortfolio('d1', 'Draft', 'draft', 'parent-1');
    expect(p.type).toBe('draft');
    expect(p.parentId).toBe('parent-1');
  });
});

describe('createHolding', () => {
  it('creates a holding with defaults', () => {
    const h = createHolding();
    expect(h.id).toBeTruthy();
    expect(h.section).toBe('Core');
    expect(h.theme).toBe('All');
    expect(h.assetType).toBe('ETF');
    expect(h.exchange).toBe('LSE');
    expect(h.account).toBe('Brokerage');
    expect(h.price).toBe(0);
    expect(h.qty).toBe(0);
    expect(h.include).toBe(true);
    expect(h.avgCost).toBe(0);
  });

  it('applies overrides', () => {
    const h = createHolding({
      name: 'VWRL',
      ticker: 'VWRL.L',
      price: 100,
      qty: 50,
      section: 'Satellite',
    });
    expect(h.name).toBe('VWRL');
    expect(h.ticker).toBe('VWRL.L');
    expect(h.price).toBe(100);
    expect(h.qty).toBe(50);
    expect(h.section).toBe('Satellite');
    expect(h.avgCost).toBe(100); // defaults to price
  });

  it('uses avgCost override when provided', () => {
    const h = createHolding({ price: 100, avgCost: 90 });
    expect(h.avgCost).toBe(90);
  });

  it('generates unique IDs', () => {
    const h1 = createHolding();
    const h2 = createHolding();
    expect(h1.id).not.toBe(h2.id);
  });
});

describe('createInitialState', () => {
  it('creates state with 3 default portfolios', () => {
    const state = createInitialState();
    expect(state.portfolios).toHaveLength(3);
    expect(state.portfolios[0].name).toBe('Main Portfolio');
    expect(state.portfolios[1].name).toBe('ISA Portfolio');
    expect(state.portfolios[2].name).toBe('SIPP Portfolio');
    expect(state.activePortfolioId).toBe('portfolio-1');
    expect(state.playground.enabled).toBe(false);
    expect(state.filters).toEqual({});
  });
});

describe('getActivePortfolio', () => {
  it('returns the active portfolio', () => {
    const state = createInitialState();
    const active = getActivePortfolio(state);
    expect(active.id).toBe('portfolio-1');
    expect(active.name).toBe('Main Portfolio');
  });

  it('throws when active portfolio not found', () => {
    const state = createInitialState();
    state.activePortfolioId = 'nonexistent';
    expect(() => getActivePortfolio(state)).toThrow('Active portfolio not found');
  });
});

describe('generatePortfolioId', () => {
  it('generates unique IDs', () => {
    const id1 = generatePortfolioId();
    const id2 = generatePortfolioId();
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });
});

describe('generateTradeId', () => {
  it('generates unique IDs', () => {
    const id1 = generateTradeId();
    const id2 = generateTradeId();
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });
});
