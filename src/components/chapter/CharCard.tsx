import { useState } from "react";
import type { Character, Event } from "../../lib/types";

interface CharCardProps {
  char: Character;
  events: Event[];
}

export function CharCard({ char, events }: CharCardProps) {
  const [open, setOpen] = useState(false);
  const latestEvent = [...events]
    .sort((a, b) => b.time - a.time)
    .find((e) => (e.characters || []).includes(char.id));
  const attr = latestEvent ? char.attributes?.[latestEvent.id] || {} : {};

  return (
    <div
      style={{
        marginBottom: 10,
        borderLeft: `2px solid ${char.color}`,
        paddingLeft: 10,
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 12,
          color: char.color,
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
        {char.name}
        {char.role && (
          <span
            style={{
              color: "var(--text-muted)",
              fontStyle: "italic",
              fontSize: 11,
            }}
          >
            — {char.role}
          </span>
        )}
      </button>
      {open && (
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          {char.coreWound && (
            <p style={{ margin: "2px 0" }}>
              <span style={{ color: "var(--text-muted)" }}>wound:</span>{" "}
              {char.coreWound}
            </p>
          )}
          {char.coreFear && (
            <p style={{ margin: "2px 0" }}>
              <span style={{ color: "var(--text-muted)" }}>fear:</span>{" "}
              {char.coreFear}
            </p>
          )}
          {char.coreDesire && (
            <p style={{ margin: "2px 0" }}>
              <span style={{ color: "var(--text-muted)" }}>desire:</span>{" "}
              {char.coreDesire}
            </p>
          )}
          {char.secrets && (
            <p style={{ margin: "2px 0" }}>
              <span style={{ color: "var(--text-muted)" }}>secret:</span>{" "}
              {char.secrets}
            </p>
          )}
          {attr.power && (
            <p style={{ margin: "4px 0 2px" }}>
              <span style={{ color: "var(--text-muted)" }}>now:</span>{" "}
              {attr.power}
              {attr.arcStage ? ` · ${attr.arcStage}` : ""}
            </p>
          )}
          {attr.emotionalState && (
            <p style={{ margin: "2px 0" }}>
              <span style={{ color: "var(--text-muted)" }}>feeling:</span>{" "}
              {attr.emotionalState}
            </p>
          )}
          {(char.traumas || []).length > 0 && (
            <p style={{ margin: "2px 0" }}>
              <span style={{ color: "var(--text-muted)" }}>traumas:</span>{" "}
              {char.traumas
                .map((t) => t.title)
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
