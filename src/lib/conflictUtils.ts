import type { BookData } from "../store/appStore";

export interface ConflictItem {
  id: string;
  type: string;
  name: string;
  localValue: unknown;
  serverValue: unknown;
  resolution?: "local" | "server";
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
        if (JSON.stringify(l) !== JSON.stringify(s)) {
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
  if (JSON.stringify(localMeta) !== JSON.stringify(serverMeta)) {
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
  ]);
  diffEntities("nation", localBook.nations, serverBook.nations, n => n.name || "Unnamed Nation");
  diffEntities("technique", localBook.techniques, serverBook.techniques, t => t.name || "Unnamed Technique");
  diffEntities("ingredient", localBook.ingredients, serverBook.ingredients, i => i.name || "Unnamed Ingredient");
  diffEntities("monster", localBook.monsters, serverBook.monsters, m => m.name || "Unnamed Monster");
  diffEntities("treasure", localBook.treasures, serverBook.treasures, t => t.name || "Unnamed Treasure");
  diffEntities("foreshadow", localBook.foreshadows, serverBook.foreshadows, f => f.description || "Foreshadow Entry");

  return list;
}
