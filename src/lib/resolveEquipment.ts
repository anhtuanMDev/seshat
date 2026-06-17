import type { Equipment, Event, StatusEntry } from "./types";

/**
 * Resolves the equipment array for a character at a specific status timeline context.
 *
 * Rules:
 * 1. If contextId is "base" or empty, return all items exactly as configured (base state).
 * 2. If contextId is a valid StatusEntry ID:
 *    - Find the statusEntry and its associated story event.
 *    - Filter out items whose gained event time is strictly AFTER the current event time.
 *    - Filter out items whose lost event time is BEFORE OR AT the current event time.
 *    - For active items, check their `history` array for any overrides at or before the current event time.
 *      Use the latest override state. If none exists, fall back to the base state.
 */
export function resolveEquipmentAt(
  equipmentList: Equipment[],
  events: Event[],
  statusTimeline: StatusEntry[],
  contextId?: string,
): Equipment[] {
  if (!contextId || contextId === "base") {
    return equipmentList;
  }

  // 1. Try to find activeEvent by chapterId
  const chapterEvents = events.filter((e) => e.chapters?.includes(contextId));
  let activeEvent = chapterEvents.length > 0
    ? [...chapterEvents].sort((a, b) => a.time - b.time)[0]
    : undefined;

  // 2. Try to find activeEvent directly by contextId (if it's an eventId)
  if (!activeEvent) {
    activeEvent = events.find((e) => e.id === contextId);
  }

  // 3. If not found, try to find it via statusTimeline (fallback)
  if (!activeEvent) {
    const activeStatus = statusTimeline.find((s) => s.id === contextId);
    if (activeStatus) {
      activeEvent = events.find((e) => e.id === activeStatus.eventId);
    }
  }

  // 4. If still not found, return base equipment list
  if (!activeEvent) {
    return equipmentList;
  }

  const activeEventTime = activeEvent.time;
  const eventTimeMap = new Map(events.map((e) => [e.id, e.time]));

  return equipmentList
    .filter((eq) => {
      // 1. Check if item has been gained/introduced yet
      if (eq.atEventId) {
        const gainedTime = eventTimeMap.get(eq.atEventId);
        if (gainedTime !== undefined && gainedTime > activeEventTime) {
          return false;
        }
      }

      // 2. Check if item has already been lost/destroyed
      if (eq.lostEventId) {
        const lostTime = eventTimeMap.get(eq.lostEventId);
        if (lostTime !== undefined && lostTime <= activeEventTime) {
          return false;
        }
      }

      return true;
    })
    .map((eq) => {
      // 3. Resolve accessState overrides based on history
      if (!eq.history || !eq.history.length) {
        return eq;
      }

      // Find all history entries that occurred at or before the active event time
      const validHistory = eq.history
        .map((h) => ({
          ...h,
          time: eventTimeMap.get(h.eventId) ?? -1,
        }))
        .filter((h) => h.time !== -1 && h.time <= activeEventTime)
        .sort((a, b) => b.time - a.time); // Latest first

      if (validHistory.length > 0) {
        return {
          ...eq,
          accessState: validHistory[0].accessState,
        };
      }

      return eq;
    });
}
