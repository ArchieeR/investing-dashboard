import { describe, it, expect, beforeEach } from 'vitest';
import { portfolioReducer, applyTradeToHolding } from './reducer';
import type { PortfolioAction } from './reducer';
import { createInitialState, createHolding, getActivePortfolio } from './factory';
import { cacheInvalidation } from './cache';
import type { AppState, Holding } from '@/types/portfolio';

beforeEach(() => {
  cacheInvalidation.invalidateAllCalculations();
});

const reduce = (state: AppState, action: PortfolioAction): AppState =>
  portfolioReducer(state, action);

const getActive = (state: AppState) => getActivePortfolio(state);

describe('applyTradeToHolding', () => {
  it('applies buy trade (weighted avg cost)', () => {
    const h = createHolding({ price: 100, qty: 10, avgCost: 100 });
    const result = applyTradeToHolding(h, { type: 'buy', price: 120, qty: 5 });
    expect(result.qty).toBe(15);
    expect(result.avgCost).toBeCloseTo(106.67, 1);
    expect(result.price).toBe(120);
  });

  it('applies sell trade', () => {
    const h = createHolding({ price: 100, qty: 10, avgCost: 100 });
    const result = applyTradeToHolding(h, { type: 'sell', price: 120, qty: 3 });
    expect(result.qty).toBe(7);
    expect(result.avgCost).toBe(100);
  });

  it('sell cannot go below 0 qty', () => {
    const h = createHolding({ price: 100, qty: 5, avgCost: 100 });
    const result = applyTradeToHolding(h, { type: 'sell', price: 100, qty: 10 });
    expect(result.qty).toBe(0);
    expect(result.avgCost).toBe(0);
  });

  it('handles invalid trade values', () => {
    const h = createHolding({ price: 100, qty: 10, avgCost: 100 });
    const result = applyTradeToHolding(h, { type: 'buy', price: NaN, qty: -5 });
    expect(result.qty).toBe(10); // cleanQty = 0
    expect(result.price).toBe(100); // cleanPrice = 0, so keeps original
  });
});

describe('add-holding', () => {
  it('adds a holding with defaults', () => {
    const state = createInitialState();
    const next = reduce(state, { type: 'add-holding' });
    const active = getActive(next);
    expect(active.holdings.length).toBeGreaterThan(0);
  });

  it('adds a specific holding', () => {
    const state = createInitialState();
    const holding = createHolding({ name: 'VWRL', ticker: 'VWRL.L', price: 100, qty: 10 });
    const next = reduce(state, { type: 'add-holding', holding });
    const active = getActive(next);
    const found = active.holdings.find((h) => h.name === 'VWRL');
    expect(found).toBeDefined();
    expect(found!.price).toBe(100);
  });
});

describe('delete-holding', () => {
  it('removes a holding by id', () => {
    const state = createInitialState();
    const holding = createHolding({ name: 'Test' });
    const s1 = reduce(state, { type: 'add-holding', holding });
    const s2 = reduce(s1, { type: 'delete-holding', id: holding.id });
    const active = getActive(s2);
    expect(active.holdings.find((h) => h.id === holding.id)).toBeUndefined();
  });
});

describe('duplicate-holding', () => {
  it('duplicates a holding with new id', () => {
    const state = createInitialState();
    const holding = createHolding({ name: 'VWRL', price: 100 });
    const s1 = reduce(state, { type: 'add-holding', holding });
    const s2 = reduce(s1, { type: 'duplicate-holding', id: holding.id });
    const active = getActive(s2);
    const vwrlHoldings = active.holdings.filter((h) => h.name === 'VWRL');
    expect(vwrlHoldings.length).toBe(2);
    expect(vwrlHoldings[0].id).not.toBe(vwrlHoldings[1].id);
  });

  it('does nothing for nonexistent id', () => {
    const state = createInitialState();
    const next = reduce(state, { type: 'duplicate-holding', id: 'nonexistent' });
    expect(getActive(next).holdings).toEqual(getActive(state).holdings);
  });
});

describe('update-holding', () => {
  it('patches a holding', () => {
    const state = createInitialState();
    const holding = createHolding({ name: 'Old Name' });
    const s1 = reduce(state, { type: 'add-holding', holding });
    const s2 = reduce(s1, {
      type: 'update-holding',
      id: holding.id,
      patch: { name: 'New Name', price: 200 },
    });
    const updated = getActive(s2).holdings.find((h) => h.id === holding.id)!;
    expect(updated.name).toBe('New Name');
    expect(updated.price).toBe(200);
  });
});

