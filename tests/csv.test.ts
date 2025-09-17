import { describe, expect, it } from 'vitest';
import { holdingsToCsv, parseHoldingsCsv, tradesToCsv, parseTradesCsv } from '../src/utils/csv';
import type { Trade, Holding } from '../src/state/types';

const sampleRows = [
  {
    section: 'Core',
    theme: 'Equities',
    assetType: 'ETF' as const,
    name: 'Vanguard FTSE',
    ticker: 'VUKE',
    account: 'ISA',
    price: 100,
    qty: 2,
    include: true,
    targetPct: 60,
  },
  {
    section: 'Satellite',
    theme: 'Bonds',
    assetType: 'Bond' as const,
    name: 'Gilts',
    ticker: 'GILT',
    account: 'GIA',
    price: 50,
    qty: 1.5,
    include: false,
    targetPct: undefined,
  },
];

describe('csv utilities', () => {
  it('serialises holdings to CSV with header', () => {
    const csv = holdingsToCsv(sampleRows);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('section,theme,assetType,name,ticker,account,price,qty,include,targetPct');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('Core,Equities,ETF,Vanguard FTSE,VUKE,ISA,100,2,true,60');
  });

  it('parses CSV back into holding rows, normalising values', () => {
    const csv = `section,theme,assetType,name,ticker,account,price,qty,include,targetPct\nCore,Equities,ETF,Vanguard,VUKE,ISA,100,2,true,60\nSatellite,Bonds,Unknown,Gilts,GILT,GIA,abc,1.5,false,`;
    const rows = parseHoldingsCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].price).toBe(100);
    expect(rows[1].price).toBe(0);
    expect(rows[1].include).toBe(false);
    expect(rows[1].assetType).toBe('Other');
  });

  it('ignores blank lines and treats empty input as empty array', () => {
    expect(parseHoldingsCsv('')).toEqual([]);
    const csv = `section,theme,assetType,name,ticker,account,price,qty,include,targetPct\nCore,Equities,ETF,Vanguard,VUKE,ISA,100,2,true,60\n\n`;
    expect(parseHoldingsCsv(csv)).toHaveLength(1);
  });

  it('throws for unsupported CSV formats', () => {
    expect(() => parseHoldingsCsv('foo,bar')).toThrowError(/unsupported csv/i);
  });

  it('parses Interactive Investor CSV format', () => {
    const csv = '\ufeffSymbol,Name,Qty,Price,Market Value £\nCS1,Amundi Ibex 35 ETF Acc GBP,1,"32,997.50p",£329.98\n';
    const rows = parseHoldingsCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].ticker).toBe('CS1');
    expect(rows[0].name).toContain('Amundi');
    expect(rows[0].price).toBeCloseTo(329.975, 3);
    expect(rows[0].account).toBe('Imported');
  });

  it('parses Hargreaves Lansdown CSV exports', () => {
    const csv = `HL Lifetime ISA,,,,\nClient Name:,Sample,,,,\n\nCode,Stock,Units held,Price (pence),Value (£)\n"EQQQ","Invesco Markets III plc",7,"43,458.00","3,042.06"\n"","Totals",,,,,\n`;
    const rows = parseHoldingsCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].ticker).toBe('EQQQ');
    expect(rows[0].account).toBe('HL Lifetime ISA');
    expect(rows[0].price).toBeCloseTo(434.58, 2);
    expect(rows[0].qty).toBe(7);
  });

  it('serialises trades to CSV', () => {
    const trades: Trade[] = [
      {
        id: 't1',
        holdingId: 'h1',
        type: 'buy',
        date: '2024-09-01',
        price: 120,
        qty: 10,
      },
    ];
    const holdings: Holding[] = [
      {
        id: 'h1',
        section: 'Core',
        theme: 'All',
        assetType: 'ETF' as const,
        name: 'Tracker',
        ticker: 'TRKR',
        account: 'Brokerage',
        price: 120,
        qty: 10,
        include: true,
        avgCost: 120,
        targetPct: undefined,
      },
    ];

    const csv = tradesToCsv(trades, holdings);
    expect(csv.split('\n')[0]).toBe('ticker,name,type,date,price,qty');
    expect(csv).toContain('TRKR,Tracker,buy,2024-09-01,120,10');
  });

  it('parses trades CSV', () => {
    const csv = 'ticker,name,type,date,price,qty\nTRKR,Tracker,buy,2024-09-01,120,10\nTRKR,Tracker,sell,2024-09-02,130,5\n';
    const rows = parseTradesCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].type).toBe('buy');
    expect(rows[1].type).toBe('sell');
    expect(rows[1].price).toBe(130);
  });
});
