"use client"

import { font } from "./tokens"
import { FadeSection } from "./FadeSection"

// ─── Infographic 01: Excel-style Spreadsheet ─────────────────────────────────

function SpreadsheetChaos() {
    return (
        <svg viewBox="0 0 280 180" fill="none" className="w-full h-auto">
            {/* Excel-style title bar */}
            <rect x="0" y="0" width="280" height="20" rx="3" fill="#217346" />
            <text x="8" y="14" fontSize="8" fill="#fff" fontFamily="monospace" fontWeight="600">Portfolio_tracker_FINAL_v47.xlsx</text>
            <rect x="250" y="4" width="8" height="8" rx="1" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.6" />
            <line x1="260" y1="4" x2="268" y2="12" stroke="#fff" strokeWidth="0.8" opacity="0.6" />
            <line x1="268" y1="4" x2="260" y2="12" stroke="#fff" strokeWidth="0.8" opacity="0.6" />

            {/* Ribbon bar */}
            <rect x="0" y="20" width="280" height="14" fill="#E7E6E6" />
            <text x="6" y="30" fontSize="7" fill="#333" fontFamily="system-ui" fontWeight="500">Home</text>
            <text x="30" y="30" fontSize="7" fill="#666" fontFamily="system-ui">Insert</text>
            <text x="54" y="30" fontSize="7" fill="#666" fontFamily="system-ui">Formulas</text>
            <text x="86" y="30" fontSize="7" fill="#666" fontFamily="system-ui">Data</text>

            {/* Formula bar */}
            <rect x="0" y="34" width="280" height="14" fill="#F3F3F3" />
            <rect x="0" y="34" width="30" height="14" fill="#E7E6E6" stroke="#D4D4D4" strokeWidth="0.5" />
            <text x="7" y="44" fontSize="7" fill="#333" fontFamily="monospace">D7</text>
            <text x="34" y="44" fontSize="7" fill="#CC0000" fontFamily="monospace">=GOOGLEFINANCE(&quot;LON:VUSA&quot;,&quot;price&quot;) — #REF!</text>

            {/* Column headers */}
            <rect x="0" y="48" width="280" height="14" fill="#F9F9F9" />
            <rect x="0" y="48" width="24" height="14" fill="#F3F3F3" stroke="#D4D4D4" strokeWidth="0.5" />
            {["A", "B", "C", "D", "E", "F", "G"].map((col, i) => (
                <g key={col}>
                    <rect x={24 + i * 38} y={48} width={38} height={14} fill="#F9F9F9" stroke="#D4D4D4" strokeWidth="0.5" />
                    <text x={24 + i * 38 + 19} y={58} fontSize="7" fill="#666" fontFamily="system-ui" textAnchor="middle">{col}</text>
                </g>
            ))}

            {/* Row data */}
            {[
                { row: "1", cells: ["Ticker", "Name", "Qty", "Price", "Value", "Gain", "%"] },
                { row: "2", cells: ["VUSA", "Vanguard S&P", "150", "#REF!", "#REF!", "#ERR", "#ERR"] },
                { row: "3", cells: ["SWDA", "iShares World", "80", "£72.41", "£5,793", "£412", "7.6%"] },
                { row: "4", cells: ["SMT", "Scottish Mtg", "200", "#N/A", "#N/A", "#N/A", "#N/A"] },
                { row: "5", cells: ["VUKE", "FTSE 100", "300", "£31.20", "£9,360", "", ""] },
                { row: "6", cells: ["EQQQ", "NASDAQ-100", "45", "£289.5", "####", "####", "####"] },
                { row: "7", cells: ["", "", "", "", "", "", ""] },
            ].map((r, ri) => (
                <g key={ri}>
                    <rect x={0} y={62 + ri * 14} width={24} height={14} fill="#F3F3F3" stroke="#D4D4D4" strokeWidth="0.5" />
                    <text x={12} y={72 + ri * 14} fontSize="7" fill="#666" fontFamily="monospace" textAnchor="middle">{r.row}</text>
                    {r.cells.map((cell, ci) => {
                        const isError = cell.startsWith("#")
                        const isHeader = ri === 0
                        return (
                            <g key={ci}>
                                <rect
                                    x={24 + ci * 38}
                                    y={62 + ri * 14}
                                    width={38}
                                    height={14}
                                    fill={isError ? "#FFF0F0" : "#fff"}
                                    stroke="#D4D4D4"
                                    strokeWidth="0.5"
                                />
                                <text
                                    x={24 + ci * 38 + 3}
                                    y={72 + ri * 14}
                                    fontSize="6.5"
                                    fill={isError ? "#CC0000" : isHeader ? "#333" : "#555"}
                                    fontFamily="monospace"
                                    fontWeight={isHeader ? "600" : "400"}
                                >
                                    {cell}
                                </text>
                            </g>
                        )
                    })}
                </g>
            ))}

            {/* Sheet tabs at bottom */}
            <rect x="0" y="160" width="280" height="20" fill="#E7E6E6" rx="0" />
            {["Sheet1", "ISA", "SIPP", "Dividends", "...+43"].map((tab, i) => (
                <g key={tab}>
                    <rect
                        x={4 + i * 52}
                        y={163}
                        width={50}
                        height={14}
                        rx={2}
                        fill={i === 0 ? "#fff" : "#D9D9D9"}
                        stroke="#BFBFBF"
                        strokeWidth="0.5"
                    />
                    <text
                        x={4 + i * 52 + 25}
                        y={173}
                        fontSize="6"
                        fill={i === 4 ? "#999" : "#555"}
                        fontFamily="system-ui"
                        textAnchor="middle"
                    >
                        {tab}
                    </text>
                </g>
            ))}
        </svg>
    )
}

