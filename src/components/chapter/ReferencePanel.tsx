import { useState } from "react";
import { S } from "../../lib/utils";
import { ContextTag } from "./ContextTag";
import { CharCard } from "./CharCard";
import { EventRef } from "./EventRef";
import { WorldTabContent } from "./WorldTabContent";
import { Modal } from "../ui/Modal";
import {
  PeopleIcon,
  EventNoteIcon,
  PublicIcon,
  NotesIcon,
  HistoryIcon,
  AutoFixHighIcon,
  ShieldIcon,
  AddIcon,
} from "../ui/icons";
import type { Character, Event } from "../../lib/types";

interface ReferencePanelProps {
  isOpen: boolean;
  panelTab:
    | "chars"
    | "events"
    | "world"
    | "notes"
    | "drafts"
    | "foreshadows"
    | "continuity";
  onTabChange: (
    tab:
      | "chars"
      | "events"
      | "world"
      | "notes"
      | "drafts"
      | "foreshadows"
      | "continuity",
  ) => void;
  characters: Character[];
  sortedEvents: Event[];
  pinnedCharIds: string[];
  pinnedEventIds: string[];
  onTogglePinChar: (id: string) => void;
  onTogglePinEvent: (id: string) => void;
  worldData: {
    synopsis: string;
    setting: string;
    themes: string;
    rules: string;
  };
  events: Event[];
  notesNode?: React.ReactNode;
  draftsNode?: React.ReactNode;
  foreshadowsNode?: React.ReactNode;
  continuityNode?: React.ReactNode;
}

