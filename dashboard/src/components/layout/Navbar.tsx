"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ModeToggle } from "@/components/theme/ModeToggle"
import { AuthButton } from "@/components/auth/AuthButton"

const navItems = [
    { href: "/explorer", label: "Explorer" },
    { href: "/research", label: "Research Hub" },
]

export function Navbar() {
    const pathname = usePathname()

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mr-4 flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <span className="hidden font-bold sm:inline-block text-lg">
                            <span className="text-[#FF6B00]">inv</span><span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">ormed</span>
                        </span>
                    </Link>
                    <nav className="flex items-center gap-4 text-sm font-medium xl:gap-6">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "transition-colors hover:text-foreground/80",
                                    pathname === item.href || pathname?.startsWith(item.href)
                                        ? "text-foreground"
                                        : "text-foreground/60"
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                        {/* Search Placeholder */}
                    </div>
                    <nav className="flex items-center gap-2">
                        <ModeToggle />
                        <AuthButton />
                    </nav>
                </div>
            </div>
        </header>
    )
}
