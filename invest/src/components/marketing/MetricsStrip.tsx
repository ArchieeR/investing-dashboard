"use client"

import { font } from "./tokens"
import { FadeSection } from "./FadeSection"

const metrics = [
    { value: "\u00A3127,430.56", label: "tracked" },
    { value: "847", label: "holdings analysed" },
    { value: "12", label: "markets covered" },
    { value: "99.9%", label: "uptime" },
]

export function MetricsStrip() {
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
