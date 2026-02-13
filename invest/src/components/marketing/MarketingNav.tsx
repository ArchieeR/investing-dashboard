"use client"

import Link from "next/link"
import { useState, useEffect } from "react"

export function MarketingNav() {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                ? "bg-black/80 backdrop-blur-xl border-b border-white/5"
                : "bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-8 flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                        <span className="text-black font-bold text-sm">I</span>
                    </div>
                    <span className="font-bold text-lg text-white">Invest</span>
                </Link>

                <nav className="hidden md:flex items-center gap-8 text-sm text-neutral-400">
                    <a href="#features" className="hover:text-white transition-colors">Features</a>
                    <a href="#ai" className="hover:text-white transition-colors">AI Analyst</a>
                    <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                </nav>

                <div className="flex items-center gap-3">
                    <Link
                        href="/login"
                        className="text-sm text-neutral-300 hover:text-white transition-colors hidden sm:inline-block"
                    >
                        Log in
                    </Link>
                    <Link
                        href="/register"
                        className="text-sm font-medium bg-gradient-to-r from-orange-500 to-amber-500 text-black px-5 py-2.5 rounded-full hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] transition-all duration-300"
                    >
                        Get Started Free
                    </Link>
                </div>
            </div>
        </header>
    )
}
