// =============================================================================
// Smart Import Types
// =============================================================================

import type { HoldingCsvRow } from '@/lib/domain/csv';
import type { Holding } from '@/types/portfolio';

/** A single holding extracted by AI from an uploaded document */
export interface ExtractedHolding {
  ticker: string;
  name: string;
  qty: number;
  price: number;
  assetType: string;
  account: string;
  exchange?: string;
}

/** Result from AI document parsing */
export interface ParseResult {
  statementDate: string | null;
  provider: string | null;
  holdings: ExtractedHolding[];
}

/** Diff between an extracted holding and the current portfolio */
export interface HoldingDiff {
  type: 'new' | 'changed' | 'removed' | 'unchanged';
  extracted: HoldingCsvRow;
  existing?: Holding;
  changes?: {
    qty?: { old: number; new: number };
    price?: { old: number; new: number };
  };
  accepted: boolean;
}

/** Summary of the diff for display */
export interface DiffSummary {
  newCount: number;
  changedCount: number;
  removedCount: number;
  unchangedCount: number;
  estimatedValueChange: number;
}
