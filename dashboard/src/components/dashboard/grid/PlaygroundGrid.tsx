"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { useHoldingsGrid } from "@/hooks/use-holdings-grid";

export function PlaygroundGrid() {
    const {
        data,
        updateHolding
    } = useHoldingsGrid();

    return (
        <Card className="w-full border-0 bg-transparent shadow-none sm:border sm:rounded-xl sm:bg-card/50 sm:shadow-sm">
            <CardHeader className="px-4 sm:px-6">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">Playground Grid</CardTitle>
                        <CardDescription>
                            All holdings live here. Edit quantities and costs directly.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
                <DataTable
                    columns={columns}
                    data={data}
                    onDataUpdate={(id, field, value) => updateHolding(id, field as keyof import("@/types/portfolio").Holding, value)}
                />
            </CardContent>
        </Card>
    );
}
