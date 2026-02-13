"use client"

import Link from "next/link"
import { font, PRODUCT_NAME } from "./tokens"
import { FadeSection } from "./FadeSection"

// ─── Footer CTA ──────────────────────────────────────────────────────────────

export function FooterCTA() {
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
                                <Link
                                    href="/register"
                                    className="inline-flex items-center gap-2 bg-[#FF6B00] text-[#0C0C0C] font-semibold text-sm px-6 py-3 rounded-[4px] hover:bg-[#FF6B00]/90 transition-colors duration-200"
                                    style={{ fontFamily: font.body }}
                                >
                                    Start Tracking
                                    <span aria-hidden="true">&rarr;</span>
                                </Link>
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

// ─── Footer ──────────────────────────────────────────────────────────────────

const columns = [
    { title: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
    { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
    { title: "Legal", links: ["Privacy", "Terms", "Security", "Cookies"] },
    { title: "Connect", links: ["Twitter", "LinkedIn", "Discord", "Support"] },
]

export function Footer() {
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
