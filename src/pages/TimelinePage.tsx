import { useNavigate, useParams } from "react-router-dom";
import { appStore } from "../store/appStore";
import {
  useEvents,
  useCharacters,
  useActiveBookIdx,
} from "../hooks/useWorldStore";
import { S, mkEvent, getLatestEventDates, uid } from "../lib/utils";
import { TimelineIcon, AddIcon, SearchIcon, CloseIcon } from "../components/ui/icons";
import { useAnimateIn } from "../hooks/useAnimateIn";
import type { Event, EventType } from "../lib/types";
import { useCallback, useState } from "react";
import { EventCard } from "../components/event/EventCard";
import { showToast } from "../store/toastStore";
import { Modal } from "../components/ui/Modal";

export default function TimelinePage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const events = useEvents();
  const characters = useCharacters();
  const bookIdx = useActiveBookIdx();
  const ref = useAnimateIn();

  const add = useCallback(() => {
    if (bookIdx < 0) return;
    const maxT = events.reduce((m: number, e: Event) => Math.max(m, e.time), 0);
    const defaultDates = getLatestEventDates(events);
    const e = { ...mkEvent(), ...defaultDates, time: maxT + 1 };
    appStore.books[bookIdx].events.push(e);
    navigate(`/book/${bookId}/events/${e.id}`);
  }, [events, bookIdx, bookId, navigate]);

  const [showImport, setShowImport] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [conflictResolution, setConflictResolution] = useState<"overwrite" | "skip" | "clone">("overwrite");
  const [conflictsCount, setConflictsCount] = useState(0);

  const normalizeEvent = (e: unknown): Event => {
    const obj = (e && typeof e === "object" ? e : {}) as Record<string, unknown>;
    return {
      id: typeof obj.id === "string" && obj.id ? obj.id : uid(),
      time: typeof obj.time === "number" ? obj.time : 1,
      title: typeof obj.title === "string" ? obj.title : "Untitled event",
      type: (typeof obj.type === "string" ? obj.type : "Story") as EventType,
      chapters: Array.isArray(obj.chapters) ? obj.chapters.filter((x: unknown): x is string => typeof x === "string") : [],
      startDate: typeof obj.startDate === "string" ? obj.startDate : "",
      endDate: typeof obj.endDate === "string" ? obj.endDate : "",
      setting: typeof obj.setting === "string" ? obj.setting : "",
      description: typeof obj.description === "string" ? obj.description : "",
      consequence: typeof obj.consequence === "string" ? obj.consequence : "",
      characters: Array.isArray(obj.characters) ? obj.characters.filter((x: unknown): x is string => typeof x === "string") : [],
      subplot: typeof obj.subplot === "string" ? obj.subplot : "",
    };
  };

  const handleJsonChange = (val: string) => {
    setJsonText(val);
    setConflictsCount(0);
    if (!val.trim()) {
      setValidationError(null);
      return;
    }
    try {
      const parsed = JSON.parse(val);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      if (arr.length === 0) {
        setValidationError("JSON array is empty.");
        return;
      }
      setValidationError(null);

      // Scan for conflicts
      let matchCount = 0;
      arr.forEach((item: unknown) => {
        if (item && typeof item === "object") {
          const obj = item as Record<string, unknown>;
          if (typeof obj.id === "string") {
            const exists = events.some((x) => x.id === obj.id);
            if (exists) {
              matchCount++;
            }
          }
        }
      });
      setConflictsCount(matchCount);
    } catch (err) {
      setValidationError("Invalid JSON: " + (err as Error).message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (typeof text === "string") {
        handleJsonChange(text);
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(events, null, 2);
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const filename = `events-export-${bookId || "book"}.json`;
      
      const link = document.createElement("a");
      link.setAttribute("href", dataUri);
      link.setAttribute("download", filename);
      link.click();
      showToast("Events exported successfully!", "success");
    } catch (err) {
      showToast("Failed to export events: " + (err as Error).message, "error");
    }
  };

  const executeImport = () => {
    if (bookIdx < 0) return;
    try {
      const parsed = JSON.parse(jsonText);
      const rawArray = Array.isArray(parsed) ? parsed : [parsed];
      const importedEvents = rawArray.map(normalizeEvent);

      if (importMode === "replace") {
        appStore.books[bookIdx].events.set(importedEvents);
      } else {
        const currentEvents = [...events];
        importedEvents.forEach((imp) => {
          const matchIdx = currentEvents.findIndex((x) => x.id === imp.id);
          if (matchIdx >= 0) {
            if (conflictResolution === "overwrite") {
              currentEvents[matchIdx] = imp;
            } else if (conflictResolution === "clone") {
              currentEvents.push({ ...imp, id: uid() });
            }
            // If skip, we don't modify currentEvents[matchIdx] or push imp
          } else {
            currentEvents.push(imp);
          }
        });
        appStore.books[bookIdx].events.set(currentEvents);
      }

      showToast(`Successfully imported ${importedEvents.length} events! Remember to click Sync to save changes to GitHub.`, "success");
      handleCloseImport();
    } catch (err) {
      setValidationError("Import failed: " + (err as Error).message);
    }
  };

  const handleCloseImport = () => {
    setShowImport(false);
    setJsonText("");
    setValidationError(null);
    setConflictsCount(0);
    setConflictResolution("overwrite");
  };

  const [subplotFilter, setSubplotFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const sortedEvents = [...events].sort((a, b) => a.time - b.time);
  const filteredEvents = sortedEvents.filter((e) => {
    if (subplotFilter && e.subplot !== subplotFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = e.title.toLowerCase().includes(q);
      const descMatch = e.description.toLowerCase().includes(q);
      const settingMatch = e.setting.toLowerCase().includes(q);
      const consequenceMatch = e.consequence.toLowerCase().includes(q);
      const subplotMatch = e.subplot?.toLowerCase().includes(q) || false;
      const typeMatch = e.type.toLowerCase().includes(q);
      
      const charMatch = (e.characters || []).some((cid) => {
        const char = characters.find((c) => c.id === cid);
        return char?.name.toLowerCase().includes(q);
      });

      return (
        titleMatch ||
        descMatch ||
        settingMatch ||
        consequenceMatch ||
        subplotMatch ||
        typeMatch ||
        charMatch
      );
    }
    return true;
  });

  const uniqueSubplots = Array.from(
    new Set(events.map((e) => e.subplot).filter(Boolean)),
  ) as string[];

  return (
    <div ref={ref} className="seshat-page-container">
      {/* Header */}
      <div className="seshat-flex-between" style={styles.header}>
        <div style={styles.headerTitleRow}>
          <TimelineIcon sx={styles.headerIcon} />
          <span style={styles.headerText}>
            Timeline ({events.length})
          </span>
        </div>
        <div style={styles.headerActions}>
          <button
            onClick={() => setShowImport(true)}
            className="seshat-header-btn"
          >
            import
          </button>
          <button
            onClick={handleExport}
            className="seshat-header-btn"
          >
            export
          </button>
          <button onClick={add} style={styles.addBtn}>
            <AddIcon sx={{ fontSize: 14 }} />
            add event
          </button>
        </div>
      </div>

      {/* Search Row */}
      <div style={styles.searchRow}>
        <div
          style={{
            ...styles.searchContainer,
            borderColor: isSearchFocused ? "var(--border-field)" : "var(--border)",
            boxShadow: isSearchFocused ? "0 0 0 2px rgba(110, 115, 129, 0.15)" : "none",
          }}
        >
          <SearchIcon sx={styles.searchIcon} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Search events by title, description, characters, settings, subplot..."
            style={styles.searchInput}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={styles.clearBtn}
              title="Clear search"
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </button>
          )}
        </div>
      </div>

      {uniqueSubplots.length > 0 && (
        <div style={styles.subplotsRow}>
          <span style={styles.subplotsLabel}>Subplots:</span>
          <button
            onClick={() => setSubplotFilter(null)}
            style={{
              ...styles.filterBtn,
              background:
                subplotFilter === null ? "var(--bg-hover)" : "transparent",
              color:
                subplotFilter === null
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
            }}
          >
            All
          </button>
          {uniqueSubplots.map((sp) => (
            <button
              key={sp}
              onClick={() => setSubplotFilter(sp)}
              style={{
                ...styles.filterBtn,
                background:
                  subplotFilter === sp ? "var(--bg-hover)" : "transparent",
                color:
                  subplotFilter === sp
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
              }}
            >
              {sp}
            </button>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div style={styles.timelineWrapper}>
        {/* Vertical line */}
        {sortedEvents.length > 1 && (
          <div style={styles.verticalLine} />
        )}

        <div style={styles.eventsList}>
          {filteredEvents.map((e: Event) => (
            <EventCard
              key={e.id}
              event={e}
              characters={characters}
              onClick={() => navigate(`/book/${bookId}/events/${e.id}`)}
            />
          ))}
        </div>
      </div>

      {!events.length && (
        <div style={styles.emptyContainer}>
          No events yet. Add one to begin.
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <Modal
          title="Import Events"
          onClose={handleCloseImport}
          footer={
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleCloseImport}
                style={S.ghost}
              >
                Cancel
              </button>
              <button
                onClick={executeImport}
                disabled={!!validationError || !jsonText.trim()}
                style={{
                  ...styles.modalActionBtn,
                  opacity: (validationError || !jsonText.trim()) ? 0.5 : 1,
                  cursor: (validationError || !jsonText.trim()) ? "default" : "pointer",
                }}
              >
                Import
              </button>
            </div>
          }
        >
          <div style={styles.modalBody}>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
              Paste event JSON data below or upload a JSON file exported from Seshat.
            </p>
            
            <div style={{ marginBottom: 16 }}>
              <label className="seshat-date-shortcut-btn" style={{ display: "inline-block", padding: "6px 12px", fontSize: 12 }}>
                Choose JSON File
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </label>
            </div>

            <textarea
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              placeholder='[{"title": "My Event", "time": 1, ...}]'
              style={styles.modalTextarea}
            />

            {validationError && (
              <div style={{ color: "var(--color-red)", fontSize: 11, marginTop: 4 }}>
                {validationError}
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <span style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: 8 }}>
                Import Method:
              </span>
              <div style={{ display: "flex", gap: 16 }}>
                <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === "merge"}
                    onChange={() => setImportMode("merge")}
                  />
                  Merge (add or overwrite by ID)
                </label>
                <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === "replace"}
                    onChange={() => setImportMode("replace")}
                  />
                  Replace All (clears current events)
                </label>
              </div>
            </div>

            {conflictsCount > 0 && importMode === "merge" && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 4,
                  background: "rgba(224, 86, 36, 0.1)",
                  border: "1px solid rgba(224, 86, 36, 0.2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#e05624",
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  <span role="img" aria-label="warning">⚠️</span> Conflict Detected: {conflictsCount} event(s) in this file already exist in your timeline.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "var(--text-primary)" }}>
                    <input
                      type="radio"
                      name="conflictResolution"
                      checked={conflictResolution === "overwrite"}
                      onChange={() => setConflictResolution("overwrite")}
                    />
                    Overwrite existing events with imported versions
                  </label>
                  <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "var(--text-primary)" }}>
                    <input
                      type="radio"
                      name="conflictResolution"
                      checked={conflictResolution === "skip"}
                      onChange={() => setConflictResolution("skip")}
                    />
                    Skip imported duplicates (keep timeline versions)
                  </label>
                  <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "var(--text-primary)" }}>
                    <input
                      type="radio"
                      name="conflictResolution"
                      checked={conflictResolution === "clone"}
                      onChange={() => setConflictResolution("clone")}
                    />
                    Keep both (import duplicates as new copies)
                  </label>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

const styles = {
  header: {
    marginBottom: "var(--space-8)",
  },
  headerTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
  },
  headerIcon: {
    fontSize: 14,
    color: "var(--text-muted)",
  },
  headerText: {
    fontSize: "var(--text-xs)",
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "var(--text-secondary)",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
  },
  addBtn: {
    ...S.ghost,
    display: "flex",
    alignItems: "center",
    gap: "var(--space-1)",
    fontSize: "var(--text-xs)",
    color: "var(--text-secondary)",
  },
  subplotsRow: {
    display: "flex",
    gap: "var(--space-2)",
    marginBottom: "var(--space-5)",
    flexWrap: "wrap",
    alignItems: "center",
  },
  subplotsLabel: {
    fontSize: "var(--text-xs)",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  filterBtn: {
    ...S.ghost,
    fontSize: 12,
    padding: "2px 8px",
  },
  timelineWrapper: {
    position: "relative",
    marginLeft: 8,
  },
  verticalLine: {
    position: "absolute",
    left: 18,
    top: 36,
    bottom: 36,
    width: 2,
    background:
      "linear-gradient(to bottom, var(--border), var(--border-field), var(--border))",
    transform: "translateX(-50%)",
    zIndex: 0,
  },
  eventsList: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-4)",
  },
  emptyContainer: {
    paddingTop: 60,
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: 13,
    fontStyle: "italic",
  },
  modalBody: {
    padding: "16px 0",
    display: "flex",
    flexDirection: "column",
  },
  modalTextarea: {
    ...S.textarea,
    height: 160,
    fontFamily: "monospace",
    fontSize: 12,
    background: "var(--bg-active)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    color: "var(--text-primary)",
    padding: 8,
    resize: "vertical",
  },
  modalActionBtn: {
    background: "var(--color-green)",
    color: "var(--bg-app)",
    border: "none",
    borderRadius: 4,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 600,
  },
  searchRow: {
    marginBottom: "var(--space-4)",
  },
  searchContainer: {
    display: "flex",
    alignItems: "center",
    background: "var(--bg-active)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "6px 12px",
    gap: 8,
    transition: "all var(--duration-fast) var(--ease-smooth)",
  },
  searchIcon: {
    color: "var(--text-muted)",
    fontSize: 16,
  },
  searchInput: {
    background: "transparent",
    border: "none",
    outline: "none",
    color: "var(--text-primary)",
    fontSize: 13,
    width: "100%",
    padding: 0,
  },
  clearBtn: {
    ...S.ghost,
    padding: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-muted)",
    cursor: "pointer",
  },
} satisfies Record<string, React.CSSProperties>;
