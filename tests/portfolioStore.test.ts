import { describe, expect, it } from 'vitest';
import { portfolioReducer, type PortfolioAction } from '../src/state/portfolioStore';
import type { HoldingCsvRow } from '../src/utils/csv';
import { selectTotalValue } from '../src/state/selectors';
import { createInitialState, getActivePortfolio } from '../src/state/types';

const reduce = (actions: PortfolioAction[]) => {
  return actions.reduce(portfolioReducer, createInitialState());
};

describe('portfolio reducer', () => {
  it('adds a new holding with sensible defaults', () => {
    const state = reduce([{ type: 'add-holding' }]);
    const portfolio = getActivePortfolio(state);
    expect(portfolio.holdings).toHaveLength(1);
    const holding = portfolio.holdings[0];
    expect(holding.include).toBe(true);
    expect(holding.name).toBe('');
  });

  it('updates a holding by id', () => {
    const initial = reduce([{ type: 'add-holding' }]);
    const holdingId = getActivePortfolio(initial).holdings[0].id;

    const updated = portfolioReducer(initial, {
      type: 'update-holding',
      id: holdingId,
      patch: { price: 123.45, name: 'Updated' },
    });

    const holding = getActivePortfolio(updated).holdings.find((row) => row.id === holdingId);
    expect(holding?.price).toBe(123.45);
    expect(holding?.name).toBe('Updated');
  });

  it('duplicates a holding adjacent to the original', () => {
    const withHolding = reduce([{ type: 'add-holding' }]);
    const [original] = getActivePortfolio(withHolding).holdings;
    const populated = portfolioReducer(withHolding, {
      type: 'update-holding',
      id: original.id,
      patch: { name: 'Base', price: 10, qty: 2 },
    });

    const afterDuplicate = portfolioReducer(populated, { type: 'duplicate-holding', id: original.id });
    const holdings = getActivePortfolio(afterDuplicate).holdings;

    expect(holdings).toHaveLength(2);
    expect(holdings[0].name).toBe(holdings[1].name);
    expect(holdings[0].id).not.toBe(holdings[1].id);
  });

  it('removes holdings by id', () => {
    const state = reduce([
      { type: 'add-holding' },
      { type: 'add-holding' },
    ]);
    const [first, second] = getActivePortfolio(state).holdings;
    const afterDelete = portfolioReducer(state, { type: 'delete-holding', id: first.id });
    const holdings = getActivePortfolio(afterDelete).holdings;

    expect(holdings).toHaveLength(1);
    expect(holdings[0].id).toBe(second.id);
  });

  it('creates or updates cash buffer when setting total value', () => {
    const initial = reduce([{ type: 'add-holding' }]);
    const { id } = getActivePortfolio(initial).holdings[0];

    const populated = portfolioReducer(initial, {
      type: 'update-holding',
      id,
      patch: { price: 100, qty: 2, include: true },
    });

    const adjusted = portfolioReducer(populated, { type: 'set-total', total: 500 });
    const portfolio = getActivePortfolio(adjusted);
    const cash = portfolio.holdings.find((holding) => holding.name === 'Cash buffer');
    expect(cash).toBeDefined();
    expect(cash?.assetType).toBe('Cash');
    expect(cash?.qty).toBeCloseTo(300, 5);
  });

  it('excludes toggled holdings from totals', () => {
    const initial = reduce([{ type: 'add-holding' }]);
    const { id } = getActivePortfolio(initial).holdings[0];
    const populated = portfolioReducer(initial, {
      type: 'update-holding',
      id,
      patch: { price: 100, qty: 1, include: true },
    });

    const afterExclude = portfolioReducer(populated, {
      type: 'update-holding',
      id,
      patch: { include: false },
    });

    const portfolio = getActivePortfolio(afterExclude);
    expect(selectTotalValue(portfolio)).toBe(0);
  });

  it('keeps total locked when holdings change after setting total', () => {
    const initial = reduce([{ type: 'add-holding' }]);
    const { id } = getActivePortfolio(initial).holdings[0];

    const populated = portfolioReducer(initial, {
      type: 'update-holding',
      id,
      patch: { price: 100, qty: 1, include: true },
    });

    const locked = portfolioReducer(populated, { type: 'set-total', total: 400 });

    const afterEdit = portfolioReducer(locked, {
      type: 'update-holding',
      id,
      patch: { qty: 2 },
    });

    const portfolio = getActivePortfolio(afterEdit);
    const cash = portfolio.holdings.find((holding) => holding.name === 'Cash buffer');
    expect(selectTotalValue(portfolio)).toBeCloseTo(400, 5);
    expect(cash?.qty).toBeCloseTo(200, 5);
  });

  it('sets and clears filters on the app state', () => {
    const stateWithFilter = portfolioReducer(createInitialState(), {
      type: 'set-filter',
      key: 'section',
      value: 'Core',
    });

    expect(stateWithFilter.filters.section).toBe('Core');

    const cleared = portfolioReducer(stateWithFilter, {
      type: 'set-filter',
      key: 'section',
      value: undefined,
    });

    expect(cleared.filters.section).toBeUndefined();
  });

  it('records guidance budgets without altering existing holdings', () => {
    const initial = reduce([{ type: 'add-holding' }]);
    const { id } = getActivePortfolio(initial).holdings[0];

    const populated = portfolioReducer(initial, {
      type: 'update-holding',
      id,
      patch: { section: 'Core', account: 'Brokerage', theme: 'All', price: 100, qty: 2, include: true },
    });

    const withBudget = portfolioReducer(populated, {
      type: 'set-budget',
      domain: 'sections',
      key: 'Core',
      limit: { amount: 150 },
    });

    const holding = getActivePortfolio(withBudget).holdings.find((row) => row.id === id);
    expect(holding?.qty).toBe(2);
    expect(getActivePortfolio(withBudget).budgets.sections.Core?.amount).toBe(150);
  });

  it('keeps holdings when budgets are present', () => {
    const initial = reduce([{ type: 'add-holding' }]);
    const { id } = getActivePortfolio(initial).holdings[0];

    let state = portfolioReducer(initial, {
      type: 'update-holding',
      id,
      patch: { section: 'Core', account: 'Brokerage', theme: 'All', price: 50, qty: 2, include: true },
    });

    state = portfolioReducer(state, {
      type: 'set-budget',
      domain: 'accounts',
      key: 'Brokerage',
      limit: { amount: 120 },
    });

    const afterEdit = portfolioReducer(state, {
      type: 'update-holding',
      id,
      patch: { qty: 10 },
    });

    const holding = getActivePortfolio(afterEdit).holdings.find((row) => row.id === id);
    expect(holding?.qty).toBe(10);
  });

  it('stores percentage budgets for guidance', () => {
    const initial = reduce([{ type: 'add-holding' }]);
    const { id } = getActivePortfolio(initial).holdings[0];

    let state = portfolioReducer(initial, {
      type: 'update-holding',
      id,
      patch: { section: 'Core', account: 'Brokerage', theme: 'All', price: 100, qty: 2, include: true },
    });

    state = portfolioReducer(state, {
      type: 'set-total',
      total: 500,
    });

    state = portfolioReducer(state, {
      type: 'set-budget',
      domain: 'sections',
      key: 'Core',
      limit: { percent: 20 },
    });

    const holding = getActivePortfolio(state).holdings.find((row) => row.id === id);
    expect(holding?.qty).toBe(2);
    expect(getActivePortfolio(state).budgets.sections.Core?.percent).toBe(20);
  });

  it('captures a playground snapshot when enabled', () => {
    const state = portfolioReducer(createInitialState(), {
      type: 'set-playground-enabled',
      enabled: true,
    });

    expect(state.playground.enabled).toBe(true);
    expect(state.playground.snapshot).toBeTruthy();
  });

  it('restores the playground snapshot', () => {
    const initial = reduce([{ type: 'add-holding' }]);
    const { id } = getActivePortfolio(initial).holdings[0];

    const enabled = portfolioReducer(initial, { type: 'set-playground-enabled', enabled: true });

    const updated = portfolioReducer(enabled, {
      type: 'update-holding',
      id,
      patch: { price: 200 },
    });

    const restored = portfolioReducer(updated, { type: 'restore-playground' });

    const holding = getActivePortfolio(restored).holdings.find((row) => row.id === id);
    expect(holding?.price).toBe(getActivePortfolio(enabled).holdings[0].price);
    expect(restored.playground.enabled).toBe(true);
  });

  it('clears playground snapshot when disabled', () => {
    const enabled = portfolioReducer(createInitialState(), { type: 'set-playground-enabled', enabled: true });
    const disabled = portfolioReducer(enabled, { type: 'set-playground-enabled', enabled: false });

    expect(disabled.playground.enabled).toBe(false);
    expect(disabled.playground.snapshot).toBeUndefined();
  });

  it('adds list items without duplicates', () => {
    const state = reduce([{ type: 'add-list-item', domain: 'sections', value: 'Alternative' }]);
    const portfolio = getActivePortfolio(state);
    expect(portfolio.lists.sections).toContain('Alternative');

    const duplicate = portfolioReducer(state, {
      type: 'add-list-item',
      domain: 'sections',
      value: 'Alternative',
    });
    const updated = getActivePortfolio(duplicate);
    expect(updated.lists.sections.filter((item) => item === 'Alternative')).toHaveLength(1);
  });

  it('renames themes and keeps associated data', () => {
    const initial = reduce([{ type: 'add-holding' }]);
    const { id } = getActivePortfolio(initial).holdings[0];

    let state = portfolioReducer(initial, {
      type: 'update-holding',
      id,
      patch: { theme: 'All', price: 200, qty: 1, include: true },
    });

    state = portfolioReducer(state, {
      type: 'set-budget',
      domain: 'themes',
      key: 'All',
      limit: { amount: 200 },
    });

    const renamed = portfolioReducer(state, {
      type: 'rename-list-item',
      domain: 'themes',
      previous: 'All',
      next: 'Global',
    });

    const portfolio = getActivePortfolio(renamed);
    expect(portfolio.lists.themes).toContain('Global');
    expect(portfolio.holdings[0].theme).toBe('Global');
    expect(portfolio.budgets.themes.Global).toBeDefined();
    expect(portfolio.lists.themeSections.Global).toBeDefined();
  });

  it('removes sections and reassigns holdings to fallback', () => {
    const initial = reduce([{ type: 'add-holding' }]);
    const { id } = getActivePortfolio(initial).holdings[0];

    const populated = portfolioReducer(initial, {
      type: 'update-holding',
      id,
      patch: { section: 'Satellite', price: 100, qty: 1, include: true },
    });

    const withBudget = portfolioReducer(populated, {
      type: 'set-budget',
      domain: 'sections',
      key: 'Satellite',
      limit: { amount: 150 },
    });

    const removed = portfolioReducer(withBudget, {
      type: 'remove-list-item',
      domain: 'sections',
      value: 'Satellite',
    });

    const portfolio = getActivePortfolio(removed);
    expect(portfolio.lists.sections).not.toContain('Satellite');
    expect(portfolio.holdings[0].section).toBe(portfolio.lists.sections[0]);
    expect(portfolio.budgets.sections.Satellite).toBeUndefined();
  });

  it('reorders sections when requested', () => {
    const initial = createInitialState();
    const withExtraSection = portfolioReducer(initial, {
      type: 'add-list-item',
      domain: 'sections',
      value: 'Growth',
    });

    const reordered = portfolioReducer(withExtraSection, {
      type: 'reorder-list',
      domain: 'sections',
      from: 0,
      to: 2,
    });

    expect(getActivePortfolio(reordered).lists.sections).toEqual(['Satellite', 'Growth', 'Core', 'Cash']);
  });

  it('ignores out-of-range reorders', () => {
    const state = createInitialState();
    const afterInvalid = portfolioReducer(state, {
      type: 'reorder-list',
      domain: 'accounts',
      from: 5,
      to: 0,
    });

    expect(getActivePortfolio(afterInvalid).lists.accounts).toEqual(['Brokerage']);
  });

  it('appends list items when dropping beyond the end', () => {
    const initial = portfolioReducer(createInitialState(), {
      type: 'add-list-item',
      domain: 'sections',
      value: 'Income',
    });

    const targetLength = getActivePortfolio(initial).lists.sections.length;
    const withAppend = portfolioReducer(initial, {
      type: 'reorder-list',
      domain: 'sections',
      from: 0,
      to: targetLength,
    });

    expect(getActivePortfolio(withAppend).lists.sections).toEqual(['Satellite', 'Income', 'Core', 'Cash']);
  });

  it('keeps the cash section immutable', () => {
    const initial = createInitialState();

    const renamedSection = portfolioReducer(initial, {
      type: 'rename-list-item',
      domain: 'sections',
      previous: 'Cash',
      next: 'Liquid',
    });
    expect(getActivePortfolio(renamedSection).lists.sections).toContain('Cash');

    const removedSection = portfolioReducer(initial, {
      type: 'remove-list-item',
      domain: 'sections',
      value: 'Cash',
    });
    expect(getActivePortfolio(removedSection).lists.sections).toContain('Cash');

    const moveCash = portfolioReducer(initial, {
      type: 'reorder-list',
      domain: 'sections',
      from: 2,
      to: 0,
    });
    expect(getActivePortfolio(moveCash).lists.sections).toEqual(['Core', 'Satellite', 'Cash']);
  });

  it('derives theme totals from section allocation', () => {
    let state = createInitialState();

    state = portfolioReducer(state, {
      type: 'add-list-item',
      domain: 'themes',
      value: 'AI',
    });

    state = portfolioReducer(state, {
      type: 'set-theme-section',
      theme: 'AI',
      section: 'Satellite',
    });

    state = portfolioReducer(state, {
      type: 'set-budget',
      domain: 'sections',
      key: 'Satellite',
      limit: { percent: 50 },
    });

    state = portfolioReducer(state, {
      type: 'set-budget',
      domain: 'themes',
      key: 'AI',
      limit: { percentOfSection: 8 },
    });

    const portfolio = getActivePortfolio(state);
    const themeBudget = portfolio.budgets.themes['AI'];
    expect(themeBudget?.percentOfSection).toBeCloseTo(8, 5);
    expect(themeBudget?.percent).toBeCloseTo(4, 5);
  });

  it('switches active portfolios and resets filters', () => {
    const initial = createInitialState();
    const [first, second] = initial.portfolios;
    const withFilter = portfolioReducer(initial, {
      type: 'set-filter',
      key: 'section',
      value: 'Core',
    });

    const switched = portfolioReducer(withFilter, {
      type: 'set-active-portfolio',
      id: second.id,
    });

    expect(switched.activePortfolioId).toBe(second.id);
    expect(switched.filters).toEqual({});
    expect(getActivePortfolio(switched).name).toBe(second.name);
    expect(first.id).not.toBe(second.id);
  });

  it('renames portfolios by id', () => {
    const initial = createInitialState();
    const [first] = initial.portfolios;
    const renamed = portfolioReducer(initial, {
      type: 'rename-portfolio',
      id: first.id,
      name: 'Long-Term Growth',
    });

    expect(getActivePortfolio(renamed).name).toBe('Long-Term Growth');
    expect(renamed.portfolios.map((p) => p.name)).toContain('Long-Term Growth');
  });

  it('adds a new portfolio and activates it', () => {
    const initial = createInitialState();
    const newId = 'new-portfolio';
    const withNew = portfolioReducer(initial, {
      type: 'add-portfolio',
      id: newId,
      name: 'Additional Portfolio',
    });

    expect(withNew.portfolios).toHaveLength(initial.portfolios.length + 1);
    expect(withNew.activePortfolioId).toBe(newId);
    expect(withNew.filters).toEqual({});
  });

  it('removes portfolios and reassigns the active one', () => {
    const initial = createInitialState();
    const [, second] = initial.portfolios;

    const withoutSecond = portfolioReducer(initial, {
      type: 'remove-portfolio',
      id: second.id,
    });

    expect(withoutSecond.portfolios.find((p) => p.id === second.id)).toBeUndefined();
    expect(withoutSecond.portfolios).toHaveLength(initial.portfolios.length - 1);
    expect(withoutSecond.activePortfolioId).toBe(initial.activePortfolioId);

    const withoutFirst = portfolioReducer(withoutSecond, {
      type: 'remove-portfolio',
      id: initial.activePortfolioId,
    });

    expect(withoutFirst.activePortfolioId).toBe(withoutFirst.portfolios[0].id);
    expect(withoutFirst.filters).toEqual({});
  });

  it('does not remove the final remaining portfolio', () => {
    let state = createInitialState();
    state = portfolioReducer(state, { type: 'remove-portfolio', id: state.portfolios[1].id });
    state = portfolioReducer(state, { type: 'remove-portfolio', id: state.portfolios[1].id });

    const afterAttempt = portfolioReducer(state, {
      type: 'remove-portfolio',
      id: state.portfolios[0].id,
    });

    expect(afterAttempt.portfolios).toHaveLength(1);
  });

  it('appends imported holdings without duplicates', () => {
    const base = reduce([{ type: 'add-holding' }]);
    const active = getActivePortfolio(base);
    const originalCount = active.holdings.length;

    const rows: HoldingCsvRow[] = [
      {
        section: 'Imported',
        theme: 'Imported',
        assetType: 'ETF',
        name: 'Global Tracker',
        ticker: 'GLBL',
        account: 'Brokerage',
        price: 100,
        qty: 2,
        include: true,
        targetPct: undefined,
      },
      {
        section: 'Imported',
        theme: 'Imported',
        assetType: 'ETF',
        name: 'Global Tracker',
        ticker: 'GLBL',
        account: 'Brokerage',
        price: 100,
        qty: 2,
        include: true,
        targetPct: undefined,
      },
    ];

    const afterImport = portfolioReducer(base, {
      type: 'import-holdings',
      rows,
      account: 'ISA',
    });

    const importedPortfolio = getActivePortfolio(afterImport);
    expect(importedPortfolio.holdings.length).toBe(originalCount + 1);
    expect(importedPortfolio.lists.accounts).toContain('ISA');
    expect(importedPortfolio.lists.sections).toContain('Imported');
  });

  it('records trades and adjusts holding quantity', () => {
    const base = reduce([{ type: 'add-holding' }]);
    const portfolio = getActivePortfolio(base);
    const holdingId = portfolio.holdings[0].id;

    const afterBuy = portfolioReducer(base, {
      type: 'record-trade',
      holdingId,
      trade: { type: 'buy', date: '2024-09-01', price: 100, qty: 5 },
    });

    const portfolioAfterBuy = getActivePortfolio(afterBuy);
    const holdingAfterBuy = portfolioAfterBuy.holdings.find((holding) => holding.id === holdingId)!;
    expect(holdingAfterBuy.qty).toBeCloseTo(5, 5);
    expect(holdingAfterBuy.avgCost).toBeCloseTo(100, 5);
    expect(portfolioAfterBuy.trades).toHaveLength(1);

    const afterSell = portfolioReducer(afterBuy, {
      type: 'record-trade',
      holdingId,
      trade: { type: 'sell', date: '2024-09-02', price: 105, qty: 2 },
    });

    const holdingAfterSell = getActivePortfolio(afterSell).holdings.find((holding) => holding.id === holdingId)!;
    expect(holdingAfterSell.qty).toBeCloseTo(3, 5);
    expect(holdingAfterSell.avgCost).toBeCloseTo(100, 5);
    expect(getActivePortfolio(afterSell).trades).toHaveLength(2);
  });

  it('imports trades, creating holdings when needed', () => {
    const initial = createInitialState();
    const imports = portfolioReducer(initial, {
      type: 'import-trades',
      trades: [
        { ticker: 'NEW', name: 'New Asset', type: 'buy', date: '2024-01-01', price: 50, qty: 4 },
        { ticker: 'NEW', name: 'New Asset', type: 'buy', date: '2024-02-01', price: 60, qty: 6 },
      ],
    });

    const portfolio = getActivePortfolio(imports);
    const holding = portfolio.holdings.find((row) => row.ticker === 'NEW');
    expect(holding).toBeTruthy();
    expect(holding?.qty).toBeCloseTo(10, 5);
    expect(holding?.avgCost).toBeCloseTo(56, 5);
    expect(portfolio.trades).toHaveLength(2);
  });
});
