import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChapterPage from "../ChapterPage";
import { appStore, mkBook } from "../../store/appStore";
import { showToast } from "../../store/toastStore";
import { updateFileOnGitHub, loadFileFromGitHub } from "../../lib/githubSync";
import { computeEventSync } from "../../lib/eventSync";
import * as routerDom from "react-router-dom";
import { saveAs } from "file-saver";
import type { Chapter, Character, Event } from "../../lib/types";

// Mock dependencies
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

vi.mock("../../store/toastStore", () => ({
  showToast: vi.fn(),
}));

vi.mock("../../lib/githubSync", () => ({
  updateFileOnGitHub: vi.fn(),
  loadFileFromGitHub: vi.fn(),
}));

vi.mock("../../lib/eventSync", () => ({
  computeEventSync: vi.fn(),
}));

vi.mock("file-saver", () => ({
  saveAs: vi.fn(),
}));

vi.mock("docx", () => ({
  Document: class {},
  Packer: {
    toBlob: vi.fn().mockResolvedValue(new Blob()),
  },
  Paragraph: class {},
  TextRun: class {},
}));

// Mock complex child components to simplify DOM and avoid Tiptap issues in JSDOM
vi.mock("../../components/editor/RichEditor", () => ({
  default: ({ onSave, isDirty }: { onSave: () => void; isDirty: boolean }) => (
    <div data-testid="mock-rich-editor">
      <button onClick={onSave} data-testid="mock-editor-save">Save Editor</button>
      <span data-testid="mock-editor-dirty">{isDirty ? "Dirty" : "Clean"}</span>
    </div>
  ),
}));

// Setup a baseline state for the appStore
function setupStoreWithChapter(hasBody = true) {
  const book = mkBook("Test Book");
  book.id = "book-123";
  const chapter: Partial<Chapter> = {
    id: "chap-456",
    order: 1,
    number: "Ch. 1",
    title: "The Beginning",
    timeRef: "event-1",
    synopsis: "Test synopsis",
    notes: "Test notes",
    pinnedChars: ["char-1"],
    pinnedEventIds: ["event-2"],
    scenes: [],
    drafts: [],
  };
  
  if (hasBody) {
    chapter.body = "<p>It was a dark and stormy night.</p>";
  }
  
  book.chapters = [chapter as Chapter];
  book.characters = [{ id: "char-1", name: "Hero" } as unknown as Character];
  book.events = [
    { id: "event-1", time: 1, title: "Birth" } as unknown as Event,
    { id: "event-2", time: 2, title: "Fight" } as unknown as Event,
  ];

  appStore.books.set([book]);
  appStore.activeBookId.set("book-123");
}

describe("ChapterPage Edge-to-Edge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders 'Chapter not found' if chapter is missing", () => {
    vi.mocked(routerDom.useParams).mockReturnValue({ id: "missing", bookId: "book-123" });
    setupStoreWithChapter(); // Only has chap-456

    render(<ChapterPage />);
    expect(screen.getByText("Chapter not found.")).toBeInTheDocument();
  });

  it("populates the form with existing chapter data if body is present", () => {
    vi.mocked(routerDom.useParams).mockReturnValue({ id: "chap-456", bookId: "book-123" });
    setupStoreWithChapter(true);

    render(<ChapterPage />);

    expect(screen.getByDisplayValue("Ch. 1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("The Beginning")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test synopsis")).toBeInTheDocument();
    expect(screen.getByTestId("mock-rich-editor")).toBeInTheDocument();
  });

  it("lazy loads the body from github if body is missing in appStore", async () => {
    vi.mocked(routerDom.useParams).mockReturnValue({ id: "chap-456", bookId: "book-123" });
    localStorage.setItem("seshat-auth-token", "valid-token");
    setupStoreWithChapter(false); // No body
    
    vi.mocked(loadFileFromGitHub).mockResolvedValue({
      body: "<p>Lazy loaded body</p>",
      notes: "Lazy loaded notes",
    });

    render(<ChapterPage />);

    await waitFor(() => {
      expect(loadFileFromGitHub).toHaveBeenCalledWith("valid-token", "book-123", "chapters/chapter_chap-456.json");
      const currentBody = appStore.books[0].chapters[0].body.get();
      expect(currentBody).toBe("<p>Lazy loaded body</p>");
      expect(appStore.books[0].chapters[0].notes.get()).toBe("Lazy loaded notes");
    });
  });

  it("saves changes locally if not logged in", async () => {
    vi.mocked(routerDom.useParams).mockReturnValue({ id: "chap-456", bookId: "book-123" });
    setupStoreWithChapter(true);

    render(<ChapterPage />);

    // Change title
    fireEvent.change(screen.getByDisplayValue("The Beginning"), { target: { value: "The New Beginning" } });

    // Trigger save via the mock editor
    fireEvent.click(screen.getByTestId("mock-editor-save"));

    await waitFor(() => {
      expect(appStore.books[0].chapters[0].title.get()).toBe("The New Beginning");
      expect(updateFileOnGitHub).not.toHaveBeenCalled();
      expect(showToast).toHaveBeenCalledWith("Chapter saved locally", "success");
    });
  });

  it("saves changes to cloud and triggers eventSync payloads if logged in", async () => {
    vi.mocked(routerDom.useParams).mockReturnValue({ id: "chap-456", bookId: "book-123" });
    localStorage.setItem("seshat-auth-token", "valid-token");
    setupStoreWithChapter(true);

    vi.mocked(updateFileOnGitHub).mockResolvedValue();
    vi.mocked(computeEventSync).mockImplementation((_bookIdx, eventId) => ({
      eventId,
      payloadStr: `{"mockPayloadFor": "${eventId}"}`
    }));

    render(<ChapterPage />);

    fireEvent.change(screen.getByDisplayValue("The Beginning"), { target: { value: "Cloud Title" } });
    fireEvent.click(screen.getByTestId("mock-editor-save"));

    await waitFor(() => {
      // It should sync the chapter itself
      expect(updateFileOnGitHub).toHaveBeenCalledWith(
        "valid-token",
        "book-123",
        "chapters/chapter_chap-456.json",
        expect.stringContaining("Cloud Title")
      );

      // It should compute event syncs for timeRef (event-1) and pinnedEvents (event-2)
      expect(computeEventSync).toHaveBeenCalledWith(0, "event-1", "chap-456", "event-1", ["char-1"]);
      expect(computeEventSync).toHaveBeenCalledWith(0, "event-2", "chap-456", "event-1", ["char-1"]);

      // It should sync those events
      expect(updateFileOnGitHub).toHaveBeenCalledWith(
        "valid-token",
        "book-123",
        "events/event_event-1.json",
        `{"mockPayloadFor": "event-1"}`
      );

      expect(showToast).toHaveBeenCalledWith("Chapter synced to cloud", "success");
    });
  });

  it("exports chapter to DOCX", async () => {
    vi.mocked(routerDom.useParams).mockReturnValue({ id: "chap-456", bookId: "book-123" });
    setupStoreWithChapter(true);

    render(<ChapterPage />);

    const exportBtn = screen.getByTitle("Export to plain text DOCX");
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(saveAs).toHaveBeenCalled();
      const callArgs = vi.mocked(saveAs).mock.calls[0];
      expect(callArgs[1]).toBe("The Beginning.docx"); // Filename
    });
  });
});
