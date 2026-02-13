"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

/* ─── Typewriter Hook ─── */
function useTypewriter(words: string[], speed = 100, pause = 2000) {
    const [text, setText] = useState("")
    const [wordIndex, setWordIndex] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const current = words[wordIndex]
        const timeout = setTimeout(() => {
            if (!isDeleting) {
                setText(current.slice(0, text.length + 1))
                if (text.length === current.length) {
                    setTimeout(() => setIsDeleting(true), pause)
                }
            } else {
                setText(current.slice(0, text.length - 1))
                if (text.length === 0) {
                    setIsDeleting(false)
                    setWordIndex((prev) => (prev + 1) % words.length)
                }
            }
        }, isDeleting ? speed / 2 : speed)

        return () => clearTimeout(timeout)
    }, [text, isDeleting, wordIndex, words, speed, pause])

    return text
}

/* ─── Scroll Animation Hook ─── */
function useScrollReveal() {
    const ref = useRef<HTMLDivElement>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
            { threshold: 0.1 }
        )
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [])

    return { ref, isVisible }
}

function RevealSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    const { ref, isVisible } = useScrollReveal()
    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
        >
            {children}
        </div>
    )
}

/* ═══════════════════════════════════ HERO ═══════════════════════════════════ */
function HeroSection() {
    const cyclingWord = useTypewriter(["Excel.", "Broker apps.", "Guesswork."], 80, 1800)

    return (
        <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-neutral-400 mb-8">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    Now in early access
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
                    <span className="text-white">Stop managing </span>
                    <br className="hidden sm:block" />
                    <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                        {cyclingWord}
                    </span>
                    <span className="text-orange-500/60 animate-pulse">|</span>
                </h1>

                <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                    Your broker&apos;s app was never built for you. <strong className="text-neutral-200">Invest</strong> is
                    the Second Brain for your portfolio — like ChatGPT, but for your investments.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/register"
                        className="w-full sm:w-auto text-center font-semibold bg-gradient-to-r from-orange-500 to-amber-500 text-black px-8 py-3.5 rounded-full text-base hover:shadow-[0_0_30px_rgba(255,107,0,0.4)] transition-all duration-300 hover:scale-[1.02]"
                    >
                        Get Started Free
                    </Link>
                    <a
                        href="#features"
                        className="w-full sm:w-auto text-center font-medium text-neutral-300 px-8 py-3.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-base"
                    >
                        See how it works
                    </a>
                </div>
            </div>

            {/* Dashboard preview mockup */}
            <div className="max-w-5xl mx-auto mt-16 sm:mt-20">
                <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden shadow-[0_0_60px_rgba(255,107,0,0.08)]">
                    {/* Window chrome */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                        <div className="w-3 h-3 rounded-full bg-red-500/60" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                        <div className="w-3 h-3 rounded-full bg-green-500/60" />
                        <span className="ml-3 text-xs text-neutral-500">invest.app/dashboard</span>
                    </div>
                    {/* Mock dashboard content */}
                    <div className="p-6 sm:p-8">
                        <div className="flex items-baseline justify-between mb-6">
                            <div>
                                <p className="text-sm text-neutral-500 mb-1">Total Portfolio Value</p>
                                <p className="text-3xl sm:text-4xl font-light text-white tracking-tight">£127,430.56</p>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">+12.4%</span>
                            </div>
                        </div>
                        {/* Chart area */}
                        <div className="h-48 sm:h-56 rounded-xl bg-gradient-to-b from-orange-500/5 to-transparent border border-white/5 flex items-end p-4">
                            <svg viewBox="0 0 400 120" className="w-full h-full" fill="none">
                                <defs>
                                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="rgb(255,107,0)" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="rgb(255,107,0)" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <path d="M0,100 C30,90 60,85 100,70 C140,55 170,60 200,45 C230,30 260,35 300,20 C340,5 370,10 400,8 L400,120 L0,120Z" fill="url(#chartGrad)" />
                                <path d="M0,100 C30,90 60,85 100,70 C140,55 170,60 200,45 C230,30 260,35 300,20 C340,5 370,10 400,8" stroke="rgb(255,107,0)" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        {/* Holdings preview */}
                        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { name: "Vanguard S&P 500", ticker: "VUSA", pct: "+15.2%", color: "text-emerald-400" },
                                { name: "iShares MSCI World", ticker: "SWDA", pct: "+8.7%", color: "text-emerald-400" },
                                { name: "Vanguard FTSE 100", ticker: "VUKE", pct: "-2.1%", color: "text-red-400" },
                                { name: "Cash", ticker: "GBP", pct: "—", color: "text-neutral-400" },
                            ].map((h) => (
                                <div key={h.ticker} className="bg-white/[0.03] rounded-lg px-3 py-2.5 border border-white/5">
                                    <p className="text-xs text-neutral-500">{h.ticker}</p>
                                    <p className="text-sm text-white truncate">{h.name}</p>
                                    <p className={`text-xs font-medium ${h.color} mt-1`}>{h.pct}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

/* ═══════════════════════════════ PROBLEM CARDS ═══════════════════════════════ */
function ProblemSection() {
    const problems = [
        {
            icon: "📊",
            title: "Excel Hell",
            description: "47 tabs. 12 broken formulas. No idea what you actually own.",
        },
        {
            icon: "📱",
            title: "Broker App Prison",
            description: "Great for buying. Terrible for understanding.",
        },
        {
            icon: "🔍",
            title: "The Blind Spot",
            description: "You own an S&P 500 ETF. But do you know you're 7% Apple?",
        },
    ]

    return (
        <section className="py-24 sm:py-32 px-6 lg:px-8">
            <RevealSection>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-sm font-medium text-orange-400 uppercase tracking-widest mb-3">The Problem</p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white">
                            You deserve better tools.
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {problems.map((p) => (
                            <div
                                key={p.title}
                                className="group relative rounded-2xl p-6 bg-white/[0.03] border border-white/5 hover:border-orange-500/20 transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,107,0,0.06)]"
                            >
                                <div className="text-3xl mb-4">{p.icon}</div>
                                <h3 className="text-lg font-semibold text-white mb-2">{p.title}</h3>
                                <p className="text-sm text-neutral-400 leading-relaxed">{p.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </RevealSection>
        </section>
    )
}

/* ═══════════════════════════════ FEATURES ═══════════════════════════════ */
function FeaturesSection() {
    const features = [
        {
            title: "Playground Grid",
            description: "Your holdings, your way. Drag, drop, section, draft — build your portfolio like a pro.",
            detail: "ISA • SIPP • GIA — all in one view",
        },
        {
            title: "Look-Through Engine",
            description: "See through your ETFs to the actual companies you own. Real exposure, real understanding.",
            detail: "Know your true allocation",
        },
        {
            title: "Performance Analytics",
            description: "Real returns tracked over time. Sharpe ratio, beta, volatility — not broker vanity metrics.",
            detail: "Powered by real financial math",
        },
    ]

    return (
        <section id="features" className="py-24 sm:py-32 px-6 lg:px-8">
            <RevealSection>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-sm font-medium text-orange-400 uppercase tracking-widest mb-3">The Solution</p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                            Everything in one place.
                        </h2>
                        <p className="text-neutral-400 max-w-xl mx-auto">
                            A professional workspace that replaces your spreadsheets, aggregates your accounts,
                            and actually helps you understand what you own.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {features.map((f, i) => (
                            <div
                                key={f.title}
                                className="group flex flex-col md:flex-row items-start gap-6 p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-orange-500/15 transition-all duration-500"
                            >
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/20 flex items-center justify-center">
                                    <span className="text-orange-400 font-bold">{i + 1}</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-white mb-2">{f.title}</h3>
                                    <p className="text-neutral-400 leading-relaxed mb-2">{f.description}</p>
                                    <p className="text-xs text-orange-400/70 font-medium uppercase tracking-wider">{f.detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </RevealSection>
        </section>
    )
}

/* ═══════════════════════════════ AI ANALYST ═══════════════════════════════ */
function AiSection() {
    const messages = [
        { role: "user" as const, text: "Am I overweight in tech?" },
        { role: "ai" as const, text: "Yes — 34% of your portfolio is tech exposure via 3 ETFs. Your target allocation is 25%. Here's a rebalancing suggestion that would bring you within 2% of target with just 2 trades." },
        { role: "user" as const, text: "What's my biggest risk right now?" },
        { role: "ai" as const, text: "Concentration risk: 18% of your total portfolio is exposed to just 5 US mega-caps through your ETF holdings. Consider diversifying into VUKE or adding a small-cap allocation." },
    ]

    return (
        <section id="ai" className="py-24 sm:py-32 px-6 lg:px-8">
            <RevealSection>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-sm font-medium text-orange-400 uppercase tracking-widest mb-3">AI Intelligence</p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                            Ask your portfolio anything.
                        </h2>
                        <p className="text-neutral-400 max-w-xl mx-auto">
                            Like ChatGPT, but it knows your holdings, your targets, and your actual exposure.
                        </p>
                    </div>

                    {/* Chat mockup */}
                    <div className="max-w-2xl mx-auto rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                            <span className="text-sm text-neutral-400 font-medium">Invest AI Analyst</span>
                        </div>
                        <div className="p-5 space-y-4 max-h-[400px] overflow-y-auto">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div
                                        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.role === "user"
                                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-black rounded-br-sm"
                                            : "bg-white/[0.05] text-neutral-300 border border-white/5 rounded-bl-sm"
                                            }`}
                                    >
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-white/5">
                            <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/[0.03] border border-white/10">
                                <span className="text-sm text-neutral-500 flex-1">Ask about your portfolio...</span>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </RevealSection>
        </section>
    )
}

/* ═══════════════════════════════ PRICING ═══════════════════════════════ */
function PricingSection() {
    const tiers = [
        {
            name: "Free",
            price: "£0",
            period: "forever",
            description: "Get started with the basics.",
            features: ["1 portfolio", "Manual entry", "Basic performance chart", "CSV import"],
            cta: "Start Free",
            highlight: false,
        },
        {
            name: "Pro",
            price: "£9.99",
            period: "/month",
            description: "For serious investors.",
            features: [
                "Unlimited portfolios",
                "Live prices",
                "Look-through analysis",
                "AI Analyst chat",
                "Performance analytics",
                "Priority support",
            ],
            cta: "Start Pro Trial",
            highlight: true,
        },
        {
            name: "Enterprise",
            price: "£49.99",
            period: "/month",
            description: "Full power for professionals.",
            features: [
                "Everything in Pro",
                "AI Agent (auto-rebalance)",
                "API access",
                "White-label reports",
                "Dedicated support",
                "Custom integrations",
            ],
            cta: "Contact Sales",
            highlight: false,
        },
    ]

    return (
        <section id="pricing" className="py-24 sm:py-32 px-6 lg:px-8">
            <RevealSection>
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-sm font-medium text-orange-400 uppercase tracking-widest mb-3">Pricing</p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                            Simple, transparent pricing.
                        </h2>
                        <p className="text-neutral-400">No hidden fees. Cancel anytime.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {tiers.map((t) => (
                            <div
                                key={t.name}
                                className={`relative rounded-2xl p-6 sm:p-8 border transition-all duration-500 ${t.highlight
                                    ? "bg-white/[0.05] border-orange-500/30 shadow-[0_0_40px_rgba(255,107,0,0.08)]"
                                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                    }`}
                            >
                                {t.highlight && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                                            Most Popular
                                        </span>
                                    </div>
                                )}
                                <h3 className="text-lg font-semibold text-white mb-1">{t.name}</h3>
                                <p className="text-sm text-neutral-500 mb-4">{t.description}</p>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-white">{t.price}</span>
                                    <span className="text-neutral-500 text-sm ml-1">{t.period}</span>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {t.features.map((f) => (
                                        <li key={f} className="flex items-start gap-2.5 text-sm text-neutral-300">
                                            <svg className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href="/register"
                                    className={`block text-center font-medium py-3 rounded-full transition-all duration-300 ${t.highlight
                                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:shadow-[0_0_20px_rgba(255,107,0,0.3)]"
                                        : "border border-white/10 text-neutral-300 hover:bg-white/5"
                                        }`}
                                >
                                    {t.cta}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </RevealSection>
        </section>
    )
}

/* ═══════════════════════════════ FOOTER CTA ═══════════════════════════════ */
function FooterCta() {
    return (
        <section className="py-24 sm:py-32 px-6 lg:px-8">
            <RevealSection>
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                        <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                            Your portfolio deserves better
                        </span>
                        <br />
                        <span className="text-white">than a spreadsheet.</span>
                    </h2>
                    <p className="text-neutral-400 text-lg mb-10 max-w-xl mx-auto">
                        Join investors who are replacing Excel chaos with real clarity.
                    </p>
                    <Link
                        href="/register"
                        className="inline-block font-semibold bg-gradient-to-r from-orange-500 to-amber-500 text-black px-10 py-4 rounded-full text-lg hover:shadow-[0_0_40px_rgba(255,107,0,0.4)] transition-all duration-300 hover:scale-[1.02]"
                    >
                        Get Started Free
                    </Link>
                </div>
            </RevealSection>
        </section>
    )
}

/* ═══════════════════════════════ FOOTER ═══════════════════════════════ */
function Footer() {
    return (
        <footer className="border-t border-white/5 py-12 px-6 lg:px-8">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                        <span className="text-black font-bold text-xs">I</span>
                    </div>
                    <span className="font-semibold text-sm text-white">Invest</span>
                </div>
                <div className="flex items-center gap-6 text-sm text-neutral-500">
                    <a href="#" className="hover:text-neutral-300 transition-colors">Privacy</a>
                    <a href="#" className="hover:text-neutral-300 transition-colors">Terms</a>
                    <a href="#" className="hover:text-neutral-300 transition-colors">Contact</a>
                </div>
                <p className="text-xs text-neutral-600">© {new Date().getFullYear()} Invest. All rights reserved.</p>
            </div>
        </footer>
    )
}

/* ═══════════════════════════════ PAGE ═══════════════════════════════ */
export default function LandingPage() {
    return (
        <>
            <HeroSection />
            <ProblemSection />
            <FeaturesSection />
            <AiSection />
            <PricingSection />
            <FooterCta />
            <Footer />
        </>
    )
}
