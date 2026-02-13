import { MarketingNav } from "@/components/marketing/MarketingNav"
import { MeshGradient } from "@/components/marketing/MeshGradient"

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="relative min-h-screen text-white overflow-x-hidden">
            <MeshGradient />
            <MarketingNav />
            <main>{children}</main>
        </div>
    )
}
