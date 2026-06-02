import type { Character, Event, StatusEntry } from "./types";

/**
 * Resolves the most relevant StatusEntry for a character given a chapter's
 * time context.
 *
 * Algorithm:
 *   1. If context events have a date window (startDate–endDate), find all
 *      status entries whose startDate falls within or before the window end.
 *      Among those, pick the one with the latest startDate ≤ window end.
 *      "Within the event window" means startDate is between the event's
 *      startDate and endDate inclusive. This is the key fix: a prologue
 *      event at T-1 with dates in August should show the August status,
 *      not the most recent one ever.
 *   2. Fall back to event-time comparison when no dates exist.
 *   3. Absolute fallback: last entry.
 *
 * contextDate: The upper bound of the chapter's time window (ISO string).
 *   Derived from the earliest startDate of pinned events.
 * contextWindowStart: The lower bound of the chapter's time window (ISO
 *   string). Derived from the earliest startDate of pinned events.
 * contextEventTime: Numeric T-value fallback.
 */
export function resolveStatusAt(
  char: Character,
  events: Event[],
  contextDate?: string,
  contextEventTime?: number,
  contextWindowStart?: string,
): StatusEntry | undefined {
  const timeline = char.statusTimeline || [];
  if (!timeline.length) return undefined;

  // ── Path 1: date-based resolution ────────────────────────────────────────
  if (contextDate) {
    const ctxEndMs = new Date(contextDate).getTime();
    if (!isNaN(ctxEndMs)) {
      const ctxStartMs = contextWindowStart
        ? new Date(contextWindowStart).getTime()
        : -Infinity;

      // Prefer entries whose startDate is within the event window
      if (!isNaN(ctxStartMs) && ctxStartMs !== -Infinity) {
        const withinWindow = timeline
          .filter((e) => {
            if (!e.startDate) return false;
            const ms = new Date(e.startDate).getTime();
            return !isNaN(ms) && ms >= ctxStartMs && ms <= ctxEndMs;
          })
          .sort(
            (a, b) =>
              new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
          );
        if (withinWindow.length) return withinWindow[0];
      }

      // Fall back: latest entry whose startDate ≤ context end
      const dated = timeline
        .filter((e) => e.startDate && !isNaN(new Date(e.startDate).getTime()))
        .filter((e) => new Date(e.startDate).getTime() <= ctxEndMs)
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

  // ── Path 3: absolute fallback ─────────────────────────────────────────────
  const withDates = timeline.filter((e) => e.startDate);
  if (withDates.length) {
    return withDates.sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    )[0];
  }

  return timeline[timeline.length - 1];
}

/**
 * Extracts the chapter's time context from its pinned events.
 * Returns contextDate as the END of the event window (latest endDate or
 * latest startDate), contextWindowStart as the START (earliest startDate),
 * and contextEventTime as the lowest T-value.
 *
 * The window-based approach: an event from 20-Aug to 25-Aug means we want
 * status entries that fall within that 5-day window, not the all-time latest.
 */
export function chapterContext(pinnedEvents: Event[]): {
  contextDate: string | undefined;
  contextWindowStart: string | undefined;
  contextEventTime: number | undefined;
} {
  if (!pinnedEvents.length) {
    return {
      contextDate: undefined,
      contextWindowStart: undefined,
      contextEventTime: undefined,
    };
  }

  const startDates = pinnedEvents
    .map((e) => e.startDate)
    .filter(Boolean)
    .map((d) => new Date(d).getTime())
    .filter((ms) => !isNaN(ms));

  const endDates = pinnedEvents
    .map((e) => e.endDate || e.startDate)
    .filter(Boolean)
    .map((d) => new Date(d).getTime())
    .filter((ms) => !isNaN(ms));

  // contextDate = latest end of pinned events = upper bound of window
  const contextDate =
    endDates.length > 0
      ? new Date(Math.max(...endDates)).toISOString()
      : startDates.length > 0
        ? new Date(Math.max(...startDates)).toISOString()
        : undefined;

  // contextWindowStart = earliest start of pinned events = lower bound
  const contextWindowStart =
    startDates.length > 0
      ? new Date(Math.min(...startDates)).toISOString()
      : undefined;

  // contextEventTime = lowest T-value among pinned events
  const times = pinnedEvents.map((e) => e.time).filter((t) => t != null);
  const contextEventTime = times.length > 0 ? Math.min(...times) : undefined;

  return { contextDate, contextWindowStart, contextEventTime };
}
