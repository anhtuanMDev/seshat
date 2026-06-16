import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatPill } from "../StatPill";

describe("StatPill Component", () => {
  it("renders the label correctly", () => {
    render(<StatPill label="Protagonist" />);
    expect(screen.getByText("Protagonist")).toBeInTheDocument();
  });

  it("applies the custom color style correctly", () => {
    render(<StatPill label="Hero" color="#ff0000" />);
    const span = screen.getByText("Hero");
    expect(span.style.color).toBe("rgb(255, 0, 0)");
    // JSDOM / browsers format hex alpha colors differently (e.g. rgba(255, 0, 0, 0.2))
    expect(
      span.style.border.includes("rgba(255, 0, 0") ||
        span.style.border.includes("#ff000033")
    ).toBe(true);
  });
});
