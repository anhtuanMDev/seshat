import { memo } from "react";
import type { Note } from "../../lib/scoreFighter";

export const NoteRow = memo(function NoteRow({ n }: { n: Note }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "3px 0",
        borderBottom: "1px solid var(--border)",
        fontSize: 12,
      }}
    >
      <span style={{ color: "var(--text-secondary)" }}>
        {n.label}:{" "}
        <span style={{ color: "var(--text-primary)" }}>{n.value}</span>
      </span>
      {!n.neutral && (
        <span
          style={{
            color: n.positive ? "var(--color-green)" : "var(--color-red)",
            fontWeight: 500,
            minWidth: 40,
            textAlign: "right",
          }}
        >
          {n.pts > 0 ? "+" : ""}
          {n.pts}
        </span>
      )}
      {n.neutral && (
        <span
          style={{
            color: "var(--text-muted)",
            fontSize: 11,
            minWidth: 40,
            textAlign: "right",
          }}
        >
          info
        </span>
      )}
    </div>
  );
});
