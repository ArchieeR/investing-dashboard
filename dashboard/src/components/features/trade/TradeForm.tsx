'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePortfolio } from '@/context/PortfolioContext';
import type { TradeType } from '@/types/portfolio';

interface TradeFormProps {
  children?: React.ReactNode;
  defaultHoldingId?: string;
}

export function TradeForm({ children, defaultHoldingId }: TradeFormProps) {
  const { portfolio, recordTrade } = usePortfolio();
  const [open, setOpen] = useState(false);
  const [holdingId, setHoldingId] = useState(defaultHoldingId ?? '');
  const [tradeType, setTradeType] = useState<TradeType>('buy');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');

  const holdings = portfolio.holdings.filter((h) => h.assetType !== 'Cash');
  const selectedHolding = useMemo(
    () => holdings.find((h) => h.id === holdingId),
    [holdings, holdingId],
  );

  const parsedPrice = Number.parseFloat(price);
  const parsedQty = Number.parseFloat(qty);
  const totalValue = Number.isFinite(parsedPrice) && Number.isFinite(parsedQty)
    ? parsedPrice * parsedQty
    : 0;

  const maxSellQty = selectedHolding?.qty ?? 0;
  const isValid =
    holdingId !== '' &&
    Number.isFinite(parsedPrice) &&
    parsedPrice > 0 &&
    Number.isFinite(parsedQty) &&
    parsedQty > 0 &&
    (tradeType === 'buy' || parsedQty <= maxSellQty);

  const handleSubmit = () => {
    if (!isValid) return;
    recordTrade(holdingId, {
      type: tradeType,
      date,
      price: parsedPrice,
      qty: parsedQty,
    });
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setHoldingId(defaultHoldingId ?? '');
    setTradeType('buy');
    setDate(new Date().toISOString().slice(0, 10));
    setPrice('');
    setQty('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        {children ?? <Button className="rounded-[4px]">Record Trade</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Trade</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Holding selector */}
          <div className="space-y-1.5">
            <Label className="text-[#52525B]">Holding</Label>
            <Select value={holdingId} onValueChange={setHoldingId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a holding" />
              </SelectTrigger>
              <SelectContent>
                {holdings.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    <span className="font-mono text-xs">{h.ticker}</span>
                    {h.name && <span className="ml-2 text-muted-foreground">{h.name}</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trade type toggle */}
          <div className="space-y-1.5">
            <Label className="text-[#52525B]">Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={tradeType === 'buy' ? 'default' : 'outline'}
                className="flex-1 rounded-[4px]"
                onClick={() => setTradeType('buy')}
              >
                Buy
              </Button>
              <Button
                type="button"
                variant={tradeType === 'sell' ? 'default' : 'outline'}
                className="flex-1 rounded-[4px]"
                onClick={() => setTradeType('sell')}
              >
                Sell
              </Button>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label className="text-[#52525B]">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Price per unit */}
          <div className="space-y-1.5">
            <Label className="text-[#52525B]">Price per unit</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <Label className="text-[#52525B]">Quantity</Label>
            <Input
              type="number"
              step="any"
              min="0"
              max={tradeType === 'sell' ? maxSellQty : undefined}
              placeholder="0"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
            {tradeType === 'sell' && selectedHolding && (
              <p className="text-xs text-muted-foreground">
                Available: {maxSellQty.toLocaleString()}
              </p>
            )}
            {tradeType === 'sell' && parsedQty > maxSellQty && (
              <p className="text-xs text-destructive">
                Cannot sell more than held quantity
              </p>
            )}
          </div>

          {/* Total value */}
          {totalValue > 0 && (
            <div className="rounded-lg bg-secondary px-4 py-3">
              <p className="text-xs text-muted-foreground">Total value</p>
              <p className="text-lg font-mono font-semibold text-foreground">
                {totalValue.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-[4px]">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid} className="rounded-[4px]">
            {tradeType === 'buy' ? 'Record Buy' : 'Record Sell'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
