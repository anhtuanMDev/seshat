import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BookListPage from "../BookListPage";
import * as routerDom from "react-router-dom";
import { syncToGitHub, loadFromGitHub } from "../../lib/githubSync";
import { showToast } from "../../store/toastStore";
import { appStore, mkBook } from "../../store/appStore";

// Mock dependencies
vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock("../../lib/githubSync", () => ({
  syncToGitHub: vi.fn(),
  loadFromGitHub: vi.fn(),
}));

vi.mock("../../store/toastStore", () => ({
  showToast: vi.fn(),
}));

vi.mock("../../hooks/useTheme", () => ({
  useTheme: () => ({ theme: "light", toggle: vi.fn() }),
}));

describe("BookListPage Edge-to-Edge", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.mocked(routerDom.useNavigate).mockReturnValue(mockNavigate);
    vi.clearAllMocks();

    // Clear the global store
    appStore.books.set([]);
    appStore.activeBookId.set(null);
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders empty state when there are no books", () => {
    render(<BookListPage />);
    expect(
      screen.getByText("No books yet. Create one to get started."),
    ).toBeInTheDocument();
  });

  it("loads books from cloud if token exists", async () => {
    localStorage.setItem("seshat-auth-token", "valid-token");
    vi.mocked(loadFromGitHub).mockResolvedValue([
      { id: "b1", title: "Cloud Book 1", isFullyLoaded: false } as unknown as import("../../lib/types").BookData,
    ]);

    render(<BookListPage />);

    // Initially might show loading or empty depending on render cycle, but we expect it to eventually show the book
    await waitFor(() => {
      expect(loadFromGitHub).toHaveBeenCalledWith("valid-token");
      expect(screen.getByText("Cloud Book 1")).toBeInTheDocument();
      expect(showToast).toHaveBeenCalledWith(
        "Books loaded from cloud.",
        "success",
      );
    });
  });

  it("handles cloud load failure gracefully", async () => {
    localStorage.setItem("seshat-auth-token", "valid-token");
    vi.mocked(loadFromGitHub).mockRejectedValue(new Error("Network Error"));

    render(<BookListPage />);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        "Failed to load books from cloud.",
        "error",
      );
      expect(
        screen.getByText("No books yet. Create one to get started."),
      ).toBeInTheDocument();
    });
  });

  it("shows login error and redirects to /auth if trying to create without token", async () => {
    render(<BookListPage />);

    // Click new book
    fireEvent.click(screen.getByRole("button", { name: "New book" }));

    // Type name
    fireEvent.change(
      screen.getByPlaceholderText("e.g. The Lord of the Rings"),
      { target: { value: "My Book" } },
    );

    // Click create
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        "Please log in to create a book.",
        "error",
      );
      expect(mockNavigate).toHaveBeenCalledWith("/auth");
    });
  });

  it("creates a new book, saves to cloud, and redirects to the world view", async () => {
    localStorage.setItem("seshat-auth-token", "valid-token");
    vi.mocked(syncToGitHub).mockResolvedValue();

    render(<BookListPage />);

    // Wait for the initial load to finish
    const newBookBtn = await screen.findByRole("button", { name: "New book" });
    fireEvent.click(newBookBtn);
    fireEvent.change(
      screen.getByPlaceholderText("e.g. The Lord of the Rings"),
      { target: { value: "New Masterpiece" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(appStore.books.get().length).toBe(1);
      expect(appStore.books.get()[0].title).toBe("New Masterpiece");
      expect(syncToGitHub).toHaveBeenCalledWith("valid-token");
      expect(showToast).toHaveBeenCalledWith(
        "Book initialized securely in the cloud!",
        "success",
      );
      // The navigate path uses the newly generated ID
      const bookId = appStore.books.get()[0].id;
      expect(mockNavigate).toHaveBeenCalledWith(`/book/${bookId}/world`);
    });
  });

  it("prevents creating a book with a duplicate title", async () => {
    appStore.books.set([mkBook("Existing Book")]);
    localStorage.setItem("seshat-auth-token", "valid-token");

    render(<BookListPage />);

    // Wait for load to finish
    const newBookBtns = await screen.findAllByRole("button", {
      name: "New book",
    });
    fireEvent.click(newBookBtns[0]);

    fireEvent.change(
      screen.getByPlaceholderText("e.g. The Lord of the Rings"),
      { target: { value: "existing book" } },
    ); // Different casing
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        "A book with this name already exists.",
        "error",
      );
      expect(syncToGitHub).not.toHaveBeenCalled();
      expect(appStore.books.get().length).toBe(1); // Still 1
    });
  });

  it("renames a book and syncs", async () => {
    const book = mkBook("Old Title");
    appStore.books.set([book]);
    localStorage.setItem("seshat-auth-token", "valid-token");
    vi.mocked(syncToGitHub).mockResolvedValue();

    render(<BookListPage />);

    // Wait for load to finish
    const titleSpan = await screen.findByText("Old Title");
    fireEvent.doubleClick(titleSpan);

    const input = screen.getByDisplayValue("Old Title");
    fireEvent.change(input, { target: { value: "New Title" } });
    fireEvent.keyDown(input, { key: "Enter" }); // Commit

    await waitFor(() => {
      expect(appStore.books.get()[0].title).toBe("New Title");
      expect(syncToGitHub).toHaveBeenCalled();
      expect(showToast).toHaveBeenCalledWith(
        "Book renamed in cloud.",
        "success",
      );
    });
  });

  it("prevents renaming to a duplicate title", async () => {
    appStore.books.set([mkBook("Alpha"), mkBook("Beta")]);
    localStorage.setItem("seshat-auth-token", "valid-token");

    render(<BookListPage />);

    const titleSpan = await screen.findByText("Alpha");
    fireEvent.doubleClick(titleSpan);

    const input = screen.getByDisplayValue("Alpha");
    fireEvent.change(input, { target: { value: "beta" } }); // Case insensitive match
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        "A book with this name already exists.",
        "error",
      );
      expect(appStore.books.get()[0].title).toBe("Alpha"); // Did not change
      expect(syncToGitHub).not.toHaveBeenCalled();
    });
  });

  it("cancels rename on Escape", async () => {
    appStore.books.set([mkBook("Keep Me")]);

    render(<BookListPage />);

    const keepMeSpan = await screen.findByText("Keep Me");
    fireEvent.doubleClick(keepMeSpan);
    const input = screen.getByDisplayValue("Keep Me");

    fireEvent.change(input, { target: { value: "Changed" } });
    fireEvent.keyDown(input, { key: "Escape" });

    await waitFor(() => {
      expect(screen.getByText("Keep Me")).toBeInTheDocument();
      expect(screen.queryByDisplayValue("Changed")).not.toBeInTheDocument();
      expect(appStore.books.get()[0].title).toBe("Keep Me");
    });
  });

  it("deletes a book after confirmation", async () => {
    const book = mkBook("Delete Me");
    appStore.books.set([book]);
    appStore.activeBookId.set(book.id); // It's currently active
    localStorage.setItem("seshat-auth-token", "valid-token");
    vi.mocked(syncToGitHub).mockResolvedValue();

    render(<BookListPage />);

    // Wait for load to finish
    const deleteIconBtn = await screen.findByTitle("Delete book");
    fireEvent.click(deleteIconBtn);

    // Confirmation shows up
    expect(
      screen.getByText('Delete "Delete Me"? This cannot be undone.'),
    ).toBeInTheDocument();

    // Click confirm Delete
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(appStore.books.get().length).toBe(0);
      expect(appStore.activeBookId.get()).toBeNull(); // Should clear active book
      expect(syncToGitHub).toHaveBeenCalled();
      expect(showToast).toHaveBeenCalledWith(
        "Book deleted from cloud.",
        "success",
      );
      expect(
        screen.getByText("No books yet. Create one to get started."),
      ).toBeInTheDocument();
    });
  });

  it("cancels deletion", async () => {
    appStore.books.set([mkBook("Keep Me")]);

    render(<BookListPage />);

    const deleteIconBtn = await screen.findByTitle("Delete book");
    fireEvent.click(deleteIconBtn);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(
        screen.queryByText('Delete "Keep Me"? This cannot be undone.'),
      ).not.toBeInTheDocument();
      expect(appStore.books.get().length).toBe(1);
    });
  });
});
