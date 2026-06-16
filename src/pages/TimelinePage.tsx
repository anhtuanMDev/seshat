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
import type { Event } from "../lib/types";
import { useCallback, useState } from "react";
import { EventCard } from "../components/event/EventCard";

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
      <div className="seshat-flex-between" style={styles.header}>
        <div style={styles.headerTitleRow}>
          <TimelineIcon sx={styles.headerIcon} />
          <span style={styles.headerText}>
            Timeline ({events.length})
          </span>
        </div>
        <button onClick={add} style={styles.addBtn}>
          <AddIcon sx={{ fontSize: 14 }} />
          add event
        </button>
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
} satisfies Record<string, React.CSSProperties>;
