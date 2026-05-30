import { useState } from "react";
import type { Event } from "../../lib/types";

interface EventRefProps {
  event: Event;
}

export function EventRef({ event }: EventRefProps) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        marginBottom: 8,
        paddingLeft: 10,
        borderLeft: "2px solid var(--border)",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "Georgia, serif",
          fontSize: 12,
          color: "var(--text-primary)",
          padding: 0,
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {open ? "▾" : "▸"}
        </span>
        <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
          T{event.time}
        </span>
        {event.title}
      </button>
      {open && (
        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          {event.setting && (
            <p style={{ margin: "2px 0" }}>
              <span style={{ color: "var(--text-muted)" }}>where:</span>{" "}
              {event.setting}
            </p>
          )}
          {event.description && (
            <p style={{ margin: "2px 0" }}>{event.description}</p>
          )}
          {event.consequence && (
            <p style={{ margin: "2px 0" }}>
              <span style={{ color: "var(--text-muted)" }}>→</span>{" "}
              {event.consequence}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
