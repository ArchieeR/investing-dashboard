"use client"

import Link from "next/link"
import { font } from "./tokens"
import { FadeSection } from "./FadeSection"

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

export function PricingSection() {
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
                                    <Link
                                        href={tier.name === "Advisor" ? "#" : "/register"}
                                        className={`block text-center text-sm font-semibold py-3 rounded-[4px] transition-colors duration-200 ${
                                            tier.highlighted
                                                ? "bg-[#FF6B00] text-[#0C0C0C] hover:bg-[#FF6B00]/90"
                                                : "border border-[#27272A] text-[#A1A1AA] hover:border-[#52525B] hover:text-[#E4E4E7]"
                                        }`}
                                        style={{ fontFamily: font.body }}
                                    >
                                        {tier.cta}
                                    </Link>
                                </div>
                            </FadeSection>
                        ))}
                    </div>
                </div>
            </section>
        </FadeSection>
    )
}
