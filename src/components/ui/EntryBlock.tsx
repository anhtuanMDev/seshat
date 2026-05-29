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
        marginBottom: 24,
        paddingLeft: 14,
        borderLeft: `2px solid ${color || "var(--border)"}`,
        background: "var(--bg-entry)",
      }}
    >
      <div
        style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}
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
