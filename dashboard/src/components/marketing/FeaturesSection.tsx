"use client"

import { motion } from "framer-motion"
import { font } from "./tokens"
import { FadeSection } from "./FadeSection"

// ─── Feature 01: The Playground ──────────────────────────────────────────────

const tableData = [
    { ticker: "VUSA", name: "Vanguard S&P 500 ETF", weight: "19.1%", target: "20.0%", drift: "-0.9%", ok: true },
    { ticker: "SWDA", name: "iShares Core MSCI World", weight: "14.7%", target: "15.0%", drift: "-0.3%", ok: true },
    { ticker: "VUKE", name: "Vanguard FTSE 100", weight: "11.2%", target: "10.0%", drift: "+1.2%", ok: false },
    { ticker: "IITU", name: "iShares S&P 500 IT Sector", weight: "7.7%", target: "8.0%", drift: "-0.3%", ok: true },
    { ticker: "SMT", name: "Scottish Mortgage Trust", weight: "6.4%", target: "5.0%", drift: "+1.4%", ok: false },
    { ticker: "EQQQ", name: "Invesco NASDAQ-100", weight: "5.8%", target: "6.0%", drift: "-0.2%", ok: true },
]

function FeaturePlayground() {
    return (
        <FadeSection>
            <div className="py-20 border-t border-[#27272A]">
                <div className="mx-auto max-w-[1200px] px-6">
                    <div className="grid grid-cols-12 gap-6 items-start">
                        <div className="col-span-12 lg:col-span-4">
                            <p className="text-xs text-[#FF6B00] uppercase tracking-widest mb-4" style={{ fontFamily: font.mono }}>
                                Feature 01
                            </p>
                            <h3
                                className="text-2xl lg:text-3xl font-bold tracking-tight text-[#E4E4E7]"
                                style={{ fontFamily: font.headline }}
                            >
                                Portfolio Playground
                            </h3>
                            <p className="mt-4 text-[#A1A1AA] leading-relaxed" style={{ fontFamily: font.body }}>
                                Experiment with your portfolio before you commit. Simulate trades,
                                rebalance allocations, and see the impact on your exposure — all
                                without risking a penny.
                            </p>
                        </div>
                        <div className="col-span-12 lg:col-span-7 lg:col-start-6">
                            <div className="bg-[#141414] border border-[#27272A] rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[#27272A] text-[#52525B]" style={{ fontFamily: font.mono }}>
                                            <th className="text-left px-4 py-3 font-medium">Ticker</th>
                                            <th className="text-left px-4 py-3 font-medium">Name</th>
                                            <th className="text-right px-4 py-3 font-medium">Weight</th>
                                            <th className="text-right px-4 py-3 font-medium">Target</th>
                                            <th className="text-right px-4 py-3 font-medium">Drift</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableData.map((row, i) => (
                                            <motion.tr
                                                key={row.ticker}
                                                initial={{ opacity: 0 }}
                                                whileInView={{ opacity: 1 }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.3, delay: i * 0.05 }}
                                                className={`${i < tableData.length - 1 ? "border-b border-[#27272A]/50" : ""} hover:bg-[#1A1A1A] transition-colors duration-150`}
                                            >
                                                <td className="px-4 py-3 text-[#22D3EE]" style={{ fontFamily: font.mono }}>
                                                    {row.ticker}
                                                </td>
                                                <td className="px-4 py-3 text-[#A1A1AA]">{row.name}</td>
                                                <td className="px-4 py-3 text-right text-[#E4E4E7]" style={{ fontFamily: font.mono }}>
                                                    {row.weight}
                                                </td>
                                                <td className="px-4 py-3 text-right text-[#52525B]" style={{ fontFamily: font.mono }}>
                                                    {row.target}
                                                </td>
                                                <td
                                                    className={`px-4 py-3 text-right ${row.ok ? "text-[#22C55E]" : "text-[#FF6B00]"}`}
                                                    style={{ fontFamily: font.mono }}
                                                >
                                                    {row.drift}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FadeSection>
    )
}

// ─── Feature 02: Look-Through Engine ─────────────────────────────────────────

const treemapBlocks = [
    { x: 0, y: 0, w: 200, h: 120, label: "US Equities", pct: "42%", color: "#22C55E" },
    { x: 200, y: 0, w: 140, h: 120, label: "EU Equities", pct: "18%", color: "#22D3EE" },
    { x: 340, y: 0, w: 100, h: 70, label: "UK Equities", pct: "14%", color: "#FF6B00" },
    { x: 340, y: 70, w: 100, h: 50, label: "Bonds", pct: "8%", color: "#A1A1AA" },
    { x: 0, y: 120, w: 130, h: 80, label: "Apple Inc", pct: "6.2%", color: "#22C55E" },
    { x: 130, y: 120, w: 110, h: 80, label: "Microsoft", pct: "5.8%", color: "#22C55E" },
    { x: 240, y: 120, w: 100, h: 80, label: "NVIDIA", pct: "4.1%", color: "#22C55E" },
    { x: 340, y: 120, w: 100, h: 80, label: "Other", pct: "1.9%", color: "#52525B" },
]

const exposureBars = [
    { name: "Apple Inc", pct: 7.2, w: 72 },
    { name: "Microsoft", pct: 6.8, w: 68 },
    { name: "Amazon", pct: 3.4, w: 34 },
    { name: "NVIDIA", pct: 3.1, w: 31 },
    { name: "TSMC", pct: 2.6, w: 26 },
]

function FeatureLookThrough() {
    return (
        <FadeSection>
            <div className="py-20 border-t border-[#27272A]">
                <div className="mx-auto max-w-[1200px] px-6">
                    <div className="grid grid-cols-12 gap-6 items-start">
                        <div className="col-span-12 lg:col-span-6">
                            <div className="bg-[#141414] border border-[#27272A] rounded-lg p-4">
                                <svg viewBox="0 0 440 200" className="w-full" style={{ fontFamily: font.mono }}>
                                    {treemapBlocks.map((b, i) => (
                                        <g key={i}>
                                            <rect
                                                x={b.x + 1}
                                                y={b.y + 1}
                                                width={b.w - 2}
                                                height={b.h - 2}
                                                rx={4}
                                                fill={b.color}
                                                fillOpacity={0.15}
                                                stroke={b.color}
                                                strokeOpacity={0.3}
                                                strokeWidth={1}
                                            />
                                            <text
                                                x={b.x + b.w / 2}
                                                y={b.y + b.h / 2 - 6}
                                                textAnchor="middle"
                                                fill={b.color}
                                                fontSize={b.w > 110 ? 11 : 9}
                                                fontWeight={500}
                                            >
                                                {b.label}
                                            </text>
                                            <text
                                                x={b.x + b.w / 2}
                                                y={b.y + b.h / 2 + 10}
                                                textAnchor="middle"
                                                fill={b.color}
                                                fontSize={b.w > 110 ? 13 : 10}
                                                fontWeight={700}
                                                fillOpacity={0.7}
                                            >
                                                {b.pct}
                                            </text>
                                        </g>
                                    ))}
                                </svg>
                            </div>
                        </div>
                        <div className="col-span-12 lg:col-span-5 lg:col-start-8">
                            <p className="text-xs text-[#FF6B00] uppercase tracking-widest mb-4" style={{ fontFamily: font.mono }}>
                                Feature 02
                            </p>
                            <h3
                                className="text-2xl lg:text-3xl font-bold tracking-tight text-[#E4E4E7]"
                                style={{ fontFamily: font.headline }}
                            >
                                Understand what you really own.
                            </h3>
                            <p className="mt-4 text-[#A1A1AA] leading-relaxed" style={{ fontFamily: font.body }}>
                                See through your ETFs to your real underlying exposure. Know exactly
                                how much Apple, US tech, or emerging markets you actually hold across
                                every account.
                            </p>

                            <div className="mt-8 bg-[#141414] border border-[#27272A] rounded-lg p-5">
                                <p className="text-[10px] font-semibold text-[#52525B] uppercase tracking-widest mb-4" style={{ fontFamily: font.mono }}>
                                    True Exposure
                                </p>
                                <div className="space-y-3">
                                    {exposureBars.map((e, i) => (
                                        <FadeSection key={e.name} delay={i * 0.08}>
                                            <div className="flex items-center gap-3">
                                                <span className="w-20 text-xs text-[#A1A1AA] truncate" style={{ fontFamily: font.mono }}>
                                                    {e.name}
                                                </span>
                                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#27272A]">
                                                    <motion.div
                                                        className="h-full rounded-full bg-[#FF6B00]"
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: `${e.w}%` }}
                                                        viewport={{ once: true }}
                                                        transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium text-[#E4E4E7] w-10 text-right" style={{ fontFamily: font.mono }}>
                                                    {e.pct}%
                                                </span>
                                            </div>
                                        </FadeSection>
                                    ))}
                                </div>
                                <p className="mt-4 text-[10px] text-[#52525B]" style={{ fontFamily: font.mono }}>
                                    Across 3 ETFs + 2 direct holdings
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FadeSection>
    )
}

