import { IconButton } from "@mui/material";
import { CloseIcon } from "./icons";

interface EntryBlockProps {
  color?: string;
  onDelete: () => void;
  children: React.ReactNode;
}

export function EntryBlock({ color, onDelete, children }: EntryBlockProps) {
  return (
    <div
      style={{
        ...styles.containerBase,
        borderLeft: `3px solid ${color || "var(--border)"}`,
      }}
    >
      <div className="seshat-flex-end" style={styles.headerRow}>
        <IconButton
          onClick={onDelete}
          size="small"
          sx={{
            color: "var(--text-muted)",
            padding: "2px",
            "&:hover": { color: "var(--color-red)" },
          }}
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </div>
      {children}
    </div>
  );
}

const styles = {
  containerBase: {
    marginBottom: "var(--space-6)",
    padding: "var(--space-4) var(--space-5)",
    background: "var(--bg-status)",
    borderRadius: "0 var(--space-1) var(--space-1) 0",
  },
  headerRow: {
    marginBottom: "var(--space-1)",
  },
} satisfies Record<string, React.CSSProperties>;
