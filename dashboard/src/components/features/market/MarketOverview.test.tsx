import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarketOverview } from "./MarketOverview";
import type { FMPSectorPerformance, FMPMarketMover } from "@/lib/fmp";

const mockSectors: FMPSectorPerformance[] = [
  { sector: "Technology", changesPercentage: "2.15" },
  { sector: "Healthcare", changesPercentage: "-0.43" },
  { sector: "Energy", changesPercentage: "1.02" },
];

const mockGainers: FMPMarketMover[] = [
  { symbol: "NVDA", name: "NVIDIA Corp", change: 15.2, price: 850.0, changesPercentage: 5.2 },
];

const mockLosers: FMPMarketMover[] = [
  { symbol: "META", name: "Meta Platforms", change: -8.5, price: 510.0, changesPercentage: -2.1 },
];

const mockActives: FMPMarketMover[] = [
  { symbol: "TSLA", name: "Tesla Inc", change: 3.2, price: 245.0, changesPercentage: 1.3 },
];

describe("MarketOverview", () => {
  it("renders sector performance bars", () => {
    render(
      <MarketOverview
        sectors={mockSectors}
        gainers={mockGainers}
        losers={mockLosers}
        actives={mockActives}
      />
    );
    expect(screen.getByText("Technology")).toBeTruthy();
    expect(screen.getByText("Healthcare")).toBeTruthy();
    expect(screen.getByText("Energy")).toBeTruthy();
  });

  it("renders mover panels", () => {
    render(
      <MarketOverview
        sectors={mockSectors}
        gainers={mockGainers}
        losers={mockLosers}
        actives={mockActives}
      />
    );
    expect(screen.getByText("Top Gainers")).toBeTruthy();
    expect(screen.getByText("Top Losers")).toBeTruthy();
    expect(screen.getByText("Most Active")).toBeTruthy();
  });

  it("renders mover tickers", () => {
    render(
      <MarketOverview
        sectors={mockSectors}
        gainers={mockGainers}
        losers={mockLosers}
        actives={mockActives}
      />
    );
    expect(screen.getByText("NVDA")).toBeTruthy();
    expect(screen.getByText("META")).toBeTruthy();
    expect(screen.getByText("TSLA")).toBeTruthy();
  });

  it("shows positive and negative percentage formatting", () => {
    render(
      <MarketOverview
        sectors={mockSectors}
        gainers={mockGainers}
        losers={mockLosers}
        actives={mockActives}
      />
    );
    expect(screen.getByText("+2.15%")).toBeTruthy();
    expect(screen.getByText("-0.43%")).toBeTruthy();
  });
});
