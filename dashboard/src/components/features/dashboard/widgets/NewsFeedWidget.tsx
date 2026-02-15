'use client';

// =============================================================================
// News Feed Widget — compact headline list
// =============================================================================

import React from 'react';
import type { WidgetConfig } from '@/types/widget-types';
import { Newspaper, ExternalLink } from 'lucide-react';

interface NewsFeedWidgetProps {
    widget: WidgetConfig;
}

// Placeholder headlines — to be replaced with real API data
const PLACEHOLDER_HEADLINES = [
    { title: 'Markets rally on economic data', source: 'FT', time: '2h ago' },
    { title: 'Tech earnings beat expectations', source: 'Bloomberg', time: '3h ago' },
    { title: 'Central bank holds rates steady', source: 'Reuters', time: '4h ago' },
    { title: 'Energy sector sees renewed interest', source: 'CNBC', time: '5h ago' },
    { title: 'UK inflation falls to 2.3%', source: 'BBC', time: '6h ago' },
    { title: 'Asia markets close higher', source: 'Nikkei', time: '8h ago' },
];

export function NewsFeedWidget({ widget }: NewsFeedWidgetProps) {
    const isCompact = widget.colSpan <= 1 && widget.rowSpan <= 1;
    const headlines = PLACEHOLDER_HEADLINES.slice(0, isCompact ? 3 : 6);

    return (
        <div className="space-y-1.5 h-full overflow-y-auto">
            {headlines.map((headline, i) => (
                <div
                    key={i}
                    className="flex items-start gap-2 py-1.5 px-1 rounded hover:bg-secondary/50 transition-colors cursor-pointer group"
                >
                    <Newspaper className="size-3 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {headline.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground font-medium">
                                {headline.source}
                            </span>
                            <span className="text-[10px] text-muted-foreground/50">
                                {headline.time}
                            </span>
                        </div>
                    </div>
                    <ExternalLink className="size-2.5 text-muted-foreground/30 group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                </div>
            ))}
            <p className="text-[10px] text-muted-foreground/40 text-center pt-1">
                Sample data — API integration pending
            </p>
        </div>
    );
}
