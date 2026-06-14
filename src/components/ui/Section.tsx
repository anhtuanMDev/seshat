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
    <div style={{ marginBottom: "var(--space-2)" }}>
      <hr
        style={{
          border: "none",
          borderTop: "1px solid var(--border)",
          margin: "var(--space-6) 0",
        }}
      />
      <div
        className="seshat-flex-between"
        style={{
          marginBottom: open ? "var(--space-4)" : 0,
        }}
      >
        <GhostButton onClick={() => setOpen((o) => !o)}>
          {open ? (
            <ExpandMoreIcon sx={{ fontSize: 14, color: "var(--text-muted)", marginRight: "var(--space-2)" }} />
          ) : (
            <ChevronRightIcon sx={{ fontSize: 14, color: "var(--text-muted)", marginRight: "var(--space-2)" }} />
          )}
          {title}
        </GhostButton>
        {open && action}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(-4px)",
          transition: "grid-template-rows 0.3s ease, opacity 0.3s ease, transform 0.3s ease",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
