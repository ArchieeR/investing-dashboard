import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MacroCalendar } from "./MacroCalendar";
import type { MacroEvent } from "@/types/intelligence";

const today = new Date().toISOString().split("T")[0];

const mockEvents: MacroEvent[] = [
  {
    id: "1",
    title: "US CPI Data",
    time: `${today}T08:30:00Z`,
    impact: "high",
    expected: "3.2%",
    previous: "3.1%",
    category: "US",
  },
  {
    id: "2",
    title: "UK Retail Sales",
    time: `${today}T07:00:00Z`,
    impact: "medium",
    category: "UK",
  },
  {
    id: "3",
    title: "EU Consumer Confidence",
    time: `${today}T10:00:00Z`,
    impact: "low",
    category: "EU",
  },
];

describe("MacroCalendar", () => {
  it("renders empty state when no events", () => {
    render(<MacroCalendar events={[]} />);
    expect(screen.getByText("No upcoming economic events.")).toBeTruthy();
  });

  it("renders event titles", () => {
    render(<MacroCalendar events={mockEvents} />);
    expect(screen.getByText("US CPI Data")).toBeTruthy();
    expect(screen.getByText("UK Retail Sales")).toBeTruthy();
    expect(screen.getByText("EU Consumer Confidence")).toBeTruthy();
  });

  it("renders expected/previous values for high impact events", () => {
    render(<MacroCalendar events={mockEvents} />);
    expect(screen.getByText("Est: 3.2%")).toBeTruthy();
    expect(screen.getByText("Prev: 3.1%")).toBeTruthy();
  });

  it("shows NOW indicator", () => {
    render(<MacroCalendar events={mockEvents} />);
    expect(screen.getByText("NOW")).toBeTruthy();
  });

  it("groups events by day", () => {
    const twoDayEvents: MacroEvent[] = [
      { ...mockEvents[0], time: "2025-01-15T08:00:00Z", id: "a" },
      { ...mockEvents[1], time: "2025-01-16T10:00:00Z", id: "b" },
    ];
    render(<MacroCalendar events={twoDayEvents} />);
    // Both events should render
    expect(screen.getByText("US CPI Data")).toBeTruthy();
    expect(screen.getByText("UK Retail Sales")).toBeTruthy();
  });
});
