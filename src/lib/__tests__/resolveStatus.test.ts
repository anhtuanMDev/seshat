import { describe, it, expect } from "vitest";
import { resolveStatusAt, chapterContext } from "../resolveStatus";
import type { Character, Event, StatusEntry } from "../types";

describe("chapterContext", () => {
  it("returns undefined for empty pinned events", () => {
    const ctx = chapterContext([]);
    expect(ctx.contextDate).toBeUndefined();
    expect(ctx.contextWindowStart).toBeUndefined();
    expect(ctx.contextEventTime).toBeUndefined();
  });

  it("extracts context from single pinned event", () => {
    const events: Event[] = [
      { id: "e1", startDate: "2023-01-01", endDate: "2023-01-05", time: 10 } as unknown as Event
    ];
    const ctx = chapterContext(events);
    expect(ctx.contextDate).toBe(new Date("2023-01-05").toISOString());
    expect(ctx.contextWindowStart).toBe(new Date("2023-01-01").toISOString());
    expect(ctx.contextEventTime).toBe(10);
  });

  it("extracts context from multiple pinned events spanning a window", () => {
    const events: Event[] = [
      { id: "e1", startDate: "2023-01-01", endDate: "2023-01-05", time: 10 } as unknown as Event,
      { id: "e2", startDate: "2023-01-04", endDate: "2023-01-10", time: 8 } as unknown as Event
    ];
    const ctx = chapterContext(events);
    expect(ctx.contextDate).toBe(new Date("2023-01-10").toISOString());
    expect(ctx.contextWindowStart).toBe(new Date("2023-01-01").toISOString());
    expect(ctx.contextEventTime).toBe(8);
  });
});

describe("resolveStatusAt", () => {
  it("returns undefined if character has no timeline", () => {
    const char: Character = { id: "c1", statusTimeline: [] } as unknown as Character;
    expect(resolveStatusAt(char, [])).toBeUndefined();
  });

  it("resolves exact date match within window", () => {
    const entry1: StatusEntry = { id: "s1", startDate: "2022-12-01", eventId: "" } as unknown as StatusEntry;
    const entry2: StatusEntry = { id: "s2", startDate: "2023-01-03", eventId: "" } as unknown as StatusEntry;
    const entry3: StatusEntry = { id: "s3", startDate: "2023-02-01", eventId: "" } as unknown as StatusEntry;
    
    const char: Character = { id: "c1", statusTimeline: [entry1, entry2, entry3] } as unknown as Character;
    
    // Window: Jan 1 - Jan 5
    const result = resolveStatusAt(
      char,
      [],
      new Date("2023-01-05").toISOString(),
      undefined,
      new Date("2023-01-01").toISOString()
    );
    expect(result).toBe(entry2);
  });

  it("falls back to entry before window if none in window", () => {
    const entry1: StatusEntry = { id: "s1", startDate: "2022-12-01", eventId: "" } as unknown as StatusEntry;
    const entry2: StatusEntry = { id: "s2", startDate: "2023-02-01", eventId: "" } as unknown as StatusEntry;
    
    const char: Character = { id: "c1", statusTimeline: [entry1, entry2] } as unknown as Character;
    
    // Window: Jan 1 - Jan 5
    const result = resolveStatusAt(
      char,
      [],
      new Date("2023-01-05").toISOString(),
      undefined,
      new Date("2023-01-01").toISOString()
    );
    expect(result).toBe(entry1);
  });

  it("falls back to event time if no dates provided", () => {
    const entry1: StatusEntry = { id: "s1", eventId: "e1" } as unknown as StatusEntry;
    const entry2: StatusEntry = { id: "s2", eventId: "e2" } as unknown as StatusEntry;
    
    const char: Character = { id: "c1", statusTimeline: [entry1, entry2] } as unknown as Character;
    const events: Event[] = [
      { id: "e1", time: 5 } as unknown as Event,
      { id: "e2", time: 10 } as unknown as Event
    ];
    
    const result = resolveStatusAt(char, events, undefined, 8, undefined);
    expect(result).toBe(entry1); // e1 is t=5, e2 is t=10. tLimit=8, so e1 is valid.
  });

  it("falls back to absolute latest if no context", () => {
    const entry1: StatusEntry = { id: "s1", eventId: "e1" } as unknown as StatusEntry;
    const entry2: StatusEntry = { id: "s2", eventId: "e2" } as unknown as StatusEntry;
    
    const char: Character = { id: "c1", statusTimeline: [entry1, entry2] } as unknown as Character;
    const result = resolveStatusAt(char, [], undefined, undefined, undefined);
    expect(result).toBe(entry2);
  });
});
