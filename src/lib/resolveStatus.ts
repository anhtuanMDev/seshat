import type { Character, Event, StatusEntry } from "./types";

/**
 * Resolves the most relevant StatusEntry for a character given a chapter's
 * time context.
 *
 * Algorithm:
 *   1. Collect all status entries that have a valid startDate.
 *   2. Filter to entries where startDate <= contextDate (the chapter moment).
 *   3. Among those, pick the one with the latest startDate — i.e. the most
 *      recent state the character was in, at or before the chapter's time.
 *   4. If no dated entries qualify, fall back to the entry whose linked event
 *      has the highest `time` value that is <= the chapter's event time.
 *   5. If still nothing, return undefined.
 *
 * contextDate: ISO datetime string representing the chapter's point in time.
 *   Derived from the earliest startDate of the chapter's pinned events,
 *   or undefined if no pinned events.
 *
 * contextEventTime: numeric T-value of the chapter context (from pinned events
 *   or undefined). Used as a fallback when no startDates exist.
 */
export function resolveStatusAt(
  char: Character,
  events: Event[],
  contextDate?: string, // ISO string, e.g. "2024-01-20T17:00"
  contextEventTime?: number, // numeric T-value, e.g. 3
): StatusEntry | undefined {
  const timeline = char.statusTimeline || [];
  if (!timeline.length) return undefined;

  // ── Path 1: date-based resolution ────────────────────────────────────────
  if (contextDate) {
    const ctxMs = new Date(contextDate).getTime();
    if (!isNaN(ctxMs)) {
      const dated = timeline
        .filter((e) => e.startDate && !isNaN(new Date(e.startDate).getTime()))
        .filter((e) => new Date(e.startDate).getTime() <= ctxMs)
        .sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
        );
      if (dated.length) return dated[0];
    }
  }

  // ── Path 2: event-time fallback ───────────────────────────────────────────
  const eventTimeMap = new Map(events.map((e) => [e.id, e.time]));
  const tLimit = contextEventTime ?? Infinity;

  const byEventTime = timeline
    .map((entry) => ({
      entry,
      t: eventTimeMap.get(entry.eventId) ?? -1,
    }))
    .filter(({ t }) => t >= 0 && t <= tLimit)
    .sort((a, b) => b.t - a.t);

  if (byEventTime.length) return byEventTime[0].entry;

  // ── Path 3: absolute fallback (no context at all) ─────────────────────────
  // Return the last entry by startDate if available, else last by eventId order
  const withDates = timeline.filter((e) => e.startDate);
  if (withDates.length) {
    return withDates.sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    )[0];
  }

  // Last resort: last entry as-is
  return timeline[timeline.length - 1];
}

/**
 * Extracts the chapter's time context from its pinned events.
 * Returns the earliest startDate among pinned events (the chapter's "opening
 * moment"), and the lowest T-value as the event-time fallback.
 */
export function chapterContext(pinnedEvents: Event[]): {
  contextDate: string | undefined;
  contextEventTime: number | undefined;
} {
  if (!pinnedEvents.length) {
    return { contextDate: undefined, contextEventTime: undefined };
  }

  // Earliest startDate among pinned events = the start of the chapter's window
  const dates = pinnedEvents
    .map((e) => e.startDate)
    .filter(Boolean)
    .map((d) => new Date(d).getTime())
    .filter((ms) => !isNaN(ms));

  const contextDate =
    dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : undefined;

  // Lowest T-value = the event-time fallback
  const times = pinnedEvents.map((e) => e.time).filter((t) => t != null);
  const contextEventTime = times.length > 0 ? Math.min(...times) : undefined;

  return { contextDate, contextEventTime };
}
