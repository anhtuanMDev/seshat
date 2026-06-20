import { describe, it, expect } from "vitest";
import { getConflicts } from "../conflictUtils";
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
