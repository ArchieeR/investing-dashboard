"use client"

import Link from "next/link"
import { PRODUCT_NAME, font } from "./tokens"

const links = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Docs", href: "#" },
]

export function Navigation() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0C0C0C]/90 backdrop-blur-md border-b border-[#27272A]">
            <div className="mx-auto max-w-[1200px] px-6 h-16 flex items-center justify-between">
                <Link
                    href="/"
                    className="text-lg font-bold tracking-tight text-[#E4E4E7]"
                    style={{ fontFamily: font.headline }}
                >
                    <span><span style={{ color: "#FF6B00" }}>inv</span>ormed</span>
                </Link>
                <div className="flex items-center gap-8">
                    {links.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            className="hidden md:inline text-sm text-[#A1A1AA] hover:text-[#E4E4E7] transition-colors duration-200"
                            style={{ fontFamily: font.body }}
                        >
                            {link.label}
                        </a>
                    ))}
                    <Link
                        href="/register"
                        className="text-sm font-medium text-[#0C0C0C] bg-[#FF6B00] px-4 py-2 rounded-[4px] hover:bg-[#FF6B00]/90 transition-colors duration-200"
                        style={{ fontFamily: font.body }}
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </nav>
    )
}
