"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"

// ─── Design Tokens ────────────────────────────────────────────────────────────

const PRODUCT_NAME = "Invorm"

const font = {
    headline: "Space Grotesk, sans-serif",
    mono: "JetBrains Mono, monospace",
    body: "system-ui, -apple-system, sans-serif",
}

// ─── Utility: Section Fade-In ─────────────────────────────────────────────────

function FadeSection({
    children,
    className = "",
    delay = 0,
}: {
    children: React.ReactNode
    className?: string
    delay?: number
}) {
    const ref = useRef<HTMLDivElement>(null)
    const isInView = useInView(ref, { once: true, margin: "-80px" })

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function Navigation() {
    const links = [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "Docs", href: "#" },
    ]

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0C0C0C]/90 backdrop-blur-md border-b border-[#27272A]">
            <div className="mx-auto max-w-[1200px] px-6 h-16 flex items-center justify-between">
                <a
                    href="#"
                    className="text-lg font-bold tracking-tight text-[#E4E4E7]"
                    style={{ fontFamily: font.headline }}
                >
                    {PRODUCT_NAME}
                </a>
                <div className="flex items-center gap-8">
                    {links.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            className="text-sm text-[#A1A1AA] hover:text-[#E4E4E7] transition-colors duration-200"
                            style={{ fontFamily: font.body }}
                        >
                            {link.label}
                        </a>
                    ))}
                    <a
                        href="#"
                        className="text-sm font-medium text-[#0C0C0C] bg-[#FF6B00] px-4 py-2 rounded-[4px] hover:bg-[#FF6B00]/90 transition-colors duration-200"
                        style={{ fontFamily: font.body }}
                    >
                        Get Started
                    </a>
                </div>
            </div>
        </nav>
    )
}

// ─── Ticker Strip ─────────────────────────────────────────────────────────────

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

// ─── Dashboard Card (Hero right side) ─────────────────────────────────────────

