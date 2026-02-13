"use client";

import { ColumnDef } from "@tanstack/react-table";
import { GridHolding } from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";

// Define custom props for table meta to handle updates
// This trick allows us to pass functions to cell renderers
declare module '@tanstack/table-core' {
    interface TableMeta<TData extends unknown> {
        updateData: (rowIndex: string, columnId: string, value: unknown) => void;
    }
}

// Editable Cell Component
const EditableCell = ({ getValue, row, column, table }: any) => {
    const initialValue = getValue();
    const [value, setValue] = useState(initialValue);

    const onBlur = () => {
        table.options.meta?.updateData(row.original.id, column.id, value);
    };

    return (
        <Input
            value={value}
            onChange={e => setValue(e.target.value)}
            onBlur={onBlur}
            className="h-8 w-24 text-right bg-transparent border-transparent hover:border-input focus:bg-background focus:border-primary transition-all"
        />
    );
};

// Helper for currency formatting
const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(val);
};

export const columns: ColumnDef<GridHolding>[] = [
    {
        accessorKey: "ticker",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="pl-0 hover:bg-transparent"
                >
                    Ticker
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div className="font-bold text-primary">{row.getValue("ticker")}</div>,
    },
    {
        accessorKey: "name", // We mocked this, need to ensure it exists in data passed
        header: "Asset Name",
        cell: ({ row }) => <div className="text-muted-foreground truncate max-w-[150px]">{(row.original as any).name || "Unknown"}</div>,
    },
    {
        accessorKey: "sector",
        header: "Sector",
        cell: ({ row }) => (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                {row.getValue("sector")}
            </span>
        ),
    },
    {
        accessorKey: "quantity",
        header: () => <div className="text-right">Qty</div>,
        cell: ({ row, column, table }) => {
            const initialValue = row.getValue("quantity");
            return (
                <div className="flex justify-end">
                    <EditableNumberCell
                        value={initialValue as number}
                        id={row.original.id}
                        field="quantity"
                        updateData={table.options.meta?.updateData}
                    />
                </div>
            )
        },
    },
    {
        accessorKey: "avgCost",
        header: () => <div className="text-right">Avg Cost</div>,
        cell: ({ row }) => <div className="text-right font-mono text-muted-foreground">{formatCurrency(row.getValue("avgCost"))}</div>,
    },
    {
        accessorKey: "currentPrice",
        header: () => <div className="text-right">Price</div>,
        cell: ({ row }) => <div className="text-right font-mono">{formatCurrency(row.getValue("currentPrice"))}</div>,
    },
    {
        accessorKey: "currentValue",
        header: ({ column }) => {
            return (
                <div className="text-right">
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="pr-0 hover:bg-transparent"
                    >
                        Value
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            );
        },
        cell: ({ row }) => <div className="text-right font-bold font-mono">{formatCurrency(row.getValue("currentValue"))}</div>,
    },
    {
        accessorKey: "allocationPercent", // Derived
        header: () => <div className="text-right">% Alloc</div>,
        cell: ({ row }) => {
            const val = (row.original as any).allocationPercent || 0;
            return <div className="text-right text-muted-foreground">{val.toFixed(2)}%</div>
        }
    },
    {
        accessorKey: "targetPercent",
        header: () => <div className="text-right">Target %</div>,
        cell: ({ row, table }) => {
            const initialValue = row.getValue("targetPercent");
            return (
                <div className="flex justify-end">
                    <EditableNumberCell
                        value={initialValue as number}
                        id={row.original.id}
                        field="targetPercent"
                        updateData={table.options.meta?.updateData}
                    />
                </div>
            )
        },
    }
];

// Extracted for standard number input
import { useState, useEffect } from "react";

const EditableNumberCell = ({ value: initialValue, id, field, updateData }: any) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    const onBlur = () => {
        if (value !== initialValue) {
            updateData(id, field, Number(value));
        }
    };

    return (
        <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            onBlur={onBlur}
            className="w-16 text-right bg-transparent border-b border-transparent hover:border-muted-foreground/30 focus:border-primary focus:outline-none transition-colors font-mono text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
    );
};