describe('set-total', () => {
  it('locks total and adjusts cash buffer', () => {
    const state = createInitialState();
    const holding = createHolding({ price: 100, qty: 10, include: true });
    const s1 = reduce(state, { type: 'add-holding', holding });
    const s2 = reduce(s1, { type: 'set-total', total: 2000 });
    const active = getActive(s2);
    expect(active.settings.lockTotal).toBe(true);
    expect(active.settings.lockedTotal).toBe(2000);
    // Cash buffer should exist
    const cashHolding = active.holdings.find((h) => h.name === 'Cash buffer');
    expect(cashHolding).toBeDefined();
    expect(cashHolding!.qty).toBe(1000); // 2000 - 1000 non-cash
  });
});

describe('set-filter', () => {
  it('sets a filter', () => {
    const state = createInitialState();
    const next = reduce(state, { type: 'set-filter', key: 'section', value: 'Core' });
    expect(next.filters.section).toBe('Core');
  });

  it('removes a filter when value is undefined', () => {
    const state = createInitialState();
    const s1 = reduce(state, { type: 'set-filter', key: 'section', value: 'Core' });
    const s2 = reduce(s1, { type: 'set-filter', key: 'section' });
    expect(s2.filters.section).toBeUndefined();
  });
});

describe('set-budget', () => {
  it('sets a budget limit', () => {
    const state = createInitialState();
    const next = reduce(state, {
      type: 'set-budget',
      domain: 'sections',
      key: 'Core',
      limit: { percent: 60 },
    });
    const active = getActive(next);
    expect(active.budgets.sections.Core.percent).toBe(60);
  });

  it('removes budget when all values undefined', () => {
    const state = createInitialState();
    const s1 = reduce(state, {
      type: 'set-budget',
      domain: 'sections',
      key: 'Core',
      limit: { percent: 60 },
    });
    const s2 = reduce(s1, {
      type: 'set-budget',
      domain: 'sections',
      key: 'Core',
      limit: {},
    });
    const active = getActive(s2);
    expect(active.budgets.sections.Core).toBeUndefined();
  });
});

describe('set-holding-target-percent', () => {
  it('sets target percent on a holding', () => {
    const state = createInitialState();
    const holding = createHolding();
    const s1 = reduce(state, { type: 'add-holding', holding });
    const s2 = reduce(s1, {
      type: 'set-holding-target-percent',
      holdingId: holding.id,
      targetPct: 25,
    });
    const updated = getActive(s2).holdings.find((h) => h.id === holding.id)!;
    expect(updated.targetPct).toBe(25);
  });

  it('removes target percent when 0', () => {
    const state = createInitialState();
    const holding = createHolding({ targetPct: 25 });
    const s1 = reduce(state, { type: 'add-holding', holding });
    const s2 = reduce(s1, {
      type: 'set-holding-target-percent',
      holdingId: holding.id,
      targetPct: 0,
    });
    const updated = getActive(s2).holdings.find((h) => h.id === holding.id)!;
    expect(updated.targetPct).toBeUndefined();
  });
});

describe('set-theme-section', () => {
  it('maps a theme to a section', () => {
    const state = createInitialState();
    const next = reduce(state, {
      type: 'set-theme-section',
      theme: 'Tech',
      section: 'Satellite',
    });
    const active = getActive(next);
    expect(active.lists.themeSections.Tech).toBe('Satellite');
  });

  it('removes mapping when section is undefined', () => {
    const state = createInitialState();
    const s1 = reduce(state, {
      type: 'set-theme-section',
      theme: 'Tech',
      section: 'Core',
    });
    const s2 = reduce(s1, { type: 'set-theme-section', theme: 'Tech' });
    const active = getActive(s2);
    expect(active.lists.themeSections.Tech).toBeUndefined();
  });
});

