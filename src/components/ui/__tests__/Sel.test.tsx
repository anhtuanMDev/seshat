import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sel } from "../Sel";

describe("Sel (uncontrolled)", () => {
  const opts = ["Option A", "Option B", "Option C"];

  it("renders with label", () => {
    render(<Sel label="Choose" value="" onChange={() => {}} opts={opts} />);
    expect(screen.getByText("Choose")).toBeInTheDocument();
  });

  it("shows selected value", () => {
    render(<Sel label="Choose" value="Option B" onChange={() => {}} opts={opts} />);
    expect(screen.getByText("Option B")).toBeInTheDocument();
  });
});
