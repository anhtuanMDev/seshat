import { useNavigate, useParams } from "react-router-dom";
import { appStore } from "../store/appStore";
import {
  useEvents,
  useCharacters,
  useActiveBookIdx,
} from "../hooks/useWorldStore";
import { S, mkEvent } from "../lib/utils";
import { TimelineIcon, AddIcon } from "../components/ui/icons";
import { useAnimateIn } from "../hooks/useAnimateIn";
import type { Event, Character } from "../lib/types";
import { useCallback, useState } from "react";

const EVENT_TYPE_COLORS: Record<string, string> = {
  Story: "var(--color-blue)",
  Trauma: "var(--color-red)",
  Revelation: "var(--color-purple)",
  Conflict: "var(--color-orange)",
  Bond: "var(--color-green)",
  Loss: "var(--color-red)",
  Growth: "var(--color-teal)",
  Mystery: "var(--color-dark)",
};

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
    const e = { ...mkEvent(), time: maxT + 1 };
    appStore.books[bookIdx].events.push(e);
    navigate(`/book/${bookId}/events/${e.id}`);
  }, [events, bookIdx, bookId, navigate]);

  const [subplotFilter, setSubplotFilter] = useState<string | null>(null);

  const sortedEvents = [...events].sort((a, b) => a.time - b.time);
  const filteredEvents = subplotFilter
    ? sortedEvents.filter((e) => e.subplot === subplotFilter)
    : sortedEvents;

  const uniqueSubplots = Array.from(
    new Set(events.map((e) => e.subplot).filter(Boolean)),
  ) as string[];

  return (
    <div ref={ref} className="seshat-page-container">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TimelineIcon sx={{ fontSize: 14, color: "var(--text-muted)" }} />
          <span
            style={{
              fontSize: 13,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "var(--text-secondary)",
            }}
          >
            Timeline ({events.length})
          </span>
        </div>
        <button
          onClick={add}
          style={{
            ...S.ghost,
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
            color: "var(--text-secondary)",
          }}
        >
          <AddIcon sx={{ fontSize: 14 }} />
          add event
        </button>
      </div>

      {uniqueSubplots.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Subplots:
          </span>
          <button
            onClick={() => setSubplotFilter(null)}
            style={{
              ...S.ghost,
              fontSize: 12,
              padding: "2px 8px",
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
                ...S.ghost,
                fontSize: 12,
                padding: "2px 8px",
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
      <div style={{ position: "relative", marginLeft: 8 }}>
        {/* Vertical line */}
        {sortedEvents.length > 1 && (
          <div
            style={{
              position: "absolute",
              left: 18,
              top: 36,
              bottom: 36,
              width: 2,
              background: "linear-gradient(to bottom, var(--border), var(--border-field), var(--border))",
              transform: "translateX(-50%)",
              zIndex: 0,
            }}
          />
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
        <div
          style={{
            paddingTop: 60,
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 13,
            fontStyle: "italic",
          }}
        >
          No events yet. Add one to begin.
        </div>
      )}
    </div>
  );
}

function EventCard({
  event: e,
  characters,
  onClick,
}: {
  event: Event;
  characters: Character[];
  onClick: () => void;
}) {
  const typeColor = EVENT_TYPE_COLORS[e.type] || "var(--text-muted)";
  const presentChars = (e.characters || [])
    .map((id: string) => characters.find((c: Character) => c.id === id))
    .filter(Boolean) as Character[];

  const dateTag = [
    e.startDate && e.startDate.replace("T", " "),
    e.endDate && `→ ${e.endDate.replace("T", " ")}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        gap: 24,
        cursor: "pointer",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        const card = e.currentTarget.querySelector(".event-card-inner") as HTMLElement;
        const node = e.currentTarget.querySelector(".event-node") as HTMLElement;
        const arrow = e.currentTarget.querySelector(".hover-arrow") as HTMLElement;
        if (card) {
          card.style.background = "var(--bg-hover)";
          card.style.borderColor = "var(--border)";
          card.style.transform = "translateY(-1px)";
          card.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
        }
        if (node) {
          node.style.boxShadow = `0 0 12px ${typeColor}88`;
          node.style.background = typeColor;
          node.style.color = "#000";
        }
        if (arrow) {
          arrow.style.opacity = "1";
          arrow.style.transform = "translateY(-50%) translateX(4px)";
        }
      }}
      onMouseLeave={(e) => {
        const card = e.currentTarget.querySelector(".event-card-inner") as HTMLElement;
        const node = e.currentTarget.querySelector(".event-node") as HTMLElement;
        const arrow = e.currentTarget.querySelector(".hover-arrow") as HTMLElement;
        if (card) {
          card.style.background = "var(--bg-entry)";
          card.style.borderColor = "transparent";
          card.style.transform = "translateY(0)";
          card.style.boxShadow = "none";
        }
        if (node) {
          node.style.boxShadow = "none";
          node.style.background = `var(--bg-app)`;
          node.style.color = typeColor;
        }
        if (arrow) {
          arrow.style.opacity = "0";
          arrow.style.transform = "translateY(-50%)";
        }
      }}
    >
      {/* Time bubble */}
      <div style={{ position: "relative", width: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          className="event-node"
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "var(--bg-app)",
            border: `2px solid ${typeColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            zIndex: 1,
            transition: "all 0.2s ease",
            marginTop: 16,
            alignSelf: "flex-start",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 0.5,
              color: "inherit",
            }}
          >
            T{e.time}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div
        className="event-card-inner"
        style={{
          flex: 1,
          padding: "16px 20px",
          background: "var(--bg-entry)",
          borderRadius: "8px",
          border: "1px solid transparent",
          transition: "all 0.2s ease",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Header Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: "var(--text-primary)",
                letterSpacing: 0.2,
              }}
            >
              {e.title || "Untitled event"}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: typeColor,
                background: `${typeColor}15`,
                padding: "2px 8px",
                borderRadius: "12px",
                border: `1px solid ${typeColor}33`,
              }}
            >
              {e.type}
            </span>
          </div>
          
          {dateTag && (
            <span
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontFamily: "monospace",
                letterSpacing: -0.2,
                background: "var(--bg-side)",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              {dateTag}
            </span>
          )}
        </div>

        {/* Content Row */}
        {(e.subplot || e.description || e.consequence) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {e.subplot && (
              <div>
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: "var(--bg-hover)",
                    color: "var(--text-secondary)",
                    letterSpacing: 0.5,
                  }}
                >
                  Plot: {e.subplot}
                </span>
              </div>
            )}

            {e.description && (
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {e.description.length > 200
                  ? e.description.slice(0, 197) + "…"
                  : e.description}
              </p>
            )}

            {e.consequence && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  margin: "4px 0 0 0",
                  fontStyle: "italic",
                  display: "flex",
                  gap: 6,
                }}
              >
                <span style={{ color: typeColor }}>↳</span>
                {e.consequence.length > 150
                  ? e.consequence.slice(0, 147) + "…"
                  : e.consequence}
              </p>
            )}
          </div>
        )}

        {/* Characters Row */}
        {presentChars.length > 0 && (
          <div
            style={{ 
              display: "flex", 
              gap: 6, 
              flexWrap: "wrap",
              marginTop: "auto",
              paddingTop: 8,
            }}
          >
            {presentChars.map((c: Character) => (
              <span
                key={c.id}
                style={{
                  fontSize: 11,
                  color: c.color,
                  background: `${c.color}11`,
                  border: `1px solid ${c.color}33`,
                  padding: "2px 8px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: c.color }} />
                {c.name}
              </span>
            ))}
          </div>
        )}

        {/* Hover arrow indicator */}
        <span
          className="hover-arrow"
          style={{
            position: "absolute",
            right: 20,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 14,
            color: "var(--text-muted)",
            opacity: 0,
            transition: "opacity 0.2s, transform 0.2s",
          }}
        >
          →
        </span>
      </div>
    </div>
  );
}
