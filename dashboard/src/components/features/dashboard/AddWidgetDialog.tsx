'use client';

// =============================================================================
// Add Widget Dialog — choose from available widget types
// =============================================================================

import React, { useState } from 'react';
import { useDashboardLayout } from '@/context/DashboardLayoutContext';
import { WIDGET_CATALOG } from '@/types/widget-types';
import type { WidgetType } from '@/types/widget-types';
import {
    TrendingUp,
    Table,
    PieChart,
    Eye,
    Newspaper,
    BarChart3,
    Plus,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
    TrendingUp,
    Table,
    PieChart,
    Eye,
    Newspaper,
    BarChart3,
};

export function AddWidgetDialog() {
    const [open, setOpen] = useState(false);
    const { addWidget } = useDashboardLayout();

    const handleAdd = (type: WidgetType) => {
        addWidget(type);
        setOpen(false);
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg border border-dashed border-border hover:border-primary/50 transition-colors"
            >
                <Plus className="size-3.5" />
                Add Widget
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-foreground">Add Widget</h3>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {WIDGET_CATALOG.map((meta) => {
                                const IconComponent = ICON_MAP[meta.icon] ?? Plus;
                                return (
                                    <button
                                        key={meta.type}
                                        onClick={() => handleAdd(meta.type)}
                                        className="flex flex-col items-start gap-1.5 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/50 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-2">
                                            <IconComponent className="size-4 text-primary" />
                                            <span className="text-xs font-medium text-foreground">
                                                {meta.label}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground leading-tight">
                                            {meta.description}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground/50">
                                            Size: {meta.constraints.minColSpan}×{meta.constraints.minRowSpan} to{' '}
                                            {meta.constraints.maxColSpan}×{meta.constraints.maxRowSpan}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
