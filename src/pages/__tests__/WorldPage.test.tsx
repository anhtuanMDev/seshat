import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WorldPage from "../WorldPage";
import { appStore, mkBook } from "../../store/appStore";
import { showToast } from "../../store/toastStore";
import { updateFilesOnGitHub } from "../../lib/githubSync";
import type { Nation } from "../../store/appStore";

// Mock dependencies
vi.mock("../../store/toastStore", () => ({
  showToast: vi.fn(),
}));

vi.mock("../../lib/githubSync", () => ({
  updateFilesOnGitHub: vi.fn(),
}));

// Mock child modal components
vi.mock("../../components/ui/Modal", () => ({
  Modal: ({ title, children, onClose, footer }: { title: string; children?: React.ReactNode; onClose?: () => void; footer?: React.ReactNode }) => (
    <div data-testid="mock-modal">
      <h2>{title}</h2>
      <button onClick={onClose} aria-label="Cancel">Cancel Modal</button>
      {footer}
      {children}
    </div>
  )
}));

vi.mock("../../components/ui", async () => {
  const actual = await vi.importActual("../../components/ui");
  return {
    ...actual as Record<string, unknown>,
    Section: ({ title, action, children }: { title: React.ReactNode; action: React.ReactNode; children?: React.ReactNode }) => (
      <div data-testid="mock-section">
        <div>{title}</div>
        <div data-testid="section-action">{action}</div>
        {children}
      </div>
    ),
    GhostButton: ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
      <button onClick={onClick} data-testid="add-btn">{children}</button>
    )
  };
});

vi.mock("../../components/world/NationBlock", () => ({
  NationBlock: () => <div data-testid="mock-nation-block" />
}));

function setupStoreWithWorld() {
  const book = mkBook("Test World Book");
  book.id = "book-world";
  book.setting = "Fantasy";
  
  const nation: Nation = {
    id: "nat-1",
    name: "Fire Kingdom",
    type: "Kingdom",
    capital: "Fire City",
    ruler: "Fire King",
    population: "1000",
    geography: "Volcanic",
    culture: "Fiery",
    military: "Strong",
    economy: "Poor",
    periodActive: "Always",
    allianceLogic: "None",
    secrets: "None",
    lore: "None",
    connections: []
  };
  
  book.nations = [nation];
  
  appStore.books.set([book]);
  appStore.activeBookId.set("book-world");
}

describe("WorldPage Edge-to-Edge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("populates the form with existing world data", () => {
    setupStoreWithWorld();
    render(<WorldPage />);
    
    expect(screen.getByDisplayValue("Test World Book")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Fantasy")).toBeInTheDocument();
    expect(screen.getByText("Fire Kingdom")).toBeInTheDocument();
  });

  it("adds a new nation via modal", async () => {
    setupStoreWithWorld();
    render(<WorldPage />);
    
    const addBtns = screen.getAllByTestId("add-btn");
    // Nations is the first section
    fireEvent.click(addBtns[0]);
    
    await waitFor(() => {
      expect(screen.getByTestId("mock-modal")).toBeInTheDocument();
      expect(screen.getByText("Add Nation / Faction")).toBeInTheDocument();
      expect(screen.getByTestId("mock-nation-block")).toBeInTheDocument();
    });
    
    // Cancel via custom cancel button to close
    fireEvent.click(screen.getByText("Cancel Modal"));
    
    await waitFor(() => {
      expect(screen.queryByTestId("mock-modal")).not.toBeInTheDocument();
    });
  });

  it("edits an existing nation", async () => {
    setupStoreWithWorld();
    render(<WorldPage />);
    
    // Click on the existing nation card
    fireEvent.click(screen.getByText("Fire Kingdom"));
    
    await waitFor(() => {
      expect(screen.getByTestId("mock-modal")).toBeInTheDocument();
      expect(screen.getByText("Edit Nation / Faction Details")).toBeInTheDocument();
    });
  });

  it("saves changes to cloud and triggers sync", async () => {
    localStorage.setItem("seshat-auth-token", "valid-token");
    setupStoreWithWorld();
    (updateFilesOnGitHub as Mock).mockResolvedValue(undefined);
    
    render(<WorldPage />);
    
    // Change setting
    fireEvent.change(screen.getByDisplayValue("Fantasy"), { target: { value: "Sci-Fi" } });
    
    // Wait for react-hook-form to register dirty state
    await waitFor(() => {
      const saveBtns = screen.getAllByTitle("Save changes");
      expect(saveBtns[0]).not.toBeDisabled();
    });
    
    const saveBtns = screen.getAllByTitle("Save changes");
    fireEvent.click(saveBtns[0]);
    
    await waitFor(() => {
      expect(updateFilesOnGitHub).toHaveBeenCalledWith(
        "valid-token",
        "book-world",
        expect.arrayContaining([
          expect.objectContaining({ path: "world/world.json" }),
          expect.objectContaining({ path: "world/nations/nation_nat-1.json" })
        ])
      );
      expect(showToast).toHaveBeenCalledWith("World synced to cloud", "success");
      expect(appStore.books[0].setting.get()).toBe("Sci-Fi");
    });
  });
});
