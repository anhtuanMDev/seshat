import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toggle } from "../Toggle";

describe("Toggle (uncontrolled)", () => {
  it("shows Yes when value is true", () => {
    render(<Toggle label="Active" value={true} onChange={() => {}} />);
    expect(screen.getByText("Yes")).toBeInTheDocument();
  });

  it("shows No when value is false", () => {
    render(<Toggle label="Active" value={false} onChange={() => {}} />);
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("toggles on click", async () => {
    const onChange = vi.fn();
    render(<Toggle label="Active" value={false} onChange={onChange} />);
    await userEvent.click(screen.getByText("No"));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
