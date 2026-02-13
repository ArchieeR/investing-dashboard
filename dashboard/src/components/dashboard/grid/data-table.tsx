"use client";

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    SortingState,
    getGroupedRowModel,
    GroupingState,
    getExpandedRowModel,
} from "@tanstack/react-table";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    onDataUpdate: (id: string, field: string, value: any) => void;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    onDataUpdate
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [grouping, setGrouping] = useState<GroupingState>(['section']); // Default Group by Section

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getGroupedRowModel: getGroupedRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        onSortingChange: setSorting,
        onGroupingChange: setGrouping,
        state: {
            sorting,
            grouping,
            expanded: true // Expand all groups by default
        },
        meta: {
            updateData: onDataUpdate
        }
    });

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => {
                            // Group Headers
                            if (row.getIsGrouped()) {
                                return (
                                    <TableRow key={row.id} className="bg-muted/50 hover:bg-muted/60">
                                        <TableCell colSpan={columns.length} className="font-medium py-2">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs uppercase tracking-wider font-bold">
                                                    {row.getValue("section")}
                                                </span>
                                                <span className="text-muted-foreground text-xs">
                                                    ({row.subRows.length} Assets)
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            }

                            // Standard Rows
                            return (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="hover:bg-muted/5 transition-colors"
                                >
                                    {row.getVisibleCells().map((cell) => {
                                        if (cell.getIsAggregated()) return null; // Skip if aggregated (we don't use yet)
                                        if (cell.getIsPlaceholder()) return <TableCell key={cell.id} />; // Fill gaps for grouped columns

                                        return (
                                            <TableCell key={cell.id} className="py-2">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            )
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
