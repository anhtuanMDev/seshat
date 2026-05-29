import { useState } from "react";
import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import { ExpandMoreIcon, ChevronRightIcon } from "./icons";

const GhostButton = styled(Button)(() => ({
  fontFamily: "Georgia, serif",
  fontSize: 11,
  letterSpacing: 3,
  padding: "4px 0",
  textTransform: "uppercase",
  background: "none",
  color: "var(--text-secondary)",
  "&:hover": { background: "none" },
}));

interface SectionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  defaultOpen?: boolean;
}

export function Section({
  title,
  children,
  action,
  defaultOpen = true,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 8 }}>
      <hr
        style={{
          border: "none",
          borderTop: "1px solid var(--border)",
          margin: "20px 0",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: open ? 14 : 0,
        }}
      >
        <GhostButton onClick={() => setOpen((o) => !o)}>
          {open ? (
            <ExpandMoreIcon sx={{ fontSize: 14, color: "var(--text-muted)", marginRight: 8 }} />
          ) : (
            <ChevronRightIcon sx={{ fontSize: 14, color: "var(--text-muted)", marginRight: 8 }} />
          )}
          {title}
        </GhostButton>
        {open && action}
      </div>
      {open && <div>{children}</div>}
    </div>
  );
}