describe('add-list-item', () => {
  it('adds a section', () => {
    const state = createInitialState();
    const next = reduce(state, { type: 'add-list-item', domain: 'sections', value: 'Growth' });
    const active = getActive(next);
    expect(active.lists.sections).toContain('Growth');
  });

  it('adds a theme with section mapping', () => {
    const state = createInitialState();
    const next = reduce(state, {
      type: 'add-list-item',
      domain: 'themes',
      value: 'Tech',
      section: 'Satellite',
    });
    const active = getActive(next);
    expect(active.lists.themes).toContain('Tech');
    expect(active.lists.themeSections.Tech).toBe('Satellite');
  });

  it('does not add duplicates', () => {
    const state = createInitialState();
    const next = reduce(state, { type: 'add-list-item', domain: 'sections', value: 'Core' });
    const active = getActive(next);
    expect(active.lists.sections.filter((s) => s === 'Core')).toHaveLength(1);
  });

  it('ignores empty value', () => {
    const state = createInitialState();
    const next = reduce(state, { type: 'add-list-item', domain: 'sections', value: '  ' });
    expect(next).toBe(state);
  });
});

describe('rename-list-item', () => {
  it('renames a section and updates holdings', () => {
    const state = createInitialState();
    const holding = createHolding({ section: 'Core' });
    const s1 = reduce(state, { type: 'add-holding', holding });
    const s2 = reduce(s1, {
      type: 'rename-list-item',
      domain: 'sections',
      previous: 'Core',
      next: 'Main',
    });
    const active = getActive(s2);
    expect(active.lists.sections).toContain('Main');
    expect(active.lists.sections).not.toContain('Core');
    const updatedHolding = active.holdings.find((h) => h.id === holding.id)!;
    expect(updatedHolding.section).toBe('Main');
  });

  it('cannot rename Cash section', () => {
    const state = createInitialState();
    const next = reduce(state, {
      type: 'rename-list-item',
      domain: 'sections',
      previous: 'Cash',
      next: 'Money',
    });
    expect(next).toBe(state);
  });

  it('updates filters when renamed item matches filter', () => {
    const state = createInitialState();
    const s1 = reduce(state, { type: 'set-filter', key: 'section', value: 'Core' });
    const s2 = reduce(s1, {
      type: 'rename-list-item',
      domain: 'sections',
      previous: 'Core',
      next: 'Main',
    });
    expect(s2.filters.section).toBe('Main');
  });
});

describe('remove-list-item', () => {
  it('removes a section and reassigns holdings to fallback', () => {
    const state = createInitialState();
    const holding = createHolding({ section: 'Satellite' });
    const s1 = reduce(state, { type: 'add-holding', holding });
    const s2 = reduce(s1, {
      type: 'remove-list-item',
      domain: 'sections',
      value: 'Satellite',
    });
    const active = getActive(s2);
    expect(active.lists.sections).not.toContain('Satellite');
    const updatedHolding = active.holdings.find((h) => h.id === holding.id)!;
    expect(updatedHolding.section).toBe('Core'); // fallback to first
  });

  it('cannot remove Cash section', () => {
    const state = createInitialState();
    const next = reduce(state, {
      type: 'remove-list-item',
      domain: 'sections',
      value: 'Cash',
    });
    expect(next).toBe(state);
  });
});

describe('reorder-list', () => {
  it('reorders sections', () => {
    const state = createInitialState();
    // Core=0, Satellite=1, Cash=2
    const next = reduce(state, {
      type: 'reorder-list',
      domain: 'sections',
      from: 1,
      to: 0,
    });
    const active = getActive(next);
    // Satellite should be first, but Cash is always last
    expect(active.lists.sections[0]).toBe('Satellite');
    expect(active.lists.sections[active.lists.sections.length - 1]).toBe('Cash');
  });

  it('cannot reorder Cash section', () => {
    const state = createInitialState();
    const cashIndex = getActive(state).lists.sections.indexOf('Cash');
    const next = reduce(state, {
      type: 'reorder-list',
      domain: 'sections',
      from: cashIndex,
      to: 0,
    });
    const active = getActive(next);
    expect(active.lists.sections[active.lists.sections.length - 1]).toBe('Cash');
  });
});

