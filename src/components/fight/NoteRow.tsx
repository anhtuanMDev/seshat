import { memo } from "react";
import type { Note } from "../../lib/scoreFighter";

export const NoteRow = memo(function NoteRow({ n }: { n: Note }) {
  return (
    <div style={styles.row}>
      <span style={styles.labelText}>
        {n.label}:{" "}
        <span style={styles.valueText}>{n.value}</span>
      </span>
      {!n.neutral && (
        <span
          style={{
            ...styles.pointsBadge,
            color: n.positive ? "var(--color-green)" : "var(--color-red)",
          }}
        >
          {n.pts > 0 ? "+" : ""}
          {n.pts}
        </span>
      )}
      {n.neutral && (
        <span style={styles.neutralBadge}>
          info
        </span>
      )}
    </div>
  );
});

const styles = {
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "3px 0",
    borderBottom: "1px solid var(--border)",
    fontSize: 12,
  },
  labelText: {
    color: "var(--text-secondary)",
  },
  valueText: {
    color: "var(--text-primary)",
  },
  pointsBadge: {
    fontWeight: 500,
    minWidth: 40,
    textAlign: "right",
  },
  neutralBadge: {
    color: "var(--text-muted)",
    fontSize: 11,
    minWidth: 40,
    textAlign: "right",
  },
} satisfies Record<string, React.CSSProperties>;
