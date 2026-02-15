'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePortfolio } from '@/context/PortfolioContext';
import { parseDocument } from '@/app/actions/smart-import';
import { diffHoldings, summarizeDiff } from '@/lib/domain/diff';
import type { HoldingDiff, ParseResult } from '@/types/import';
import type { HoldingCsvRow } from '@/lib/domain/csv';
import { toast } from '@/components/shared/Toast';
import { cn } from '@/lib/utils';
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowUpDown,
  Minus,
  Equal,
  FileText,
  Image as ImageIcon,
  X,
  Sparkles,
  Calendar,
} from 'lucide-react';

type Step = 'upload' | 'reviewing' | 'confirm';

const ACCEPT =
  '.csv,.pdf,.xlsx,.xls,.doc,.docx,.png,.jpg,.jpeg,.webp,.gif,image/*,application/pdf,text/csv';

const TYPE_ICONS: Record<string, string> = {
  new: 'text-green-400',
  changed: 'text-amber-400',
  removed: 'text-red-400',
  unchanged: 'text-muted-foreground',
};

function DiffIcon({ type }: { type: HoldingDiff['type'] }) {
  switch (type) {
    case 'new':
      return <Plus className="size-3.5 text-green-400" />;
    case 'changed':
      return <ArrowUpDown className="size-3.5 text-amber-400" />;
    case 'removed':
      return <Minus className="size-3.5 text-red-400" />;
    default:
      return <Equal className="size-3.5 text-muted-foreground" />;
  }
}

function DiffBadge({ type }: { type: HoldingDiff['type'] }) {
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  const variant = type === 'new' ? 'default' : type === 'removed' ? 'destructive' : 'outline';
  return (
    <Badge variant={variant} className="text-[10px] px-1.5 py-0">
      {label}
    </Badge>
  );
}

