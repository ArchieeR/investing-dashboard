// =============================================================================
// Holdings Diff — compare extracted holdings against current portfolio
// =============================================================================

import type { Holding, AssetType, Exchange } from '@/types/portfolio';
import type { HoldingCsvRow } from '@/lib/domain/csv';
import type { ExtractedHolding, ParseResult } from '@/types/import';
import type { HoldingDiff, DiffSummary } from '@/types/import';

const VALID_ASSET_TYPES = new Set<string>([
  'ETF', 'Stock', 'Crypto', 'Cash', 'Bond', 'Fund', 'Other',
]);

const VALID_EXCHANGES = new Set<string>([
  'LSE', 'NYSE', 'NASDAQ', 'AMS', 'XETRA', 'XC', 'VI', 'Other',
]);

/** Convert an ExtractedHolding from AI to a HoldingCsvRow for import */
function toHoldingCsvRow(h: ExtractedHolding): HoldingCsvRow {
  return {
    section: 'Imported',
    theme: 'All',
    assetType: VALID_ASSET_TYPES.has(h.assetType) ? (h.assetType as AssetType) : 'Other',
    name: h.name,
    ticker: h.ticker,
    account: h.account || 'Imported',
    price: h.price,
    qty: h.qty,
    include: true,
    exchange: h.exchange && VALID_EXCHANGES.has(h.exchange)
      ? (h.exchange as Exchange)
      : undefined,
  };
}

/** Normalize ticker for matching (strip whitespace, lowercase) */
function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

/**
 * Compute diff between current holdings and extracted holdings.
 * Matches primarily by ticker symbol.
 */
export function diffHoldings(
  current: Holding[],
  extracted: ExtractedHolding[],
): HoldingDiff[] {
  const diffs: HoldingDiff[] = [];

  // Index current holdings by ticker
  const currentByTicker = new Map<string, Holding>();
  for (const h of current) {
    const key = normalizeTicker(h.ticker);
    if (key) currentByTicker.set(key, h);
  }

  const matchedTickers = new Set<string>();

  // Process each extracted holding
  for (const ext of extracted) {
    const key = normalizeTicker(ext.ticker);
    const row = toHoldingCsvRow(ext);
    const existing = currentByTicker.get(key);

    if (!existing) {
      // New holding
      diffs.push({ type: 'new', extracted: row, accepted: true });
    } else {
      matchedTickers.add(key);

      const qtyChanged = Math.abs(existing.qty - ext.qty) > 0.0001;
      const priceChanged = Math.abs(existing.price - ext.price) > 0.01;

      if (qtyChanged || priceChanged) {
        diffs.push({
          type: 'changed',
          extracted: row,
          existing,
          changes: {
            ...(qtyChanged ? { qty: { old: existing.qty, new: ext.qty } } : {}),
            ...(priceChanged ? { price: { old: existing.price, new: ext.price } } : {}),
          },
          accepted: true,
        });
      } else {
        diffs.push({ type: 'unchanged', extracted: row, existing, accepted: false });
      }
    }
  }

  // Holdings in portfolio but not in statement → removed
  // Only flag removals if the statement has holdings (avoid false positives on empty/partial)
  if (extracted.length > 0) {
    for (const h of current) {
      const key = normalizeTicker(h.ticker);
      if (key && !matchedTickers.has(key)) {
        diffs.push({
          type: 'removed',
          extracted: toHoldingCsvRow({
            ticker: h.ticker,
            name: h.name,
            qty: 0,
            price: h.price,
            assetType: h.assetType,
            account: h.account,
            exchange: h.exchange,
          }),
          existing: h,
          accepted: false,
        });
      }
    }
  }

  // Sort: new first, then changed, then removed, then unchanged
  const order = { new: 0, changed: 1, removed: 2, unchanged: 3 };
  diffs.sort((a, b) => order[a.type] - order[b.type]);

  return diffs;
}

/** Compute summary stats from a diff */
export function summarizeDiff(diffs: HoldingDiff[]): DiffSummary {
  let newCount = 0;
  let changedCount = 0;
  let removedCount = 0;
  let unchangedCount = 0;
  let estimatedValueChange = 0;

  for (const d of diffs) {
    switch (d.type) {
      case 'new':
        newCount++;
        estimatedValueChange += d.extracted.price * d.extracted.qty;
        break;
      case 'changed':
        changedCount++;
        if (d.changes?.qty && d.existing) {
          const oldVal = d.existing.price * d.changes.qty.old;
          const newVal = d.extracted.price * d.changes.qty.new;
          estimatedValueChange += newVal - oldVal;
        }
        break;
      case 'removed':
        removedCount++;
        if (d.existing) {
          estimatedValueChange -= d.existing.price * d.existing.qty;
        }
        break;
      case 'unchanged':
        unchangedCount++;
        break;
    }
  }

  return { newCount, changedCount, removedCount, unchangedCount, estimatedValueChange };
}

/** Convert ParseResult extracted holdings to diff format */
export function createDiffFromParseResult(
  current: Holding[],
  result: ParseResult,
): HoldingDiff[] {
  return diffHoldings(current, result.holdings);
}
