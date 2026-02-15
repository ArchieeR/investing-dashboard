'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type StatusColor = 'green' | 'amber' | 'red' | 'gray';

interface LivePriceStatusProps {
  quoteCount: number;
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

function getStatus(
  lastUpdated: Date | null,
  isLoading: boolean,
  error: string | null,
): StatusColor {
  if (isLoading) return 'amber';
  if (error) return 'red';
  if (!lastUpdated) return 'gray';
  return 'green';
}

function formatTimeSince(date: Date | null): string {
  if (!date) return 'No data';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

const dotColors: Record<StatusColor, string> = {
  green: 'bg-[#22C55E]',
  amber: 'bg-yellow-500',
  red: 'bg-destructive',
  gray: 'bg-muted-foreground/50',
};

export function LivePriceStatus({
  quoteCount,
  lastUpdated,
  isLoading,
  error,
  onRefresh,
}: LivePriceStatusProps) {
  const status = getStatus(lastUpdated, isLoading, error);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full',
              dotColors[status],
              status === 'green' && 'animate-ping opacity-75',
            )}
          />
          <span
            className={cn(
              'relative inline-flex h-2.5 w-2.5 rounded-full',
              dotColors[status],
            )}
          />
        </span>
        <span className="text-xs text-muted-foreground">
          {quoteCount > 0 ? `${quoteCount} quotes` : 'No quotes'}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatTimeSince(lastUpdated)}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
        className="h-7 w-7 p-0"
      >
        <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
      </Button>
    </div>
  );
}
