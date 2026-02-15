'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePortfolio } from '@/context/PortfolioContext';
import { CSVImport } from '@/components/features/import/CSVImport';
import { BackupRestore } from '@/components/features/backup/BackupRestore';
import { holdingsToCsv } from '@/lib/domain/csv';
import type { HoldingCsvRow } from '@/lib/domain/csv';
import type { AssetType, Exchange } from '@/types/portfolio';
import { Download, Settings, BarChart3, Database, Layers } from 'lucide-react';

const EXCHANGES: Exchange[] = ['LSE', 'NYSE', 'NASDAQ', 'AMS', 'XETRA', 'XC', 'VI', 'Other'];
const ASSET_TYPES: AssetType[] = ['ETF', 'Stock', 'Crypto', 'Cash', 'Bond', 'Fund', 'Other'];
const UPDATE_INTERVALS = [1, 2, 5, 10, 15, 30, 60];

export function SettingsPanel() {
  const { portfolio, updatePortfolioSettings } = usePortfolio();
  const { settings } = portfolio;
  const [lockedTotalInput, setLockedTotalInput] = useState(
    settings.lockedTotal?.toString() ?? '',
  );

  // Exchange visibility state (local, since it's a UI filter concept)
  const [enabledExchanges, setEnabledExchanges] = useState<Set<Exchange>>(
    new Set(EXCHANGES),
  );
  const [enabledAssetTypes, setEnabledAssetTypes] = useState<Set<AssetType>>(
    new Set(ASSET_TYPES),
  );

  const toggleExchange = (exchange: Exchange) => {
    setEnabledExchanges((prev) => {
      const next = new Set(prev);
      if (next.has(exchange)) next.delete(exchange);
      else next.add(exchange);
      return next;
    });
  };

  const toggleAssetType = (type: AssetType) => {
    setEnabledAssetTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const handleExportCsv = () => {
    const rows: HoldingCsvRow[] = portfolio.holdings.map((h) => ({
      section: h.section,
      theme: h.theme,
      assetType: h.assetType,
      name: h.name,
      ticker: h.ticker,
      account: h.account,
      price: h.price,
      qty: h.qty,
      include: h.include,
      targetPct: h.targetPct,
      exchange: h.exchange,
    }));
    const csv = holdingsToCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${portfolio.name.replace(/\s+/g, '-').toLowerCase()}-holdings.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="w-full grid grid-cols-4">
        <TabsTrigger value="general">
          <Settings className="h-3.5 w-3.5 mr-1 hidden md:inline" />
          General
        </TabsTrigger>
        <TabsTrigger value="exchanges">
          <BarChart3 className="h-3.5 w-3.5 mr-1 hidden md:inline" />
          Exchanges
        </TabsTrigger>
        <TabsTrigger value="asset-types">
          <Layers className="h-3.5 w-3.5 mr-1 hidden md:inline" />
          Assets
        </TabsTrigger>
        <TabsTrigger value="data">
          <Database className="h-3.5 w-3.5 mr-1 hidden md:inline" />
          Data
        </TabsTrigger>
      </TabsList>

      {/* General Tab */}
      <TabsContent value="general" className="space-y-6 pt-4">
        {/* Currency */}
        <div className="space-y-1.5">
          <Label className="text-[#52525B]">Base Currency</Label>
          <Select
            value={settings.currency}
            onValueChange={(v) => updatePortfolioSettings({ currency: v })}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lock total */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="lockTotal"
              checked={settings.lockTotal}
              onCheckedChange={(checked) => {
                updatePortfolioSettings({ lockTotal: !!checked });
              }}
            />
            <Label htmlFor="lockTotal" className="text-[#52525B]">
              Lock portfolio total
            </Label>
          </div>
          {settings.lockTotal && (
            <div className="flex items-center gap-2 pl-6">
              <Input
                type="number"
                step="100"
                min="0"
                className="w-[160px]"
                value={lockedTotalInput}
                onChange={(e) => setLockedTotalInput(e.target.value)}
                onBlur={() => {
                  const val = Number.parseFloat(lockedTotalInput);
                  if (Number.isFinite(val) && val > 0) {
                    updatePortfolioSettings({ lockedTotal: val });
                  }
                }}
                placeholder="Enter total"
              />
              <span className="text-xs text-muted-foreground">{settings.currency}</span>
            </div>
          )}
        </div>

        {/* Live prices */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="livePrices"
              checked={settings.enableLivePrices}
              onCheckedChange={(checked) => {
                updatePortfolioSettings({ enableLivePrices: !!checked });
              }}
            />
            <Label htmlFor="livePrices" className="text-[#52525B]">
              Enable live prices
            </Label>
          </div>
          {settings.enableLivePrices && (
            <div className="flex items-center gap-2 pl-6">
              <Label className="text-xs text-muted-foreground">Update every</Label>
              <Select
                value={String(settings.livePriceUpdateInterval)}
                onValueChange={(v) =>
                  updatePortfolioSettings({ livePriceUpdateInterval: Number(v) })
                }
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UPDATE_INTERVALS.map((i) => (
                    <SelectItem key={i} value={String(i)}>
                      {i} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </TabsContent>

      {/* Exchanges Tab */}
      <TabsContent value="exchanges" className="pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {EXCHANGES.map((exchange) => (
            <div
              key={exchange}
              className="flex items-center gap-2 rounded-lg border border-border bg-card p-3"
            >
              <Checkbox
                id={`exchange-${exchange}`}
                checked={enabledExchanges.has(exchange)}
                onCheckedChange={() => toggleExchange(exchange)}
              />
              <Label htmlFor={`exchange-${exchange}`} className="text-sm font-mono">
                {exchange}
              </Label>
            </div>
          ))}
        </div>
      </TabsContent>

      {/* Asset Types Tab */}
      <TabsContent value="asset-types" className="pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ASSET_TYPES.map((type) => (
            <div
              key={type}
              className="flex items-center gap-2 rounded-lg border border-border bg-card p-3"
            >
              <Checkbox
                id={`asset-${type}`}
                checked={enabledAssetTypes.has(type)}
                onCheckedChange={() => toggleAssetType(type)}
              />
              <Label htmlFor={`asset-${type}`} className="text-sm">
                {type}
              </Label>
            </div>
          ))}
        </div>
      </TabsContent>

      {/* Data Management Tab */}
      <TabsContent value="data" className="space-y-6 pt-4">
        {/* CSV Import */}
        <div className="space-y-2">
          <Label className="text-[#52525B]">Import Holdings (CSV)</Label>
          <CSVImport />
        </div>

        {/* CSV Export */}
        <div className="space-y-2">
          <Label className="text-[#52525B]">Export Holdings (CSV)</Label>
          <Button
            variant="outline"
            onClick={handleExportCsv}
            className="rounded-[4px]"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Backup / Restore */}
        <div className="space-y-2">
          <Label className="text-[#52525B]">Backup & Restore (JSON)</Label>
          <BackupRestore />
        </div>
      </TabsContent>
    </Tabs>
  );
}
