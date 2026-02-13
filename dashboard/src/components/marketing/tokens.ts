// ─── Swiss Precision Design Tokens ───────────────────────────────────────────
// Shared across all marketing components. See .claude/prds/ui-design-system.md

export const PRODUCT_NAME = "Invorm"

export const font = {
    headline: "Space Grotesk, sans-serif",
    mono: "JetBrains Mono, monospace",
    body: "system-ui, -apple-system, sans-serif",
} as const

export const color = {
    bg: "#0C0C0C",
    card: "#141414",
    cardHover: "#1A1A1A",
    featuresBg: "#0A1A0A",

    text: "#E4E4E7",
    textSecondary: "#A1A1AA",
    textMuted: "#52525B",

    accent: "#FF6B00",
    positive: "#22C55E",
    negative: "#EF4444",
    ticker: "#22D3EE",

    border: "#27272A",
    borderSubtle: "rgba(39, 39, 42, 0.5)",
} as const