export function SmartImport() {
  const { portfolio, importHoldings, updateHolding } = usePortfolio();
  const [step, setStep] = useState<Step>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [diffs, setDiffs] = useState<HoldingDiff[]>([]);
  const [statementDate, setStatementDate] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsLoading(true);
      setFileName(file.name);

      try {
        const formData = new FormData();
        formData.append('document', file);

        const result = await parseDocument(formData);

        if (result.error) {
          setError(result.error);
          setIsLoading(false);
          return;
        }

        if (!result.data || result.data.holdings.length === 0) {
          setError('No holdings found in document. Try a clearer image or different format.');
          setIsLoading(false);
          return;
        }

        setParseResult(result.data);

        // Auto-detect date
        if (result.data.statementDate) {
          setStatementDate(result.data.statementDate);
        }

        // Compute diff
        const holdingDiffs = diffHoldings(portfolio.holdings, result.data.holdings);
        setDiffs(holdingDiffs);
        setStep('reviewing');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse document');
      } finally {
        setIsLoading(false);
      }
    },
    [portfolio.holdings],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const toggleDiff = useCallback((index: number) => {
    setDiffs((prev) =>
      prev.map((d, i) => (i === index ? { ...d, accepted: !d.accepted } : d)),
    );
  }, []);

  const handleConfirm = useCallback(() => {
    const accepted = diffs.filter((d) => d.accepted);
    if (accepted.length === 0) {
      toast('No changes selected', 'error');
      return;
    }

    // New holdings → import
    const newRows = accepted
      .filter((d) => d.type === 'new')
      .map((d) => d.extracted);

    if (newRows.length > 0) {
      importHoldings(newRows);
    }

    // Changed holdings → update existing
    const changed = accepted.filter((d) => d.type === 'changed' && d.existing);
    for (const d of changed) {
      if (!d.existing) continue;
      const patch: Partial<{ qty: number; price: number }> = {};
      if (d.changes?.qty) patch.qty = d.changes.qty.new;
      if (d.changes?.price) patch.price = d.changes.price.new;
      updateHolding(d.existing.id, patch);
    }

    const count = newRows.length + changed.length;
    toast(`Applied ${count} change${count !== 1 ? 's' : ''} to portfolio`, 'success');
    handleReset();
  }, [diffs, importHoldings, updateHolding]);

  const handleReset = useCallback(() => {
    setStep('upload');
    setDiffs([]);
    setParseResult(null);
    setError(null);
    setFileName('');
    setStatementDate('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const summary = diffs.length > 0 ? summarizeDiff(diffs) : null;
  const acceptedCount = diffs.filter((d) => d.accepted).length;

  // ── Upload Step ──
  if (step === 'upload') {
    return (
      <div className="space-y-4">
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50',
            isLoading && 'pointer-events-none opacity-60',
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ACCEPT}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          {isLoading ? (
            <>
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
              <p className="font-medium text-foreground mb-1">
                Analyzing {fileName}...
              </p>
              <p className="text-xs text-muted-foreground">
                AI is extracting holdings from your document
              </p>
            </>
          ) : (
            <>
              <div className="rounded-full bg-secondary p-4 mb-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium text-foreground mb-1">
                Drop any document or click to browse
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <Badge variant="outline" className="text-[10px]">
                  <ImageIcon className="size-2.5 mr-1" />
                  Screenshots
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  <FileText className="size-2.5 mr-1" />
                  PDF
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  CSV / Excel
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  Word
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                AI-powered — works with brokerage statements, screenshots, exports
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="size-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>
    );
  }

  // ── Review Step ──
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-green-400" />
          <span className="text-sm font-medium">
            Found {parseResult?.holdings.length ?? 0} holdings
          </span>
          {parseResult?.provider && (
            <Badge variant="outline" className="text-[10px]">
              {parseResult.provider}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <X className="size-4 mr-1" />
          Clear
        </Button>
      </div>

      {/* Statement date */}
      <div className="flex items-center gap-3">
        <Calendar className="size-4 text-muted-foreground" />
        <Label className="text-xs text-muted-foreground">Statement date</Label>
        <Input
          type="date"
          className="w-[160px] h-8 text-xs"
          value={statementDate}
          onChange={(e) => setStatementDate(e.target.value)}
        />
      </div>

      {/* Summary pills */}
      {summary && (
        <div className="flex flex-wrap gap-2">
          {summary.newCount > 0 && (
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
              +{summary.newCount} new
            </Badge>
          )}
          {summary.changedCount > 0 && (
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
              {summary.changedCount} changed
            </Badge>
          )}
          {summary.removedCount > 0 && (
            <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
              {summary.removedCount} not found
            </Badge>
          )}
          {summary.unchangedCount > 0 && (
            <Badge variant="outline" className="text-muted-foreground">
              {summary.unchangedCount} unchanged
            </Badge>
          )}
        </div>
      )}

      {/* Diff table */}
      <ScrollArea className="h-[400px] border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead>Ticker</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="w-16">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {diffs.map((diff, i) => (
              <TableRow
                key={i}
                className={cn(
                  diff.type === 'unchanged' && 'opacity-40',
                  !diff.accepted && diff.type !== 'unchanged' && 'opacity-50',
                )}
              >
                <TableCell>
                  {diff.type !== 'unchanged' && (
                    <Checkbox
                      checked={diff.accepted}
                      onCheckedChange={() => toggleDiff(i)}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <DiffIcon type={diff.type} />
                </TableCell>
                <TableCell className="font-mono text-xs text-cyan-400">
                  {diff.extracted.ticker}
                </TableCell>
                <TableCell className="text-sm truncate max-w-[200px]">
                  {diff.extracted.name}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {diff.extracted.assetType}
                </TableCell>
                <TableCell className="font-mono text-xs text-right">
                  {diff.type === 'changed' && diff.changes?.qty ? (
                    <span>
                      <span className="text-muted-foreground line-through mr-1">
                        {diff.changes.qty.old}
                      </span>
                      <span className={TYPE_ICONS[diff.type]}>
                        {diff.changes.qty.new}
                      </span>
                    </span>
                  ) : (
                    diff.extracted.qty.toLocaleString()
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs text-right">
                  {diff.type === 'changed' && diff.changes?.price ? (
                    <span>
                      <span className="text-muted-foreground line-through mr-1">
                        {diff.changes.price.old.toFixed(2)}
                      </span>
                      <span className={TYPE_ICONS[diff.type]}>
                        {diff.changes.price.new.toFixed(2)}
                      </span>
                    </span>
                  ) : (
                    diff.extracted.price.toFixed(2)
                  )}
                </TableCell>
                <TableCell>
                  <DiffBadge type={diff.type} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {acceptedCount} change{acceptedCount !== 1 ? 's' : ''} selected
        </span>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="rounded-[4px]">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={acceptedCount === 0}
            className="rounded-[4px]"
          >
            <CheckCircle2 className="size-4 mr-2" />
            Apply {acceptedCount} Change{acceptedCount !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}
