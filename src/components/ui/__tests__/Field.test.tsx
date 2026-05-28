import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Field } from "../Field";

describe("Field (uncontrolled)", () => {
  it("renders with label and value", () => {
    render(<Field label="Name" value="Hero" />);
    expect(screen.getByDisplayValue("Hero")).toBeInTheDocument();
  });

  it("calls onChange when user types", async () => {
    const onChange = vi.fn();
    render(<Field label="Name" value="" onChange={onChange} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "a");
    expect(onChange).toHaveBeenCalled();
  });

  it("renders multiline when multi=true", () => {
    render(<Field label="Desc" value="" multi rows={3} />);
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
  });
});
