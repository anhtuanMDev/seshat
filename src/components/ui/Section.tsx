import { useState } from "react";
import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import { ExpandMoreIcon, ChevronRightIcon } from "./icons";

const GhostButton = styled(Button)(() => ({
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 1.5,
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
      <div
        style={{
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(-10px)",
          maxHeight: open ? 2000 : 0,
          overflow: "hidden",
          transition: `opacity 0.2s ease, transform 0.2s ease, max-height ${open ? "0.25s ease-in" : "0.2s ease-out"}`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
