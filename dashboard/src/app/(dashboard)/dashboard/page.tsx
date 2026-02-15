'use client';

import { PortfolioProvider } from '@/context/PortfolioContext';
import { DashboardLayoutProvider } from '@/context/DashboardLayoutContext';
import { PortfolioSwitcher } from '@/components/features/portfolio/PortfolioSwitcher';
import { PortfolioHero } from '@/components/features/dashboard/PortfolioHero';
import { DashboardGrid } from '@/components/features/dashboard/DashboardGrid';
import { AddWidgetDialog } from '@/components/features/dashboard/AddWidgetDialog';
import { useDashboardLayout } from '@/context/DashboardLayoutContext';
import { RotateCcw } from 'lucide-react';

function DashboardContent() {
  const { resetLayout } = useDashboardLayout();

  return (
    <div className="flex flex-col gap-6">
      <PortfolioSwitcher />
      <PortfolioHero />

      {/* Widget toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AddWidgetDialog />
          <button
            onClick={resetLayout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg border border-border hover:border-primary/50 transition-colors"
            title="Reset to default layout"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/50">
          Drag to reorder • Hover for resize/remove
        </p>
      </div>

      {/* Widget grid */}
      <DashboardGrid />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <PortfolioProvider>
      <DashboardLayoutProvider>
        <DashboardContent />
      </DashboardLayoutProvider>
    </PortfolioProvider>
  );
}
