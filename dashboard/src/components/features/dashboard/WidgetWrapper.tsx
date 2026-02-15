'use client';

// =============================================================================
// WidgetWrapper — drag handle, resize, remove for each dashboard widget
// =============================================================================

import React, { useCallback, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { GripVertical, X, Maximize2, Minimize2 } from 'lucide-react';
import { useDashboardLayout } from '@/context/DashboardLayoutContext';
import { WIDGET_SIZE_CONSTRAINTS } from '@/types/widget-types';
import type { WidgetConfig } from '@/types/widget-types';

interface WidgetWrapperProps {
    widget: WidgetConfig;
    title: string;
    children: React.ReactNode;
}

export function WidgetWrapper({ widget, title, children }: WidgetWrapperProps) {
    const { removeWidget, resizeWidget } = useDashboardLayout();
    const constraints = WIDGET_SIZE_CONSTRAINTS[widget.type];

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: widget.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        gridColumn: `span ${widget.colSpan}`,
        gridRow: `span ${widget.rowSpan}`,
    };

    // Track whether widget is at max or min size for toggle
    const isMaxSize = widget.colSpan === constraints.maxColSpan && widget.rowSpan === constraints.maxRowSpan;
    const isMinSize = widget.colSpan === constraints.minColSpan && widget.rowSpan === constraints.minRowSpan;

    const toggleSize = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (isMaxSize) {
                resizeWidget(widget.id, constraints.minColSpan, constraints.minRowSpan);
            } else {
                resizeWidget(widget.id, constraints.maxColSpan, constraints.maxRowSpan);
            }
        },
        [isMaxSize, widget.id, constraints, resizeWidget],
    );

    const handleRemove = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            removeWidget(widget.id);
        },
        [widget.id, removeWidget],
    );

    // Cycle through sizes: default → min → max → default
    const cycleSize = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            const isDefault =
                widget.colSpan === constraints.defaultColSpan &&
                widget.rowSpan === constraints.defaultRowSpan;

            if (isDefault) {
                resizeWidget(widget.id, constraints.minColSpan, constraints.minRowSpan);
            } else if (isMinSize) {
                resizeWidget(widget.id, constraints.maxColSpan, constraints.maxRowSpan);
            } else {
                resizeWidget(widget.id, constraints.defaultColSpan, constraints.defaultRowSpan);
            }
        },
        [widget, constraints, isMinSize, resizeWidget],
    );

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group relative rounded-lg border border-border bg-card overflow-hidden flex flex-col',
                isDragging && 'opacity-50 shadow-2xl z-50',
            )}
        >
            {/* Drag handle / toolbar */}
            <div
                className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-card/80 cursor-grab active:cursor-grabbing"
                {...attributes}
                {...listeners}
            >
                <div className="flex items-center gap-1.5">
                    <GripVertical className="size-3.5 text-muted-foreground/50" />
                    <span className="text-xs font-medium text-muted-foreground">{title}</span>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={cycleSize}
                        className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="Resize"
                    >
                        {isMinSize ? (
                            <Maximize2 className="size-3" />
                        ) : (
                            <Minimize2 className="size-3" />
                        )}
                    </button>
                    <button
                        onClick={handleRemove}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Remove widget"
                    >
                        <X className="size-3" />
                    </button>
                </div>
            </div>

            {/* Widget content */}
            <div className="flex-1 overflow-auto p-3">
                {children}
            </div>
        </div>
    );
}
