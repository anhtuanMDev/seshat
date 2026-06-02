import { useState } from "react";
import type { Character, Event } from "../../lib/types";

interface CharMentionTooltipProps {
  char: Character;
  events: Event[];
  pinnedEvents: Event[];
  anchorEl: HTMLElement;
  onClose: () => void;
}

export default function CharMentionTooltip({
  char,
  events,
  pinnedEvents,

  onClose,
}: CharMentionTooltipProps) {
  const charEvents = events.filter((e) => e.characters?.includes(char.id));

  // If no direct association, show pinned events or recent events
  const displayEvents = charEvents.length > 0 
    ? charEvents.slice(0, 5) 
    : pinnedEvents.slice(0, 5);

  const [hoveredEvent, setHoveredEvent] = useState<Event | null>(null);

  return (
    <div
      style={{
        position: "absolute",
        background: "var(--bg-entry)",
        border: "1px solid var(--border)",
        borderRadius: 4,
        padding: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: 1000,
        maxWidth: 300,
        fontFamily: "'Georgia',serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div
          style={{
            width: 24,
            height: 24,
            background: char.color,
            borderRadius: 4,
          }}
        />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{char.name}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{char.role}</div>
        </div>
      </div>

      {displayEvents.length > 0 && (
        <>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
            Related Events:
          </div>
          {displayEvents.map((event) => (
            <div
              key={event.id}
              style={{
                padding: 4,
                borderRadius: 2,
                cursor: "pointer",
                background: hoveredEvent?.id === event.id 
                  ? "var(--bg-hover)" 
                  : "transparent",
                border: hoveredEvent?.id === event.id 
                  ? "1px solid var(--border)" 
                  : "none",
              }}
              onMouseEnter={() => setHoveredEvent(event)}
              onMouseLeave={() => setHoveredEvent(null)}
            >
              <div style={{ fontWeight: 500, marginBottom: 2 }}>{event.title}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {new Date(event.startDate || 0).toLocaleDateString()}
              </div>
            </div>
          ))}
        </>
      )}

      {displayEvents.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
          No related events
        </div>
      )}

      <div style={{ marginTop: 8, textAlign: "right" }}>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 2,
            padding: "2px 6px",
            fontSize: 12,
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}