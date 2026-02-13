export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                <p className="text-muted-foreground">Deep-dive performance, risk metrics, and overlap analysis.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="p-6 border rounded-xl bg-card text-card-foreground shadow-sm h-64 flex flex-col items-center justify-center border-dashed">
                    <p className="text-muted-foreground">Risk Metrics (Sharpe, Beta)</p>
                </div>
                <div className="p-6 border rounded-xl bg-card text-card-foreground shadow-sm h-64 flex flex-col items-center justify-center border-dashed">
                    <p className="text-muted-foreground">Overlap Matrix</p>
                </div>
            </div>
        </div>
    )
}
