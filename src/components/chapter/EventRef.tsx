import { useState } from "react";
import type { Event } from "../../lib/types";

interface EventRefProps {
  event: Event;
}

export function EventRef({ event }: EventRefProps) {
  const [open, setOpen] = useState(false);
  return (
    <div style={styles.container}>
      <button onClick={() => setOpen((o) => !o)} style={styles.toggleBtn}>
        <span style={styles.arrow}>{open ? "▾" : "▸"}</span>
        <span style={styles.timeLabel}>T{event.time}</span>
        {event.title}
      </button>
      {open && (
        <div style={styles.detailsContainer}>
          {event.setting && (
            <p style={styles.detailRow}>
              <span style={styles.mutedLabel}>where:</span> {event.setting}
            </p>
          )}
          {event.description && (
            <p style={styles.detailRow}>{event.description}</p>
          )}
          {event.consequence && (
            <p style={styles.detailRow}>
              <span style={styles.mutedLabel}>→</span> {event.consequence}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    marginBottom: 8,
    paddingLeft: 10,
    borderLeft: "2px solid var(--border)",
  },
  toggleBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 12,
    color: "var(--text-primary)",
    padding: 0,
    display: "flex",
    alignItems: "center",
    gap: 6,
    width: "100%",
    textAlign: "left",
  },
  arrow: {
    fontSize: 12,
    color: "var(--text-muted)",
  },
  timeLabel: {
    color: "var(--text-muted)",
    fontSize: 11,
  },
  detailsContainer: {
    marginTop: 4,
    fontSize: 11,
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  detailRow: {
    margin: "2px 0",
  },
  mutedLabel: {
    color: "var(--text-muted)",
  },
} satisfies Record<string, React.CSSProperties>;
