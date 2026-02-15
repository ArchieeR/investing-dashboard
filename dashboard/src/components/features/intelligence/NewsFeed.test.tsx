import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NewsFeed } from "./NewsFeed";
import type { NewsItem } from "@/types/intelligence";

const mockNews: NewsItem[] = [
  {
    id: "1",
    title: "Apple Reports Record Quarter",
    summary: "Apple Inc. reported record Q4 revenue driven by iPhone sales.",
    url: "https://example.com/apple",
    source: "Bloomberg",
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    category: "Market",
    tickers: ["AAPL"],
  },
  {
    id: "2",
    title: "UK Markets Surge on Rate Decision",
    summary: "The FTSE 100 rallied following the Bank of England decision.",
    url: "https://example.com/uk",
    source: "Reuters",
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    category: "Market",
    tickers: ["VUKE"],
  },
];

describe("NewsFeed", () => {
  it("renders empty state when no items", () => {
    render(<NewsFeed initialItems={[]} />);
    expect(screen.getByText("No news available.")).toBeTruthy();
  });

  it("renders news headlines", () => {
    render(<NewsFeed initialItems={mockNews} />);
    expect(screen.getByText("Apple Reports Record Quarter")).toBeTruthy();
    expect(screen.getByText("UK Markets Surge on Rate Decision")).toBeTruthy();
  });

  it("renders source badges", () => {
    render(<NewsFeed initialItems={mockNews} />);
    expect(screen.getByText("Bloomberg")).toBeTruthy();
    expect(screen.getByText("Reuters")).toBeTruthy();
  });

  it("highlights portfolio-matching news", () => {
    const { container } = render(
      <NewsFeed initialItems={mockNews} portfolioTickers={["AAPL"]} />
    );
    // The AAPL news item should have the highlighted border class
    const links = container.querySelectorAll("a");
    const aaplLink = Array.from(links).find((a) =>
      a.textContent?.includes("Apple Reports Record Quarter")
    );
    expect(aaplLink?.className).toContain("border-primary");
  });

  it("renders ticker symbols", () => {
    render(<NewsFeed initialItems={mockNews} />);
    expect(screen.getByText("$AAPL")).toBeTruthy();
    expect(screen.getByText("$VUKE")).toBeTruthy();
  });
});