describe('import-holdings', () => {
  it('imports holdings from CSV rows', () => {
    const state = createInitialState();
    const rows = [
      {
        section: 'Core',
        theme: 'All',
        assetType: 'ETF' as const,
        name: 'VWRL',
        ticker: 'VWRL.L',
        account: 'ISA',
        price: 100,
        qty: 10,
        include: true,
      },
    ];
    const next = reduce(state, { type: 'import-holdings', rows });
    const active = getActive(next);
    expect(active.holdings.some((h) => h.name === 'VWRL')).toBe(true);
    expect(next.filters).toEqual({});
  });

  it('deduplicates by ticker+name', () => {
    const state = createInitialState();
    const holding = createHolding({ name: 'VWRL', ticker: 'VWRL.L' });
    const s1 = reduce(state, { type: 'add-holding', holding });
    const rows = [
      {
        section: 'Core',
        theme: 'All',
        assetType: 'ETF' as const,
        name: 'VWRL',
        ticker: 'VWRL.L',
        account: 'ISA',
        price: 200,
        qty: 20,
        include: true,
      },
    ];
    const s2 = reduce(s1, { type: 'import-holdings', rows });
    const vwrls = getActive(s2).holdings.filter((h) => h.name === 'VWRL');
    expect(vwrls).toHaveLength(1); // not duplicated
  });
});

describe('record-trade', () => {
  it('records a buy trade', () => {
    const state = createInitialState();
    const holding = createHolding({ price: 100, qty: 10, avgCost: 100 });
    const s1 = reduce(state, { type: 'add-holding', holding });
    const s2 = reduce(s1, {
      type: 'record-trade',
      holdingId: holding.id,
      trade: { type: 'buy', date: '2024-01-15', price: 120, qty: 5 },
    });
    const active = getActive(s2);
    const updated = active.holdings.find((h) => h.id === holding.id)!;
    expect(updated.qty).toBe(15);
    expect(active.trades).toHaveLength(1);
    expect(active.trades[0].type).toBe('buy');
  });

  it('does nothing for nonexistent holding', () => {
    const state = createInitialState();
    const next = reduce(state, {
      type: 'record-trade',
      holdingId: 'nonexistent',
      trade: { type: 'buy', date: '2024-01-15', price: 100, qty: 5 },
    });
    expect(getActive(next).trades).toHaveLength(0);
  });
});

describe('import-trades', () => {
  it('imports trades and creates holdings if needed', () => {
    const state = createInitialState();
    const trades = [
      { ticker: 'VWRL.L', name: 'VWRL', type: 'buy' as const, date: '2024-01-15', price: 100, qty: 10 },
    ];
    const next = reduce(state, { type: 'import-trades', trades });
    const active = getActive(next);
    expect(active.holdings.some((h) => h.ticker === 'VWRL.L')).toBe(true);
    expect(active.trades).toHaveLength(1);
  });

  it('applies trade to existing holding by ticker', () => {
    const state = createInitialState();
    const holding = createHolding({ ticker: 'VWRL.L', price: 100, qty: 10, avgCost: 100 });
    const s1 = reduce(state, { type: 'add-holding', holding });
    const trades = [
      { ticker: 'VWRL.L', type: 'buy' as const, date: '2024-01-15', price: 120, qty: 5 },
    ];
    const s2 = reduce(s1, { type: 'import-trades', trades });
    const updated = getActive(s2).holdings.find((h) => h.ticker === 'VWRL.L')!;
    expect(updated.qty).toBe(15);
  });
});

describe('set-active-portfolio', () => {
  it('switches active portfolio', () => {
    const state = createInitialState();
    const next = reduce(state, { type: 'set-active-portfolio', id: 'portfolio-2' });
    expect(next.activePortfolioId).toBe('portfolio-2');
    expect(next.filters).toEqual({});
    expect(next.playground.enabled).toBe(false);
  });

  it('does nothing for same portfolio', () => {
    const state = createInitialState();
    const next = reduce(state, { type: 'set-active-portfolio', id: 'portfolio-1' });
    expect(next).toBe(state);
  });

  it('does nothing for nonexistent portfolio', () => {
    const state = createInitialState();
    const next = reduce(state, { type: 'set-active-portfolio', id: 'nonexistent' });
    expect(next).toBe(state);
  });
});

