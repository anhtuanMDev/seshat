import { S } from "../../lib/utils";
import { ContextTag } from "./ContextTag";
import { CharCard } from "./CharCard";
import { EventRef } from "./EventRef";
import { WorldTabContent } from "./WorldTabContent";
import { PeopleIcon, EventNoteIcon, PublicIcon, NotesIcon, HistoryIcon } from "../ui/icons";
import type { Character, Event } from "../../lib/types";

interface ReferencePanelProps {
  panelTab: "chars" | "events" | "world" | "notes" | "drafts";
  onTabChange: (tab: "chars" | "events" | "world" | "notes" | "drafts") => void;
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
}

export function ReferencePanel({
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
}: ReferencePanelProps) {
  const pinnedCharObjs = characters.filter((c: Character) =>
    pinnedCharIds.includes(c.id),
  );
  const pinnedEventObjs = events
    .filter((e: Event) => pinnedEventIds.includes(e.id))
    .sort((a: Event, b: Event) => a.time - b.time);

  return (
    <div className="seshat-chapter-panel">
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 16,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 8,
          overflowX: "auto",
          scrollbarWidth: "none", // For Firefox
          msOverflowStyle: "none", // For IE/Edge
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
        {(["chars", "events", "world", "notes", "drafts"] as const).map((tab) => {
          const icon = tab === "chars" ? <PeopleIcon sx={{ fontSize: 12 }} />
            : tab === "events" ? <EventNoteIcon sx={{ fontSize: 12 }} />
            : tab === "world" ? <PublicIcon sx={{ fontSize: 12 }} />
            : tab === "drafts" ? <HistoryIcon sx={{ fontSize: 12 }} />
            : <NotesIcon sx={{ fontSize: 12 }} />;
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

      {panelTab === "chars" && (
        <div>
          <p style={{ ...S.dim, marginBottom: 10 }}>
            Pin characters present in this chapter.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 5,
              marginBottom: 16,
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
          {pinnedCharObjs.map((c: Character) => (
            <CharCard key={c.id} char={c} events={events} />
          ))}
        </div>
      )}

      {panelTab === "events" && (
        <div>
          <p style={{ ...S.dim, marginBottom: 10 }}>
            Pin timeline events this chapter covers.
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
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <p style={{ ...S.dim, marginBottom: 10 }}>
            Private notes, research, and threads to pull later...
          </p>
          {notesNode}
        </div>
      )}

      {panelTab === "drafts" && (
        <div style={{ paddingTop: 12 }}>
          {draftsNode}
        </div>
      )}
    </div>
  );
}
