// =============================================================================
// Widget Dashboard Types
// =============================================================================

export type WidgetType =
    | 'performance-chart'
    | 'holdings-table'
    | 'breakdown'
    | 'watchlist'
    | 'news-feed'
    | 'market-movers';

export interface WidgetSizeConstraints {
    minColSpan: number;
    maxColSpan: number;
    minRowSpan: number;
    maxRowSpan: number;
    defaultColSpan: number;
    defaultRowSpan: number;
}

export interface WidgetConfig {
    id: string;
    type: WidgetType;
    colSpan: number;
    rowSpan: number;
    order: number;
}

export interface DashboardLayout {
    widgets: WidgetConfig[];
    columns: number;
}

// ---------------------------------------------------------------------------
// Size constraints per widget type
// ---------------------------------------------------------------------------

export const WIDGET_SIZE_CONSTRAINTS: Record<WidgetType, WidgetSizeConstraints> = {
    'performance-chart': {
        defaultColSpan: 4, defaultRowSpan: 2,
        minColSpan: 2, maxColSpan: 4,
        minRowSpan: 1, maxRowSpan: 3,
    },
    'holdings-table': {
        defaultColSpan: 4, defaultRowSpan: 3,
        minColSpan: 3, maxColSpan: 4,
        minRowSpan: 2, maxRowSpan: 4,
    },
    breakdown: {
        defaultColSpan: 2, defaultRowSpan: 2,
        minColSpan: 1, maxColSpan: 4,
        minRowSpan: 1, maxRowSpan: 3,
    },
    watchlist: {
        defaultColSpan: 1, defaultRowSpan: 2,
        minColSpan: 1, maxColSpan: 2,
        minRowSpan: 1, maxRowSpan: 4,
    },
    'news-feed': {
        defaultColSpan: 2, defaultRowSpan: 2,
        minColSpan: 1, maxColSpan: 2,
        minRowSpan: 1, maxRowSpan: 2,
    },
    'market-movers': {
        defaultColSpan: 2, defaultRowSpan: 2,
        minColSpan: 1, maxColSpan: 2,
        minRowSpan: 1, maxRowSpan: 2,
    },
};

// ---------------------------------------------------------------------------
// Widget metadata
// ---------------------------------------------------------------------------

export interface WidgetMeta {
    type: WidgetType;
    label: string;
    description: string;
    icon: string; // lucide icon name
    constraints: WidgetSizeConstraints;
}

export const WIDGET_CATALOG: WidgetMeta[] = [
    {
        type: 'performance-chart',
        label: 'Performance Chart',
        description: 'Portfolio value over time',
        icon: 'TrendingUp',
        constraints: WIDGET_SIZE_CONSTRAINTS['performance-chart'],
    },
    {
        type: 'holdings-table',
        label: 'Holdings Table',
        description: 'Full holdings grid with editing',
        icon: 'Table',
        constraints: WIDGET_SIZE_CONSTRAINTS['holdings-table'],
    },
    {
        type: 'breakdown',
        label: 'Breakdown',
        description: 'Sector, industry, country, or account breakdown',
        icon: 'PieChart',
        constraints: WIDGET_SIZE_CONSTRAINTS.breakdown,
    },
    {
        type: 'watchlist',
        label: 'Watchlist',
        description: 'Live price watchlist',
        icon: 'Eye',
        constraints: WIDGET_SIZE_CONSTRAINTS.watchlist,
    },
    {
        type: 'news-feed',
        label: 'News Feed',
        description: 'Latest market headlines',
        icon: 'Newspaper',
        constraints: WIDGET_SIZE_CONSTRAINTS['news-feed'],
    },
    {
        type: 'market-movers',
        label: 'Market Movers',
        description: 'Top gainers, losers, and most active',
        icon: 'BarChart3',
        constraints: WIDGET_SIZE_CONSTRAINTS['market-movers'],
    },
];

// ---------------------------------------------------------------------------
// Default layout
// ---------------------------------------------------------------------------

export function createDefaultLayout(): DashboardLayout {
    return {
        columns: 4,
        widgets: [
            {
                id: 'widget-perf',
                type: 'performance-chart',
                colSpan: 4,
                rowSpan: 2,
                order: 0,
            },
            {
                id: 'widget-holdings',
                type: 'holdings-table',
                colSpan: 4,
                rowSpan: 3,
                order: 1,
            },
            {
                id: 'widget-breakdown-1',
                type: 'breakdown',
                colSpan: 2,
                rowSpan: 2,
                order: 2,
            },
            {
                id: 'widget-breakdown-2',
                type: 'breakdown',
                colSpan: 2,
                rowSpan: 2,
                order: 3,
            },
        ],
    };
}
