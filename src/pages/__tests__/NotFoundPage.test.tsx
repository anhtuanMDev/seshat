import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NotFoundPage from "../NotFoundPage";
import * as routerDom from "react-router-dom";

// Mock useNavigate, useParams, and useLocation
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useNavigate: vi.fn(),
    useParams: vi.fn(() => ({})),
    useLocation: vi.fn(() => ({ pathname: "/unknown-route" })),
  };
});

// Mock useAnimateIn hook to return a mock ref
vi.mock("../../hooks/useAnimateIn", () => ({
  useAnimateIn: vi.fn(() => ({ current: null })),
}));

describe("NotFoundPage", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.mocked(routerDom.useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(routerDom.useParams).mockReturnValue({});
    vi.clearAllMocks();
  });

  it("renders 404 text and descriptive details", () => {
    render(<NotFoundPage />);
    expect(screen.getByTestId("error-code")).toHaveTextContent("404");
    expect(screen.getByText("Timeline Disruption")).toBeInTheDocument();
    expect(
      screen.getByText(
        /The chronicle or page you are seeking does not exist in this universe/
      )
    ).toBeInTheDocument();
  });

  it("renders correct buttons when no bookId is present", () => {
    render(<NotFoundPage />);
    
    expect(screen.getByRole("button", { name: "Return to Library" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go Back" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Restore Timeline" })).not.toBeInTheDocument();
  });

  it("navigates to library home when Return to Library is clicked (no bookId)", () => {
    render(<NotFoundPage />);
    const button = screen.getByRole("button", { name: "Return to Library" });
    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("navigates back when Go Back is clicked (no bookId)", () => {
    render(<NotFoundPage />);
    const button = screen.getByRole("button", { name: "Go Back" });
    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("renders book-specific options when bookId is present", () => {
    vi.mocked(routerDom.useParams).mockReturnValue({ bookId: "123" });
    render(<NotFoundPage />);
    
    expect(screen.getByRole("button", { name: "Restore Timeline" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inspect Lore Web" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Return to Library" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Go Back" })).not.toBeInTheDocument();
  });

  it("navigates to specific book routes when book-specific buttons are clicked", () => {
    vi.mocked(routerDom.useParams).mockReturnValue({ bookId: "123" });
    render(<NotFoundPage />);
    
    const worldBtn = screen.getByRole("button", { name: "Restore Timeline" });
    fireEvent.click(worldBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/book/123/world");

    const loreBtn = screen.getByRole("button", { name: "Inspect Lore Web" });
    fireEvent.click(loreBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/book/123/lore-web");
  });
});
