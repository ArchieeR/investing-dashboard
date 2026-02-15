'use client';

// =============================================================================
// Dashboard Layout Context — manages widget layout with localStorage persistence
// =============================================================================

import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import type { DashboardLayout, WidgetConfig, WidgetType } from '@/types/widget-types';
import { createDefaultLayout, WIDGET_SIZE_CONSTRAINTS } from '@/types/widget-types';

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type LayoutAction =
    | { type: 'add-widget'; widget: WidgetConfig }
    | { type: 'remove-widget'; widgetId: string }
    | { type: 'move-widget'; fromIndex: number; toIndex: number }
    | { type: 'resize-widget'; widgetId: string; colSpan: number; rowSpan: number }
    | { type: 'reset-layout' }
    | { type: 'restore-layout'; layout: DashboardLayout };

function layoutReducer(state: DashboardLayout, action: LayoutAction): DashboardLayout {
    switch (action.type) {
        case 'add-widget': {
            const widgets = [...state.widgets, { ...action.widget, order: state.widgets.length }];
            return { ...state, widgets };
        }
        case 'remove-widget': {
            const widgets = state.widgets
                .filter((w) => w.id !== action.widgetId)
                .map((w, i) => ({ ...w, order: i }));
            return { ...state, widgets };
        }
        case 'move-widget': {
            const widgets = [...state.widgets];
            const [moved] = widgets.splice(action.fromIndex, 1);
            widgets.splice(action.toIndex, 0, moved);
            return { ...state, widgets: widgets.map((w, i) => ({ ...w, order: i })) };
        }
        case 'resize-widget': {
            const widgets = state.widgets.map((w) => {
                if (w.id !== action.widgetId) return w;
                const constraints = WIDGET_SIZE_CONSTRAINTS[w.type];
                return {
                    ...w,
                    colSpan: Math.max(constraints.minColSpan, Math.min(constraints.maxColSpan, action.colSpan)),
                    rowSpan: Math.max(constraints.minRowSpan, Math.min(constraints.maxRowSpan, action.rowSpan)),
                };
            });
            return { ...state, widgets };
        }
        case 'reset-layout':
            return createDefaultLayout();
        case 'restore-layout':
            return action.layout;
        default:
            return state;
    }
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'invormed-dashboard-layout';

function loadLayout(): DashboardLayout | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as DashboardLayout;
    } catch {
        return null;
    }
}

function saveLayout(layout: DashboardLayout): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {
        // storage full — ignore
    }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

let widgetIdCounter = 0;

function generateWidgetId(): string {
    widgetIdCounter += 1;
    return `widget-${Date.now()}-${widgetIdCounter}`;
}

interface DashboardLayoutContextValue {
    layout: DashboardLayout;
    addWidget: (type: WidgetType) => void;
    removeWidget: (widgetId: string) => void;
    moveWidget: (fromIndex: number, toIndex: number) => void;
    resizeWidget: (widgetId: string, colSpan: number, rowSpan: number) => void;
    resetLayout: () => void;
}

const DashboardLayoutContext = createContext<DashboardLayoutContextValue | undefined>(undefined);

export function DashboardLayoutProvider({ children }: { children: React.ReactNode }) {
    const [layout, dispatch] = useReducer(layoutReducer, undefined, createDefaultLayout);
    const [hasLoaded, setHasLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = loadLayout();
        if (saved) {
            dispatch({ type: 'restore-layout', layout: saved });
        }
        setHasLoaded(true);
    }, []);

    // Save on changes
    useEffect(() => {
        if (!hasLoaded) return;
        saveLayout(layout);
    }, [layout, hasLoaded]);

    const addWidget = useCallback((type: WidgetType) => {
        const constraints = WIDGET_SIZE_CONSTRAINTS[type];
        const widget: WidgetConfig = {
            id: generateWidgetId(),
            type,
            colSpan: constraints.defaultColSpan,
            rowSpan: constraints.defaultRowSpan,
            order: 0,
        };
        dispatch({ type: 'add-widget', widget });
    }, []);

    const removeWidget = useCallback(
        (widgetId: string) => dispatch({ type: 'remove-widget', widgetId }),
        [],
    );

    const moveWidget = useCallback(
        (fromIndex: number, toIndex: number) => dispatch({ type: 'move-widget', fromIndex, toIndex }),
        [],
    );

    const resizeWidget = useCallback(
        (widgetId: string, colSpan: number, rowSpan: number) =>
            dispatch({ type: 'resize-widget', widgetId, colSpan, rowSpan }),
        [],
    );

    const resetLayout = useCallback(() => dispatch({ type: 'reset-layout' }), []);

    const value = useMemo<DashboardLayoutContextValue>(
        () => ({
            layout,
            addWidget,
            removeWidget,
            moveWidget,
            resizeWidget,
            resetLayout,
        }),
        [layout, addWidget, removeWidget, moveWidget, resizeWidget, resetLayout],
    );

    return (
        <DashboardLayoutContext.Provider value={value}>
            {children}
        </DashboardLayoutContext.Provider>
    );
}

export function useDashboardLayout(): DashboardLayoutContextValue {
    const ctx = useContext(DashboardLayoutContext);
    if (!ctx) {
        throw new Error('useDashboardLayout must be used within a DashboardLayoutProvider');
    }
    return ctx;
}
