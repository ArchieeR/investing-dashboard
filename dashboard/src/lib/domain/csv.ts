// =============================================================================
// CSV Import/Export - 3 formats: Spec, Interactive Investor, Hargreaves Lansdown
// =============================================================================

import type { Holding, Trade } from '@/types/portfolio';

const HEADER = 'section,theme,assetType,name,ticker,account,price,qty,include,targetPct';
const IMPORTED_LABEL = 'Imported';

export type HoldingCsvRow = Omit<
  Holding,
  | 'id'
  | 'avgCost'
  | 'exchange'
  | 'livePrice'
  | 'livePriceUpdated'
  | 'dayChange'
  | 'dayChangePercent'
  | 'originalLivePrice'
  | 'originalCurrency'
  | 'conversionRate'
> & {
  exchange?: Holding['exchange'];
};

export interface TradeCsvRow {
  ticker: string;
  name?: string;
  type: 'buy' | 'sell';
  date: string;
  price: number;
  qty: number;
}

export const stripBom = (value: string): string => value.replace(/^\ufeff+/g, '');

export const parseCsvRow = (line: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => stripBom(cell.trim()));
};

export const normaliseBoolean = (raw: string | undefined): boolean => {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return true;
  }

  const value = raw.trim().toLowerCase();
  if (value === 'true' || value === 'yes' || value === '1') {
    return true;
  }

  if (value === 'false' || value === 'no' || value === '0') {
    return false;
  }

  return true;
};

export const parseNumber = (raw: string | undefined): number => {
  if (!raw) {
    return 0;
  }

  const cleaned = raw.replace(/[^0-9.-]/g, '');
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
};

export const parseMoney = (raw: string | undefined): number => {
  if (!raw) {
    return 0;
  }

  const trimmed = raw.trim();
  if (trimmed === '') {
    return 0;
  }

  const isPence = /p(ence)?$/i.test(trimmed);
  const cleaned = trimmed
    .replace(/p(ence)?$/i, '')
    .replace(/[£$€]/g, '')
    .replace(/,/g, '')
    .trim();

  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value)) {
    return 0;
  }

  return isPence ? value / 100 : value;
};

export const normaliseAssetType = (raw: string | undefined): HoldingCsvRow['assetType'] => {
  const allowed: HoldingCsvRow['assetType'][] = [
    'ETF',
    'Stock',
    'Crypto',
    'Cash',
    'Bond',
    'Fund',
    'Other',
  ];
  if (!raw) {
    return 'Other';
  }

  const candidate = raw.trim() as HoldingCsvRow['assetType'];
  return allowed.includes(candidate) ? candidate : 'Other';
};

export const escapeCsvValue = (value: string | number | boolean | undefined): string => {
  if (value === undefined) {
    return '';
  }

  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

export const holdingsToCsv = (rows: HoldingCsvRow[]): string => {
  const lines = rows.map((row) => {
    const target = typeof row.targetPct === 'number' ? row.targetPct : '';
    return [
      escapeCsvValue(row.section),
      escapeCsvValue(row.theme),
      escapeCsvValue(row.assetType),
      escapeCsvValue(row.name),
      escapeCsvValue(row.ticker),
      escapeCsvValue(row.account),
      escapeCsvValue(row.price),
      escapeCsvValue(row.qty),
      escapeCsvValue(row.include),
      escapeCsvValue(target),
    ].join(',');
  });

  return [HEADER, ...lines].join('\n');
};

export const parseSpecCsv = (csv: string): HoldingCsvRow[] | undefined => {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => stripBom(line.trim()))
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  if (lines[0] !== HEADER) {
    return undefined;
  }

  return lines.slice(1).map((line) => {
    const [section, theme, assetType, name, ticker, account, price, qty, include, targetPct] =
      parseCsvRow(line);

    return {
      section: section ?? '',
      theme: theme ?? '',
      assetType: normaliseAssetType(assetType),
      name: name ?? '',
      ticker: ticker ?? '',
      account: account ?? '',
      price: parseNumber(price),
      qty: parseNumber(qty),
      include: normaliseBoolean(include),
      targetPct:
        targetPct !== undefined && targetPct.trim() !== '' ? parseNumber(targetPct) : undefined,
    } satisfies HoldingCsvRow;
  });
};

const TRADE_HEADER = 'ticker,name,type,date,price,qty';

export const tradesToCsv = (trades: Trade[], holdings: Holding[]): string => {
  const holdingsById = new Map(holdings.map((holding) => [holding.id, holding]));
  const lines = trades.map((trade) => {
    const holding = holdingsById.get(trade.holdingId);
    return [
      escapeCsvValue(holding?.ticker ?? ''),
      escapeCsvValue(holding?.name ?? ''),
      escapeCsvValue(trade.type),
      escapeCsvValue(trade.date),
      escapeCsvValue(trade.price),
      escapeCsvValue(trade.qty),
    ].join(',');
  });

  return [TRADE_HEADER, ...lines].join('\n');
};

