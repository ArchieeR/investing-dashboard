'use client';

import { cn } from '@/lib/utils';

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded bg-secondary',
        className,
      )}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-4 space-y-3', className)}>
      <Shimmer className="h-5 w-1/3" />
      <Shimmer className="h-8 w-1/2" />
      <Shimmer className="h-4 w-2/3" />
    </div>
  );
}

export function SkeletonTableRow({ columns = 5, className }: { columns?: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 px-4 py-3 border-b border-border', className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Shimmer key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-4 space-y-4', className)}>
      <div className="flex justify-between">
        <Shimmer className="h-5 w-24" />
        <Shimmer className="h-5 w-16" />
      </div>
      <Shimmer className="h-48 w-full" />
    </div>
  );
}
