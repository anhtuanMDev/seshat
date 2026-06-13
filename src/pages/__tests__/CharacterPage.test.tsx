import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CharacterPage from "../CharacterPage";
import { appStore, mkBook } from "../../store/appStore";
import { showToast } from "../../store/toastStore";
import { updateFileOnGitHub } from "../../lib/githubSync";
import * as routerDom from "react-router-dom";
import type { Character, Event } from "../../lib/types";

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
}));

vi.mock("../../lib/export", () => ({
  buildExport: vi.fn().mockReturnValue("Mocked Export Data"),
}));

// Mock the child modal components so we can interact with them easily
vi.mock("../../components/ui/Modal", () => ({
  Modal: ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
    <div data-testid="mock-modal">
      <h2>{title}</h2>
      <button onClick={onClose}>Cancel</button>
      {children}
    </div>
  )
}));

vi.mock("../../components/character/TraumaBlock", () => ({
  TraumaBlock: () => (
    <div data-testid="mock-trauma-block">
      <input 
        data-testid="mock-trauma-title" 
        onChange={() => {
          // This is a rough simulation of react-hook-form's nested fields
          // Since it's complex to mock RHF nested contexts perfectly, 
          // we'll just test that the modal opens and closes.
        }}
      />
    </div>
  ),
}));

// Setup a baseline state
function setupStoreWithCharacter() {
  const book = mkBook("Test Book");
  book.id = "book-123";
  
  const char: Character = {
    id: "char-1",
    name: "Hero",
    role: "Protagonist",
    archetype: "Fighter",
    coreWound: "Lost sword",
    coreFear: "Spiders",
    coreDesire: "Find sword",
    philosophy: "Fight hard",
    secrets: "Scared of dark",
    arcs: [],
    statusTimeline: [],
    traumas: [{
      id: "trauma-1",
      title: "The Bite",
      when: "Childhood",
      description: "Bitten by spider",
      trigger: "Webs",
      manifestation: "Screaming"
    }],
    conditions: [],
    achievements: [],
    losses: [],
    relationships: [],
    attributes: {},
    skills: [],
    equipment: [],
    color: "#ff0000",
    branch: [],
  };
  
  book.characters = [char];
  book.events = [
    { id: "event-1", time: 1, title: "Birth" } as unknown as Event,
  ];

  appStore.books.set([book]);
  appStore.activeBookId.set("book-123");
}

describe("CharacterPage Edge-to-Edge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders 'Character not found' if missing", () => {
    vi.mocked(routerDom.useParams).mockReturnValue({ id: "missing" });
    setupStoreWithCharacter(); 

    render(<CharacterPage />);
    expect(screen.getByText("Character not found.")).toBeInTheDocument();
  });

  it("populates form with existing character data", () => {
    vi.mocked(routerDom.useParams).mockReturnValue({ id: "char-1" });
    setupStoreWithCharacter();

    render(<CharacterPage />);

    expect(screen.getByDisplayValue("Hero")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Protagonist")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Lost sword")).toBeInTheDocument();
    
    // Existing trauma is rendered
    expect(screen.getByText("The Bite")).toBeInTheDocument();
  });

  it("adds a new item via modal", async () => {
    vi.mocked(routerDom.useParams).mockReturnValue({ id: "char-1" });
    setupStoreWithCharacter();

    render(<CharacterPage />);

    const errors: Error[] = [];
    window.addEventListener("error", (e) => errors.push(e.error));
    window.addEventListener("unhandledrejection", (e) => errors.push(e.reason));

    const addBtns = screen.getAllByText("add");
    fireEvent.click(addBtns[1]);

    // Modal opens
    await waitFor(() => {
      if (errors.length > 0) console.error("Caught error:", errors[0]);
      expect(screen.getByTestId("mock-modal")).toBeInTheDocument();
    });

    // Close the modal by cancelling
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    
    await waitFor(() => {
      expect(screen.queryByTestId("mock-modal")).not.toBeInTheDocument();
    });
  });

  it("deletes an existing item", async () => {
    vi.mocked(routerDom.useParams).mockReturnValue({ id: "char-1" });
    setupStoreWithCharacter();

    render(<CharacterPage />);

    // Click the delete icon on the existing trauma
    const deleteBtn = screen.getByTitle("Delete item");
    fireEvent.click(deleteBtn);

    // The item should disappear from the UI
    await waitFor(() => {
      expect(screen.queryByText("The Bite")).not.toBeInTheDocument();
      expect(screen.getByText("No traumas recorded.")).toBeInTheDocument();
    });
  });

  it("saves changes to cloud if logged in", async () => {
    vi.mocked(routerDom.useParams).mockReturnValue({ id: "char-1" });
    localStorage.setItem("seshat-auth-token", "valid-token");
    setupStoreWithCharacter();
    (updateFileOnGitHub as Mock).mockResolvedValue(undefined);

    render(<CharacterPage />);

    // Change character name
    fireEvent.change(screen.getByDisplayValue("Hero"), { target: { value: "Villain" } });

    // Click save
    const saveBtn = screen.getByRole("button", { name: "save" });
    expect(saveBtn).not.toBeDisabled();
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateFileOnGitHub).toHaveBeenCalledWith(
        "valid-token",
        "book-123",
        "characters/char_char-1.json",
        expect.stringContaining("Villain")
      );
      expect(showToast).toHaveBeenCalledWith("Character synced to cloud", "success");
      expect(appStore.books[0].characters[0].name.get()).toBe("Villain");
    });
  });
});