export const parseTradesCsv = (csv: string): TradeCsvRow[] => {
  const trimmed = stripBom(csv.trim());
  if (!trimmed) {
    return [];
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) {
    return [];
  }

  const header = lines[0].toLowerCase();
  if (header !== TRADE_HEADER) {
    throw new Error('Unsupported trades CSV format');
  }

  return lines.slice(1).map((line) => {
    const [ticker, name, type, date, price, qty] = parseCsvRow(line);
    const tradeType = type.toLowerCase() === 'sell' ? 'sell' : 'buy';

    return {
      ticker: ticker ?? '',
      name: name ?? '',
      type: tradeType,
      date: date ?? new Date().toISOString().slice(0, 10),
      price: parseNumber(price),
      qty: parseNumber(qty),
    } satisfies TradeCsvRow;
  });
};

export const parseInteractiveInvestorCsv = (csv: string): HoldingCsvRow[] | undefined => {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => stripBom(line.trim()))
    .filter((line) => line.length > 0);
  if (lines.length === 0) {
    return [];
  }

  const header = parseCsvRow(lines[0]).map((cell) => cell.toLowerCase());
  if (!header.includes('symbol') || !header.includes('name') || !header.includes('qty')) {
    return undefined;
  }

  const indexOf = (label: string) => header.findIndex((cell) => cell === label);
  const symbolIndex = indexOf('symbol');
  const nameIndex = indexOf('name');
  const qtyIndex = indexOf('qty');
  const priceIndex = header.findIndex((cell) => cell.startsWith('price'));

  if (symbolIndex === -1 || nameIndex === -1 || qtyIndex === -1 || priceIndex === -1) {
    return undefined;
  }

  return lines.slice(1).reduce<HoldingCsvRow[]>((acc, line) => {
    const cells = parseCsvRow(line);
    if (cells.length <= Math.max(symbolIndex, nameIndex, qtyIndex, priceIndex)) {
      return acc;
    }

    const qty = parseNumber(cells[qtyIndex]);
    const price = parseMoney(cells[priceIndex]);

    if (qty === 0 && price === 0) {
      return acc;
    }

    acc.push({
      section: IMPORTED_LABEL,
      theme: IMPORTED_LABEL,
      assetType: 'Other',
      name: cells[nameIndex] ?? '',
      ticker: cells[symbolIndex] ?? '',
      account: IMPORTED_LABEL,
      price,
      qty,
      include: true,
      targetPct: undefined,
    });
    return acc;
  }, []);
};

export const parseHlCsv = (csv: string): HoldingCsvRow[] | undefined => {
  const linesRaw = csv.split(/\r?\n/);
  if (linesRaw.length === 0) {
    return [];
  }

  const lines = linesRaw.map((line) => stripBom(line.trim()));
  const accountLine = lines.find((line) => line.length > 0);
  const account = accountLine ? parseCsvRow(accountLine)[0] ?? IMPORTED_LABEL : IMPORTED_LABEL;

  const headerIndex = lines.findIndex((line) => line.toLowerCase().startsWith('code,stock'));
  if (headerIndex === -1) {
    return undefined;
  }

  const header = parseCsvRow(lines[headerIndex]).map((cell) => cell.toLowerCase());
  const codeIndex = header.findIndex((cell) => cell === 'code');
  const nameIndex = header.findIndex((cell) => cell === 'stock');
  const unitsIndex = header.findIndex((cell) => cell.includes('units'));
  const priceIndex = header.findIndex((cell) => cell.includes('price'));

  if (codeIndex === -1 || nameIndex === -1 || unitsIndex === -1 || priceIndex === -1) {
    return undefined;
  }

  const rows = lines.slice(headerIndex + 1);
  const holdings: HoldingCsvRow[] = [];

  rows.forEach((line) => {
    if (!line || line.toLowerCase().startsWith('""') || line.toLowerCase().includes('totals')) {
      return;
    }

    const cells = parseCsvRow(line);
    if (cells.length <= Math.max(codeIndex, nameIndex, unitsIndex, priceIndex)) {
      return;
    }

    const qty = parseNumber(cells[unitsIndex]);
    const price = parseMoney(`${cells[priceIndex]}p`);

    if (qty === 0 && price === 0) {
      return;
    }

    holdings.push({
      section: IMPORTED_LABEL,
      theme: IMPORTED_LABEL,
      assetType: 'Other',
      name: cells[nameIndex] ?? '',
      ticker: cells[codeIndex] ?? '',
      account: account || IMPORTED_LABEL,
      price,
      qty,
      include: true,
      targetPct: undefined,
    });
  });

  return holdings;
};

export const parseHoldingsCsv = (csv: string): HoldingCsvRow[] => {
  const trimmed = stripBom(csv.trim());
  if (!trimmed) {
    return [];
  }

  const spec = parseSpecCsv(trimmed);
  if (spec !== undefined) {
    return spec;
  }

  const ii = parseInteractiveInvestorCsv(trimmed);
  if (ii !== undefined && ii.length > 0) {
    return ii;
  }

  const hl = parseHlCsv(trimmed);
  if (hl !== undefined && hl.length > 0) {
    return hl;
  }

  throw new Error('Unsupported CSV format');
};
