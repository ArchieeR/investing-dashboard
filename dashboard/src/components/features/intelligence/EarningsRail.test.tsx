import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EarningsRail } from "./EarningsRail";
import type { EarningEvent } from "@/types/intelligence";

const mockEarnings: EarningEvent[] = [
  {
    ticker: "AAPL",
    company: "Apple Inc.",
    date: "2025-01-30",
    time: "amc",
    estimatedEPS: 2.35,
  },
  {
    ticker: "MSFT",
    company: "Microsoft Corp.",
    date: "2025-01-28",
    time: "amc",
    estimatedEPS: 3.12,
  },
  {
    ticker: "VWRL",
    company: "Vanguard FTSE All-World",
    date: "2025-02-01",
    time: "bmo",
  },
];

describe("EarningsRail", () => {
  it("renders empty state when no events", () => {
    render(<EarningsRail events={[]} />);
    expect(screen.getByText("No upcoming earnings reports.")).toBeTruthy();
  });

  it("renders earning tickers", () => {
    render(<EarningsRail events={mockEarnings} />);
    expect(screen.getByText("AAPL")).toBeTruthy();
    expect(screen.getByText("MSFT")).toBeTruthy();
    expect(screen.getByText("VWRL")).toBeTruthy();
  });

  it("shows estimated EPS when available", () => {
    render(<EarningsRail events={mockEarnings} />);
    expect(screen.getByText("Est. EPS: $2.35")).toBeTruthy();
    expect(screen.getByText("Est. EPS: $3.12")).toBeTruthy();
  });

  it("marks portfolio holdings with HELD badge", () => {
    render(
      <EarningsRail events={mockEarnings} portfolioTickers={["AAPL"]} />
    );
    expect(screen.getByText("HELD")).toBeTruthy();
  });

  it("does not show HELD badge for non-portfolio tickers", () => {
    render(
      <EarningsRail events={mockEarnings} portfolioTickers={["TSLA"]} />
    );
    expect(screen.queryByText("HELD")).toBeNull();
  });
});
