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
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 13, color: colA, fontWeight: 500 }}>
          {nameA} — {pctA}%
        </span>
        <span style={{ fontSize: 13, color: colB, fontWeight: 500 }}>
          {pctB}% — {nameB}
        </span>
      </div>
      <div
        style={{
          height: 24,
          borderRadius: 2,
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
          marginTop: 8,
        }}
      >
        {pctA === pctB ? (
          <span style={{ ...S.dim, fontSize: 13 }}>Even match</span>
        ) : (
          <span
            style={{
              fontSize: 13,
              color: pctA > pctB ? colA : colB,
              fontWeight: 500,
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
