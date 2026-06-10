import { appStore } from "../store/appStore";

export function computeEventSync(
  bookIdx: number,
  eventId: string,
  chapterId: string,
  newTimeRef: string | undefined,
  newPinnedChars: string[] | undefined
): { eventId: string; payloadStr: string } | null {
  const events = appStore.books[bookIdx].events.get();
  if (!events) return null;
  
  const eIdx = events.findIndex(e => e.id === eventId);
  if (eIdx < 0) return null;
  
  const ev = appStore.books[bookIdx].events[eIdx];
  const currentEvChars = ev.characters.get() || [];
  const currentEvChapters = ev.chapters.get() || [];
  let modified = false;

  const allChapters = appStore.books[bookIdx].chapters.get() || [];
  const expectedChars = new Set<string>();
  const expectedChapters = new Set<string>();

  allChapters.forEach(c => {
    const isCurrentChapter = c.id === chapterId;
    const cTimeRef = isCurrentChapter ? newTimeRef : c.timeRef;
    const cPinnedChars = isCurrentChapter ? newPinnedChars : c.pinnedChars;

    if (cTimeRef === eventId) {
      expectedChapters.add(c.id);
      if (cPinnedChars) {
        cPinnedChars.forEach(cid => expectedChars.add(cid));
      }
    }
  });

  const nextEvChars: string[] = [];
  currentEvChars.forEach(cid => {
    if (expectedChars.has(cid)) {
      nextEvChars.push(cid);
    } else {
      const attrs = appStore.books[bookIdx].characters.get()?.find(c => c.id === cid)?.attributes?.[eventId];
      const hasMeaningfulAttrs = attrs && Object.values(attrs).some(v => v !== "" && v !== undefined && v !== null);
      if (hasMeaningfulAttrs) {
        nextEvChars.push(cid);
      } else {
        modified = true;
      }
    }
  });
  expectedChars.forEach(cid => {
    if (!nextEvChars.includes(cid)) {
      nextEvChars.push(cid);
      modified = true;
    }
  });

  const nextEvChapters: string[] = [];
  currentEvChapters.forEach(cid => {
    if (expectedChapters.has(cid)) {
      nextEvChapters.push(cid);
    } else {
      modified = true;
    }
  });
  expectedChapters.forEach(cid => {
    if (!nextEvChapters.includes(cid)) {
      nextEvChapters.push(cid);
      modified = true;
    }
  });

  if (modified) {
    ev.characters.set(nextEvChars);
    ev.chapters.set(nextEvChapters);
    return {
      eventId: ev.id.get(),
      payloadStr: JSON.stringify(ev.get(), null, 2),
    };
  }
  return null;
}