// ─── Infographic 02: Broker Apps (Real Brands) ───────────────────────────────

const brokers = [
    { name: "Hargreaves Lansdown", account: "Lifetime ISA", logo: "/brands/HL.png", color: "#4A7FBB" },
    { name: "Interactive Investor", account: "S&S ISA", logo: "/brands/ii.jpg", color: "#6666FF" },
    { name: "Trading 212", account: "Stocks & Shares", logo: "/brands/T212.png", color: "#FF903B" },
    { name: "Vanguard", account: "SIPP", logo: "/brands/vanguard.jpg", color: "#52525B" },
    { name: "HSBC", account: "ISA", logo: "/brands/hsbc.png", color: "#DB0011" },
    { name: "IG", account: "Share Dealing", logo: "/brands/IG.webp", color: "#E8395A" },
    { name: "Lloyds", account: "Ready-Made", logo: "/brands/lloyds.avif", color: "#006A4E" },
]

function BrokerApps() {
    const positions = [
        { x: "8%", y: "2%", rotate: -6, size: 64 },
        { x: "55%", y: "0%", rotate: 4, size: 58 },
        { x: "78%", y: "15%", rotate: -3, size: 54 },
        { x: "25%", y: "30%", rotate: 8, size: 68 },
        { x: "62%", y: "38%", rotate: -5, size: 56 },
        { x: "5%", y: "55%", rotate: 3, size: 60 },
        { x: "48%", y: "65%", rotate: -7, size: 52 },
    ]
    return (
        <div className="w-full relative" style={{ height: 220 }}>
            {brokers.map((b, i) => {
                const pos = positions[i]
                return (
                    <div
                        key={b.name}
                        className="absolute group"
                        style={{
                            left: pos.x,
                            top: pos.y,
                            transform: `rotate(${pos.rotate}deg)`,
                        }}
                    >
                        <div
                            className="rounded-full border-2 border-dashed p-1.5 transition-all duration-300 group-hover:scale-110 group-hover:border-solid"
                            style={{
                                borderColor: b.color + "50",
                                backgroundColor: b.color + "0A",
                                width: pos.size,
                                height: pos.size,
                            }}
                        >
                            <img
                                src={b.logo}
                                alt={b.name}
                                className="w-full h-full rounded-full object-contain bg-white/90 p-1"
                            />
                        </div>
                        <span
                            className="block text-center text-[9px] mt-1 opacity-50 group-hover:opacity-100 transition-opacity"
                            style={{ color: b.color, fontFamily: font.mono }}
                        >
                            {b.account}
                        </span>
                    </div>
                )
            })}
            {/* Dashed disconnect lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                <line x1="18%" y1="30%" x2="35%" y2="42%" stroke="#52525B" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.2" />
                <line x1="60%" y1="15%" x2="50%" y2="38%" stroke="#52525B" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.2" />
                <line x1="85%" y1="30%" x2="72%" y2="50%" stroke="#52525B" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.2" />
                <line x1="15%" y1="72%" x2="48%" y2="75%" stroke="#52525B" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.2" />
            </svg>
        </div>
    )
}

// ─── Infographic 03: ETF Overlap ─────────────────────────────────────────────

function ETFOverlap() {
    return (
        <svg viewBox="0 0 280 180" fill="none" className="w-full h-auto">
            {/* VUSA circle */}
            <circle cx="105" cy="90" r="58" stroke="#22D3EE" strokeWidth="1.5" fill="#22D3EE" fillOpacity="0.06" />
            <text x="68" y="65" fontSize="11" fill="#22D3EE" fontFamily="monospace" fontWeight="600">VUSA</text>
            <text x="56" y="80" fontSize="7" fill="#52525B" fontFamily="monospace">S&amp;P 500</text>

            {/* SWDA circle */}
            <circle cx="175" cy="90" r="58" stroke="#FF6B00" strokeWidth="1.5" fill="#FF6B00" fillOpacity="0.06" />
            <text x="190" y="65" fontSize="11" fill="#FF6B00" fontFamily="monospace" fontWeight="600">SWDA</text>
            <text x="190" y="80" fontSize="7" fill="#52525B" fontFamily="monospace">MSCI World</text>

            {/* Overlap zone */}
            <clipPath id="clipVUSA">
                <circle cx="105" cy="90" r="58" />
            </clipPath>
            <circle cx="175" cy="90" r="58" fill="#EF4444" fillOpacity="0.15" clipPath="url(#clipVUSA)" />

            {/* Overlap tickers */}
            <text x="140" y="86" fontSize="8" fill="#EF4444" fontFamily="monospace" textAnchor="middle" fontWeight="500" opacity="0.9">AAPL 7.2%</text>
            <text x="140" y="98" fontSize="8" fill="#EF4444" fontFamily="monospace" textAnchor="middle" fontWeight="500" opacity="0.7">MSFT 6.1%</text>
            <text x="140" y="110" fontSize="8" fill="#EF4444" fontFamily="monospace" textAnchor="middle" fontWeight="500" opacity="0.5">NVDA 5.4%</text>

            {/* Warning label */}
            <rect x="80" y="158" width="120" height="16" rx="3" fill="#EF4444" fillOpacity="0.1" stroke="#EF4444" strokeWidth="0.5" strokeOpacity="0.3" />
            <text x="140" y="170" fontSize="8" fill="#EF4444" fontFamily="monospace" textAnchor="middle" fontWeight="600">⚠ 62% overlap</text>
        </svg>
    )
}

