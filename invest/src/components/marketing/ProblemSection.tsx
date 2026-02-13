"use client"

import { font } from "./tokens"
import { FadeSection } from "./FadeSection"

const problems = [
    {
        num: "01",
        title: "Spreadsheets don\u2019t scale",
        desc: "You started with a simple sheet. Now it\u2019s 47 tabs, three broken GOOGLEFINANCE formulas, and a pivot table nobody understands. Your portfolio outgrew your tools.",
    },
    {
        num: "02",
        title: "Broker apps don\u2019t aggregate",
        desc: "ISA here, SIPP there, GIA somewhere else. Every broker shows you a fragment. Nobody shows you the whole picture across all your accounts.",
    },
    {
        num: "03",
        title: "You can\u2019t see through your ETFs",
        desc: "You hold VUSA and SWDA \u2014 but what\u2019s the overlap? What\u2019s your real exposure to Apple, or to US Tech? Without look-through, you\u2019re flying blind.",
    },
]

export function ProblemSection() {
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
