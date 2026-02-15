'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
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
import { parseHoldingsCsv, type HoldingCsvRow } from '@/lib/domain/csv';
import { toast } from '@/components/shared/Toast';
import { Upload, CheckCircle2, AlertCircle, FileSpreadsheet, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type DetectedFormat = 'Spec' | 'Interactive Investor' | 'Hargreaves Lansdown' | 'Unknown';

interface ParseResult {
  rows: HoldingCsvRow[];
  format: DetectedFormat;
  errors: string[];
}

function detectFormat(csv: string): DetectedFormat {
  const firstLine = csv.split(/\r?\n/).find((l) => l.trim().length > 0) ?? '';
  if (firstLine.startsWith('section,theme,assetType')) return 'Spec';
  const lower = firstLine.toLowerCase();
  if (lower.includes('symbol') && lower.includes('name') && lower.includes('qty')) return 'Interactive Investor';
  if (lower.includes('code') || lower.includes('stock')) return 'Hargreaves Lansdown';
  return 'Unknown';
}

export function CSVImport() {
  const { importHoldings } = usePortfolio();
  const [result, setResult] = useState<ParseResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const format = detectFormat(text);
      const rows = parseHoldingsCsv(text);
      setResult({ rows, format, errors: [] });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse CSV';
      setResult({ rows: [], format: 'Unknown', errors: [message] });
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleImport = useCallback(() => {
    if (!result || result.rows.length === 0) return;
    importHoldings(result.rows);
    toast(`Imported ${result.rows.length} holdings`, 'success');
    setResult(null);
  }, [result, importHoldings]);

  const handleReset = useCallback(() => {
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  return (
    <div className="space-y-4">
      {!result ? (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50',
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <div className="rounded-full bg-secondary p-4 mb-3">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground mb-1">
            Drop CSV file here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Supports Spec, Interactive Investor, and Hargreaves Lansdown formats
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {result.errors.length === 0 && result.rows.length > 0 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  <span className="text-sm font-medium text-[#22C55E]">
                    Parsed {result.rows.length} holdings
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">
                    {result.errors[0] ?? 'No holdings found'}
                  </span>
                </>
              )}
              <span className="text-xs text-muted-foreground ml-2">
                Format: {result.format}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>

          {/* Preview table */}
          {result.rows.length > 0 && (
            <ScrollArea className="h-[300px] border border-border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs text-cyan-400">
                        {row.ticker}
                      </TableCell>
                      <TableCell className="text-sm truncate max-w-[200px]">
                        {row.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.assetType}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-right">
                        {row.qty.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-right">
                        {row.price.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}

          {/* Import action */}
          {result.rows.length > 0 && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleReset} className="rounded-[4px]">
                Cancel
              </Button>
              <Button onClick={handleImport} className="rounded-[4px]">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Import {result.rows.length} Holdings
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
