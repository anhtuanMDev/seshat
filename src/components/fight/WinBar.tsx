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
    <div style={{ marginBottom: "var(--space-8)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "var(--space-2)",
        }}
      >
        <span style={{ fontSize: "var(--text-sm)", color: colA, fontWeight: 500 }}>
          {nameA} — {pctA}%
        </span>
        <span style={{ fontSize: "var(--text-sm)", color: colB, fontWeight: 500 }}>
          {pctB}% — {nameB}
        </span>
      </div>
      <div
        style={{
          height: "var(--space-8)",
          borderRadius: "var(--space-1)",
          overflow: "hidden",
          display: "flex",
          background: "var(--bg-active)",
        }}
      >
        <div
          style={{
            width: `${pctA}%`,
            background: colA,
            transition: "width 0.4s",
          }}
        />
        <div
          style={{
            width: `${pctB}%`,
            background: colB,
            transition: "width 0.4s",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "var(--space-2)",
        }}
      >
        {pctA === pctB ? (
          <span style={{ ...S.dim, fontSize: "var(--text-xs)" }}>Even match</span>
        ) : (
          <span
            style={{
              fontSize: "var(--text-xs)",
              color: pctA > pctB ? colA : colB,
              fontWeight: 500,
              background: "var(--bg-status)",
              padding: "var(--space-1) var(--space-3)",
              borderRadius: "20px",
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
