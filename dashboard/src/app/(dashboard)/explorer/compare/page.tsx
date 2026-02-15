"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function CompareContent() {
  const searchParams = useSearchParams();
  const rawAssets = searchParams.get("assets");
  const tickers = rawAssets ? rawAssets.split(",").filter(Boolean) : ["VUSA", "VWRL"];

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-6">
      <Link href="/explorer">
        <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground h-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Explorer
        </Button>
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">
        Comparison: {tickers.join(" vs ")}
      </h1>
      <p className="text-muted-foreground">
        Asset comparison is being migrated to the new ETF Overlap Analysis system.
        Visit the Explorer page to use the new look-through and overlap tools.
      </p>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-muted-foreground">Loading...</div>}>
      <CompareContent />
    </Suspense>
  );
}
