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
import { useCallback } from "react";

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

  const sortedEvents = [...events].sort((a, b) => a.time - b.time);

  return (
    <div ref={ref}>
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
              fontSize: 11,
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

      {/* Timeline */}
      <div style={{ position: "relative" }}>
        {/* Vertical line */}
        {sortedEvents.length > 1 && (
          <div
            style={{
              position: "absolute",
              left: 30,
              top: 16,
              bottom: 16,
              width: 1,
              background: "var(--border)",
            }}
          />
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {sortedEvents.map((e: Event) => (
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
        gap: 20,
        cursor: "pointer",
        padding: "16px 0",
        position: "relative",
        paddingLeft: 60,
      }}
      onMouseEnter={(e) => {
        const card = e.currentTarget.querySelector(
          ".event-card-inner",
        ) as HTMLElement;
        if (card) card.style.background = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        const card = e.currentTarget.querySelector(
          ".event-card-inner",
        ) as HTMLElement;
        if (card) card.style.background = "var(--bg-entry)";
      }}
    >
      {/* Time bubble */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: typeColor + "22",
          border: `1px solid ${typeColor}66`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: typeColor,
            fontWeight: 400,
            letterSpacing: 0.5,
          }}
        >
          T{e.time}
        </span>
      </div>

      {/* Card body */}
      <div
        className="event-card-inner"
        style={{
          flex: 1,
          padding: "14px 18px",
          background: "var(--bg-entry)",
          borderRadius: "2px",
          borderLeft: `2px solid ${typeColor}`,
          transition: "background 0.12s",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            marginBottom: e.description ? 8 : 0,
          }}
        >
          <span
            style={{
              fontSize: 15,
              color: "var(--text-primary)",
            }}
          >
            {e.title}
          </span>
          <span
            style={{
              fontSize: 10,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: typeColor,
              opacity: 0.8,
            }}
          >
            {e.type}
          </span>
          {dateTag && (
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginLeft: "auto",
              }}
            >
              {dateTag}
            </span>
          )}
        </div>

        {e.description && (
          <p
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              lineHeight: 1.65,
              margin: "0 0 8px",
            }}
          >
            {e.description.length > 160
              ? e.description.slice(0, 157) + "…"
              : e.description}
          </p>
        )}

        {e.consequence && (
          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              margin: 0,
              fontStyle: "italic",
            }}
          >
            →{" "}
            {e.consequence.length > 100
              ? e.consequence.slice(0, 97) + "…"
              : e.consequence}
          </p>
        )}

        {/* Characters present */}
        {presentChars.length > 0 && (
          <div
            style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}
          >
            {presentChars.map((c: Character) => (
              <span
                key={c.id}
                style={{
                  fontSize: 11,
                  color: c.color,
                  border: `1px solid ${c.color}44`,
                  padding: "1px 7px",
                  borderRadius: 2,
                }}
              >
                {c.name}
              </span>
            ))}
          </div>
        )}

        <span
          style={{
            position: "absolute",
            right: 14,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 11,
            color: "var(--text-muted)",
            opacity: 0.4,
          }}
        >
          →
        </span>
      </div>
    </div>
  );
}
