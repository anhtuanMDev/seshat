import { describe, it, expect, vi, beforeEach } from "vitest";
import { appStore } from "../../store/appStore";
import { computeEventSync } from "../eventSync";

// Mock legend-state store structure
const setMock1 = vi.fn();
const setMock2 = vi.fn();

vi.mock("../../store/appStore", () => ({
  appStore: {
    books: [
      {
        events: {
          get: () => [{ id: "evt-1" }, { id: "evt-2" }],
        },
        chapters: {
          get: () => [
            { id: "ch-1", timeRef: "evt-1", pinnedChars: ["char-1", "char-2"] },
            { id: "ch-2", timeRef: "evt-1", pinnedChars: ["char-3"] },
          ],
        },
        characters: {
          get: () => [
            { id: "char-1", attributes: { "evt-1": { emotional: "angry" } } },
            { id: "char-2", attributes: {} },
            { id: "char-3", attributes: { "evt-1": { physical: "hurt" } } },
          ],
        },
      },
    ],
  },
}));

describe("computeEventSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup observable mock returns
    appStore.books[0].events[0] = {
      id: { get: () => "evt-1" },
      characters: { get: () => ["char-1"], set: setMock1 },
      chapters: { get: () => ["ch-1"], set: setMock2 },
      get: () => ({ id: "evt-1", characters: ["char-1"], chapters: ["ch-1"] }),
    } as unknown as typeof appStore.books[number]["events"][number];
  });

  it("returns null if event not found", () => {
    const result = computeEventSync(
      0,
      "evt-missing",
      "ch-1",
      "evt-missing",
      [],
    );
    expect(result).toBeNull();
  });

  it("computes event char sync additions properly", () => {
    // Current chapter modifies timeRef to evt-1, chars to [char-2, char-4]
    const result = computeEventSync(0, "evt-1", "ch-1", "evt-1", [
      "char-2",
      "char-4",
    ]);
    expect(result).not.toBeNull();
    // Expected chars: char-3 (from ch-2), char-2, char-4 (from ch-1)
    // Plus char-1 because they have meaningful attributes manually set for evt-1
    expect(setMock1).toHaveBeenCalledWith(
      expect.arrayContaining(["char-1", "char-2", "char-4", "char-3"]),
    );
    expect(setMock2).toHaveBeenCalledWith(
      expect.arrayContaining(["ch-1", "ch-2"]),
    );
  });

  it("removes characters if no attributes and removed from chapter links", () => {
    // char-2 has no meaningful attributes. If ch-1 removes char-2, char-2 should be dropped.
    appStore.books[0].events[0].characters.get = () => ["char-2"];

    const result = computeEventSync(0, "evt-1", "ch-1", "evt-1", []);
    expect(result).not.toBeNull();

    // char-3 is linked in ch-2
    expect(setMock1).toHaveBeenCalledWith(["char-3"]);
  });

  it("returns null if no modifications needed", () => {
    appStore.books[0].events[0].characters.get = () => [
      "char-1",
      "char-2",
      "char-3",
    ];
    appStore.books[0].events[0].chapters.get = () => ["ch-1", "ch-2"];

    const result = computeEventSync(0, "evt-1", "ch-1", "evt-1", [
      "char-1",
      "char-2",
    ]);
    expect(result).toBeNull();
  });
});
