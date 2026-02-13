"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePortfolio } from "@/context/PortfolioContext"

export function PortfolioSwitcher() {
    const { portfolios, activePortfolioId, setActivePortfolioId, addPortfolio } = usePortfolio();

    return (
        <div className="w-full pt-8 px-8">
            <div className="flex items-center gap-4">
                {portfolios.map((portfolio) => {
                    const isActive = portfolio.id === activePortfolioId;
                    return (
                        <button
                            key={portfolio.id}
                            onClick={() => setActivePortfolioId(portfolio.id)}
                            className={cn(
                                "relative h-9 px-4 rounded-full flex items-center gap-2 text-sm font-medium transition-all duration-300",
                                isActive
                                    ? "bg-[#2c2c2e] text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/10"
                                    : "bg-transparent text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
                            )}
                        >
                            {/* Simple Dot Indicator */}
                            <div className={cn(
                                "w-2 h-2 rounded-full transition-colors",
                                isActive ? "bg-[#0a84ff]" : "bg-neutral-600"
                            )} />

                            <span>{portfolio.name}</span>

                            {/* Minimal count */}
                            <span className={cn(
                                "text-[10px] ml-1 opacity-60",
                                isActive ? "text-white" : "text-neutral-600"
                            )}>
                                {portfolio.holdings.length} items
                            </span>
                        </button>
                    );
                })}

                <div className="h-6 w-px bg-white/10 mx-2" />

                <button
                    onClick={() => addPortfolio(`New Portfolio ${portfolios.length + 1}`)}
                    className="h-9 px-4 rounded-full flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-white hover:bg-white/5 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">New portfolio</span>
                </button>
            </div>
        </div>
    )
}
