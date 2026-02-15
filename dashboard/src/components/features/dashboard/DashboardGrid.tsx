'use client';

// =============================================================================
// DashboardGrid — drag-and-drop widget grid using @dnd-kit
// =============================================================================

import React, { useCallback, useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useDashboardLayout } from '@/context/DashboardLayoutContext';
import { WidgetWrapper } from './WidgetWrapper';
import { WIDGET_CATALOG } from '@/types/widget-types';
import type { WidgetConfig } from '@/types/widget-types';

// Widget components (lazy — these are lightweight wrappers)
import { PerformanceChartWidget } from './widgets/PerformanceChart';
import { HoldingsTableWidget } from './widgets/HoldingsTableWidget';
import { BreakdownWidget } from './widgets/BreakdownWidget';
import { WatchlistWidget } from './widgets/WatchlistWidget';
import { NewsFeedWidget } from './widgets/NewsFeedWidget';
import { MarketMoversWidget } from './widgets/MarketMoversWidget';

// ---------------------------------------------------------------------------
// Widget renderer
// ---------------------------------------------------------------------------

function renderWidgetContent(widget: WidgetConfig) {
    switch (widget.type) {
        case 'performance-chart':
            return <PerformanceChartWidget widget={widget} />;
        case 'holdings-table':
            return <HoldingsTableWidget widget={widget} />;
        case 'breakdown':
            return <BreakdownWidget widget={widget} />;
        case 'watchlist':
            return <WatchlistWidget widget={widget} />;
        case 'news-feed':
            return <NewsFeedWidget widget={widget} />;
        case 'market-movers':
            return <MarketMoversWidget widget={widget} />;
        default:
            return <div className="text-sm text-muted-foreground">Unknown widget</div>;
    }
}

function getWidgetLabel(type: string): string {
    return WIDGET_CATALOG.find((w) => w.type === type)?.label ?? type;
}

// ---------------------------------------------------------------------------
// Grid component
// ---------------------------------------------------------------------------

export function DashboardGrid() {
    const { layout, moveWidget } = useDashboardLayout();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const widgetIds = useMemo(
        () => layout.widgets.map((w) => w.id),
        [layout.widgets],
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            const oldIndex = layout.widgets.findIndex((w) => w.id === active.id);
            const newIndex = layout.widgets.findIndex((w) => w.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                moveWidget(oldIndex, newIndex);
            }
        },
        [layout.widgets, moveWidget],
    );

    if (layout.widgets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-muted-foreground">
                    No widgets on your dashboard. Add some!
                </p>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
                <div
                    className="grid gap-4"
                    style={{
                        gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
                        gridAutoRows: 'minmax(140px, auto)',
                    }}
                >
                    {layout.widgets.map((widget) => (
                        <WidgetWrapper
                            key={widget.id}
                            widget={widget}
                            title={getWidgetLabel(widget.type)}
                        >
                            {renderWidgetContent(widget)}
                        </WidgetWrapper>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