function DashboardCard() {
    const holdings = [
        { ticker: "VUSA", name: "Vanguard S&P 500", value: "£24,350", pct: "+18.2%", positive: true },
        { ticker: "SWDA", name: "iShares World", value: "£18,720", pct: "+8.7%", positive: true },
        { ticker: "VUKE", name: "Vanguard FTSE 100", value: "£12,100", pct: "-2.1%", positive: false },
        { ticker: "IITU", name: "iShares US Tech", value: "£9,840", pct: "+22.4%", positive: true },
    ]

    return (
        <div className="bg-[#141414] border border-[#27272A] rounded-lg p-6 w-full max-w-[440px]">
            {/* Header */}
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
            {/* Mini chart line */}
            <div className="mb-6">
                <svg viewBox="0 0 400 60" className="w-full h-12" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
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
                        fill="url(#chartGrad)"
                    />
                </svg>
            </div>
            {/* Holdings list */}
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

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection() {
    return (
        <section className="pt-28 pb-0">
            <div className="mx-auto max-w-[1200px] px-6">
                <div className="grid grid-cols-12 gap-6 items-start">
                    {/* Left: headline + CTAs */}
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
                            <a
                                href="#"
                                className="inline-flex items-center gap-2 bg-[#FF6B00] text-[#0C0C0C] font-semibold text-sm px-6 py-3 rounded-[4px] hover:bg-[#FF6B00]/90 transition-colors duration-200"
                                style={{ fontFamily: font.body }}
                            >
                                Start Tracking
                                <span aria-hidden="true">&rarr;</span>
                            </a>
                            <a
                                href="#"
                                className="inline-flex items-center gap-2 border border-[#27272A] text-[#A1A1AA] font-medium text-sm px-6 py-3 rounded-[4px] hover:border-[#52525B] hover:text-[#E4E4E7] transition-colors duration-200"
                                style={{ fontFamily: font.body }}
                            >
                                View Demo
                            </a>
                        </motion.div>
                    </div>
                    {/* Right: Dashboard card */}
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
            {/* Ticker strip */}
            <div className="mt-16">
                <TickerStrip />
            </div>
        </section>
    )
}

// ─── Metrics Strip ────────────────────────────────────────────────────────────

function MetricsStrip() {
    const metrics = [
        { value: "\u00A3127,430.56", label: "tracked" },
        { value: "847", label: "holdings analysed" },
        { value: "12", label: "markets covered" },
        { value: "99.9%", label: "uptime" },
    ]

    return (
        <FadeSection>
            <section className="border-b border-[#27272A] py-10">
                <div className="mx-auto max-w-[1200px] px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {metrics.map((m) => (
                            <div key={m.label} className="text-center md:text-left">
                                <p
                                    className="text-2xl lg:text-3xl font-medium text-[#E4E4E7]"
                                    style={{ fontFamily: font.mono }}
                                >
                                    {m.value}
                                </p>
                                <p className="mt-1 text-sm text-[#52525B]" style={{ fontFamily: font.mono }}>
                                    {m.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </FadeSection>
    )
}

// ─── Problem Section ──────────────────────────────────────────────────────────

function ProblemSection() {
    const problems = [
        {
            num: "01",
            title: "Spreadsheets don't scale",
            desc: "You started with a simple sheet. Now it's 47 tabs, three broken GOOGLEFINANCE formulas, and a pivot table nobody understands. Your portfolio outgrew your tools.",
        },
        {
            num: "02",
            title: "Broker apps don't aggregate",
            desc: "ISA here, SIPP there, GIA somewhere else. Every broker shows you a fragment. Nobody shows you the whole picture across all your accounts.",
        },
        {
            num: "03",
            title: "You can't see through your ETFs",
            desc: "You hold VUSA and SWDA \u2014 but what's the overlap? What's your real exposure to Apple, or to US Tech? Without look-through, you're flying blind.",
        },
    ]

    return (
        <FadeSection>
            <section className="py-24">
                <div className="mx-auto max-w-[1200px] px-6">
                    <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12 lg:col-span-7">
                            <h2
                                className="text-3xl lg:text-4xl font-bold tracking-tight text-[#E4E4E7]"
                                style={{ fontFamily: font.headline }}
                            >
                                Your tools weren&rsquo;t built for this.
                            </h2>
                            <div className="mt-12 space-y-0">
                                {problems.map((p, i) => (
                                    <FadeSection key={p.num} delay={i * 0.1}>
                                        <div
                                            className={`py-8 ${i < problems.length - 1 ? "border-b border-[#27272A]" : ""} ${i === 0 ? "border-t border-[#27272A]" : ""}`}
                                        >
                                            <div className="flex items-start gap-6">
                                                <span
                                                    className="text-sm text-[#52525B] pt-1 shrink-0"
                                                    style={{ fontFamily: font.mono }}
                                                >
                                                    {p.num}
                                                </span>
                                                <div>
                                                    <h3
                                                        className="text-xl font-semibold text-[#E4E4E7]"
                                                        style={{ fontFamily: font.headline }}
                                                    >
                                                        {p.title}
                                                    </h3>
                                                    <p
                                                        className="mt-3 text-[#A1A1AA] leading-relaxed max-w-lg"
                                                        style={{ fontFamily: font.body }}
                                                    >
                                                        {p.desc}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </FadeSection>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </FadeSection>
    )
}

// ─── Feature Panel 1: The Playground ──────────────────────────────────────────

function FeaturePlayground() {
    const tableData = [
        { ticker: "VUSA", name: "Vanguard S&P 500 ETF", weight: "19.1%", target: "20.0%", drift: "-0.9%", ok: true },
        { ticker: "SWDA", name: "iShares Core MSCI World", weight: "14.7%", target: "15.0%", drift: "-0.3%", ok: true },
        { ticker: "VUKE", name: "Vanguard FTSE 100", weight: "11.2%", target: "10.0%", drift: "+1.2%", ok: false },
        { ticker: "IITU", name: "iShares S&P 500 IT Sector", weight: "7.7%", target: "8.0%", drift: "-0.3%", ok: true },
        { ticker: "SMT", name: "Scottish Mortgage Trust", weight: "6.4%", target: "5.0%", drift: "+1.4%", ok: false },
        { ticker: "EQQQ", name: "Invesco NASDAQ-100", weight: "5.8%", target: "6.0%", drift: "-0.2%", ok: true },
    ]

    return (
        <FadeSection>
            <div className="py-20 border-t border-[#27272A]">
                <div className="mx-auto max-w-[1200px] px-6">
                    <div className="grid grid-cols-12 gap-6 items-start">
                        {/* Left text */}
                        <div className="col-span-12 lg:col-span-4">
                            <p className="text-xs text-[#FF6B00] uppercase tracking-widest mb-4" style={{ fontFamily: font.mono }}>
                                Feature 01
                            </p>
                            <h3
                                className="text-2xl lg:text-3xl font-bold tracking-tight text-[#E4E4E7]"
                                style={{ fontFamily: font.headline }}
                            >
                                The Playground
                            </h3>
                            <p className="mt-4 text-[#A1A1AA] leading-relaxed" style={{ fontFamily: font.body }}>
                                Every holding in one place. Sort, filter, and organise across all your
                                accounts. See drift against target allocations instantly. Your portfolio
                                as data, not fragments.
                            </p>
                        </div>
                        {/* Right table */}
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

// ─── Feature Panel 2: Look-Through Engine ─────────────────────────────────────

function FeatureLookThrough() {
    // SVG treemap data
    const blocks = [
        { x: 0, y: 0, w: 200, h: 120, label: "US Equities", pct: "42%", color: "#22C55E" },
        { x: 200, y: 0, w: 140, h: 120, label: "EU Equities", pct: "18%", color: "#22D3EE" },
        { x: 340, y: 0, w: 100, h: 70, label: "UK Equities", pct: "14%", color: "#FF6B00" },
        { x: 340, y: 70, w: 100, h: 50, label: "Bonds", pct: "8%", color: "#A1A1AA" },
        { x: 0, y: 120, w: 130, h: 80, label: "Apple Inc", pct: "6.2%", color: "#22C55E" },
        { x: 130, y: 120, w: 110, h: 80, label: "Microsoft", pct: "5.8%", color: "#22C55E" },
        { x: 240, y: 120, w: 100, h: 80, label: "NVIDIA", pct: "4.1%", color: "#22C55E" },
        { x: 340, y: 120, w: 100, h: 80, label: "Other", pct: "1.9%", color: "#52525B" },
    ]

    return (
        <FadeSection>
            <div className="py-20 border-t border-[#27272A]">
                <div className="mx-auto max-w-[1200px] px-6">
                    <div className="grid grid-cols-12 gap-6 items-start">
                        {/* Left: treemap */}
                        <div className="col-span-12 lg:col-span-6">
                            <div className="bg-[#141414] border border-[#27272A] rounded-lg p-4">
                                <svg viewBox="0 0 440 200" className="w-full" style={{ fontFamily: font.mono }}>
                                    {blocks.map((b, i) => (
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
                        {/* Right text + exposure bars */}
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

                            {/* True Exposure progress bars */}
                            <div className="mt-8 bg-[#141414] border border-[#27272A] rounded-lg p-5">
                                <p className="text-[10px] font-semibold text-[#52525B] uppercase tracking-widest mb-4" style={{ fontFamily: font.mono }}>
                                    True Exposure
                                </p>
                                <div className="space-y-3">
                                    {[
                                        { name: "Apple Inc", pct: 7.2, w: 72 },
                                        { name: "Microsoft", pct: 6.8, w: 68 },
                                        { name: "Amazon", pct: 3.4, w: 34 },
                                        { name: "NVIDIA", pct: 3.1, w: 31 },
                                        { name: "TSMC", pct: 2.6, w: 26 },
                                    ].map((e, i) => (
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

// ─── Feature Panel 3: Performance Analytics ───────────────────────────────────

function FeaturePerformance() {
    // SVG multi-line chart
    const portfolioLine = "M0,140 Q40,135 80,125 T160,105 T240,95 T320,80 T400,60 T480,50 T560,35 T640,25 T720,18 L760,12"
    const benchmarkLine = "M0,140 Q40,138 80,132 T160,120 T240,115 T320,108 T400,95 T480,88 T560,78 T640,70 T720,62 L760,55"

    const analyticsCards = [
        { label: "Sharpe Ratio", value: "1.42" },
        { label: "Beta", value: "0.87" },
        { label: "Max Drawdown", value: "-12.3%" },
        { label: "Volatility", value: "14.7%" },
    ]

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
                    {/* Chart */}
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
                            {/* Grid lines */}
                            {[0, 40, 80, 120, 160].map((y) => (
                                <line
                                    key={y}
                                    x1={0}
                                    y1={y}
                                    x2={760}
                                    y2={y}
                                    stroke="#27272A"
                                    strokeWidth={0.5}
                                />
                            ))}
                            {[0, 95, 190, 285, 380, 475, 570, 665, 760].map((x) => (
                                <line
                                    key={x}
                                    x1={x}
                                    y1={0}
                                    x2={x}
                                    y2={160}
                                    stroke="#27272A"
                                    strokeWidth={0.5}
                                />
                            ))}
                            {/* Benchmark (behind) */}
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
                            {/* Portfolio line */}
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
                            <span>Jan</span>
                            <span>Mar</span>
                            <span>May</span>
                            <span>Jul</span>
                            <span>Sep</span>
                            <span>Nov</span>
                            <span>Dec</span>
                        </div>
                    </div>
                    {/* Metric cards */}
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

// ─── Features Section Wrapper ─────────────────────────────────────────────────

function FeaturesSection() {
    return (
        <section id="features" className="bg-[#0A1A0A]">
            <FeaturePlayground />
            <FeatureLookThrough />
            <FeaturePerformance />
        </section>
    )
}

// ─── AI Analyst Section ───────────────────────────────────────────────────────

function AIAnalystSection() {
    const chatMessages = [
        {
            sender: "user" as const,
            text: "What\u2019s my total exposure to US tech stocks across all accounts?",
        },
        {
            sender: "ai" as const,
            text: "Across your ISA, SIPP, and GIA, you have 34.2% exposure to US technology companies. This includes direct holdings like Apple (4.7%) and Microsoft (3.1%), plus indirect exposure through your Vanguard S&P 500 ETF which is 31% tech-weighted.",
        },
        {
            sender: "user" as const,
            text: "Am I too concentrated? What would you suggest?",
        },
        {
            sender: "ai" as const,
            text: "Your US tech concentration is above the global market weight of ~24%. Consider shifting 5\u201310% toward your FTSE All-World position for diversification. I can model how that rebalance would look across your accounts.",
        },
    ]

    return (
        <FadeSection>
            <section className="py-24 border-t border-[#27272A]">
                <div className="mx-auto max-w-[1200px] px-6">
                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-12 lg:col-span-5">
                            <p className="text-xs text-[#FF6B00] uppercase tracking-widest mb-4" style={{ fontFamily: font.mono }}>
                                AI Assistant
                            </p>
                            <h2
                                className="text-3xl lg:text-4xl font-bold tracking-tight text-[#E4E4E7]"
                                style={{ fontFamily: font.headline }}
                            >
                                Ask your portfolio anything.
                            </h2>
                            <p className="mt-4 text-[#A1A1AA] leading-relaxed" style={{ fontFamily: font.body }}>
                                An AI that knows your holdings, understands diversification, and
                                speaks in plain English. Not a chatbot &mdash; a co-pilot.
                            </p>
                        </div>
                        <div className="col-span-12 lg:col-span-6 lg:col-start-7">
                            <div className="bg-[#141414] border border-[#27272A] rounded-lg overflow-hidden">
                                {/* Window header */}
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#27272A] bg-[#0C0C0C]">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/60" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B00]/60" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]/60" />
                                    <span className="ml-3 text-xs text-[#52525B]" style={{ fontFamily: font.mono }}>
                                        {PRODUCT_NAME} &mdash; AI Chat
                                    </span>
                                </div>
                                {/* Chat bubbles */}
                                <div className="p-5 space-y-4 max-h-[420px] overflow-y-auto">
                                    {chatMessages.map((msg, i) => (
                                        <FadeSection key={i} delay={i * 0.12}>
                                            <div className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                                                <div
                                                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                                        msg.sender === "user"
                                                            ? "bg-[#FF6B00] text-white"
                                                            : "border border-[#27272A] bg-[#0C0C0C] text-[#E4E4E7]"
                                                    }`}
                                                    style={{ fontFamily: font.body }}
                                                >
                                                    {msg.text}
                                                </div>
                                            </div>
                                        </FadeSection>
                                    ))}
                                </div>
                                {/* Input bar */}
                                <div className="border-t border-[#27272A] px-4 py-3 flex items-center gap-3">
                                    <span className="flex-1 text-sm text-[#52525B]" style={{ fontFamily: font.body }}>
                                        Ask about your portfolio...
                                    </span>
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF6B00]">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="white"
                                            className="h-3.5 w-3.5"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </FadeSection>
    )
}

// ─── Pricing Section ──────────────────────────────────────────────────────────

function PricingSection() {
    const tiers = [
        {
            name: "Free",
            price: "\u00A30.00",
            period: "/month",
            description: "For getting started",
            features: [
                "1 portfolio",
                "Up to 10 holdings",
                "Basic allocation view",
                "Manual price updates",
                "Community support",
            ],
            cta: "Start Free",
            highlighted: false,
        },
        {
            name: "Pro",
            price: "\u00A39.99",
            period: "/month",
            description: "For serious investors",
            features: [
                "Unlimited portfolios",
                "Unlimited holdings",
                "ETF look-through analysis",
                "Live prices & alerts",
                "AI analyst chat",
                "Performance analytics",
                "CSV import & export",
                "Priority support",
            ],
            cta: "Start Pro Trial",
            highlighted: true,
        },
        {
            name: "Advisor",
            price: "\u00A349.99",
            period: "/month",
            description: "For professionals",
            features: [
                "Everything in Pro",
                "Client portfolio management",
                "White-label reports",
                "API access",
                "Custom benchmarks",
                "Dedicated account manager",
                "SSO & team management",
                "SLA guarantee",
            ],
            cta: "Contact Sales",
            highlighted: false,
        },
    ]

    return (
        <FadeSection>
            <section id="pricing" className="py-24 border-t border-[#27272A]">
                <div className="mx-auto max-w-[1200px] px-6">
                    <div className="text-center mb-16">
                        <h2
                            className="text-3xl lg:text-4xl font-bold tracking-tight text-[#E4E4E7]"
                            style={{ fontFamily: font.headline }}
                        >
                            Transparent pricing
                        </h2>
                        <p className="mt-4 text-[#A1A1AA]" style={{ fontFamily: font.body }}>
                            Start free. Upgrade when you&rsquo;re ready.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {tiers.map((tier, i) => (
                            <FadeSection key={tier.name} delay={i * 0.1}>
                                <div
                                    className={`relative bg-[#141414] border rounded-lg p-6 flex flex-col ${
                                        tier.highlighted
                                            ? "border-l-[#FF6B00] border-l-2 border-t-[#27272A] border-r-[#27272A] border-b-[#27272A]"
                                            : "border-[#27272A]"
                                    }`}
                                >
                                    {tier.highlighted && (
                                        <span
                                            className="absolute -top-3 left-6 bg-[#FF6B00] text-[#0C0C0C] text-xs font-semibold px-3 py-1 rounded-[3px]"
                                            style={{ fontFamily: font.mono }}
                                        >
                                            POPULAR
                                        </span>
                                    )}
                                    <div className="mb-6">
                                        <h3
                                            className="text-lg font-semibold text-[#E4E4E7]"
                                            style={{ fontFamily: font.headline }}
                                        >
                                            {tier.name}
                                        </h3>
                                        <p className="text-sm text-[#52525B] mt-1" style={{ fontFamily: font.body }}>
                                            {tier.description}
                                        </p>
                                    </div>
                                    <div className="mb-6">
                                        <span
                                            className="text-3xl font-bold text-[#E4E4E7]"
                                            style={{ fontFamily: font.mono }}
                                        >
                                            {tier.price}
                                        </span>
                                        <span className="text-sm text-[#52525B] ml-1" style={{ fontFamily: font.mono }}>
                                            {tier.period}
                                        </span>
                                    </div>
                                    <ul className="space-y-3 mb-8 flex-1">
                                        {tier.features.map((f) => (
                                            <li key={f} className="flex items-start gap-3 text-sm">
                                                <span className="text-[#FF6B00] mt-0.5 shrink-0">&check;</span>
                                                <span className="text-[#A1A1AA]">{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <a
                                        href="#"
                                        className={`block text-center text-sm font-semibold py-3 rounded-[4px] transition-colors duration-200 ${
                                            tier.highlighted
                                                ? "bg-[#FF6B00] text-[#0C0C0C] hover:bg-[#FF6B00]/90"
                                                : "border border-[#27272A] text-[#A1A1AA] hover:border-[#52525B] hover:text-[#E4E4E7]"
                                        }`}
                                        style={{ fontFamily: font.body }}
                                    >
                                        {tier.cta}
                                    </a>
                                </div>
                            </FadeSection>
                        ))}
                    </div>
                </div>
            </section>
        </FadeSection>
    )
}

// ─── Footer CTA ───────────────────────────────────────────────────────────────

function FooterCTA() {
    return (
        <FadeSection>
            <section className="py-24 border-t border-[#27272A]">
                <div className="mx-auto max-w-[1200px] px-6">
                    <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12 lg:col-span-8">
                            <h2
                                className="text-3xl lg:text-4xl font-bold tracking-tight text-[#E4E4E7]"
                                style={{ fontFamily: font.headline }}
                            >
                                Ready to see what you really own?
                            </h2>
                            <div className="mt-8 flex items-center gap-4">
                                <a
                                    href="#"
                                    className="inline-flex items-center gap-2 bg-[#FF6B00] text-[#0C0C0C] font-semibold text-sm px-6 py-3 rounded-[4px] hover:bg-[#FF6B00]/90 transition-colors duration-200"
                                    style={{ fontFamily: font.body }}
                                >
                                    Start Tracking
                                    <span aria-hidden="true">&rarr;</span>
                                </a>
                            </div>
                            <p className="mt-4 text-sm text-[#52525B]" style={{ fontFamily: font.mono }}>
                                Free tier available. No credit card required.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </FadeSection>
    )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
    const columns = [
        {
            title: "Product",
            links: ["Features", "Pricing", "Changelog", "Roadmap"],
        },
        {
            title: "Company",
            links: ["About", "Blog", "Careers", "Press"],
        },
        {
            title: "Legal",
            links: ["Privacy", "Terms", "Security", "Cookies"],
        },
        {
            title: "Connect",
            links: ["Twitter", "LinkedIn", "Discord", "Support"],
        },
    ]

    return (
        <footer className="border-t border-[#27272A] py-16">
            <div className="mx-auto max-w-[1200px] px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {columns.map((col) => (
                        <div key={col.title}>
                            <h4
                                className="text-xs text-[#52525B] uppercase tracking-widest mb-4"
                                style={{ fontFamily: font.mono }}
                            >
                                {col.title}
                            </h4>
                            <ul className="space-y-3">
                                {col.links.map((link) => (
                                    <li key={link}>
                                        <a
                                            href="#"
                                            className="text-sm text-[#A1A1AA] hover:text-[#E4E4E7] transition-colors duration-200"
                                            style={{ fontFamily: font.body }}
                                        >
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="mt-12 pt-8 border-t border-[#27272A] flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-[#52525B]" style={{ fontFamily: font.mono }}>
                        &copy; {new Date().getFullYear()} {PRODUCT_NAME}. All rights reserved.
                    </p>
                    <p className="text-xs text-[#52525B]" style={{ fontFamily: font.mono }}>
                        Built in London, UK
                    </p>
                </div>
            </div>
        </footer>
    )
}

// ─── Page Composition ─────────────────────────────────────────────────────────

export default function SwissPrecisionPage() {
    return (
        <>
            <Navigation />
            <HeroSection />
            <MetricsStrip />
            <ProblemSection />
            <FeaturesSection />
            <AIAnalystSection />
            <PricingSection />
            <FooterCTA />
            <Footer />
        </>
    )
}
