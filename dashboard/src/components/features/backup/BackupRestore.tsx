'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { usePortfolio } from '@/context/PortfolioContext';
import { toast } from '@/components/shared/Toast';
import { logger } from '@/services/logging';
import { Download, Upload, Loader2, AlertCircle } from 'lucide-react';
import type { AppState, Portfolio } from '@/types/portfolio';

interface BackupMetadata {
  version: number;
  createdAt: string;
  portfolioCount: number;
  totalHoldings: number;
}

interface BackupFile {
  metadata: BackupMetadata;
  data: AppState;
}

function createBackup(allPortfolios: Portfolio[]): BackupFile {
  const totalHoldings = allPortfolios.reduce((sum, p) => sum + p.holdings.length, 0);
  return {
    metadata: {
      version: 1,
      createdAt: new Date().toISOString(),
      portfolioCount: allPortfolios.length,
      totalHoldings,
    },
    data: {
      portfolios: allPortfolios,
      activePortfolioId: allPortfolios[0]?.id ?? '',
      playground: { enabled: false },
      filters: {},
    },
  };
}

function validateBackup(data: unknown): data is BackupFile {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;

  if (!obj.metadata || !obj.data) return false;

  const meta = obj.metadata as Record<string, unknown>;
  if (typeof meta.version !== 'number') return false;

  const state = obj.data as Record<string, unknown>;
  if (!Array.isArray(state.portfolios)) return false;

  return true;
}

export function BackupRestore() {
  const { allPortfolios, restoreFullBackup } = usePortfolio();
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = useCallback(() => {
    setIsExporting(true);
    setError(null);

    try {
      const backup = createBackup(allPortfolios);
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Backup downloaded', 'success');
      logger.info('portfolio', 'Backup created', { portfolioCount: allPortfolios.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Backup failed';
      setError(message);
      toast(message, 'error');
    } finally {
      setIsExporting(false);
    }
  }, [allPortfolios]);

  const handleRestore = useCallback(
    async (file: File) => {
      setError(null);
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);

        if (validateBackup(parsed)) {
          restoreFullBackup(parsed.data);
          toast(
            `Restored ${parsed.metadata.portfolioCount} portfolios with ${parsed.metadata.totalHoldings} holdings`,
            'success',
          );
          logger.info('portfolio', 'Backup restored', {
            portfolioCount: parsed.metadata.portfolioCount,
          });
        } else if (Array.isArray(parsed.portfolios)) {
          // Direct AppState format
          restoreFullBackup(parsed as AppState);
          toast('Backup restored', 'success');
        } else {
          throw new Error('Invalid backup file format');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Restore failed';
        setError(message);
        toast(message, 'error');
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [restoreFullBackup],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={handleBackup}
          disabled={isExporting}
          className="rounded-[4px]"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Backup
        </Button>

        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-[4px]"
        >
          <Upload className="h-4 w-4 mr-2" />
          Restore
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleRestore(file);
          }}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  );
}