describe('rename-portfolio', () => {
  it('renames a portfolio', () => {
    const state = createInitialState();
    const next = reduce(state, { type: 'rename-portfolio', id: 'portfolio-1', name: 'Renamed' });
    expect(next.portfolios[0].name).toBe('Renamed');
  });

  it('generates unique name on conflict', () => {
    const state = createInitialState();
    const next = reduce(state, {
      type: 'rename-portfolio',
      id: 'portfolio-1',
      name: 'ISA Portfolio',
    });
    expect(next.portfolios[0].name).toBe('ISA Portfolio 2');
  });

  it('ignores empty name', () => {
    const state = createInitialState();
    const next = reduce(state, { type: 'rename-portfolio', id: 'portfolio-1', name: '' });
    expect(next).toBe(state);
  });
});

describe('add-portfolio', () => {
  it('adds a new portfolio and switches to it', () => {
    const state = createInitialState();
    const next = reduce(state, {
      type: 'add-portfolio',
      id: 'new-portfolio',
      name: 'Test Portfolio',
    });
    expect(next.portfolios).toHaveLength(4);
    expect(next.activePortfolioId).toBe('new-portfolio');
    expect(next.portfolios[3].name).toBe('Test Portfolio');
  });
});

describe('remove-portfolio', () => {
  it('removes a portfolio', () => {
    const state = createInitialState();
    const next = reduce(state, { type: 'remove-portfolio', id: 'portfolio-2' });
    expect(next.portfolios).toHaveLength(2);
    expect(next.portfolios.find((p) => p.id === 'portfolio-2')).toBeUndefined();
  });

  it('cannot remove last portfolio', () => {
    let state = createInitialState();
    state = reduce(state, { type: 'remove-portfolio', id: 'portfolio-2' });
    state = reduce(state, { type: 'remove-portfolio', id: 'portfolio-3' });
    const next = reduce(state, { type: 'remove-portfolio', id: 'portfolio-1' });
    expect(next.portfolios).toHaveLength(1);
  });

  it('switches active portfolio when removing current', () => {
    const state = createInitialState();
    const next = reduce(state, { type: 'remove-portfolio', id: 'portfolio-1' });
    expect(next.activePortfolioId).toBe('portfolio-2');
  });
});

describe('create-draft-portfolio', () => {
  it('creates a draft from parent', () => {
    const state = createInitialState();
    const next = reduce(state, {
      type: 'create-draft-portfolio',
      parentId: 'portfolio-1',
    });
    expect(next.portfolios).toHaveLength(4);
    const draft = next.portfolios[3];
    expect(draft.type).toBe('draft');
    expect(draft.parentId).toBe('portfolio-1');
    expect(draft.name).toContain('Draft');
    expect(next.activePortfolioId).toBe(draft.id);
  });

  it('does nothing for nonexistent parent', () => {
    const state = createInitialState();
    const next = reduce(state, {
      type: 'create-draft-portfolio',
      parentId: 'nonexistent',
    });
    expect(next).toBe(state);
  });
});

describe('promote-draft-to-actual', () => {
  it('promotes draft and replaces parent', () => {
    const state = createInitialState();
    const s1 = reduce(state, { type: 'create-draft-portfolio', parentId: 'portfolio-1' });
    const draftId = s1.activePortfolioId;

    const s2 = reduce(s1, { type: 'promote-draft-to-actual', draftId });
    expect(s2.portfolios).toHaveLength(3);
    const promoted = s2.portfolios.find((p) => p.id === 'portfolio-1')!;
    expect(promoted.type).toBe('actual');
    expect(promoted.parentId).toBeUndefined();
    expect(s2.portfolios.find((p) => p.id === draftId)).toBeUndefined();
  });
});

describe('set-playground-enabled', () => {
  it('enables playground with snapshot', () => {
    const state = createInitialState();
    const next = reduce(state, { type: 'set-playground-enabled', enabled: true });
    expect(next.playground.enabled).toBe(true);
    expect(next.playground.snapshot).toBeDefined();
    expect(next.playground.snapshot!.id).toBe('portfolio-1');
  });

  it('disables playground', () => {
    const state = createInitialState();
    const s1 = reduce(state, { type: 'set-playground-enabled', enabled: true });
    const s2 = reduce(s1, { type: 'set-playground-enabled', enabled: false });
    expect(s2.playground.enabled).toBe(false);
    expect(s2.playground.snapshot).toBeUndefined();
  });
});

