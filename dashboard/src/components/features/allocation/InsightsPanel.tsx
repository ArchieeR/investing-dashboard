'use client';

import { usePortfolio } from '@/context/PortfolioContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, GripVertical } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { BudgetLimit, Lists } from '@/types/portfolio';

function formatGBP(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

type ListDomain = Exclude<keyof Lists, 'themeSections'>;

interface InsightCardProps {
  title: string;
  domain: ListDomain;
  budgetDomain: 'sections' | 'accounts' | 'themes';
  items: string[];
  budgets: Record<string, BudgetLimit>;
  remaining: Array<{ label: string; used: number; percentage: number }>;
}

function InsightCard({ title, domain, budgetDomain, items, budgets, remaining }: InsightCardProps) {
  const { setBudget, renameListItem, removeListItem } = usePortfolio();
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleRenameBlur = useCallback(
    (original: string) => {
      if (editValue.trim() && editValue.trim() !== original) {
        renameListItem(domain, original, editValue.trim());
      }
      setEditingItem(null);
    },
    [editValue, domain, renameListItem],
  );

  const handleBudgetChange = useCallback(
    (key: string, amount: string) => {
      const num = parseFloat(amount);
      if (!amount || isNaN(num)) {
        setBudget(budgetDomain, key, undefined);
      } else {
        setBudget(budgetDomain, key, { ...budgets[key], amount: num });
      }
    },
    [budgetDomain, budgets, setBudget],
  );

  const handleDelete = useCallback(
    (item: string) => {
      if (confirmDelete === item) {
        removeListItem(domain, item);
        setConfirmDelete(null);
      } else {
        setConfirmDelete(item);
      }
    },
    [confirmDelete, domain, removeListItem],
  );

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-[#52525B] uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const budgetEntry = budgets[item];
          const remainingEntry = remaining.find((r) => r.label === item);
          return (
            <div
              key={item}
              className="flex items-center gap-2 group"
            >
              <GripVertical className="size-3.5 text-[#52525B] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
              {editingItem === item ? (
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleRenameBlur(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameBlur(item);
                    if (e.key === 'Escape') setEditingItem(null);
                  }}
                  className="h-7 text-sm flex-1"
                  autoFocus
                />
              ) : (
                <span
                  className="text-sm text-foreground flex-1 truncate cursor-text"
                  onClick={() => {
                    setEditingItem(item);
                    setEditValue(item);
                  }}
                >
                  {item}
                </span>
              )}
              <span className="text-xs font-mono text-muted-foreground shrink-0">
                {remainingEntry ? formatGBP(remainingEntry.used) : '--'}
              </span>
              <Input
                type="number"
                placeholder="Budget"
                value={budgetEntry?.amount ?? ''}
                onChange={(e) => handleBudgetChange(item, e.target.value)}
                className="h-7 w-20 text-xs font-mono"
              />
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleDelete(item)}
                className={confirmDelete === item ? 'text-destructive' : 'text-muted-foreground'}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">No items</p>
        )}
      </div>
    </div>
  );
}

export function InsightsPanel() {
  const { portfolio, budgets, remaining } = usePortfolio();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <InsightCard
        title="Sections"
        domain="sections"
        budgetDomain="sections"
        items={portfolio.lists.sections}
        budgets={budgets.sections}
        remaining={remaining.sections}
      />
      <InsightCard
        title="Themes"
        domain="themes"
        budgetDomain="themes"
        items={portfolio.lists.themes}
        budgets={budgets.themes}
        remaining={remaining.themes}
      />
      <InsightCard
        title="Accounts"
        domain="accounts"
        budgetDomain="accounts"
        items={portfolio.lists.accounts}
        budgets={budgets.accounts}
        remaining={remaining.accounts}
      />
    </div>
  );
}
