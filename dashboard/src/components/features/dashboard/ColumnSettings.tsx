'use client';

import { usePortfolio } from '@/context/PortfolioContext';
import type { VisibleColumns } from '@/types/portfolio';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';
import { useCallback } from 'react';

type ColumnKey = keyof VisibleColumns;

interface ColumnGroup {
  label: string;
  columns: Array<{ key: ColumnKey; label: string }>;
}

const COLUMN_GROUPS: ColumnGroup[] = [
  {
    label: 'Basic Info',
    columns: [
      { key: 'section', label: 'Section' },
      { key: 'theme', label: 'Theme' },
      { key: 'assetType', label: 'Asset Type' },
      { key: 'name', label: 'Name' },
      { key: 'ticker', label: 'Ticker' },
      { key: 'exchange', label: 'Exchange' },
      { key: 'account', label: 'Account' },
    ],
  },
  {
    label: 'Pricing',
    columns: [
      { key: 'price', label: 'Manual Price' },
      { key: 'livePrice', label: 'Live Price' },
      { key: 'avgCost', label: 'Avg Cost' },
    ],
  },
  {
    label: 'Holdings',
    columns: [
      { key: 'qty', label: 'Quantity' },
      { key: 'value', label: 'Manual Value' },
      { key: 'liveValue', label: 'Live Value' },
      { key: 'costBasis', label: 'Cost Basis' },
    ],
  },
  {
    label: 'Daily Changes',
    columns: [
      { key: 'dayChange', label: 'Day Change' },
      { key: 'dayChangePercent', label: 'Day Change %' },
    ],
  },
  {
    label: 'Portfolio Metrics',
    columns: [
      { key: 'pctOfPortfolio', label: '% of Portfolio' },
      { key: 'pctOfSection', label: '% of Section' },
      { key: 'pctOfTheme', label: '% of Theme' },
      { key: 'targetPct', label: 'Target %' },
      { key: 'targetDelta', label: 'Target Delta' },
    ],
  },
  {
    label: 'Performance',
    columns: [
      { key: 'performance1d', label: '1D' },
      { key: 'performance2d', label: '2D' },
      { key: 'performance3d', label: '3D' },
      { key: 'performance1w', label: '1W' },
      { key: 'performance1m', label: '1M' },
      { key: 'performance6m', label: '6M' },
      { key: 'performanceYtd', label: 'YTD' },
      { key: 'performance1y', label: '1Y' },
      { key: 'performance2y', label: '2Y' },
    ],
  },
  {
    label: 'Controls',
    columns: [
      { key: 'include', label: 'Include' },
      { key: 'actions', label: 'Actions' },
    ],
  },
];

export function ColumnSettings() {
  const { portfolio, updatePortfolioSettings } = usePortfolio();
  const visibleColumns = portfolio.settings.visibleColumns;

  const handleToggle = useCallback(
    (key: ColumnKey) => {
      updatePortfolioSettings({
        visibleColumns: {
          ...visibleColumns,
          [key]: !visibleColumns[key],
        },
      });
    },
    [visibleColumns, updatePortfolioSettings],
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <Settings2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Column Settings</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          {COLUMN_GROUPS.map((group) => (
            <div key={group.label}>
              <h4 className="text-xs font-medium text-[#52525B] uppercase tracking-wider mb-2">
                {group.label}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {group.columns.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 text-sm text-foreground cursor-pointer"
                  >
                    <Checkbox
                      checked={visibleColumns[col.key]}
                      onCheckedChange={() => handleToggle(col.key)}
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
