import { useState, useMemo } from "react";
import { Modal } from "./ui/Modal";
import type { BookData } from "../store/appStore";
import { appStore } from "../store/appStore";
import { getConflicts } from "../lib/conflictUtils";

interface ConflictModalProps {
  localBook: BookData;
  serverBook: BookData;
  activeChapterId?: string | null;
  onResolve: (mergedBook: BookData) => void;
  onCancel: () => void;
}

export function ConflictModal({ localBook, serverBook, activeChapterId, onResolve, onCancel }: ConflictModalProps) {
  const [resolutions, setResolutions] = useState<Record<string, "local" | "server">>({});

  const conflicts = useMemo(() => getConflicts(localBook, serverBook), [localBook, serverBook]);

  const { visibleConflicts, autoResolutions } = useMemo(() => {
    const visible: typeof conflicts = [];
    const auto: Record<string, "local" | "server"> = {};

    conflicts.forEach(c => {
      if (c.type === "chapter") {
        const originalId = c.id.replace("chapter_", "");
        if (activeChapterId && originalId !== activeChapterId) {
          auto[c.id] = "server";
          return;
        }
      }
      visible.push(c);
    });

    return { visibleConflicts: visible, autoResolutions: auto };
  }, [conflicts, activeChapterId]);

  const handleResolveAll = (strategy: "local" | "server") => {
    const newRes = { ...resolutions };
    visibleConflicts.forEach(c => newRes[c.id] = strategy);
    setResolutions(newRes);
  };

  const buildMergedBook = (resolutionsMap: Record<string, "local" | "server">): BookData => {
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
        const res = resolutionsMap[c.id];
        const originalId = c.id.replace(`${type}_`, "");
        
        if (res === "server") {
          if (c.serverValue === null) {
            mergedMap.delete(originalId);
          } else {
            const serverVal = { ...(c.serverValue as Entity) };
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
        } else if (res === "local") {
          // Keep local: do nothing if it exists locally, or add if it was local only
          if (c.localValue) {
            mergedMap.set(originalId, c.localValue as Entity);
          } else {
            mergedMap.delete(originalId); // It was cloud only, and user said "Keep Local" (which means ignore cloud)
          }
        }
      });
      (mergedBook[arrayKey] as unknown) = Array.from(mergedMap.values());
    };

    if (resolutionsMap["meta_book"] === "server") {
      mergedBook.title = serverBook.title;
      mergedBook.synopsis = serverBook.synopsis;
      mergedBook.setting = serverBook.setting;
      mergedBook.themes = serverBook.themes;
      mergedBook.rules = serverBook.rules;
    }

    mergeArray("character", "characters");
    mergeArray("event", "events");
    mergeArray("chapter", "chapters", ["body", "drafts", "activeDraftId"]);
    mergeArray("nation", "nations");
    mergeArray("technique", "techniques");
    mergeArray("ingredient", "ingredients");
    mergeArray("monster", "monsters");
    mergeArray("treasure", "treasures");
    mergeArray("foreshadow", "foreshadows");

    return mergedBook;
  };

  const handleConfirm = () => {
    // Ensure all resolved
    if (visibleConflicts.some(c => !resolutions[c.id])) {
      alert("Please resolve all conflicts before continuing.");
      return;
    }

    // Build the merged book based on resolutions
    const finalResolutions = { ...autoResolutions, ...resolutions };
    onResolve(buildMergedBook(finalResolutions));
  };

  if (visibleConflicts.length === 0) {
    return (
      <Modal title="Sync Complete" onClose={onCancel}>
        <div style={{ padding: "32px 24px", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: 16 }}>Your local data safely matches the cloud. No conflicts found.</p>
          <button onClick={() => {
            // Build the fully merged book using autoResolutions since no visible conflicts exist
            onResolve(buildMergedBook(autoResolutions));
          }} style={btnStyle}>Continue</button>
        </div>
      </Modal>
    );
  }

  const footer = (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, width: "100%" }}>
      <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
      <button 
        onClick={handleConfirm} 
        disabled={visibleConflicts.some(c => !resolutions[c.id])} 
        style={visibleConflicts.some(c => !resolutions[c.id]) ? disabledBtnStyle : btnStyle}
      >
        Confirm Merge
      </button>
    </div>
  );

  return (
    <Modal title="Sync Conflicts Detected" onClose={onCancel} footer={footer}>
      <div style={{ padding: "0 24px 24px" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 12, lineHeight: 1.5 }}>
          The cloud has changes that conflict with your local data. Please select which version to keep for each item.
        </p>
        <div style={{ display: "flex", gap: 16, marginBottom: 20, fontSize: 13, background: "var(--bg-panel)", padding: "10px 14px", borderRadius: 6, border: "1px solid var(--border)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", fontWeight: "bold" }}>Your Local Edits</div>
            <div style={{ color: "var(--text-primary)", fontWeight: 500, marginTop: 4 }}>
              Last updated: {appStore.lastModifiedLocal.get() ? new Date(appStore.lastModifiedLocal.get()!).toLocaleString() : "Unknown"}
            </div>
          </div>
          <div style={{ width: 1, background: "var(--border)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", fontWeight: "bold" }}>Cloud Snapshot</div>
            <div style={{ color: "var(--text-primary)", fontWeight: 500, marginTop: 4 }}>
              Last synced: {appStore.lastSyncedCloud.get() ? new Date(appStore.lastSyncedCloud.get()!).toLocaleString() : "Unknown"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          <button onClick={() => handleResolveAll("local")} style={outlineBtnStyle}>Keep All Local</button>
          <button onClick={() => handleResolveAll("server")} style={outlineBtnStyle}>Keep All Cloud</button>
        </div>

        <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16, background: "var(--bg-app)" }}>
          {visibleConflicts.map((c, index) => (
            <div key={c.id} style={{ 
              display: "flex", 
              flexWrap: "wrap", 
              gap: 16, 
              justifyContent: "space-between", 
              alignItems: "flex-start", 
              padding: "16px 0", 
              borderBottom: index === visibleConflicts.length - 1 ? "none" : "1px solid var(--border)" 
            }}>
              <div style={{ flex: "1 1 250px", minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "var(--color-blue)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>{c.type}</div>
                <div style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 600, lineHeight: 1.3, marginBottom: 8, wordBreak: "break-word" }}>{c.name}</div>
                {c.diffs && c.diffs.length > 0 && (
                  <div style={{ background: "var(--bg-panel)", padding: "10px 12px", borderRadius: 6, fontSize: 12, fontFamily: "monospace", color: "var(--text-secondary)", maxHeight: 180, overflowY: "auto", overflowX: "hidden" }}>
                    {c.diffs.slice(0, 10).map((diff, i) => (
                      <div key={i} style={{ marginBottom: 6, overflowWrap: "anywhere", lineHeight: 1.4, paddingLeft: 12, textIndent: -12 }}>
                        <span style={{ color: "var(--text-muted)", marginRight: 4 }}>•</span>{diff}
                      </div>
                    ))}
                    {c.diffs.length > 10 && <div style={{ fontStyle: "italic", marginTop: 6, color: "var(--text-muted)" }}>...and {c.diffs.length - 10} more changes</div>}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flex: "1 1 180px", minWidth: "180px" }}>
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
  background: "var(--color-blue)", border: "1px solid var(--color-blue)", color: "var(--bg-app)", padding: "6px 16px", borderRadius: 4, cursor: "pointer", fontSize: 14, fontWeight: 500, flex: 1, textAlign: "center" as const, boxShadow: "0 2px 8px rgba(0, 153, 255, 0.3)"
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
