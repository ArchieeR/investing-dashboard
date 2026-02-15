import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ETFOverlap } from "./ETFOverlap";
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

describe("ETFOverlap", () => {
  it("renders heatmap with ETF headers", () => {
    render(<ETFOverlap holdingsByETF={mockHoldings} />);
    expect(screen.getByText("Overlap Heatmap")).toBeTruthy();
    // ETF names appear in headers
    const vwrlElements = screen.getAllByText("VWRL");
    expect(vwrlElements.length).toBeGreaterThan(0);
  });

  it("shows 100% on diagonal", () => {
    render(<ETFOverlap holdingsByETF={mockHoldings} />);
    const cells = screen.getAllByText("100%");
    expect(cells.length).toBe(2); // VWRL-VWRL and SPY-SPY
  });

  it("shows common holdings", () => {
    render(<ETFOverlap holdingsByETF={mockHoldings} />);
    expect(screen.getByText(/Common Holdings/)).toBeTruthy();
    expect(screen.getByText("AAPL")).toBeTruthy();
    expect(screen.getByText("MSFT")).toBeTruthy();
  });

  it("shows message when only 1 ETF", () => {
    render(
      <ETFOverlap
        holdingsByETF={{ VWRL: mockHoldings["VWRL"] }}
      />
    );
    expect(
      screen.getByText(/Add at least 2 ETFs/)
    ).toBeTruthy();
  });

  it("calculates overlap percentage correctly", () => {
    render(<ETFOverlap holdingsByETF={mockHoldings} />);
    // VWRL has 3 holdings, 2 overlap with SPY = 66.67%
    // SPY has 3 holdings, 2 overlap with VWRL = 66.67%
    const cells67 = screen.getAllByText("67%");
    expect(cells67.length).toBe(2);
  });
});
