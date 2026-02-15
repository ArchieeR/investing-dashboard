import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AIChat } from "./AIChat";

describe("AIChat", () => {
  it("renders the chat header", () => {
    render(<AIChat />);
    expect(screen.getByText("The Analyst")).toBeTruthy();
  });

  it("shows empty state with suggestions", () => {
    render(<AIChat />);
    expect(
      screen.getByText("Ask me about your portfolio, markets, or any stock.")
    ).toBeTruthy();
    expect(screen.getByText("How is the tech sector doing?")).toBeTruthy();
  });

  it("renders input field and send button", () => {
    render(<AIChat />);
    const input = screen.getByPlaceholderText("Ask about your portfolio...");
    expect(input).toBeTruthy();
  });

  it("clicking a suggestion fills input", () => {
    render(<AIChat />);
    const suggestion = screen.getByText("Analyze VWRL for me");
    fireEvent.click(suggestion);
    const input = screen.getByPlaceholderText(
      "Ask about your portfolio..."
    ) as HTMLInputElement;
    expect(input.value).toBe("Analyze VWRL for me");
  });

  it("shows the disclaimer", () => {
    render(<AIChat />);
    expect(
      screen.getByText(/This is not financial advice/)
    ).toBeTruthy();
  });

  it("send button is disabled when input is empty", () => {
    render(<AIChat />);
    const buttons = screen.getAllByRole("button");
    const sendButton = buttons.find((b) => b.querySelector("svg"));
    expect(sendButton?.className).toContain("opacity-40");
  });
});
