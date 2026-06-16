import { memo } from "react";
import { S } from "../../lib/utils";

interface WinBarProps {
  pctA: number;
  pctB: number;
  colA: string;
  colB: string;
  nameA: string;
  nameB: string;
}

export const WinBar = memo(function WinBar({ pctA, pctB, colA, colB, nameA, nameB }: WinBarProps) {
  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <span style={{ ...styles.nameLabel, color: colA }}>
          {nameA} — {pctA}%
        </span>
        <span style={{ ...styles.nameLabel, color: colB }}>
          {pctB}% — {nameB}
        </span>
      </div>
      <div style={styles.barContainer}>
        <div
          style={{
            ...styles.barSegment,
            width: `${pctA}%`,
            background: colA,
          }}
        />
        <div
          style={{
            ...styles.barSegment,
            width: `${pctB}%`,
            background: colB,
          }}
        />
      </div>
      <div style={styles.footerRow}>
        {pctA === pctB ? (
          <span style={styles.evenMatchText}>Even match</span>
        ) : (
          <span
            style={{
              ...styles.edgeText,
              color: pctA > pctB ? colA : colB,
            }}
          >
            {pctA > pctB ? nameA : nameB} has the edge (
            {Math.abs(pctA - pctB)}% margin)
          </span>
        )}
      </div>
    </div>
  );
});

const styles = {
  container: {
    marginBottom: "var(--space-8)",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "var(--space-2)",
  },
  nameLabel: {
    fontSize: "var(--text-sm)",
    fontWeight: 500,
  },
  barContainer: {
    height: "var(--space-8)",
    borderRadius: "var(--space-1)",
    overflow: "hidden",
    display: "flex",
    background: "var(--bg-active)",
  },
  barSegment: {
    transition: "width 0.4s",
  },
  footerRow: {
    display: "flex",
    justifyContent: "center",
    marginTop: "var(--space-2)",
  },
  evenMatchText: {
    ...S.dim,
    fontSize: "var(--text-xs)",
  },
  edgeText: {
    fontSize: "var(--text-xs)",
    fontWeight: 500,
    background: "var(--bg-status)",
    padding: "var(--space-1) var(--space-3)",
    borderRadius: "20px",
  },
} satisfies Record<string, React.CSSProperties>;
