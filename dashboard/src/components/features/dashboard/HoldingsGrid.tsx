'use client';

import { usePortfolio } from '@/context/PortfolioContext';
import type { HoldingDerived } from '@/lib/domain/selectors';
import type { Holding, VisibleColumns } from '@/types/portfolio';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type GroupingState,
  type ExpandedState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Copy,
  Trash2,
  BarChart3,
} from 'lucide-react';
import { useCallback, useMemo, useState, useRef, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatGBP(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPct(value: number | undefined): string {
  if (value === undefined) return '--';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatChange(value: number | undefined): string {
  if (value === undefined) return '--';
  return `${value >= 0 ? '+' : ''}${formatGBP(value)}`;
}

// ---------------------------------------------------------------------------
// Inline editable cell
// ---------------------------------------------------------------------------

interface EditableCellProps {
  value: string | number;
  onSave: (value: string) => void;
  type?: 'text' | 'number';
  className?: string;
}

function EditableCell({ value, onSave, type = 'text', className }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.select();
    }
  }, [editing]);

  const handleConfirm = useCallback(() => {
    setEditing(false);
    if (draft !== String(value)) {
      onSave(draft);
    }
  }, [draft, value, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleConfirm();
      }
      if (e.key === 'Escape') {
        setDraft(String(value));
        setEditing(false);
      }
    },
    [handleConfirm, value],
  );

  if (editing) {
    return (
      <Input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleConfirm}
        onKeyDown={handleKeyDown}
        className="h-6 w-full text-xs font-mono px-1"
      />
    );
  }

  return (
    <span
      className={cn('cursor-text', className)}
      onClick={() => {
        setDraft(String(value));
        setEditing(true);
      }}
    >
      {value}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Grid mode
// ---------------------------------------------------------------------------

export type GridMode = 'monitor' | 'editor';

interface HoldingsGridProps {
  mode?: GridMode;
}

// ---------------------------------------------------------------------------
// Sort icon helper
// ---------------------------------------------------------------------------

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <ArrowUp className="size-3" />;
  if (sorted === 'desc') return <ArrowDown className="size-3" />;
  return <ArrowUpDown className="size-3 opacity-40" />;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HoldingsGrid({ mode = 'monitor' }: HoldingsGridProps) {
  const {
    derivedHoldings,
    portfolio,
    filters,
    setFilter,
    updateHolding,
    deleteHolding,
    duplicateHolding,
  } = usePortfolio();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>(true);
  const visibleColumns = portfolio.settings.visibleColumns;

  // Filter data by current filters
  const filteredData = useMemo(() => {
    return derivedHoldings.filter((dh) => {
      if (filters.section && dh.holding.section !== filters.section) return false;
      if (filters.theme && dh.holding.theme !== filters.theme) return false;
      if (filters.account && dh.holding.account !== filters.account) return false;
      return true;
    });
  }, [derivedHoldings, filters]);

  // Callbacks for inline editing
  const handleUpdateField = useCallback(
    (id: string, field: keyof Holding, raw: string) => {
      const numFields = ['price', 'qty', 'targetPct', 'avgCost'] as const;
      if ((numFields as readonly string[]).includes(field)) {
        const num = parseFloat(raw);
        if (!isNaN(num)) {
          updateHolding(id, { [field]: num });
        }
      } else {
        updateHolding(id, { [field]: raw });
      }
    },
    [updateHolding],
  );

  const handleToggleInclude = useCallback(
    (id: string, current: boolean) => {
      updateHolding(id, { include: !current });
    },
    [updateHolding],
  );

  // Column definitions
  const columns = useMemo(() => {
    const cols: ColumnDef<HoldingDerived, unknown>[] = [];

    const vc = visibleColumns;
    const isEditor = mode === 'editor';

    // Monitor columns
    if (!isEditor) {
      cols.push({
        accessorFn: (row) => row.holding.ticker,
        id: 'ticker',
        header: 'Ticker',
        cell: ({ getValue }) => (
          <span className="font-mono text-[#22D3EE]">{getValue<string>()}</span>
        ),
      });
      cols.push({
        accessorFn: (row) => row.holding.name,
        id: 'name',
        header: 'Name',
        cell: ({ getValue }) => (
          <span className="text-foreground truncate max-w-[200px] inline-block">{getValue<string>()}</span>
        ),
      });
      if (vc.livePrice) {
        cols.push({
          accessorFn: (row) => row.holding.livePrice ?? row.holding.price,
          id: 'livePrice',
          header: 'Price',
          cell: ({ getValue }) => (
            <span className="font-mono">{formatGBP(getValue<number>())}</span>
          ),
        });
      }
      cols.push({
        accessorFn: (row) => row.holding.qty,
        id: 'qty',
        header: 'Qty',
        cell: ({ getValue }) => <span className="font-mono">{getValue<number>()}</span>,
      });
      if (vc.dayChange) {
        cols.push({
          accessorFn: (row) => row.holding.dayChange ?? 0,
          id: 'dayChange',
          header: 'Day Chg',
          cell: ({ getValue }) => {
            const v = getValue<number>();
            return (
              <span className={cn('font-mono', v >= 0 ? 'text-[#22C55E]' : 'text-destructive')}>
                {formatChange(v)}
              </span>
            );
          },
        });
      }
      if (vc.dayChangePercent) {
        cols.push({
          accessorFn: (row) => row.holding.dayChangePercent ?? 0,
          id: 'dayChangePercent',
          header: 'Day %',
          cell: ({ getValue }) => {
            const v = getValue<number>();
            return (
              <span className={cn('font-mono', v >= 0 ? 'text-[#22C55E]' : 'text-destructive')}>
                {formatPct(v)}
              </span>
            );
          },
        });
      }
      cols.push({
        accessorFn: (row) => row.liveValue,
        id: 'liveValue',
        header: 'Value',
        cell: ({ getValue }) => (
          <span className="font-mono">{formatGBP(getValue<number>())}</span>
        ),
      });
      return cols;
    }

    // Editor columns
    if (vc.section) {
      cols.push({
        accessorFn: (row) => row.holding.section,
        id: 'section',
        header: 'Section',
        cell: ({ row: r }) => (
          <EditableCell
            value={r.original.holding.section}
            onSave={(v) => handleUpdateField(r.original.holding.id, 'section', v)}
          />
        ),
        enableGrouping: true,
      });
    }
    if (vc.theme) {
      cols.push({
        accessorFn: (row) => row.holding.theme,
        id: 'theme',
        header: 'Theme',
        cell: ({ row: r }) => (
          <EditableCell
            value={r.original.holding.theme}
            onSave={(v) => handleUpdateField(r.original.holding.id, 'theme', v)}
          />
        ),
        enableGrouping: true,
      });
    }
    if (vc.assetType) {
      cols.push({
        accessorFn: (row) => row.holding.assetType,
        id: 'assetType',
        header: 'Type',
        cell: ({ getValue }) => <span className="text-xs">{getValue<string>()}</span>,
      });
    }
    if (vc.name) {
      cols.push({
        accessorFn: (row) => row.holding.name,
        id: 'name',
        header: 'Name',
        cell: ({ row: r }) => (
          <EditableCell
            value={r.original.holding.name}
            onSave={(v) => handleUpdateField(r.original.holding.id, 'name', v)}
          />
        ),
      });
    }
    if (vc.ticker) {
      cols.push({
        accessorFn: (row) => row.holding.ticker,
        id: 'ticker',
        header: 'Ticker',
        cell: ({ row: r }) => (
          <EditableCell
            value={r.original.holding.ticker}
            onSave={(v) => handleUpdateField(r.original.holding.id, 'ticker', v)}
            className="font-mono text-[#22D3EE]"
          />
        ),
      });
    }
    if (vc.exchange) {
      cols.push({
        accessorFn: (row) => row.holding.exchange,
        id: 'exchange',
        header: 'Exch',
        cell: ({ getValue }) => <span className="text-xs">{getValue<string>()}</span>,
      });
    }
    if (vc.account) {
      cols.push({
        accessorFn: (row) => row.holding.account,
        id: 'account',
        header: 'Account',
        cell: ({ row: r }) => (
          <EditableCell
            value={r.original.holding.account}
            onSave={(v) => handleUpdateField(r.original.holding.id, 'account', v)}
          />
        ),
        enableGrouping: true,
      });
    }
    if (vc.livePrice) {
      cols.push({
        accessorFn: (row) => row.holding.livePrice ?? row.holding.price,
        id: 'livePrice',
        header: 'Price',
        cell: ({ getValue }) => (
          <span className="font-mono">{formatGBP(getValue<number>())}</span>
        ),
      });
    }
    if (vc.qty) {
      cols.push({
        accessorFn: (row) => row.holding.qty,
        id: 'qty',
        header: 'Qty',
        cell: ({ row: r }) => (
          <EditableCell
            value={r.original.holding.qty}
            onSave={(v) => handleUpdateField(r.original.holding.id, 'qty', v)}
            type="number"
            className="font-mono"
          />
        ),
      });
    }
    if (vc.liveValue) {
      cols.push({
        accessorFn: (row) => row.liveValue,
        id: 'liveValue',
        header: 'Value',
        cell: ({ getValue }) => (
          <span className="font-mono">{formatGBP(getValue<number>())}</span>
        ),
      });
    }
    if (vc.pctOfTheme) {
      cols.push({
        accessorFn: (row) => row.pctOfTheme,
        id: 'pctOfTheme',
        header: '% Theme',
        cell: ({ getValue }) => (
          <span className="font-mono text-muted-foreground">{getValue<number>().toFixed(1)}%</span>
        ),
      });
    }
    if (vc.targetPct) {
      cols.push({
        accessorFn: (row) => row.holding.targetPct,
        id: 'targetPct',
        header: 'Target %',
        cell: ({ row: r }) => (
          <EditableCell
            value={r.original.holding.targetPct ?? ''}
            onSave={(v) => handleUpdateField(r.original.holding.id, 'targetPct', v)}
            type="number"
            className="font-mono"
          />
        ),
      });
    }
    if (vc.targetDelta) {
      cols.push({
        accessorFn: (row) => row.targetPctDiff,
        id: 'targetDelta',
        header: 'Delta',
        cell: ({ getValue }) => {
          const v = getValue<number | undefined>();
          if (v === undefined) return <span className="text-[#52525B]">--</span>;
          return (
            <span className={cn('font-mono', v >= 0 ? 'text-[#22C55E]' : 'text-destructive')}>
              {formatPct(v)}
            </span>
          );
        },
      });
    }
    if (vc.include) {
      cols.push({
        accessorFn: (row) => row.holding.include,
        id: 'include',
        header: 'Incl',
        cell: ({ row: r }) => (
          <Checkbox
            checked={r.original.holding.include}
            onCheckedChange={() =>
              handleToggleInclude(r.original.holding.id, r.original.holding.include)
            }
          />
        ),
      });
    }
    if (vc.actions) {
      cols.push({
        id: 'actions',
        header: '',
        cell: ({ row: r }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs">
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => {/* Record Trade - placeholder */ }}>
                <BarChart3 className="size-3.5" />
                Record Trade
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => duplicateHolding(r.original.holding.id)}>
                <Copy className="size-3.5" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => deleteHolding(r.original.holding.id)}
              >
                <Trash2 className="size-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        enableSorting: false,
      });
    }

    return cols;
  }, [mode, visibleColumns, handleUpdateField, handleToggleInclude, duplicateHolding, deleteHolding]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, grouping, expanded },
    onSortingChange: setSorting,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.holding.id,
    autoResetPageIndex: false,
  });

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Filter toolbar */}
      {mode === 'editor' && (
        <div className="flex items-center gap-2 p-3 border-b border-border">
          <FilterSelect
            label="Section"
            value={filters.section}
            options={portfolio.lists.sections}
            onChange={(v) => setFilter('section', v)}
          />
          <FilterSelect
            label="Theme"
            value={filters.theme}
            options={portfolio.lists.themes}
            onChange={(v) => setFilter('theme', v)}
          />
          <FilterSelect
            label="Account"
            value={filters.account}
            options={portfolio.lists.accounts}
            onChange={(v) => setFilter('account', v)}
          />
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant={grouping.includes('theme') ? 'secondary' : 'ghost'}
              size="xs"
              onClick={() =>
                setGrouping((prev) =>
                  prev.includes('theme')
                    ? prev.filter((g) => g !== 'theme')
                    : [...prev, 'theme'],
                )
              }
            >
              Group: Theme
            </Button>
            <Button
              variant={grouping.includes('account') ? 'secondary' : 'ghost'}
              size="xs"
              onClick={() =>
                setGrouping((prev) =>
                  prev.includes('account')
                    ? prev.filter((g) => g !== 'account')
                    : [...prev, 'account'],
                )
              }
            >
              Group: Account
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="text-[#52525B] font-mono text-xs cursor-pointer select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-1">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      <SortIcon sorted={header.column.getIsSorted()} />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No holdings
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => {
              if (row.getIsGrouped()) {
                return (
                  <TableRow
                    key={row.id}
                    className="bg-secondary/50 cursor-pointer"
                    onClick={row.getToggleExpandedHandler()}
                  >
                    <TableCell colSpan={columns.length} className="font-medium text-sm">
                      {row.groupingValue as string} ({row.subRows.length})
                    </TableCell>
                  </TableRow>
                );
              }

              return (
                <TableRow
                  key={row.id}
                  className="hover:bg-secondary transition-colors duration-150"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-sm">
                      {cell.getIsAggregated()
                        ? null
                        : cell.getIsPlaceholder()
                          ? null
                          : flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter select helper
// ---------------------------------------------------------------------------

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: string[];
  onChange: (value: string | undefined) => void;
}) {
  return (
    <Select
      value={value ?? '__all__'}
      onValueChange={(v) => onChange(v === '__all__' ? undefined : v)}
    >
      <SelectTrigger className="h-7 text-xs w-32">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">All {label}s</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
