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
  takesPlaceAt: string;
  pinnedEventIds: string[];
  onTogglePinChar: (id: string) => void;
  onSetTakesPlaceAt: (id: string) => void;
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
  takesPlaceAt,
  pinnedEventIds,
  onTogglePinChar,
  onSetTakesPlaceAt,
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
    <div className={`seshat-chapter-panel ${isOpen ? "open" : ""}`} style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          gap: 12,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 8,
          overflowX: "auto",
          scrollbarWidth: "none", // For Firefox
          msOverflowStyle: "none", // For IE/Edge
          flexShrink: 0,
        }}
        className="no-scrollbar" // Assuming we might have a utility class, but inline works for basics
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
                ...S.ghost,
                fontSize: 11,
                letterSpacing: 2,
                textTransform: "uppercase",
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
                display: "flex",
                alignItems: "center",
                gap: 4,
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {icon}
              {tab}
            </button>
          );
        })}
      </div>

      <div
        style={{
          paddingLeft: 12,
          paddingBottom: 124,
          flex: 1,
          overflowY: "auto",
        }}
      >
        {panelTab === "chars" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <input
                list="unpinned-chars"
                value={charInput}
                onChange={(e) => handleCharInput(e.target.value)}
                onKeyDown={handleQuickAddChar}
                placeholder="Quick pin character..."
                style={{ ...S.input, flex: 1, padding: "6px 12px", fontSize: 12 }}
              />
              <datalist id="unpinned-chars">
                {unpinnedChars.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
              <button 
                onClick={() => setShowCharModal(true)}
                style={{ ...S.ghost, padding: "6px" }}
                title="Pin multiple characters"
              >
                <AddIcon sx={{ fontSize: 16 }} />
              </button>
            </div>
            
            {pinnedCharObjs.length === 0 ? (
              <p style={{ ...S.dim, marginTop: 10 }}>No characters pinned yet.</p>
            ) : (
              pinnedCharObjs.map((c: Character) => (
                <CharCard key={c.id} char={c} events={events} />
              ))
            )}

            {showCharModal && (
              <Modal title="Pin Characters" onClose={() => setShowCharModal(false)}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 5,
                  }}
                >
                  {characters.map((c: Character) => (
                    <ContextTag
                      key={c.id}
                      label={c.name}
                      color={c.color}
                      active={pinnedCharIds.includes(c.id)}
                      onClick={() => onTogglePinChar(c.id)}
                    />
                  ))}
                  {!characters.length && <p style={S.dim}>No characters yet.</p>}
                </div>
                <div style={{ marginTop: 24, textAlign: "right" }}>
                  <button style={{ ...S.button, padding: "6px 16px" }} onClick={() => setShowCharModal(false)}>
                    Done
                  </button>
                </div>
              </Modal>
            )}
          </div>
        )}

        {panelTab === "events" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <p style={{ ...S.label, marginBottom: 8 }}>Takes Place At</p>
              <select
                value={takesPlaceAt}
                onChange={(e) => onSetTakesPlaceAt(e.target.value)}
                style={{ ...S.select, width: "100%", fontSize: 12, padding: "6px" }}
              >
                <option value="">(None)</option>
                {sortedEvents.map((e) => (
                  <option key={e.id} value={e.id}>
                    T{e.time} {e.title}
                  </option>
                ))}
              </select>
            </div>
            
            <p style={{ ...S.label, marginBottom: 8 }}>
              Also Mentions
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 5,
                marginBottom: 16,
              }}
            >
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
          <div
            style={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            <p style={{ ...S.dim, marginBottom: 10 }}>
              Private notes, research, and threads to pull later...
            </p>
            {notesNode}
          </div>
        )}

        {panelTab === "drafts" && (
          <div style={{ paddingTop: 12 }}>{draftsNode}</div>
        )}

        {panelTab === "foreshadows" && (
          <div style={{ paddingTop: 12 }}>{foreshadowsNode}</div>
        )}

        {panelTab === "continuity" && (
          <div style={{ paddingTop: 12, height: "100%" }}>{continuityNode}</div>
        )}
      </div>
    </div>
  );
}
