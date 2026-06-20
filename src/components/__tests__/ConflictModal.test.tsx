import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConflictModal } from "../ConflictModal";
import type { BookData } from "../../store/appStore";

const createBaseBook = (title: string): BookData => ({
  id: "book-1",
  title,
  synopsis: "",
  setting: "",
  themes: "",
  rules: "",
  nations: [],
  techniques: [],
  ingredients: [],
  monsters: [],
  treasures: [],
  events: [],
  characters: [],
  chapters: [],
  foreshadows: [],
  isFullyLoaded: true,
});

describe("ConflictModal Component", () => {
  it("renders modal title and list of conflicts", () => {
    const local = createBaseBook("Local Title");
    const server = createBaseBook("Server Title");
    const onResolve = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConflictModal
        localBook={local}
        serverBook={server}
        onResolve={onResolve}
        onCancel={onCancel}
        />
    );

    expect(screen.getByText("Sync Conflicts Detected")).toBeInTheDocument();
    expect(screen.getByText("Book Metadata & World Rules")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm Merge" })).toBeDisabled();
  });

  it("calls onResolve with local values when Keep All Local is chosen", () => {
    const local = createBaseBook("Local Title");
    const server = createBaseBook("Server Title");
    const onResolve = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConflictModal
        localBook={local}
        serverBook={server}
        onResolve={onResolve}
        onCancel={onCancel}
        />
    );

    fireEvent.click(screen.getByRole("button", { name: "Keep All Local" }));
    
    const confirmBtn = screen.getByRole("button", { name: "Confirm Merge" });
    expect(confirmBtn).not.toBeDisabled();
    fireEvent.click(confirmBtn);

    expect(onResolve).toHaveBeenCalledWith(expect.objectContaining({
      title: "Local Title",
    }));
  });

  it("calls onResolve with cloud values when Keep All Cloud is chosen", () => {
    const local = createBaseBook("Local Title");
    const server = createBaseBook("Server Title");
    const onResolve = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConflictModal
        localBook={local}
        serverBook={server}
        onResolve={onResolve}
        onCancel={onCancel}
        />
    );

    fireEvent.click(screen.getByRole("button", { name: "Keep All Cloud" }));

    const confirmBtn = screen.getByRole("button", { name: "Confirm Merge" });
    expect(confirmBtn).not.toBeDisabled();
    fireEvent.click(confirmBtn);

    expect(onResolve).toHaveBeenCalledWith(expect.objectContaining({
      title: "Server Title",
    }));
  });

  it("supports individual row-level conflict resolution", () => {
    const local = {
      ...createBaseBook("Local Title"),
      characters: [{ id: "char-1", name: "Local Character" }],
    } as unknown as BookData;

    const server = {
      ...createBaseBook("Server Title"),
      characters: [{ id: "char-1", name: "Server Character" }],
    } as unknown as BookData;

    const onResolve = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConflictModal
        localBook={local}
        serverBook={server}
        onResolve={onResolve}
        onCancel={onCancel}
        />
    );

    // Should render two conflicts: metadata and the character
    expect(screen.getByText("Book Metadata & World Rules")).toBeInTheDocument();
    expect(screen.getByText("Local Character")).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: "Confirm Merge" });
    expect(confirmBtn).toBeDisabled();

    // Resolve metadata to Local
    const localBtns = screen.getAllByRole("button", { name: "Local" });
    fireEvent.click(localBtns[0]); // First conflict (metadata)

    // Resolve character to Cloud
    const cloudBtns = screen.getAllByRole("button", { name: "Cloud" });
    fireEvent.click(cloudBtns[1]); // Second conflict (character)

    expect(confirmBtn).not.toBeDisabled();
    fireEvent.click(confirmBtn);

    expect(onResolve).toHaveBeenCalledWith(expect.objectContaining({
      title: "Local Title", // Resolved to local
      characters: [expect.objectContaining({
        name: "Server Character", // Resolved to cloud
      })],
    }));
  });
});
