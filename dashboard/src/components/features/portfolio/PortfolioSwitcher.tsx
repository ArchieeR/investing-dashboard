'use client';

import { usePortfolio } from '@/context/PortfolioContext';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCallback, useRef, useState } from 'react';

export function PortfolioSwitcher() {
  const {
    portfolios,
    portfolio,
    setActivePortfolio,
    addPortfolio,
    renamePortfolio,
    removePortfolio,
    createDraftPortfolio,
    promoteDraftToActual,
    allPortfolios,
  } = usePortfolio();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = useCallback(
    (id: string, name: string) => {
      setEditingId(id);
      setEditName(name);
      setTimeout(() => inputRef.current?.select(), 0);
    },
    [],
  );

  const handleRenameConfirm = useCallback(() => {
    if (editingId && editName.trim()) {
      renamePortfolio(editingId, editName.trim());
    }
    setEditingId(null);
  }, [editingId, editName, renamePortfolio]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleRenameConfirm();
      if (e.key === 'Escape') setEditingId(null);
    },
    [handleRenameConfirm],
  );

  const handleAddPortfolio = useCallback(() => {
    addPortfolio();
  }, [addPortfolio]);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {portfolios.map((p) => {
        const isActive = p.id === portfolio.id;
        const isDraft = p.type === 'draft';
        const holdingsCount =
          allPortfolios.find((ap) => ap.id === p.id)?.holdings.length ?? 0;

        return (
          <DropdownMenu key={p.id}>
            <DropdownMenuTrigger asChild>
              <button
                onClick={() => setActivePortfolio(p.id)}
                onDoubleClick={() => handleDoubleClick(p.id, p.name)}
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
                  isDraft && 'border border-dashed border-border',
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80',
                )}
              >
                {editingId === p.id ? (
                  <input
                    ref={inputRef}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleRenameConfirm}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent outline-none w-24 text-inherit"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <span>{p.name}</span>
                    {isDraft && (
                      <span className="text-xs opacity-70">Draft</span>
                    )}
                  </>
                )}
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {holdingsCount}
                </Badge>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={() => handleDoubleClick(p.id, p.name)}>
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => createDraftPortfolio(p.id)}>
                Create Draft
              </DropdownMenuItem>
              {isDraft && (
                <DropdownMenuItem onSelect={() => promoteDraftToActual(p.id)}>
                  Promote Draft
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => removePortfolio(p.id)}
                disabled={portfolios.length <= 1}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleAddPortfolio}
        className="shrink-0"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
