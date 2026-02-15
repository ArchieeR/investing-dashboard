import { describe, it, expect } from 'vitest';
import {
  stripBom,
  parseCsvRow,
  normaliseBoolean,
  parseNumber,
  parseMoney,
  normaliseAssetType,
  escapeCsvValue,
  holdingsToCsv,
  parseSpecCsv,
  parseInteractiveInvestorCsv,
  parseHlCsv,
  parseTradesCsv,
  parseHoldingsCsv,
  tradesToCsv,
} from './csv';
import type { HoldingCsvRow } from './csv';

describe('stripBom', () => {
  it('strips BOM character', () => {
    expect(stripBom('\ufeffhello')).toBe('hello');
  });

  it('strips multiple BOMs', () => {
    expect(stripBom('\ufeff\ufeffhello')).toBe('hello');
  });

  it('returns string unchanged without BOM', () => {
    expect(stripBom('hello')).toBe('hello');
  });
});

describe('parseCsvRow', () => {
  it('parses simple CSV row', () => {
    expect(parseCsvRow('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('handles quoted fields', () => {
    expect(parseCsvRow('"hello, world",b,c')).toEqual(['hello, world', 'b', 'c']);
  });

  it('handles escaped quotes', () => {
    expect(parseCsvRow('"he said ""hi""",b')).toEqual(['he said "hi"', 'b']);
  });

  it('trims whitespace', () => {
    expect(parseCsvRow(' a , b , c ')).toEqual(['a', 'b', 'c']);
  });
});

describe('normaliseBoolean', () => {
  it('returns true for true-like values', () => {
    expect(normaliseBoolean('true')).toBe(true);
    expect(normaliseBoolean('yes')).toBe(true);
    expect(normaliseBoolean('1')).toBe(true);
    expect(normaliseBoolean('TRUE')).toBe(true);
  });

  it('returns false for false-like values', () => {
    expect(normaliseBoolean('false')).toBe(false);
    expect(normaliseBoolean('no')).toBe(false);
    expect(normaliseBoolean('0')).toBe(false);
  });

  it('defaults to true for empty/undefined', () => {
    expect(normaliseBoolean(undefined)).toBe(true);
    expect(normaliseBoolean('')).toBe(true);
  });

  it('defaults to true for unknown values', () => {
    expect(normaliseBoolean('maybe')).toBe(true);
  });
});

describe('parseNumber', () => {
  it('parses plain numbers', () => {
    expect(parseNumber('123')).toBe(123);
    expect(parseNumber('12.34')).toBe(12.34);
  });

  it('strips non-numeric characters', () => {
    expect(parseNumber('$1,234.56')).toBe(1234.56);
  });

  it('returns 0 for empty/undefined', () => {
    expect(parseNumber(undefined)).toBe(0);
    expect(parseNumber('')).toBe(0);
  });
});

describe('parseMoney', () => {
  it('parses plain amounts', () => {
    expect(parseMoney('100')).toBe(100);
    expect(parseMoney('12.50')).toBe(12.5);
  });

  it('handles currency symbols', () => {
    expect(parseMoney('£100')).toBe(100);
    expect(parseMoney('$50.25')).toBe(50.25);
  });

  it('converts pence to pounds', () => {
    expect(parseMoney('1500p')).toBe(15);
    expect(parseMoney('250pence')).toBe(2.5);
  });

  it('handles commas', () => {
    expect(parseMoney('1,234.56')).toBe(1234.56);
  });

  it('returns 0 for empty/undefined', () => {
    expect(parseMoney(undefined)).toBe(0);
    expect(parseMoney('')).toBe(0);
  });
});

describe('normaliseAssetType', () => {
  it('returns valid asset types', () => {
    expect(normaliseAssetType('ETF')).toBe('ETF');
    expect(normaliseAssetType('Stock')).toBe('Stock');
    expect(normaliseAssetType('Bond')).toBe('Bond');
  });

  it('returns Other for invalid types', () => {
    expect(normaliseAssetType('Unknown')).toBe('Other');
    expect(normaliseAssetType(undefined)).toBe('Other');
  });
});

describe('escapeCsvValue', () => {
  it('returns string as-is when no special chars', () => {
    expect(escapeCsvValue('hello')).toBe('hello');
  });

  it('wraps in quotes when containing comma', () => {
    expect(escapeCsvValue('hello, world')).toBe('"hello, world"');
  });

  it('escapes double quotes', () => {
    expect(escapeCsvValue('he said "hi"')).toBe('"he said ""hi"""');
  });

  it('handles undefined', () => {
    expect(escapeCsvValue(undefined)).toBe('');
  });

  it('handles numbers and booleans', () => {
    expect(escapeCsvValue(42)).toBe('42');
    expect(escapeCsvValue(true)).toBe('true');
  });
});

describe('holdingsToCsv', () => {
  it('generates CSV with header and rows', () => {
    const rows: HoldingCsvRow[] = [
      {
        section: 'Core',
        theme: 'All',
        assetType: 'ETF',
        name: 'VWRL',
        ticker: 'VWRL.L',
        account: 'ISA',
        price: 100,
        qty: 10,
        include: true,
        targetPct: 25,
      },
    ];
    const csv = holdingsToCsv(rows);
    const lines = csv.split('\n');
    expect(lines[0]).toBe(
      'section,theme,assetType,name,ticker,account,price,qty,include,targetPct',
    );
    expect(lines[1]).toBe('Core,All,ETF,VWRL,VWRL.L,ISA,100,10,true,25');
  });

  it('handles empty targetPct', () => {
    const rows: HoldingCsvRow[] = [
      {
        section: 'Core',
        theme: 'All',
        assetType: 'ETF',
        name: 'X',
        ticker: 'X',
        account: 'A',
        price: 1,
        qty: 1,
        include: true,
      },
    ];
    const csv = holdingsToCsv(rows);
    expect(csv.split('\n')[1]).toContain(',true,');
  });
});

describe('parseSpecCsv', () => {
  it('parses spec format CSV', () => {
    const csv = `section,theme,assetType,name,ticker,account,price,qty,include,targetPct
Core,All,ETF,VWRL,VWRL.L,ISA,100,10,true,25`;
    const result = parseSpecCsv(csv);
    expect(result).toBeDefined();
    expect(result).toHaveLength(1);
    expect(result![0].name).toBe('VWRL');
    expect(result![0].price).toBe(100);
    expect(result![0].targetPct).toBe(25);
  });

  it('returns undefined for non-matching header', () => {
    expect(parseSpecCsv('wrong,header')).toBeUndefined();
  });

  it('returns empty array for empty input', () => {
    expect(parseSpecCsv('')).toEqual([]);
  });
});

describe('parseInteractiveInvestorCsv', () => {
  it('parses II format', () => {
    const csv = `symbol,name,qty,price
VWRL,Vanguard FTSE,10,100.50`;
    const result = parseInteractiveInvestorCsv(csv);
    expect(result).toBeDefined();
    expect(result).toHaveLength(1);
    expect(result![0].ticker).toBe('VWRL');
    expect(result![0].name).toBe('Vanguard FTSE');
    expect(result![0].qty).toBe(10);
  });

  it('returns undefined for non-matching headers', () => {
    expect(parseInteractiveInvestorCsv('col1,col2,col3')).toBeUndefined();
  });

  it('skips rows with zero qty and price', () => {
    const csv = `symbol,name,qty,price
VWRL,Vanguard,0,0
IUKD,iShares,5,200`;
    const result = parseInteractiveInvestorCsv(csv);
    expect(result).toHaveLength(1);
    expect(result![0].ticker).toBe('IUKD');
  });
});

describe('parseHlCsv', () => {
  it('parses HL format', () => {
    const csv = `ISA Account
Header info
Code,Stock,Units held,Price
VWRL,Vanguard FTSE All-World,10,10050`;
    const result = parseHlCsv(csv);
    expect(result).toBeDefined();
    expect(result!.length).toBeGreaterThan(0);
    expect(result![0].ticker).toBe('VWRL');
    expect(result![0].account).toBe('ISA Account');
  });

  it('returns undefined without Code,Stock header', () => {
    expect(parseHlCsv('no,matching,header')).toBeUndefined();
  });
});

describe('parseTradesCsv', () => {
  it('parses trades CSV', () => {
    const csv = `ticker,name,type,date,price,qty
VWRL,Vanguard,buy,2024-01-15,100.50,10`;
    const result = parseTradesCsv(csv);
    expect(result).toHaveLength(1);
    expect(result[0].ticker).toBe('VWRL');
    expect(result[0].type).toBe('buy');
    expect(result[0].price).toBe(100.50);
    expect(result[0].qty).toBe(10);
  });

  it('returns empty array for empty input', () => {
    expect(parseTradesCsv('')).toEqual([]);
  });

  it('throws for unsupported format', () => {
    expect(() => parseTradesCsv('wrong,header,format')).toThrow('Unsupported trades CSV format');
  });
});

describe('tradesToCsv', () => {
  it('generates trades CSV', () => {
    const csv = tradesToCsv(
      [{ id: 't1', holdingId: 'h1', type: 'buy', date: '2024-01-15', price: 100, qty: 10 }],
      [
        {
          id: 'h1',
          section: 'Core',
          theme: 'All',
          assetType: 'ETF',
          name: 'VWRL',
          ticker: 'VWRL.L',
          exchange: 'LSE' as const,
          account: 'ISA',
          price: 100,
          qty: 10,
          include: true,
        },
      ],
    );
    const lines = csv.split('\n');
    expect(lines[0]).toBe('ticker,name,type,date,price,qty');
    expect(lines[1]).toContain('VWRL.L');
    expect(lines[1]).toContain('buy');
  });
});

describe('parseHoldingsCsv (auto-detect)', () => {
  it('detects spec format', () => {
    const csv = `section,theme,assetType,name,ticker,account,price,qty,include,targetPct
Core,All,ETF,VWRL,VWRL.L,ISA,100,10,true,25`;
    const result = parseHoldingsCsv(csv);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('VWRL');
  });

  it('detects II format', () => {
    const csv = `symbol,name,qty,price
VWRL,Vanguard FTSE,10,100.50`;
    const result = parseHoldingsCsv(csv);
    expect(result).toHaveLength(1);
  });

  it('returns empty for empty input', () => {
    expect(parseHoldingsCsv('')).toEqual([]);
  });

  it('throws for unrecognised format', () => {
    expect(() => parseHoldingsCsv('completely,unknown,format\n1,2,3')).toThrow(
      'Unsupported CSV format',
    );
  });
});
