import { useState, useMemo } from "react";
import { Modal } from "./ui/Modal";
import type { BookData } from "../store/appStore";

interface ConflictItem {
  id: string;
  type: string;
  name: string;
  localValue: unknown;
  serverValue: unknown;
  resolution?: "local" | "server";
}

interface ConflictModalProps {
  localBook: BookData;
  serverBook: BookData;
  onResolve: (mergedBook: BookData) => void;
  onCancel: () => void;
}

export function ConflictModal({ localBook, serverBook, onResolve, onCancel }: ConflictModalProps) {
  const [resolutions, setResolutions] = useState<Record<string, "local" | "server">>({});

  const conflicts = useMemo(() => {
    const list: ConflictItem[] = [];

    const diffEntities = <T extends { id: string }>(type: string, localArr: T[] | undefined, serverArr: T[] | undefined, getName: (item: T) => string, excludeKeys: string[] = []) => {
      const serverMap = new Map((serverArr || []).map(i => [i.id, i]));
      (localArr || []).forEach(localItem => {
        const serverItem = serverMap.get(localItem.id);
        if (!serverItem) {
          list.push({ id: `${type}_${localItem.id}`, type, name: `${getName(localItem)} (Local Only)`, localValue: localItem, serverValue: null });
        } else {
          const l: Record<string, unknown> = { ...localItem } as unknown as Record<string, unknown>;
          const s: Record<string, unknown> = { ...serverItem } as unknown as Record<string, unknown>;
          excludeKeys.forEach(k => { delete l[k]; delete s[k]; });
          if (JSON.stringify(l) !== JSON.stringify(s)) {
            list.push({ id: `${type}_${localItem.id}`, type, name: getName(localItem), localValue: localItem, serverValue: serverItem });
          }
          serverMap.delete(localItem.id);
        }
      });
      serverMap.forEach(serverItem => {
        list.push({ id: `${type}_${serverItem.id}`, type, name: `${getName(serverItem)} (Cloud Only)`, localValue: null, serverValue: serverItem });
      });
    };

    // Diff Book Metadata
    const localMeta = { title: localBook.title, synopsis: localBook.synopsis, setting: localBook.setting, themes: localBook.themes, rules: localBook.rules };
    const serverMeta = { title: serverBook.title, synopsis: serverBook.synopsis, setting: serverBook.setting, themes: serverBook.themes, rules: serverBook.rules };
    if (JSON.stringify(localMeta) !== JSON.stringify(serverMeta)) {
      list.push({ id: "meta_book", type: "metadata", name: "Book Metadata & World Rules", localValue: localMeta, serverValue: serverMeta });
    }

    diffEntities("character", localBook.characters, serverBook.characters, (c) => c.name || "Unnamed Character");
    diffEntities("event", localBook.events, serverBook.events, (e) => e.title || "Unnamed Event");
    diffEntities("chapter", localBook.chapters, serverBook.chapters, (c) => `Chapter ${c.number}: ${c.title || ""}`, ["body", "drafts"]); // Server has no body/drafts
    diffEntities("nation", localBook.nations, serverBook.nations, (n) => n.name || "Unnamed Nation");
    diffEntities("technique", localBook.techniques, serverBook.techniques, (t) => t.name || "Unnamed Technique");
    diffEntities("ingredient", localBook.ingredients, serverBook.ingredients, (i) => i.name || "Unnamed Ingredient");
    diffEntities("monster", localBook.monsters, serverBook.monsters, (m) => m.name || "Unnamed Monster");
    diffEntities("treasure", localBook.treasures, serverBook.treasures, (t) => t.name || "Unnamed Treasure");
    diffEntities("foreshadow", localBook.foreshadows, serverBook.foreshadows, (f) => f.description || "Foreshadow Entry");

    return list;
  }, [localBook, serverBook]);

  const handleResolveAll = (strategy: "local" | "server") => {
    const newRes = { ...resolutions };
    conflicts.forEach(c => newRes[c.id] = strategy);
    setResolutions(newRes);
  };

  const handleConfirm = () => {
    // Ensure all resolved
    if (conflicts.some(c => !resolutions[c.id])) {
      alert("Please resolve all conflicts before continuing.");
      return;
    }

    // Build the merged book based on resolutions
    const mergedBook: BookData = { ...localBook };

    const mergeArray = (type: string, arrayKey: keyof BookData, preserveKeys: string[] = []) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sourceArr = (mergedBook[arrayKey] as any[]) || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mergedMap = new Map<string, any>(sourceArr.map(i => [i.id, i]));
      
      conflicts.filter(c => c.type === type).forEach(c => {
        const res = resolutions[c.id];
        const originalId = c.id.replace(`${type}_`, "");
        
        if (res === "server") {
          if (c.serverValue === null) {
            mergedMap.delete(originalId);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const serverVal: any = { ...(c.serverValue as any) };
            // Preserve keys from local (like chapter body)
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
        } else {
          // Keep local: do nothing if it exists locally, or add if it was local only
          if (c.localValue) {
            mergedMap.set(originalId, c.localValue);
          } else {
            mergedMap.delete(originalId); // It was cloud only, and user said "Keep Local" (which means ignore cloud)
          }
        }
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mergedBook[arrayKey] as any) = Array.from(mergedMap.values());
    };

    if (resolutions["meta_book"] === "server") {
      mergedBook.title = serverBook.title;
      mergedBook.synopsis = serverBook.synopsis;
      mergedBook.setting = serverBook.setting;
      mergedBook.themes = serverBook.themes;
      mergedBook.rules = serverBook.rules;
    }

    mergeArray("character", "characters");
    mergeArray("event", "events");
    mergeArray("chapter", "chapters", ["body", "drafts"]);
    mergeArray("nation", "nations");
    mergeArray("technique", "techniques");
    mergeArray("ingredient", "ingredients");
    mergeArray("monster", "monsters");
    mergeArray("treasure", "treasures");
    mergeArray("foreshadow", "foreshadows");

    onResolve(mergedBook);
  };

  if (conflicts.length === 0) {
    return (
      <Modal title="Sync Complete" onClose={onCancel}>
        <div style={{ padding: "32px 24px", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: 16 }}>Your local data safely matches the cloud. No conflicts found.</p>
          <button onClick={() => onResolve(localBook)} style={btnStyle}>Continue</button>
        </div>
      </Modal>
    );
  }

  const footer = (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, width: "100%" }}>
      <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
      <button 
        onClick={handleConfirm} 
        disabled={conflicts.some(c => !resolutions[c.id])} 
        style={conflicts.some(c => !resolutions[c.id]) ? disabledBtnStyle : btnStyle}
      >
        Confirm Merge
      </button>
    </div>
  );

  return (
    <Modal title="Sync Conflicts Detected" onClose={onCancel} footer={footer}>
      <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", maxHeight: "65vh" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
          The cloud has changes that conflict with your local data. Please select which version to keep for each item.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          <button onClick={() => handleResolveAll("local")} style={outlineBtnStyle}>Keep All Local</button>
          <button onClick={() => handleResolveAll("server")} style={outlineBtnStyle}>Keep All Cloud</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8, padding: 16, background: "var(--bg-app)" }}>
          {conflicts.map((c, index) => (
            <div key={c.id} style={{ 
              display: "flex", 
              flexWrap: "wrap", 
              gap: 12, 
              justifyContent: "space-between", 
              alignItems: "center", 
              padding: "16px 0", 
              borderBottom: index === conflicts.length - 1 ? "none" : "1px solid var(--border)" 
            }}>
              <div style={{ flex: "1 1 200px" }}>
                <div style={{ fontSize: 11, color: "var(--color-blue)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>{c.type}</div>
                <div style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{c.name}</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button 
                  onClick={() => setResolutions(prev => ({ ...prev, [c.id]: "local" }))}
                  style={resolutions[c.id] === "local" ? activeChoiceStyle : choiceStyle}
                >
                  Local
                </button>
                <button 
                  onClick={() => setResolutions(prev => ({ ...prev, [c.id]: "server" }))}
                  style={resolutions[c.id] === "server" ? activeChoiceStyle : choiceStyle}
                >
                  Cloud
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

const outlineBtnStyle = {
  background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", padding: "6px 12px", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 500
};
const choiceStyle = {
  background: "var(--bg-app)", border: "1px solid var(--border)", color: "var(--text-secondary)", padding: "6px 16px", borderRadius: 4, cursor: "pointer", fontSize: 14, fontWeight: 500, flex: 1, textAlign: "center" as const
};
const activeChoiceStyle = {
  background: "var(--color-blue)", border: "1px solid var(--color-blue)", color: "#ffffff", padding: "6px 16px", borderRadius: 4, cursor: "pointer", fontSize: 14, fontWeight: 500, flex: 1, textAlign: "center" as const, boxShadow: "0 2px 8px rgba(0, 153, 255, 0.3)"
};
const btnStyle = {
  background: "var(--color-green)", border: "none", color: "var(--bg-app)", padding: "8px 24px", borderRadius: 6, cursor: "pointer", fontSize: 15, fontWeight: 600, boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
};
const disabledBtnStyle = {
  background: "var(--bg-card)", border: "1px dashed var(--border)", color: "var(--text-muted)", padding: "8px 24px", borderRadius: 6, cursor: "not-allowed", fontSize: 15, fontWeight: 600
};
const cancelBtnStyle = {
  background: "transparent", border: "none", color: "var(--text-secondary)", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 15, fontWeight: 500
};
