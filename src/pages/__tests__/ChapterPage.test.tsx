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
  updateFilesOnGitHub: vi.fn(),
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
    
    vi.mocked(loadFileFromGitHub).mockImplementation(async (_token, _bookId, path) => {
      if (path.endsWith("metadata.json")) {
        return {
          notes: "Lazy loaded notes",
          drafts: [{ id: "draft-123", name: "Draft 1", createdAt: Date.now() }]
        };
      }
      if (path.endsWith("draft-123.json")) {
        return {
          id: "draft-123",
          name: "Draft 1",
          body: "<p>Lazy loaded body</p>",
          createdAt: Date.now()
        };
      }
      return {};
    });

    render(<ChapterPage />);

    await waitFor(() => {
      expect(loadFileFromGitHub).toHaveBeenCalledWith("valid-token", "book-123", "chapters/chapter_chap-456/metadata.json");
      expect(loadFileFromGitHub).toHaveBeenCalledWith("valid-token", "book-123", "chapters/chapter_chap-456/draft-123.json");
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

    const { updateFilesOnGitHub } = await import("../../lib/githubSync");
    vi.mocked(updateFilesOnGitHub).mockResolvedValue();
    vi.mocked(computeEventSync).mockImplementation((_bookIdx, eventId) => ({
      eventId,
      payloadStr: `{"mockPayloadFor": "${eventId}"}`
    }));

    render(<ChapterPage />);

    fireEvent.change(screen.getByDisplayValue("The Beginning"), { target: { value: "Cloud Title" } });
    fireEvent.click(screen.getByTestId("mock-editor-save"));

    await waitFor(() => {
      // It should sync the files using updateFilesOnGitHub
      expect(updateFilesOnGitHub).toHaveBeenCalledWith(
        "valid-token",
        "book-123",
        expect.arrayContaining([
          expect.objectContaining({
            path: "chapters/chapter_chap-456/metadata.json",
            content: expect.stringContaining("Cloud Title")
          }),
          expect.objectContaining({
            path: "events/event_event-1.json",
            content: `{"mockPayloadFor": "event-1"}`
          }),
          expect.objectContaining({
            path: "events/event_event-2.json",
            content: `{"mockPayloadFor": "event-2"}`
          })
        ])
      );

      expect(showToast).toHaveBeenCalledWith("Chapter synced to cloud", "success");
    });
  });

  it("saves changes to the first/fallback draft when activeDraftId is missing or null", async () => {
    vi.mocked(routerDom.useParams).mockReturnValue({ id: "chap-456", bookId: "book-123" });
    localStorage.setItem("seshat-auth-token", "valid-token");
    setupStoreWithChapter(true);
    
    // Set up existing drafts but keep activeDraftId null
    appStore.books[0].chapters[0].drafts.set([
      { id: "draft-xyz", name: "Existing Draft", body: "<p>Original body</p>", createdAt: Date.now() }
    ]);
    appStore.books[0].chapters[0].activeDraftId?.set(undefined);

    const { updateFilesOnGitHub } = await import("../../lib/githubSync");
    vi.mocked(updateFilesOnGitHub).mockResolvedValue();

    render(<ChapterPage />);

    // Trigger save
    fireEvent.click(screen.getByTestId("mock-editor-save"));

    await waitFor(() => {
      // It should fallback to draft-xyz and update its body in filesToSync
      expect(updateFilesOnGitHub).toHaveBeenCalledWith(
        "valid-token",
        "book-123",
        expect.arrayContaining([
          expect.objectContaining({
            path: "chapters/chapter_chap-456/draft-xyz.json",
            content: expect.stringContaining("It was a dark and stormy night.")
          })
        ])
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
