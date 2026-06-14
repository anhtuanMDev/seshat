import { Button, styled } from "@mui/material";

export const GhostButton = styled(Button)(() => ({
  fontSize: "var(--text-xs)",
  color: "var(--text-secondary)",
  letterSpacing: 1,
  padding: "var(--space-1) 0",
  textTransform: "none",
  background: "none",
  minWidth: 0,
  "&:hover": { background: "none", color: "var(--text-primary)" },
}));
