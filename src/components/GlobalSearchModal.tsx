import { useState, useMemo } from "react";
import { Modal } from "./ui/Modal";
import { S } from "../lib/utils";
import {
  useCharacters,
  useEvents,
  useChapters,
  useActiveBookIdx,
} from "../hooks/useWorldStore";
import { appStore } from "../store/appStore";
import type { BookData, Character, Event, Chapter } from "../store/appStore";
import { showToast } from "../store/toastStore";

interface Props {
  open: boolean;
  onClose: () => void;
  bookId: string;
}

const EMPTY_ARR: unknown[] = [];

export function GlobalSearchModal({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [replaceStr, setReplaceStr] = useState("");
  const [isReplacing, setIsReplacing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const rawCharacters = useCharacters();
  const rawEvents = useEvents();
  const rawChapters = useChapters();
  
  const characters = rawCharacters || (EMPTY_ARR as Character[]);
  const events = rawEvents || (EMPTY_ARR as Event[]);
  const chapters = rawChapters || (EMPTY_ARR as Chapter[]);
  const bookIdx = useActiveBookIdx();
  
  // Find how many chapters are unloaded
  const unloadedCount = chapters.filter((c) => c.body === undefined).length;

  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    
    const term = query.toLowerCase();
    const hits: { type: string; name: string; snippet: string }[] = [];

    const nations = bookIdx >= 0 ? appStore.books[bookIdx].nations.get() || [] : [];
    const techniques = bookIdx >= 0 ? appStore.books[bookIdx].techniques.get() || [] : [];
    const ingredients = bookIdx >= 0 ? appStore.books[bookIdx].ingredients.get() || [] : [];
    const monsters = bookIdx >= 0 ? appStore.books[bookIdx].monsters.get() || [] : [];
    const treasures = bookIdx >= 0 ? appStore.books[bookIdx].treasures.get() || [] : [];

    // Search Characters
    characters.forEach(c => {
      if (c.name.toLowerCase().includes(term)) hits.push({ type: "Character", name: c.name, snippet: c.name });
      if (c.role?.toLowerCase().includes(term)) hits.push({ type: "Character", name: c.name, snippet: c.role });
      if (c.coreWound?.toLowerCase().includes(term)) hits.push({ type: "Character", name: c.name, snippet: c.coreWound });
      c.traumas?.forEach(t => {
        if (t.description?.toLowerCase().includes(term)) hits.push({ type: "Character Trauma", name: c.name, snippet: t.description });
      });
      const dump = JSON.stringify(c).toLowerCase();
      if (dump.includes(term) && !hits.find(h => h.name === c.name)) {
        hits.push({ type: "Character", name: c.name, snippet: "(Matched in notes/lore)" });
      }
    });

    // Search Events
    events.forEach(e => {
      const dump = JSON.stringify(e).toLowerCase();
      if (dump.includes(term)) {
        hits.push({ type: "Event", name: e.title, snippet: e.description || "(Matched in notes)" });
      }
    });

    // Search Chapters
    chapters.forEach(ch => {
      const dump = JSON.stringify(ch).toLowerCase();
      if (dump.includes(term)) {
        hits.push({ type: "Chapter", name: ch.title || "Untitled", snippet: ch.synopsis || "(Matched in text)" });
      }
    });

    // Search Glossary (World)
    nations.forEach(n => {
      if (JSON.stringify(n).toLowerCase().includes(term)) hits.push({ type: "Nation", name: n.name, snippet: n.culture || n.geography || "(Matched in lore)" });
    });
    techniques.forEach(t => {
      if (JSON.stringify(t).toLowerCase().includes(term)) hits.push({ type: "Technique", name: t.name, snippet: t.effect || t.description || "(Matched in lore)" });
    });
    ingredients.forEach(i => {
      if (JSON.stringify(i).toLowerCase().includes(term)) hits.push({ type: "Ingredient", name: i.name, snippet: i.properties || i.uses || "(Matched in lore)" });
    });
    monsters.forEach(m => {
      if (JSON.stringify(m).toLowerCase().includes(term)) hits.push({ type: "Monster", name: m.name, snippet: m.abilities || m.behavior || "(Matched in lore)" });
    });
    treasures.forEach(tr => {
      if (JSON.stringify(tr).toLowerCase().includes(term)) hits.push({ type: "Treasure", name: tr.name, snippet: tr.description || tr.stats || "(Matched in lore)" });
    });

    return hits;
  }, [query, characters, events, chapters, bookIdx]);

  const handleReplaceClick = () => {
    if (!query || !replaceStr) return;
    setShowConfirm(true);
  };

  const executeReplaceAll = () => {
    setShowConfirm(false);
    setIsReplacing(true);
    try {
      const bookData = appStore.books[bookIdx].get();
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedQuery, "gi");

      const deepReplace = (obj: unknown): unknown => {
        if (typeof obj === 'string') {
          return obj.replace(regex, replaceStr);
        } else if (Array.isArray(obj)) {
          return obj.map(item => deepReplace(item));
        } else if (obj !== null && typeof obj === 'object') {
          const newObj: Record<string, unknown> = {};
          const objRecord = obj as Record<string, unknown>;
          for (const key in objRecord) {
            if (key === 'id' || key.endsWith('Id') || key === 'time' || key.includes('Date') || key === 'body') {
              newObj[key] = objRecord[key];
            } else {
              newObj[key] = deepReplace(objRecord[key]);
            }
          }
          return newObj;
        }
        return obj;
      };

      const newBookData = deepReplace(bookData) as BookData;
      appStore.books[bookIdx].set(newBookData);
      
      const token = localStorage.getItem("seshat-auth-token") || sessionStorage.getItem("seshat-auth-token");
      if (token) {
        import("../lib/githubSync").then(({ syncToGitHub }) => {
          syncToGitHub(token).then(() => {
            showToast("Replaced and synced to cloud successfully!", "success");
          }).catch((err) => {
            console.error(err);
            showToast("Replaced locally, but failed to sync to cloud.", "error");
          });
        });
      } else {
        showToast("Replaced all occurrences in loaded data! (Not synced to cloud)", "success");
      }
      onClose();
    } catch {
      showToast("Error replacing text. See console.", "error");
    } finally {
      setIsReplacing(false);
    }
  };

  if (!open) return null;

  return (
    <Modal title="Global Search & Replace" onClose={onClose}>
      <div className="seshat-flex-col" style={styles.content}>
        <p style={styles.helpText}>
          Search across all loaded characters, events, items, world glossary, and chapters. 
          {unloadedCount > 0 && (
            <span style={styles.warningText}>
              ⚠️ {unloadedCount} chapters are unloaded to save memory. Their body text will not be searched or replaced until they are visited.
            </span>
          )}
        </p>

        <div style={styles.inputsRow}>
          <input
            style={styles.input}
            placeholder="Search for..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <input
            style={styles.input}
            placeholder="Replace with..."
            value={replaceStr}
            onChange={(e) => setReplaceStr(e.target.value)}
          />
        </div>

        <div className="seshat-flex-end" style={styles.actionsRow}>
          <button style={S.ghost} onClick={onClose}>Cancel</button>
          {!showConfirm ? (
            <button 
              style={styles.replaceBtn} 
              onClick={handleReplaceClick}
              disabled={!query || !replaceStr || isReplacing}
            >
              {isReplacing ? "Replacing..." : "Replace All"}
            </button>
          ) : (
            <div className="seshat-flex-align" style={styles.confirmBox}>
              <span style={styles.confirmWarningText}>Are you sure?</span>
              <button style={styles.confirmNoBtn} onClick={() => setShowConfirm(false)}>No</button>
              <button style={styles.replaceBtn} onClick={executeReplaceAll}>Yes, replace all</button>
            </div>
          )}
        </div>

        <div style={styles.resultsContainer}>
          {results.length > 0 ? (
            <div className="seshat-flex-col" style={styles.resultsList}>
              <span style={styles.resultsHeader}>Found {results.length} matches:</span>
              {results.slice(0, 50).map((r, i) => (
                <div key={i} style={styles.resultCard}>
                  <div style={styles.resultType}>{r.type}</div>
                  <div style={styles.resultName}>{r.name}</div>
                  <div style={styles.resultSnippet}>
                    "...{r.snippet.length > 60 ? r.snippet.substring(0, 60) + "..." : r.snippet}..."
                  </div>
                </div>
              ))}
              {results.length > 50 && <div style={styles.moreResults}>+ {results.length - 50} more</div>}
            </div>
          ) : query.length >= 2 ? (
            <div style={styles.noResults}>No matches found.</div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

const styles = {
  content: {
    padding: "0 var(--space-5) var(--space-5)",
    gap: "var(--space-4)",
  },
  helpText: {
    ...S.dim,
    margin: 0,
    fontSize: 13,
  },
  warningText: {
    color: "var(--color-orange)",
    display: "block",
    marginTop: 8,
  },
  inputsRow: {
    display: "flex",
    gap: "var(--space-2)",
  },
  input: {
    ...S.input,
    flex: 1,
  },
  actionsRow: {
    gap: "var(--space-2)",
  },
  replaceBtn: {
    ...S.pill,
    background: "var(--color-red)",
    color: "white",
    border: "none",
  },
  confirmBox: {
    gap: "var(--space-2)",
    background: "var(--bg-panel)",
    padding: "var(--space-1) var(--space-2)",
    borderRadius: 4,
    border: "1px solid var(--color-red)",
  },
  confirmWarningText: {
    fontSize: 12,
    color: "var(--color-red)",
  },
  confirmNoBtn: {
    ...S.ghost,
    color: "var(--text-muted)",
  },
  resultsContainer: {
    maxHeight: 300,
    overflowY: "auto",
    borderTop: "1px solid var(--border)",
    paddingTop: 10,
  },
  resultsList: {
    gap: "var(--space-2)",
  },
  resultsHeader: {
    ...S.dim,
    fontSize: 12,
  },
  resultCard: {
    padding: 8,
    background: "var(--bg-panel)",
    borderRadius: 4,
  },
  resultType: {
    fontSize: 11,
    color: "var(--color-primary)",
    fontWeight: "bold",
  },
  resultName: {
    fontWeight: "bold",
    fontSize: 14,
  },
  resultSnippet: {
    fontSize: 12,
    color: "var(--text-secondary)",
    marginTop: 4,
  },
  moreResults: {
    textAlign: "center",
    ...S.dim,
  },
  noResults: {
    textAlign: "center",
    ...S.dim,
    padding: 20,
  },
} satisfies Record<string, React.CSSProperties>;
