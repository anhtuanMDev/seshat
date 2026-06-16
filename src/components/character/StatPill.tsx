import React from "react";

interface StatPillProps {
  label: string;
  color?: string;
}

export function StatPill({ label, color = "var(--text-muted)" }: StatPillProps) {
  return (
    <span
      style={{
        ...styles.base,
        color,
        background: `${color}11`,
        border: `1px solid ${color}33`,
      }}
    >
      {label}
    </span>
  );
}

const styles = {
  base: {
    fontSize: 10,
    padding: "1px 6px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    letterSpacing: 0.3,
  },
} satisfies Record<string, React.CSSProperties>;
