import type { BookData } from "../store/appStore";

export interface ConflictItem {
  id: string;
  type: string;
  name: string;
  localValue: unknown;
  serverValue: unknown;
  resolution?: "local" | "server";
}

function canonicalStringify(val: unknown): string {
  if (val === null || val === undefined) {
    return "";
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return "";
    return "[" + val.map(canonicalStringify).filter(Boolean).join(",") + "]";
  }
  if (typeof val === "object") {
    const keys = Object.keys(val).sort();
    const parts = keys.map(k => {
      const v = (val as Record<string, unknown>)[k];
      if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) {
        return "";
      }
      return `${JSON.stringify(k)}:${canonicalStringify(v)}`;
    }).filter(Boolean);
    if (parts.length === 0) return "";
    return "{" + parts.join(",") + "}";
  }
  if (val === "") return "";
  return JSON.stringify(val);
}

export function getConflicts(localBook: BookData, serverBook: BookData): ConflictItem[] {
  const list: ConflictItem[] = [];

  const diffEntities = <T extends { id: string }>(
    type: string,
    localArr: T[] | undefined,
    serverArr: T[] | undefined,
    getName: (item: T) => string,
    excludeKeys: string[] = []
  ) => {
    const serverMap = new Map((serverArr || []).map(i => [i.id, i]));
    (localArr || []).forEach(localItem => {
      const serverItem = serverMap.get(localItem.id);
      if (!serverItem) {
        list.push({
          id: `${type}_${localItem.id}`,
          type,
          name: `${getName(localItem)} (Local Only)`,
          localValue: localItem,
          serverValue: null,
        });
      } else {
        const l: Record<string, unknown> = { ...localItem } as unknown as Record<string, unknown>;
        const s: Record<string, unknown> = { ...serverItem } as unknown as Record<string, unknown>;
        excludeKeys.forEach(k => {
          delete l[k];
          delete s[k];
        });
        if (canonicalStringify(l) !== canonicalStringify(s)) {
          console.log(`[Conflict Debug] Conflict detected for ${type}/${localItem.id}:`, {
            localStringified: canonicalStringify(l),
            serverStringified: canonicalStringify(s),
            localObj: l,
            serverObj: s
          });
          list.push({
            id: `${type}_${localItem.id}`,
            type,
            name: getName(localItem),
            localValue: localItem,
            serverValue: serverItem,
          });
        }
        serverMap.delete(localItem.id);
      }
    });
    serverMap.forEach(serverItem => {
      list.push({
        id: `${type}_${serverItem.id}`,
        type,
        name: `${getName(serverItem)} (Cloud Only)`,
        localValue: null,
        serverValue: serverItem,
      });
    });
  };

  // Diff Book Metadata
  const localMeta = {
    title: localBook.title,
    synopsis: localBook.synopsis,
    setting: localBook.setting,
    themes: localBook.themes,
    rules: localBook.rules,
  };
  const serverMeta = {
    title: serverBook.title,
    synopsis: serverBook.synopsis,
    setting: serverBook.setting,
    themes: serverBook.themes,
    rules: serverBook.rules,
  };
  if (canonicalStringify(localMeta) !== canonicalStringify(serverMeta)) {
    list.push({
      id: "meta_book",
      type: "metadata",
      name: "Book Metadata & World Rules",
      localValue: localMeta,
      serverValue: serverMeta,
    });
  }

  diffEntities("character", localBook.characters, serverBook.characters, c => c.name || "Unnamed Character");
  diffEntities("event", localBook.events, serverBook.events, e => e.title || "Unnamed Event");
  diffEntities("chapter", localBook.chapters, serverBook.chapters, c => `Chapter ${c.number}: ${c.title || ""}`, [
    "body",
    "drafts",
    "activeDraftId",
  ]);
  diffEntities("nation", localBook.nations, serverBook.nations, n => n.name || "Unnamed Nation");
  diffEntities("technique", localBook.techniques, serverBook.techniques, t => t.name || "Unnamed Technique");
  diffEntities("ingredient", localBook.ingredients, serverBook.ingredients, i => i.name || "Unnamed Ingredient");
  diffEntities("monster", localBook.monsters, serverBook.monsters, m => m.name || "Unnamed Monster");
  diffEntities("treasure", localBook.treasures, serverBook.treasures, t => t.name || "Unnamed Treasure");
  diffEntities("foreshadow", localBook.foreshadows, serverBook.foreshadows, f => f.description || "Foreshadow Entry");

  return list;
}

export function autoMergeOtherChapters(
  localBook: BookData,
  conflicts: ConflictItem[],
  activeChapterId: string | null
): BookData {
  const mergedBook: BookData = { ...localBook };

  const mergeArray = (type: string, arrayKey: keyof BookData, preserveKeys: string[] = []) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sourceArr = (mergedBook[arrayKey] as any[]) || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mergedMap = new Map<string, any>(sourceArr.map(i => [i.id, i]));
    
    conflicts.filter(c => c.type === type).forEach(c => {
      const originalId = c.id.replace(`${type}_`, "");
      
      // Auto-resolve non-active chapter conflicts to server
      if (type === "chapter" && activeChapterId && originalId !== activeChapterId) {
        if (c.serverValue === null) {
          mergedMap.delete(originalId);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const serverVal: any = { ...(c.serverValue as any) };
          if (preserveKeys.length > 0) {
            const localVal = mergedMap.get(originalId);
            if (localVal) {
              preserveKeys.forEach(k => {
                if (localVal[k] !== undefined) serverVal[k] = localVal[k];
              });
            }
          }
          mergedMap.set(originalId, serverVal);
        }
      }
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mergedBook[arrayKey] as any) = Array.from(mergedMap.values());
  };

  mergeArray("chapter", "chapters", ["body", "drafts", "activeDraftId"]);
  return mergedBook;
}