const problems = [
    {
        num: "01",
        title: "Spreadsheets don\u2019t update",
        desc: "You started with a simple sheet. Now it\u2019s 47 tabs, broken GOOGLEFINANCE formulas, and a pivot table nobody understands. Your portfolio outgrew your tools.",
        visual: SpreadsheetChaos,
    },
    {
        num: "02",
        title: "Your accounts are disconnected",
        desc: "Lifetime ISA here, Stocks & Shares ISA there, SIPP somewhere else. No way of knowing your whole portfolio breakdown and exposure.",
        visual: BrokerApps,
    },
    {
        num: "03",
        title: "You probably have ETF overlap",
        desc: "You hold VUSA and SWDA \u2014 but what\u2019s the overlap? You could be double-exposed to Apple without even knowing. Without look-through, you\u2019re flying blind.",
        visual: ETFOverlap,
    },
]

export function ProblemSection() {
    return (
        <FadeSection>
            <section className="py-24">
                <div className="mx-auto max-w-[1200px] px-6">
                    <h2
                        className="text-3xl lg:text-4xl font-bold tracking-tight text-[#E4E4E7]"
                        style={{ fontFamily: font.headline }}
                    >
                        The tools you use are outdated.
                    </h2>
                    <div className="mt-12 space-y-0">
                        {problems.map((p, i) => (
                            <FadeSection key={p.num} delay={i * 0.1}>
                                <div
                                    className={`py-8 ${i < problems.length - 1 ? "border-b border-[#27272A]" : ""} ${i === 0 ? "border-t border-[#27272A]" : ""}`}
                                >
                                    <div className="grid grid-cols-12 gap-6 items-center">
                                        <div className="col-span-12 lg:col-span-6 flex items-start gap-6">
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
                                        <div className="col-span-12 lg:col-span-6 flex justify-center lg:justify-end">
                                            <div className="w-full max-w-[300px] opacity-80 hover:opacity-100 transition-opacity duration-300">
                                                <p.visual />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </FadeSection>
                        ))}
                    </div>
                </div>
            </section>
        </FadeSection>
    )
}
