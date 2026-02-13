import { Navbar } from "@/components/layout/Navbar"
import { PortfolioProvider } from "@/context/PortfolioContext"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <PortfolioProvider>
            <Navbar />
            <div className="min-h-screen bg-background text-foreground">
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {children}
                </main>
            </div>
        </PortfolioProvider>
    )
}
