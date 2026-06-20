import { describe, it, expect } from "vitest";
import { getConflicts, autoMergeOtherChapters } from "../conflictUtils";
import type { BookData } from "../../store/appStore";

const createBaseBook = (): BookData => ({
  id: "book-1",
  title: "Test Book",
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

describe("getConflicts", () => {
  it("returns zero conflicts when books are identical", () => {
    const local = createBaseBook();
    const server = createBaseBook();
    expect(getConflicts(local, server)).toEqual([]);
  });

  it("handles key order differences seamlessly", () => {
    const local = {
      ...createBaseBook(),
      chapters: [
        {
          id: "ch-1",
          number: "1",
          title: "Chapter 1",
          order: 1,
          timeRef: "",
        },
      ],
    } as unknown as BookData;

    const server = {
      ...createBaseBook(),
      chapters: [
        {
          timeRef: "",
          order: 1,
          title: "Chapter 1",
          number: "1",
          id: "ch-1",
        },
      ],
    } as unknown as BookData;

    expect(getConflicts(local, server)).toEqual([]);
  });

  it("ignores body and drafts when comparing chapters", () => {
    const local = {
      ...createBaseBook(),
      chapters: [
        {
          id: "ch-1",
          number: "1",
          title: "Chapter 1",
          order: 1,
          body: "Local Chapter Body content",
          drafts: [{ id: "d-1", name: "Draft 1", body: "Draft content" }],
        },
      ],
    } as unknown as BookData;

    const server = {
      ...createBaseBook(),
      chapters: [
        {
          id: "ch-1",
          number: "1",
          title: "Chapter 1",
          order: 1,
          body: "",
        },
      ],
    } as unknown as BookData;

    expect(getConflicts(local, server)).toEqual([]);
  });

  it("considers empty arrays/strings equivalent to undefined/null", () => {
    const local = {
      ...createBaseBook(),
      chapters: [
        {
          id: "ch-1",
          number: "1",
          title: "Chapter 1",
          order: 1,
          pinnedChars: [],
        },
      ],
    } as unknown as BookData;

    const server = {
      ...createBaseBook(),
      chapters: [
        {
          id: "ch-1",
          number: "1",
          title: "Chapter 1",
          order: 1,
        },
      ],
    } as unknown as BookData;

    expect(getConflicts(local, server)).toEqual([]);
  });

  it("detects real semantic changes", () => {
    const local = {
      ...createBaseBook(),
      chapters: [
        {
          id: "ch-1",
          number: "1",
          title: "Chapter 1 - Edited Title",
          order: 1,
        },
      ],
    } as unknown as BookData;

    const server = {
      ...createBaseBook(),
      chapters: [
        {
          id: "ch-1",
          number: "1",
          title: "Chapter 1",
          order: 1,
        },
      ],
    } as unknown as BookData;

    const conflicts = getConflicts(local, server);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].type).toBe("chapter");
    expect(conflicts[0].id).toBe("chapter_ch-1");
  });
});

describe("autoMergeOtherChapters", () => {
  it("auto-merges other chapters' conflicts to server while leaving active chapter unchanged", () => {
    const local = {
      ...createBaseBook(),
      chapters: [
        { id: "ch-1", number: "1", title: "Local Chapter 1", order: 1, body: "Local Body 1" },
        { id: "ch-2", number: "2", title: "Local Chapter 2", order: 2, body: "Local Body 2" },
      ],
    } as unknown as BookData;

    const server = {
      ...createBaseBook(),
      chapters: [
        { id: "ch-1", number: "1", title: "Server Chapter 1", order: 1 },
        { id: "ch-2", number: "2", title: "Server Chapter 2", order: 2 },
      ],
    } as unknown as BookData;

    const conflicts = getConflicts(local, server);
    // Merge while ch-1 is active
    const merged = autoMergeOtherChapters(local, conflicts, "ch-1");

    // ch-1 should keep local fields (since it was active and not auto-resolved)
    const ch1 = merged.chapters.find(c => c.id === "ch-1");
    expect(ch1?.title).toBe("Local Chapter 1");
    expect(ch1?.body).toBe("Local Body 1");

    // ch-2 should auto-resolve to server values (since ch-1 was active, so ch-2 is non-active)
    // while keeping its local body
    const ch2 = merged.chapters.find(c => c.id === "ch-2");
    expect(ch2?.title).toBe("Server Chapter 2");
    expect(ch2?.body).toBe("Local Body 2");
  });

  it("ignores activeDraftId when comparing chapters and preserves it during merge", () => {
    const local = {
      ...createBaseBook(),
      chapters: [
        {
          id: "ch-1",
          number: "1",
          title: "Chapter 1",
          order: 1,
          activeDraftId: "local-draft-id",
        },
      ],
    } as unknown as BookData;

    const server = {
      ...createBaseBook(),
      chapters: [
        {
          id: "ch-1",
          number: "1",
          title: "Chapter 1",
          order: 1,
        },
      ],
    } as unknown as BookData;

    // Verify it doesn't trigger a conflict
    expect(getConflicts(local, server)).toEqual([]);

    // Verify it is preserved during autoMergeOtherChapters
    const serverWithConflict = {
      ...createBaseBook(),
      chapters: [
        {
          id: "ch-1",
          number: "1",
          title: "Server Chapter 1",
          order: 1,
        },
      ],
    } as unknown as BookData;
    const conflicts = getConflicts(local, serverWithConflict);
    const merged = autoMergeOtherChapters(local, conflicts, "ch-2"); // ch-1 is non-active, so it auto-merges to server
    const ch1 = merged.chapters.find(c => c.id === "ch-1");
    expect(ch1?.title).toBe("Server Chapter 1");
    expect(ch1?.activeDraftId).toBe("local-draft-id");
  });
});
