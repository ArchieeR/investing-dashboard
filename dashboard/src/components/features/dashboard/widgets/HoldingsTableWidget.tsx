'use client';

// =============================================================================
// Holdings Table Widget — wraps the existing HoldingsGrid
// =============================================================================

import React, { useCallback, useState } from 'react';
import { HoldingsGrid, type GridMode } from '../HoldingsGrid';
import { ColumnSettings } from '../ColumnSettings';
import { Button } from '@/components/ui/button';
import { Eye, Pencil } from 'lucide-react';
import type { WidgetConfig } from '@/types/widget-types';

interface HoldingsTableWidgetProps {
    widget: WidgetConfig;
}

export function HoldingsTableWidget({ widget }: HoldingsTableWidgetProps) {
    const [gridMode, setGridMode] = useState<GridMode>('monitor');

    const toggleMode = useCallback(() => {
        setGridMode((prev) => (prev === 'monitor' ? 'editor' : 'monitor'));
    }, []);

    return (
        <div className="flex flex-col gap-2 h-full -m-3">
            <div className="flex items-center justify-between px-3 pt-2">
                <div className="flex items-center gap-1">
                    <Button
                        variant={gridMode === 'monitor' ? 'secondary' : 'ghost'}
                        size="xs"
                        onClick={toggleMode}
                    >
                        {gridMode === 'monitor' ? (
                            <>
                                <Eye className="size-3" />
                                Monitor
                            </>
                        ) : (
                            <>
                                <Pencil className="size-3" />
                                Editor
                            </>
                        )}
                    </Button>
                    <ColumnSettings />
                </div>
            </div>
            <div className="flex-1 overflow-auto px-1">
                <HoldingsGrid mode={gridMode} />
            </div>
        </div>
    );
}
