import type { BookData } from "../store/appStore";

export interface ConflictItem {
  id: string;
  type: string;
  name: string;
  localValue: unknown;
  serverValue: unknown;
  diffs: string[];
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

export function getDeepDiff(local: unknown, server: unknown, path: string = ""): string[] {
  const diffs: string[] = [];
  if (local === server) return diffs;

  const lStr = canonicalStringify(local);
  const sStr = canonicalStringify(server);
  if (lStr === sStr) return diffs;

  if (local === undefined && server !== undefined) return [`${path}: Added from cloud`];
  if (local !== undefined && server === undefined) return [`${path}: Deleted in cloud`];

  if (Array.isArray(local) && Array.isArray(server)) {
    if (local.length !== server.length) {
      diffs.push(`${path}: Array length changed (${local.length} -> ${server.length})`);
    } else {
      diffs.push(`${path}: Array contents modified`);
    }
    return diffs;
  }

  if (local !== null && server !== null && typeof local === "object" && typeof server === "object") {
    const lObj = local as Record<string, unknown>;
    const sObj = server as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(lObj), ...Object.keys(sObj)]);
    
    for (const key of allKeys) {
      const lVal = lObj[key];
      const sVal = sObj[key];
      const currentPath = path ? `${path}.${key}` : key;
      
      const subDiffs = getDeepDiff(lVal, sVal, currentPath);
      if (subDiffs.length > 0) {
        if (typeof lVal !== "object" && typeof sVal !== "object" && !Array.isArray(lVal) && !Array.isArray(sVal)) {
          let lShort = String(lVal);
          let sShort = String(sVal);
          if (lShort.length > 30) lShort = lShort.substring(0, 30) + "...";
          if (sShort.length > 30) sShort = sShort.substring(0, 30) + "...";
          diffs.push(`${currentPath}: "${lShort}" -> "${sShort}"`);
        } else if (Array.isArray(lVal) || Array.isArray(sVal)) {
           diffs.push(`${currentPath}: Array contents modified`);
        } else {
           diffs.push(...subDiffs);
        }
      }
    }
    return diffs;
  }

  let lShort = String(local);
  let sShort = String(server);
  if (lShort.length > 30) lShort = lShort.substring(0, 30) + "...";
  if (sShort.length > 30) sShort = sShort.substring(0, 30) + "...";
  diffs.push(`${path}: "${lShort}" -> "${sShort}"`);
  return diffs;
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
    // De-duplicate arrays by ID keeping the first occurrence to prevent duplicate false conflicts
    const uniqueLocal: T[] = [];
    const localSeen = new Set<string>();
    (localArr || []).forEach(item => {
      if (item && !localSeen.has(item.id)) {
        localSeen.add(item.id);
        uniqueLocal.push(item);
      }
    });

    const uniqueServer: T[] = [];
    const serverSeen = new Set<string>();
    (serverArr || []).forEach(item => {
      if (item && !serverSeen.has(item.id)) {
        serverSeen.add(item.id);
        uniqueServer.push(item);
      }
    });

    const serverMap = new Map(uniqueServer.map(i => [i.id, i]));
    uniqueLocal.forEach(localItem => {
      const serverItem = serverMap.get(localItem.id);
      if (!serverItem) {
        list.push({
          id: `${type}_${localItem.id}`,
          type,
          name: `${getName(localItem)} (Local Only)`,
          localValue: localItem,
          serverValue: null,
          diffs: ["Added locally (Not in cloud)"]
        });
      } else {
        const l: Record<string, unknown> = { ...localItem } as unknown as Record<string, unknown>;
        const s: Record<string, unknown> = { ...serverItem } as unknown as Record<string, unknown>;
        excludeKeys.forEach(k => {
          delete l[k];
          delete s[k];
        });
        
        const diffs = getDeepDiff(l, s);
        if (diffs.length > 0) {
          list.push({
            id: `${type}_${localItem.id}`,
            type,
            name: getName(localItem),
            localValue: localItem,
            serverValue: serverItem,
            diffs: Array.from(new Set(diffs)), // deduplicate
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
        diffs: ["Added in cloud (Not local)"]
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
  
  const metaDiffs = getDeepDiff(localMeta, serverMeta);
  if (metaDiffs.length > 0) {
    list.push({
      id: "meta_book",
      type: "metadata",
      name: "Book Metadata & World Rules",
      localValue: localMeta,
      serverValue: serverMeta,
      diffs: Array.from(new Set(metaDiffs)),
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
    type Entity = Record<string, unknown> & { id: string };
    const sourceArr = (mergedBook[arrayKey] as unknown as Entity[]) || [];
    // De-duplicate sourceArr keeping the first occurrence to preserve valid local edits
    const uniqueSource: Entity[] = [];
    const seen = new Set<string>();
    sourceArr.forEach(item => {
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        uniqueSource.push(item);
      }
    });
    const mergedMap = new Map<string, Entity>(uniqueSource.map(i => [i.id, i]));
    
    conflicts.filter(c => c.type === type).forEach(c => {
      const originalId = c.id.replace(`${type}_`, "");
      
      // Auto-resolve non-active chapter conflicts to server
      if (type === "chapter" && activeChapterId && originalId !== activeChapterId) {
        if (c.serverValue === null) {
          mergedMap.delete(originalId);
        } else {
          const serverVal = { ...(c.serverValue as Entity) };
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
    (mergedBook[arrayKey] as unknown) = Array.from(mergedMap.values());
  };

  mergeArray("chapter", "chapters", ["body", "drafts", "activeDraftId"]);
  return mergedBook;
}
