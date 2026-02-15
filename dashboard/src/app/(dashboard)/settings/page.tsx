'use client';

import { useState } from 'react';
import { PortfolioProvider, usePortfolio } from '@/context/PortfolioContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SmartImport } from '@/components/features/import/SmartImport';
import { holdingsToCsv } from '@/lib/domain/csv';
import type { HoldingCsvRow } from '@/lib/domain/csv';
import type { Exchange, AssetType } from '@/types/portfolio';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Database, Settings, BarChart3, Layers } from 'lucide-react';

function DataTab() {
  const { portfolio } = usePortfolio();

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
    <div className="space-y-8">
      {/* Smart Import */}
      <SmartImport />

      {/* Export */}
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
    </div>
  );
}

function SettingsContent() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your portfolio configuration and import data.
        </p>
      </div>

      <Tabs defaultValue="data" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="data">
            <Database className="h-3.5 w-3.5 mr-1 hidden md:inline" />
            Data
          </TabsTrigger>
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
        </TabsList>

        <TabsContent value="data" className="pt-4">
          <DataTab />
        </TabsContent>

        <TabsContent value="general" className="pt-4">
          <SettingsGeneral />
        </TabsContent>

        <TabsContent value="exchanges" className="pt-4">
          <SettingsExchanges />
        </TabsContent>

        <TabsContent value="asset-types" className="pt-4">
          <SettingsAssetTypes />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Re-use logic from SettingsPanel but in standalone tab content
function SettingsGeneral() {
  const { portfolio, updatePortfolioSettings } = usePortfolio();
  const { settings } = portfolio;
  const [lockedTotalInput, setLockedTotalInput] = useState(
    settings.lockedTotal?.toString() ?? '',
  );

  return (
    <div className="space-y-6">
      {/* Currency */}
      <div className="space-y-1.5">
        <Label className="text-[#52525B]">Base Currency</Label>
        <select
          value={settings.currency}
          onChange={(e) => updatePortfolioSettings({ currency: e.target.value })}
          className="flex h-9 w-[120px] items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          <option value="GBP">GBP</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
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
            <input
              type="number"
              step="100"
              min="0"
              className="flex h-9 w-[160px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
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
            <select
              value={String(settings.livePriceUpdateInterval)}
              onChange={(e) =>
                updatePortfolioSettings({ livePriceUpdateInterval: Number(e.target.value) })
              }
              className="flex h-9 w-[100px] items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              {[1, 2, 5, 10, 15, 30, 60].map((i) => (
                <option key={i} value={String(i)}>
                  {i} min
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

const EXCHANGES: Exchange[] = ['LSE', 'NYSE', 'NASDAQ', 'AMS', 'XETRA', 'XC', 'VI', 'Other'];
const ASSET_TYPES: AssetType[] = ['ETF', 'Stock', 'Crypto', 'Cash', 'Bond', 'Fund', 'Other'];

function SettingsExchanges() {
  const [enabled, setEnabled] = useState<Set<Exchange>>(new Set(EXCHANGES));

  const toggle = (exchange: Exchange) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(exchange)) next.delete(exchange);
      else next.add(exchange);
      return next;
    });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {EXCHANGES.map((exchange) => (
        <div
          key={exchange}
          className="flex items-center gap-2 rounded-lg border border-border bg-card p-3"
        >
          <Checkbox
            id={`exchange-${exchange}`}
            checked={enabled.has(exchange)}
            onCheckedChange={() => toggle(exchange)}
          />
          <Label htmlFor={`exchange-${exchange}`} className="text-sm font-mono">
            {exchange}
          </Label>
        </div>
      ))}
    </div>
  );
}

function SettingsAssetTypes() {
  const [enabled, setEnabled] = useState<Set<AssetType>>(new Set(ASSET_TYPES));

  const toggle = (type: AssetType) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {ASSET_TYPES.map((type) => (
        <div
          key={type}
          className="flex items-center gap-2 rounded-lg border border-border bg-card p-3"
        >
          <Checkbox
            id={`asset-${type}`}
            checked={enabled.has(type)}
            onCheckedChange={() => toggle(type)}
          />
          <Label htmlFor={`asset-${type}`} className="text-sm">
            {type}
          </Label>
        </div>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <PortfolioProvider>
      <SettingsContent />
    </PortfolioProvider>
  );
}
