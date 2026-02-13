export function calculatePercentageChange(
    current: number,
    previous: number
): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export function formatValueChange(
    current: number,
    previous: number
): string {
    const diff = current - previous;
    const sign = diff >= 0 ? "+" : "";
    return `${sign}${formatCurrency(diff)}`;
}
