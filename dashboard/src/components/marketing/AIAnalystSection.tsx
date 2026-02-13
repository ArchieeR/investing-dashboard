"use client"

import { font, PRODUCT_NAME } from "./tokens"
import { FadeSection } from "./FadeSection"

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

export function AIAnalystSection() {
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
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#27272A] bg-[#0C0C0C]">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/60" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B00]/60" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]/60" />
                                    <span className="ml-3 text-xs text-[#52525B]" style={{ fontFamily: font.mono }}>
                                        {PRODUCT_NAME} &mdash; AI Chat
                                    </span>
                                </div>
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