describe('restore-playground', () => {
  it('restores portfolio from snapshot', () => {
    const state = createInitialState();
    const holding = createHolding({ name: 'Before' });
    const s1 = reduce(state, { type: 'add-holding', holding });
    const s2 = reduce(s1, { type: 'set-playground-enabled', enabled: true });

    // Modify after snapshot
    const s3 = reduce(s2, {
      type: 'update-holding',
      id: holding.id,
      patch: { name: 'After' },
    });

    const s4 = reduce(s3, { type: 'restore-playground' });
    const restored = getActive(s4).holdings.find((h) => h.id === holding.id)!;
    expect(restored.name).toBe('Before');
  });

  it('does nothing without snapshot', () => {
    const state = createInitialState();
    const next = reduce(state, { type: 'restore-playground' });
    expect(next).toBe(state);
  });
});

describe('restore-state', () => {
  it('replaces entire state', () => {
    const state = createInitialState();
    const newState = createInitialState();
    newState.activePortfolioId = 'portfolio-2';
    const next = reduce(state, { type: 'restore-state', state: newState });
    expect(next).toBe(newState);
  });
});

describe('restore-portfolio-backup', () => {
  it('replaces active portfolio with backup data', () => {
    const state = createInitialState();
    const holding = createHolding({ name: 'Backup Holding' });
    const backupPortfolio = {
      ...getActive(state),
      holdings: [holding],
    };
    const next = reduce(state, { type: 'restore-portfolio-backup', portfolioData: backupPortfolio });
    const active = getActive(next);
    expect(active.holdings.some((h) => h.name === 'Backup Holding')).toBe(true);
  });
});

describe('update-portfolio-settings', () => {
  it('merges settings', () => {
    const state = createInitialState();
    const next = reduce(state, {
      type: 'update-portfolio-settings',
      settings: { enableLivePrices: false, livePriceUpdateInterval: 30 },
    });
    const active = getActive(next);
    expect(active.settings.enableLivePrices).toBe(false);
    expect(active.settings.livePriceUpdateInterval).toBe(30);
    expect(active.settings.currency).toBe('GBP'); // preserved
  });
});

describe('update-live-prices', () => {
  it('updates holding prices from live data', () => {
    const state = createInitialState();
    const holding = createHolding({ ticker: 'VWRL.L', price: 100, qty: 10 });
    const s1 = reduce(state, { type: 'add-holding', holding });

    const prices = new Map([
      [
        'VWRL.L',
        {
          price: 105,
          change: 5,
          changePercent: 5,
          updated: new Date(),
        },
      ],
    ]);
    const s2 = reduce(s1, { type: 'update-live-prices', prices });
    const updated = getActive(s2).holdings.find((h) => h.ticker === 'VWRL.L')!;
    expect(updated.livePrice).toBe(105);
    expect(updated.dayChange).toBe(5);
    expect(updated.dayChangePercent).toBe(5);
  });

  it('handles GBX/GBp conversion', () => {
    const state = createInitialState();
    const holding = createHolding({ ticker: 'VWRL.L', price: 1, qty: 10 });
    const s1 = reduce(state, { type: 'add-holding', holding });

    const prices = new Map([
      [
        'VWRL.L',
        {
          price: 10500,
          change: 500,
          changePercent: 5,
          updated: new Date(),
          originalPrice: 10500,
          originalCurrency: 'GBX',
        },
      ],
    ]);
    const s2 = reduce(s1, { type: 'update-live-prices', prices });
    const updated = getActive(s2).holdings.find((h) => h.ticker === 'VWRL.L')!;
    expect(updated.livePrice).toBe(105); // 10500 * 0.01
  });

  it('does not update Cash holdings', () => {
    const state = createInitialState();
    const holding = createHolding({
      ticker: 'CASH',
      assetType: 'Cash',
      price: 1,
      qty: 1000,
    });
    const s1 = reduce(state, { type: 'add-holding', holding });
    const prices = new Map([
      ['CASH', { price: 1.1, change: 0.1, changePercent: 10, updated: new Date() }],
    ]);
    const s2 = reduce(s1, { type: 'update-live-prices', prices });
    const cashHolding = getActive(s2).holdings.find((h) => h.ticker === 'CASH')!;
    expect(cashHolding.livePrice).toBeUndefined(); // Cash not updated
  });
});

describe('default case', () => {
  it('returns state unchanged for unknown action', () => {
    const state = createInitialState();
    const next = portfolioReducer(state, { type: 'unknown-action' } as never);
    expect(next).toBe(state);
  });
});
