"use client";

import { Asset } from "@/hooks/use-asset-search";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, BarChart3, TrendingUp } from "lucide-react";

import Link from "next/link";

interface AssetGridProps {
    assets: Asset[];
}

export function AssetGrid({ assets }: AssetGridProps) {
    if (assets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-muted-foreground">
                <p>No assets found matching your criteria.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
                <Link key={asset.ticker} href={`/explorer/${asset.ticker}`}>
                    <AssetCard asset={asset} />
                </Link>
            ))}
        </div>
    );
}

function AssetCard({ asset }: { asset: Asset }) {
    return (
        <Card className="flex flex-col h-full hover:shadow-md transition-shadow cursor-pointer group">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <Badge variant="outline" className="font-mono font-bold text-primary border-primary/20 bg-primary/5">
                        {asset.ticker}
                    </Badge>
                    {/* Only show TER for ETFs */}
                    {asset.type === 'ETF' && asset.ter && (
                        <Badge variant="secondary" className="text-xs">
                            {asset.ter.toFixed(2)}% TER
                        </Badge>
                    )}
                    {/* Show Sector badge for Stocks to balance the UI */}
                    {asset.type === 'Stock' && (
                        <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-200/20">
                            {asset.sector}
                        </Badge>
                    )}
                </div>
                <CardTitle className="text-base font-semibold leading-tight mt-2 group-hover:text-primary transition-colors">
                    {asset.name}
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className="truncate max-w-[120px]">{asset.issuer}</span>
                    <span>•</span>
                    <span>{asset.region}</span>
                </div>
            </CardHeader>
            <CardContent className="flex-grow pt-2">
                <p className="text-sm text-muted-foreground line-clamp-3">
                    {asset.description}
                </p>
            </CardContent>
            <CardFooter className="pt-2 border-t bg-muted/50 p-3">
                <Button variant="ghost" className="w-full text-xs h-8 justify-between hover:bg-background">
                    <span className="flex items-center gap-2">
                        {asset.type === 'ETF' ? <BarChart3 className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        {asset.type === 'ETF' ? 'Analyze' : 'Research'}
                    </span>
                    <ArrowUpRight className="w-3 h-3 opacity-50" />
                </Button>
            </CardFooter>
        </Card>
    );
}
