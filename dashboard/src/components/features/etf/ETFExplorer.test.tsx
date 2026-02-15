import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ETFExplorer } from "./ETFExplorer";
import type { FMPETFInfo } from "@/lib/fmp";

const mockETFs = [
  {
    info: {
      symbol: "VWRL",
      name: "Vanguard FTSE All-World UCITS ETF",
      expenseRatio: 0.0022,
      aum: 15000000000,
      domicile: "Ireland",
      etfCompany: "Vanguard",
    } as FMPETFInfo,
  },
  {
    info: {
      symbol: "SPY",
      name: "SPDR S&P 500 ETF Trust",
      expenseRatio: 0.0009,
      aum: 500000000000,
      domicile: "United States",
      etfCompany: "State Street",
    } as FMPETFInfo,
  },
  {
    info: {
      symbol: "VUKE",
      name: "Vanguard FTSE 100 UCITS ETF",
      expenseRatio: 0.0009,
      aum: 5000000000,
      domicile: "United Kingdom",
      etfCompany: "Vanguard",
    } as FMPETFInfo,
  },
];

describe("ETFExplorer", () => {
  it("renders ETF cards", () => {
    render(<ETFExplorer etfs={mockETFs} />);
    expect(screen.getByText("VWRL")).toBeTruthy();
    expect(screen.getByText("SPY")).toBeTruthy();
    expect(screen.getByText("VUKE")).toBeTruthy();
  });

  it("filters by search text", () => {
    render(<ETFExplorer etfs={mockETFs} />);
    const input = screen.getByPlaceholderText("Search ETFs...");
    fireEvent.change(input, { target: { value: "vanguard" } });
    expect(screen.getByText("VWRL")).toBeTruthy();
    expect(screen.getByText("VUKE")).toBeTruthy();
    expect(screen.queryByText("SPY")).toBeNull();
  });

  it("shows empty state when no matches", () => {
    render(<ETFExplorer etfs={mockETFs} />);
    const input = screen.getByPlaceholderText("Search ETFs...");
    fireEvent.change(input, { target: { value: "nonexistent" } });
    expect(screen.getByText("No ETFs match your filters.")).toBeTruthy();
  });

  it("shows TER and AUM", () => {
    render(<ETFExplorer etfs={mockETFs} />);
    expect(screen.getByText("0.22%")).toBeTruthy();
    expect(screen.getByText("$15.0B")).toBeTruthy();
  });
});