// ─── Feature 03: Performance Analytics ───────────────────────────────────────

const portfolioLine = "M0,140 Q40,135 80,125 T160,105 T240,95 T320,80 T400,60 T480,50 T560,35 T640,25 T720,18 L760,12"
const benchmarkLine = "M0,140 Q40,138 80,132 T160,120 T240,115 T320,108 T400,95 T480,88 T560,78 T640,70 T720,62 L760,55"

const analyticsCards = [
    { label: "Sharpe Ratio", value: "1.42" },
    { label: "Beta", value: "0.87" },
    { label: "Max Drawdown", value: "-12.3%" },
    { label: "Volatility", value: "14.7%" },
]

function FeaturePerformance() {
    return (
        <FadeSection>
            <div className="py-20 border-t border-[#27272A]">
                <div className="mx-auto max-w-[1200px] px-6">
                    <div className="text-center mb-12">
                        <p className="text-xs text-[#FF6B00] uppercase tracking-widest mb-4" style={{ fontFamily: font.mono }}>
                            Feature 03
                        </p>
                        <h3
                            className="text-2xl lg:text-3xl font-bold tracking-tight text-[#E4E4E7]"
                            style={{ fontFamily: font.headline }}
                        >
                            Performance Analytics
                        </h3>
                        <p className="mt-4 text-[#A1A1AA] max-w-lg mx-auto" style={{ fontFamily: font.body }}>
                            Institutional-grade analytics without the institutional price tag.
                            Compare against benchmarks, track risk metrics, and understand your
                            returns over any timeframe.
                        </p>
                    </div>
                    <div className="bg-[#141414] border border-[#27272A] rounded-lg p-6">
                        <div className="flex items-center gap-6 mb-4">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-0.5 bg-[#22C55E] inline-block" />
                                <span className="text-xs text-[#A1A1AA]" style={{ fontFamily: font.mono }}>Portfolio</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-0.5 bg-[#52525B] inline-block" />
                                <span className="text-xs text-[#A1A1AA]" style={{ fontFamily: font.mono }}>Benchmark</span>
                            </div>
                        </div>
                        <svg viewBox="0 0 760 160" className="w-full" preserveAspectRatio="none">
                            {[0, 40, 80, 120, 160].map((y) => (
                                <line key={y} x1={0} y1={y} x2={760} y2={y} stroke="#27272A" strokeWidth={0.5} />
                            ))}
                            {[0, 95, 190, 285, 380, 475, 570, 665, 760].map((x) => (
                                <line key={x} x1={x} y1={0} x2={x} y2={160} stroke="#27272A" strokeWidth={0.5} />
                            ))}
                            <motion.path
                                d={benchmarkLine}
                                fill="none"
                                stroke="#52525B"
                                strokeWidth={1.5}
                                initial={{ pathLength: 0 }}
                                whileInView={{ pathLength: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                            <motion.path
                                d={portfolioLine}
                                fill="none"
                                stroke="#22C55E"
                                strokeWidth={2}
                                initial={{ pathLength: 0 }}
                                whileInView={{ pathLength: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                            />
                        </svg>
                        <div className="flex justify-between mt-3 text-xs text-[#52525B]" style={{ fontFamily: font.mono }}>
                            <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span><span>Dec</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        {analyticsCards.map((card, i) => (
                            <FadeSection key={card.label} delay={i * 0.08}>
                                <div className="bg-[#141414] border border-[#27272A] rounded-lg px-5 py-4">
                                    <p className="text-xs text-[#52525B] mb-1" style={{ fontFamily: font.mono }}>
                                        {card.label}
                                    </p>
                                    <p className="text-xl font-medium text-[#E4E4E7]" style={{ fontFamily: font.mono }}>
                                        {card.value}
                                    </p>
                                </div>
                            </FadeSection>
                        ))}
                    </div>
                </div>
            </div>
        </FadeSection>
    )
}

// ─── Features Section Wrapper ────────────────────────────────────────────────

export function FeaturesSection() {
    return (
        <section id="features" className="bg-[#0A1A0A]">
            <FeaturePlayground />
            <FeatureLookThrough />
            <FeaturePerformance />
        </section>
    )
}