export function ReferencePanel({
  isOpen,
  panelTab,
  onTabChange,
  characters,
  sortedEvents,
  pinnedCharIds,
  pinnedEventIds,
  onTogglePinChar,
  onTogglePinEvent,
  worldData,
  events,
  notesNode,
  draftsNode,
  foreshadowsNode,
  continuityNode,
}: ReferencePanelProps) {
  const [showCharModal, setShowCharModal] = useState(false);
  const [charInput, setCharInput] = useState("");
  const [modalSearch, setModalSearch] = useState("");

  const pinnedCharObjs = characters.filter((c: Character) =>
    pinnedCharIds.includes(c.id),
  );
  
  const unpinnedChars = characters.filter((c: Character) => 
    !pinnedCharIds.includes(c.id)
  );

  const handleCharInput = (val: string) => {
    setCharInput(val);
    const match = unpinnedChars.find(c => c.name.toLowerCase() === val.toLowerCase());
    if (match) {
      onTogglePinChar(match.id);
      setCharInput("");
    }
  };

  const handleQuickAddChar = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && charInput.trim() !== "") {
      const partial = unpinnedChars.find(c => c.name.toLowerCase().includes(charInput.toLowerCase()));
      if (partial) {
        onTogglePinChar(partial.id);
        setCharInput("");
      }
    }
  };
  const pinnedEventObjs = events
    .filter((e: Event) => pinnedEventIds.includes(e.id))
    .sort((a: Event, b: Event) => a.time - b.time);

  return (
    <div className={`seshat-chapter-panel seshat-flex-col ${isOpen ? "open" : ""}`}>
      <div
        style={styles.tabContainer}
        className="no-scrollbar"
      >
        <style>
          {`
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>
        {(
          [
            "chars",
            "events",
            "world",
            "notes",
            "drafts",
            "foreshadows",
            "continuity",
          ] as const
        ).map((tab, index, arr) => {
          const icon =
            tab === "chars" ? (
              <PeopleIcon sx={{ fontSize: 12 }} />
            ) : tab === "events" ? (
              <EventNoteIcon sx={{ fontSize: 12 }} />
            ) : tab === "world" ? (
              <PublicIcon sx={{ fontSize: 12 }} />
            ) : tab === "drafts" ? (
              <HistoryIcon sx={{ fontSize: 12 }} />
            ) : tab === "foreshadows" ? (
              <AutoFixHighIcon sx={{ fontSize: 12 }} />
            ) : tab === "continuity" ? (
              <ShieldIcon sx={{ fontSize: 12 }} />
            ) : (
              <NotesIcon sx={{ fontSize: 12 }} />
            );
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              style={{
                ...styles.tabButton,
                color:
                  panelTab === tab
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                borderBottom:
                  panelTab === tab ? "1px solid var(--text-primary)" : "none",
                paddingBottom: 2,
                marginLeft: index === 0 ? "8px" : "0",
                marginRight: index === arr.length - 1 ? "16px" : "0",
                marginTop: 12,
              }}
            >
              {icon}
              {tab}
            </button>
          );
        })}
      </div>

      <div style={styles.contentContainer}>
        {panelTab === "chars" && (
          <div>
            <div className="seshat-flex-align" style={styles.quickPinRow}>
              <input
                list="unpinned-chars"
                value={charInput}
                onChange={(e) => handleCharInput(e.target.value)}
                onKeyDown={handleQuickAddChar}
                placeholder="Quick pin character..."
                style={styles.quickPinInput}
              />
              <datalist id="unpinned-chars">
                {unpinnedChars.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
              <button 
                onClick={() => setShowCharModal(true)}
                style={styles.pinAddBtn}
                title="Pin multiple characters"
              >
                <AddIcon sx={{ fontSize: 16 }} />
              </button>
            </div>
            
            {pinnedCharObjs.length === 0 ? (
              <p style={styles.noCharsText}>No characters pinned yet.</p>
            ) : (
              pinnedCharObjs.map((c: Character) => (
                <CharCard key={c.id} char={c} events={events} />
              ))
            )}

            {showCharModal && (() => {
              const filtered = modalSearch
                ? characters.filter(c => c.name.toLowerCase().includes(modalSearch.toLowerCase()))
                : characters;
              return (
                <Modal title="Pin Characters" onClose={() => { setShowCharModal(false); setModalSearch(""); }}>
                  <div style={{ marginBottom: 16 }}>
                    <input
                      type="text"
                      placeholder="Search characters..."
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                      style={{ ...S.input, width: "100%", padding: "8px 12px", fontSize: 13 }}
                      autoFocus
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: "50vh", overflowY: "auto", paddingRight: 4 }}>
                    {filtered.map((c: Character) => {
                      const isPinned = pinnedCharIds.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => onTogglePinChar(c.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "8px 12px",
                            cursor: "pointer",
                            background: isPinned ? "var(--bg-active)" : "transparent",
                            border: "1px solid",
                            borderColor: isPinned ? c.color : "var(--border)",
                            borderRadius: 4,
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => { if (!isPinned) e.currentTarget.style.background = "var(--bg-hover)"; }}
                          onMouseLeave={(e) => { if (!isPinned) e.currentTarget.style.background = "transparent"; }}
                        >
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 14, color: isPinned ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: isPinned ? 500 : 400 }}>
                            {c.name}
                          </span>
                          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.role}</span>
                          <div style={{
                            width: 18, height: 18, borderRadius: 3,
                            border: `2px solid ${isPinned ? c.color : "var(--text-muted)"}`,
                            background: isPinned ? c.color : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center"
                          }}>
                            {isPinned && <span style={{ color: "#fff", fontSize: 14, lineHeight: 1 }}>✓</span>}
                          </div>
                        </div>
                      );
                    })}
                    {!filtered.length && <p style={{ ...S.dim, textAlign: "center", padding: "20px 0" }}>No characters found.</p>}
                  </div>
                  <div style={styles.modalFooter}>
                    <button style={styles.modalDoneBtn} onClick={() => { setShowCharModal(false); setModalSearch(""); }}>
                      Done
                    </button>
                  </div>
                </Modal>
              );
            })()}
          </div>
        )}

        {panelTab === "events" && (
          <div>
            <p style={styles.sectionDimText}>
              Pin timeline events this chapter covers.
            </p>
            <div style={styles.tagWrapGridMargin}>
              {sortedEvents.map((e: Event) => (
                <ContextTag
                  key={e.id}
                  label={`T${e.time} ${e.title}`}
                  active={pinnedEventIds.includes(e.id)}
                  onClick={() => onTogglePinEvent(e.id)}
                />
              ))}
              {!sortedEvents.length && <p style={S.dim}>No events yet.</p>}
            </div>
            {pinnedEventObjs.map((e: Event) => (
              <EventRef key={e.id} event={e} />
            ))}
          </div>
        )}

        {panelTab === "world" && (
          <WorldTabContent
            synopsis={worldData.synopsis}
            themes={worldData.themes}
            setting={worldData.setting}
            rules={worldData.rules}
          />
        )}

        {panelTab === "notes" && (
          <div className="seshat-flex-col" style={styles.fullHeightCol}>
            <p style={styles.sectionDimText}>
              Private notes, research, and threads to pull later...
            </p>
            {notesNode}
          </div>
        )}

        {panelTab === "drafts" && (
          <div style={styles.paddingTop12}>{draftsNode}</div>
        )}

        {panelTab === "foreshadows" && (
          <div style={styles.paddingTop12}>{foreshadowsNode}</div>
        )}

        {panelTab === "continuity" && (
          <div style={styles.paddingTop12FullHeight}>{continuityNode}</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  tabContainer: {
    display: "flex",
    gap: 12,
    borderBottom: "1px solid var(--border)",
    paddingBottom: 8,
    overflowX: "auto",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    flexShrink: 0,
  },
  tabButton: {
    ...S.ghost,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    display: "flex",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  contentContainer: {
    paddingLeft: 12,
    paddingBottom: 124,
    flex: 1,
    overflowY: "auto",
  },
  quickPinRow: {
    gap: "var(--space-2)",
    marginBottom: "var(--space-4)",
  },
  quickPinInput: {
    ...S.input,
    flex: 1,
    padding: "6px 12px",
    fontSize: 12,
  },
  pinAddBtn: {
    ...S.ghost,
    padding: "6px",
  },
  noCharsText: {
    ...S.dim,
    marginTop: 10,
  },
  tagWrapGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 5,
  },
  tagWrapGridMargin: {
    display: "flex",
    flexWrap: "wrap",
    gap: 5,
    marginBottom: 16,
  },
  modalFooter: {
    marginTop: 24,
    textAlign: "right",
  },
  modalDoneBtn: {
    ...S.button,
    padding: "6px 16px",
  },
  sectionDimText: {
    ...S.dim,
    marginBottom: 10,
  },
  fullHeightCol: {
    height: "100%",
  },
  paddingTop12: {
    paddingTop: 12,
  },
  paddingTop12FullHeight: {
    paddingTop: 12,
    height: "100%",
  },
} satisfies Record<string, React.CSSProperties>;
