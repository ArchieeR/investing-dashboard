'use client';

import { usePortfolio } from '@/context/PortfolioContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import type { BudgetLimit } from '@/types/portfolio';

function formatGBP(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getProgressColor(pct: number, target: number): string {
  if (target <= 0) return 'bg-primary';
  const diff = Math.abs(pct - target);
  const diffPct = (diff / target) * 100;
  if (diffPct <= 5) return 'bg-[#22C55E]';
  if (diffPct <= 15) return 'bg-[#F59E0B]';
  return 'bg-destructive';
}

interface AllocationRowProps {
  label: string;
  liveValue: number;
  targetAmount: number | undefined;
  targetPercent: number | undefined;
  currentPercent: number;
  onTargetAmountChange: (amount: number | undefined) => void;
  onTargetPercentChange: (percent: number | undefined) => void;
  nested?: boolean;
}

function AllocationRow({
  label,
  liveValue,
  targetAmount,
  targetPercent,
  currentPercent,
  onTargetAmountChange,
  onTargetPercentChange,
  nested,
}: AllocationRowProps) {
  const progressWidth = Math.min(currentPercent, 100);
  const progressColor = getProgressColor(currentPercent, targetPercent ?? 0);

  return (
    <div className={cn('flex items-center gap-3 py-2', nested && 'pl-6')}>
      <GripVertical className="size-3.5 text-[#52525B] shrink-0 cursor-grab" />
      <span className="text-sm text-foreground w-32 truncate">{label}</span>
      <span className="text-xs font-mono text-muted-foreground w-20 text-right shrink-0">
        {formatGBP(liveValue)}
      </span>
      <Input
        type="number"
        placeholder="Amount"
        value={targetAmount ?? ''}
        onChange={(e) => {
          const val = parseFloat(e.target.value);
          onTargetAmountChange(isNaN(val) ? undefined : val);
        }}
        className="h-7 w-24 text-xs font-mono"
      />
      <Input
        type="number"
        placeholder="%"
        value={targetPercent ?? ''}
        onChange={(e) => {
          const val = parseFloat(e.target.value);
          onTargetPercentChange(isNaN(val) ? undefined : val);
        }}
        className="h-7 w-16 text-xs font-mono"
      />
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', progressColor)}
          style={{ width: `${progressWidth}%` }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-12 text-right shrink-0">
        {currentPercent.toFixed(1)}%
      </span>
    </div>
  );
}

export function AllocationManager() {
  const { portfolio, remaining, setBudget, totalValue, targetPortfolioValue } = usePortfolio();

  const sectionData = useMemo(() => {
    return remaining.sections.map((s) => ({
      label: s.label,
      used: s.used,
      percentage: s.percentage,
      budget: portfolio.budgets.sections[s.label],
    }));
  }, [remaining.sections, portfolio.budgets.sections]);

  const themesBySection = useMemo(() => {
    const map = new Map<string, typeof remaining.themes>();
    for (const theme of remaining.themes) {
      const section = theme.section ?? 'Unassigned';
      const existing = map.get(section) ?? [];
      existing.push(theme);
      map.set(section, existing);
    }
    return map;
  }, [remaining.themes]);

  const accountData = useMemo(() => {
    return remaining.accounts.map((a) => ({
      label: a.label,
      used: a.used,
      percentage: a.percentage,
      budget: portfolio.budgets.accounts[a.label],
    }));
  }, [remaining.accounts, portfolio.budgets.accounts]);

  const handleSectionBudgetAmount = useCallback(
    (key: string, amount: number | undefined) => {
      const existing = portfolio.budgets.sections[key];
      const limit: BudgetLimit = { ...existing, amount };
      setBudget('sections', key, limit);
    },
    [portfolio.budgets.sections, setBudget],
  );

  const handleSectionBudgetPercent = useCallback(
    (key: string, percent: number | undefined) => {
      const existing = portfolio.budgets.sections[key];
      const limit: BudgetLimit = { ...existing, percent };
      setBudget('sections', key, limit);
    },
    [portfolio.budgets.sections, setBudget],
  );

  const handleThemeBudgetAmount = useCallback(
    (key: string, amount: number | undefined) => {
      const existing = portfolio.budgets.themes[key];
      const limit: BudgetLimit = { ...existing, amount };
      setBudget('themes', key, limit);
    },
    [portfolio.budgets.themes, setBudget],
  );

  const handleThemeBudgetPercent = useCallback(
    (key: string, percent: number | undefined) => {
      const existing = portfolio.budgets.themes[key];
      const limit: BudgetLimit = { ...existing, percentOfSection: percent };
      setBudget('themes', key, limit);
    },
    [portfolio.budgets.themes, setBudget],
  );

  const handleAccountBudgetAmount = useCallback(
    (key: string, amount: number | undefined) => {
      const existing = portfolio.budgets.accounts[key];
      const limit: BudgetLimit = { ...existing, amount };
      setBudget('accounts', key, limit);
    },
    [portfolio.budgets.accounts, setBudget],
  );

  const handleAccountBudgetPercent = useCallback(
    (key: string, percent: number | undefined) => {
      const existing = portfolio.budgets.accounts[key];
      const limit: BudgetLimit = { ...existing, percent };
      setBudget('accounts', key, limit);
    },
    [portfolio.budgets.accounts, setBudget],
  );

  const runningTotal = useMemo(() => {
    return sectionData.reduce((sum, s) => sum + (s.budget?.percent ?? 0), 0);
  }, [sectionData]);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-foreground">Allocation Manager</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Target: {formatGBP(targetPortfolioValue || totalValue)}</span>
          <span className="text-[#52525B]">|</span>
          <span className={cn('font-mono', runningTotal > 100 ? 'text-destructive' : 'text-foreground')}>
            {runningTotal.toFixed(1)}% allocated
          </span>
        </div>
      </div>

      <Tabs defaultValue="structure">
        <TabsList>
          <TabsTrigger value="structure">Portfolio Structure</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="mt-3">
          <div className="flex flex-col divide-y divide-border">
            {sectionData.map((section) => {
              const themes = themesBySection.get(section.label) ?? [];
              return (
                <div key={section.label}>
                  <AllocationRow
                    label={section.label}
                    liveValue={section.used}
                    targetAmount={section.budget?.amount}
                    targetPercent={section.budget?.percent}
                    currentPercent={section.percentage}
                    onTargetAmountChange={(v) => handleSectionBudgetAmount(section.label, v)}
                    onTargetPercentChange={(v) => handleSectionBudgetPercent(section.label, v)}
                  />
                  {themes.map((theme) => {
                    const themeBudget = portfolio.budgets.themes[theme.label];
                    return (
                      <AllocationRow
                        key={theme.label}
                        label={theme.label}
                        liveValue={theme.used}
                        targetAmount={themeBudget?.amount}
                        targetPercent={themeBudget?.percentOfSection ?? theme.sectionPercentLimit}
                        currentPercent={theme.percentage}
                        onTargetAmountChange={(v) => handleThemeBudgetAmount(theme.label, v)}
                        onTargetPercentChange={(v) => handleThemeBudgetPercent(theme.label, v)}
                        nested
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="accounts" className="mt-3">
          <div className="flex flex-col divide-y divide-border">
            {accountData.map((account) => (
              <AllocationRow
                key={account.label}
                label={account.label}
                liveValue={account.used}
                targetAmount={account.budget?.amount}
                targetPercent={account.budget?.percent}
                currentPercent={account.percentage}
                onTargetAmountChange={(v) => handleAccountBudgetAmount(account.label, v)}
                onTargetPercentChange={(v) => handleAccountBudgetPercent(account.label, v)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
