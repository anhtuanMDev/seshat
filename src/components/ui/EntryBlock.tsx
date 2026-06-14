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
        marginBottom: "var(--space-6)",
        padding: "var(--space-4) var(--space-5)",
        borderLeft: `3px solid ${color || "var(--border)"}`,
        background: "var(--bg-status)",
        borderRadius: "0 var(--space-1) var(--space-1) 0",
      }}
    >
      <div
        className="seshat-flex-end"
        style={{ marginBottom: "var(--space-1)" }}
      >
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
