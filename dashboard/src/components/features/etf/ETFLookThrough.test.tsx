import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ETFLookThrough } from "./ETFLookThrough";
import type { FMPETFHolding } from "@/lib/fmp";

const mockHoldings: Record<string, FMPETFHolding[]> = {
  VWRL: [
    { asset: "AAPL", name: "Apple Inc.", shares: 1000, weightPercentage: 4.5, updated: "2025-01-01" },
    { asset: "MSFT", name: "Microsoft Corp.", shares: 800, weightPercentage: 3.8, updated: "2025-01-01" },
    { asset: "GOOGL", name: "Alphabet Inc.", shares: 500, weightPercentage: 2.1, updated: "2025-01-01" },
  ],
  SPY: [
    { asset: "AAPL", name: "Apple Inc.", shares: 5000, weightPercentage: 7.2, updated: "2025-01-01" },
    { asset: "MSFT", name: "Microsoft Corp.", shares: 4000, weightPercentage: 6.5, updated: "2025-01-01" },
    { asset: "NVDA", name: "NVIDIA Corp.", shares: 3000, weightPercentage: 5.0, updated: "2025-01-01" },
  ],
};

describe("ETFLookThrough", () => {
  it("renders aggregated holdings", () => {
    render(<ETFLookThrough holdingsByETF={mockHoldings} />);
    expect(screen.getByText("AAPL")).toBeTruthy();
    expect(screen.getByText("MSFT")).toBeTruthy();
    expect(screen.getByText("GOOGL")).toBeTruthy();
    expect(screen.getByText("NVDA")).toBeTruthy();
  });

  it("shows ETF column headers", () => {
    render(<ETFLookThrough holdingsByETF={mockHoldings} />);
    expect(screen.getByText("VWRL")).toBeTruthy();
    expect(screen.getByText("SPY")).toBeTruthy();
  });

  it("displays total holding count", () => {
    render(<ETFLookThrough holdingsByETF={mockHoldings} />);
    expect(screen.getByText(/4 holdings across 2 ETFs/)).toBeTruthy();
  });

  it("sorts by total weight descending", () => {
    const { container } = render(
      <ETFLookThrough holdingsByETF={mockHoldings} />
    );
    const rows = container.querySelectorAll("tbody tr");
    // AAPL has highest combined weight (4.5 + 7.2 = 11.7)
    const firstRow = rows[0];
    expect(firstRow?.textContent).toContain("AAPL");
  });
});
