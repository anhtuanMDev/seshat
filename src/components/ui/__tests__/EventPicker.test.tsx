import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventPicker } from "../EventPicker";

describe("EventPicker (uncontrolled)", () => {
  const events = [
    { id: "e1", time: 3, title: "Battle" },
    { id: "e2", time: 1, title: "Prologue" },
  ];

  it("renders with label", () => {
    render(<EventPicker label="Pick" value="" onChange={() => {}} events={events} />);
    expect(screen.getByText("Pick")).toBeInTheDocument();
  });

  it("has a combobox role", () => {
    render(<EventPicker label="Pick" value="" onChange={() => {}} events={events} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("handles empty events list without crashing", () => {
    render(<EventPicker label="Pick" value="" onChange={() => {}} events={[]} />);
    expect(screen.getByText("Pick")).toBeInTheDocument();
  });
});
