import React from "react";
import { AddIcon } from "../ui/icons";
import { S } from "../../lib/utils";

interface GhostAddButtonProps {
  onClick: (e: React.MouseEvent) => void;
}

const styles = {
  button: {
    ...S.ghost,
    fontSize: "11px",
    display: "flex",
    alignItems: "center",
    gap: "var(--space-1)",
    color: "var(--text-secondary)",
  },
} satisfies Record<string, React.CSSProperties>;

export function GhostAddButton({ onClick }: GhostAddButtonProps) {
  return (
    <button onClick={onClick} style={styles.button}>
      <AddIcon sx={{ fontSize: 13 }} />
      add
    </button>
  );
}
