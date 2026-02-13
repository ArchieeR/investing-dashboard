import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Portfolio Intelligence, Engineered",
    description:
        "Swiss-precision portfolio tracking. Aggregate holdings, see through ETFs, and make data-driven decisions with institutional-grade analytics.",
}

export default function SwissPrecisionLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="relative min-h-screen bg-[#0C0C0C] text-[#E4E4E7] antialiased overflow-x-hidden">
            <link
                href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap"
                rel="stylesheet"
            />
            {children}
        </div>
    )
}
