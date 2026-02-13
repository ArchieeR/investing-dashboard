"use client";

import { useSearchParams } from "next/navigation";
import { useMultiAssetComparison } from "@/hooks/use-multi-asset-comparison";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRightLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MultiAssetTable } from "@/components/features/etf/MultiAssetTable";
import { ComparisonChart } from "@/components/features/etf/ComparisonChart";

export default function ComparePage() {
    const searchParams = useSearchParams();

    // Parse ?assets=A,B,C 
    const rawAssets = searchParams.get("assets");
    const rawA = searchParams.get("a");
    const rawB = searchParams.get("b");

    let targetTickers: string[] = [];
    if (rawAssets) {
        targetTickers = rawAssets.split(',').filter(Boolean);
    } else if (rawA && rawB) {
        targetTickers = [rawA, rawB];
    } else {
        targetTickers = ["VUSA", "VWRL"]; // Default
    }

    const { assets, isLoading, overlap, isAllEtfs } = useMultiAssetComparison(targetTickers);

    if (isLoading) return <div className="p-20 text-center text-muted-foreground animate-pulse">Running Deep Analysis...</div>;

    return (
        <div className="contain-layout space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <Link href="/explorer">
                    <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground h-8">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Explorer
                    </Button>
                </Link>
                <div className="flex justify-between items-center mb-2">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Comparison Engine</h1>
                    </div>
                </div>
            </div>

            {/* Hero Chart - PERFORMANCE COMPARISON */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <ComparisonChart assets={assets} />
            </div>

            {/* Compact Overlap Strip (Conditionally Rendered for 2 ETFs) */}
            {isAllEtfs && assets.length === 2 && overlap && (
                <Alert className="border-primary/20 bg-primary/5 flex items-center justify-between py-2 animate-in fade-in duration-700">
                    <div className="flex items-center gap-4">
                        <div className="bg-background p-2 rounded-full border shadow-sm">
                            <ArrowRightLeft className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <AlertTitle className="text-primary font-bold">{overlap.percentage}% Overlap</AlertTitle>
                            <AlertDescription className="text-xs text-muted-foreground">{overlap.description}</AlertDescription>
                        </div>
                    </div>
                    <div className="w-[200px] hidden sm:block">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1 font-medium">
                            <span>Unique</span>
                            <span>Common</span>
                            <span>Unique</span>
                        </div>
                        <Progress value={overlap.percentage} className="h-2" />
                    </div>
                </Alert>
            )}

            {/* Main Comparison Table */}
            <div>
                <div className="mb-2 mt-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Details</h2>
                </div>
                <MultiAssetTable assets={assets} />
            </div>

            <div className="text-center pt-8">
                <Link href="/explorer">
                    <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Asset to Comparison
                    </Button>
                </Link>
            </div>
        </div>
    );
}
