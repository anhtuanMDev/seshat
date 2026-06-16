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
        ...styles.containerBase,
        borderLeft: `2px solid ${char.color}`,
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          ...styles.toggleBtnBase,
          color: char.color,
        }}
      >
        <span style={styles.arrow}>{open ? "▾" : "▸"}</span>
        {char.name}
        {char.role && (
          <span style={styles.roleText}>
            — {char.role}
          </span>
        )}
      </button>
      {open && (
        <div style={styles.detailsContainer}>
          {char.coreWound && (
            <p style={styles.detailRow}>
              <span style={styles.mutedLabel}>wound:</span> {char.coreWound}
            </p>
          )}
          {char.coreFear && (
            <p style={styles.detailRow}>
              <span style={styles.mutedLabel}>fear:</span> {char.coreFear}
            </p>
          )}
          {char.coreDesire && (
            <p style={styles.detailRow}>
              <span style={styles.mutedLabel}>desire:</span> {char.coreDesire}
            </p>
          )}
          {char.secrets && (
            <p style={styles.detailRow}>
              <span style={styles.mutedLabel}>secret:</span> {char.secrets}
            </p>
          )}
          {attr.power && (
            <p style={styles.detailRowMargin}>
              <span style={styles.mutedLabel}>now:</span> {attr.power}
              {attr.arcStage ? ` · ${attr.arcStage}` : ""}
            </p>
          )}
          {attr.emotionalState && (
            <p style={styles.detailRow}>
              <span style={styles.mutedLabel}>feeling:</span> {attr.emotionalState}
            </p>
          )}
          {(char.traumas || []).length > 0 && (
            <p style={styles.detailRow}>
              <span style={styles.mutedLabel}>traumas:</span>{" "}
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

const styles = {
  containerBase: {
    marginBottom: 10,
    paddingLeft: 10,
  },
  toggleBtnBase: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 12,
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
  roleText: {
    color: "var(--text-muted)",
    fontStyle: "italic",
    fontSize: 11,
  },
  detailsContainer: {
    marginTop: 6,
    fontSize: 11,
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  detailRow: {
    margin: "2px 0",
  },
  detailRowMargin: {
    margin: "4px 0 2px",
  },
  mutedLabel: {
    color: "var(--text-muted)",
  },
} satisfies Record<string, React.CSSProperties>;
