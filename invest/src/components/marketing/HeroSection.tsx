"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { font } from "./tokens"

// ─── Ticker Strip ────────────────────────────────────────────────────────────

const tickerData = [
    { symbol: "VUSA", change: "+15.2%", positive: true },
    { symbol: "SWDA", change: "+8.7%", positive: true },
    { symbol: "VUKE", change: "-2.1%", positive: false },
    { symbol: "S&P 500", change: "5,234.18 \u25B2", positive: true },
    { symbol: "FTSE 100", change: "7,682.50 \u25B2", positive: true },
    { symbol: "IITU", change: "+22.4%", positive: true },
    { symbol: "VWRL", change: "+6.3%", positive: true },
    { symbol: "EQQQ", change: "-0.8%", positive: false },
    { symbol: "SMT", change: "+31.7%", positive: true },
    { symbol: "HSBA", change: "-4.2%", positive: false },
]

function TickerStrip() {
    const items = [...tickerData, ...tickerData]

    return (
        <div className="overflow-hidden w-full mt-8 border-y border-[#27272A] py-3">
            <div className="flex animate-ticker whitespace-nowrap">
                {items.map((item, i) => (
                    <span key={i} className="inline-flex items-center mx-6 text-sm" style={{ fontFamily: font.mono }}>
                        <span className="text-[#22D3EE]">{item.symbol}</span>
                        <span className="mx-2 text-[#52525B]">&bull;</span>
                        <span className={item.positive ? "text-[#22C55E]" : "text-[#EF4444]"}>
                            {item.change}
                        </span>
                        {i < items.length - 1 && (
                            <span className="ml-6 text-[#27272A]">&vert;</span>
                        )}
                    </span>
                ))}
            </div>
            <style>{`
                @keyframes ticker-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-ticker {
                    animation: ticker-scroll 40s linear infinite;
                }
            `}</style>
        </div>
    )
}

// ─── Dashboard Card ──────────────────────────────────────────────────────────

function DashboardCard() {
    const holdings = [
        { ticker: "VUSA", name: "Vanguard S&P 500", value: "\u00A324,350", pct: "+18.2%", positive: true },
        { ticker: "SWDA", name: "iShares World", value: "\u00A318,720", pct: "+8.7%", positive: true },
        { ticker: "VUKE", name: "Vanguard FTSE 100", value: "\u00A312,100", pct: "-2.1%", positive: false },
        { ticker: "IITU", name: "iShares US Tech", value: "\u00A39,840", pct: "+22.4%", positive: true },
    ]

    return (
        <div className="bg-[#141414] border border-[#27272A] rounded-lg p-6 w-full max-w-[440px]">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-xs text-[#52525B] uppercase tracking-wider" style={{ fontFamily: font.mono }}>
                        Total Portfolio Value
                    </p>
                    <p className="text-2xl font-bold text-[#E4E4E7] mt-1" style={{ fontFamily: font.mono }}>
                        &pound;127,430.56
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-[#52525B]" style={{ fontFamily: font.mono }}>24h</p>
                    <p className="text-sm text-[#22C55E]" style={{ fontFamily: font.mono }}>+&pound;1,247.30</p>
                </div>
            </div>
            <div className="mb-6">
                <svg viewBox="0 0 400 60" className="w-full h-12" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="heroChartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22C55E" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M0,45 Q30,42 60,38 T120,30 T180,35 T240,20 T300,15 T360,12 L400,8"
                        fill="none"
                        stroke="#22C55E"
                        strokeWidth="2"
                    />
                    <path
                        d="M0,45 Q30,42 60,38 T120,30 T180,35 T240,20 T300,15 T360,12 L400,8 L400,60 L0,60 Z"
                        fill="url(#heroChartGrad)"
                    />
                </svg>
            </div>
            <div className="space-y-0">
                {holdings.map((h, i) => (
                    <div
                        key={h.ticker}
                        className={`flex items-center justify-between py-3 ${i < holdings.length - 1 ? "border-b border-[#27272A]" : ""}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-[#22D3EE]" style={{ fontFamily: font.mono }}>
                                {h.ticker}
                            </span>
                            <span className="text-sm text-[#A1A1AA]">{h.name}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-sm text-[#E4E4E7] mr-3" style={{ fontFamily: font.mono }}>
                                {h.value}
                            </span>
                            <span
                                className={`text-xs ${h.positive ? "text-[#22C55E]" : "text-[#EF4444]"}`}
                                style={{ fontFamily: font.mono }}
                            >
                                {h.pct}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Hero Section ────────────────────────────────────────────────────────────

export function HeroSection() {
    return (
        <section className="pt-28 pb-0">
            <div className="mx-auto max-w-[1200px] px-6">
                <div className="grid grid-cols-12 gap-6 items-start">
                    <div className="col-span-12 lg:col-span-6 pt-8">
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6 }}
                            className="text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight text-[#E4E4E7]"
                            style={{ fontFamily: font.headline }}
                        >
                            Portfolio intelligence,
                            <br />
                            engineered.
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.15 }}
                            className="mt-6 text-lg text-[#A1A1AA] max-w-md leading-relaxed"
                            style={{ fontFamily: font.body }}
                        >
                            Aggregate every holding. See through every ETF. Make decisions
                            backed by data, not guesswork.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="mt-8 flex items-center gap-4"
                        >
                            <Link
                                href="/register"
                                className="inline-flex items-center gap-2 bg-[#FF6B00] text-[#0C0C0C] font-semibold text-sm px-6 py-3 rounded-[4px] hover:bg-[#FF6B00]/90 transition-colors duration-200"
                                style={{ fontFamily: font.body }}
                            >
                                Start Tracking
                                <span aria-hidden="true">&rarr;</span>
                            </Link>
                            <a
                                href="#features"
                                className="inline-flex items-center gap-2 border border-[#27272A] text-[#A1A1AA] font-medium text-sm px-6 py-3 rounded-[4px] hover:border-[#52525B] hover:text-[#E4E4E7] transition-colors duration-200"
                                style={{ fontFamily: font.body }}
                            >
                                View Demo
                            </a>
                        </motion.div>
                    </div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="col-span-12 lg:col-span-5 lg:col-start-8 mt-10 lg:mt-0 flex justify-end"
                    >
                        <DashboardCard />
                    </motion.div>
                </div>
            </div>
            <div className="mt-16">
                <TickerStrip />
            </div>
        </section>
    )
}
