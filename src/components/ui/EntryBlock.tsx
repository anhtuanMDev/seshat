import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";

const GhostButton = styled(Button)(() => ({
  fontFamily: "Georgia, serif",
  fontSize: 12,
  color: "var(--text-muted)",
  background: "none",
  padding: "0 4px",
  minWidth: 0,
  textTransform: "none",
  "&:hover": {
    background: "none",
    color: "var(--color-red)",
  },
}));

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
        <GhostButton onClick={onDelete}>remove</GhostButton>
      </div>
      {children}
    </div>
  );
}
