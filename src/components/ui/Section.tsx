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
    <div style={styles.container}>
      <hr style={styles.hr} />
      <div
        className="seshat-flex-between"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...styles.header,
          marginBottom: open ? "var(--space-4)" : 0,
          cursor: "pointer",
        }}
      >
        <GhostButton sx={{ pointerEvents: "none" }}>
          {open ? (
            <ExpandMoreIcon sx={styles.expandIcon} />
          ) : (
            <ChevronRightIcon sx={styles.expandIcon} />
          )}
          {title}
        </GhostButton>
        {open && action && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ display: "flex", alignItems: "center" }}
          >
            {action}
          </div>
        )}
      </div>
      <div
        style={{
          ...styles.transitionWrapper,
          gridTemplateRows: open ? "1fr" : "0fr",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(-4px)",
        }}
      >
        <div style={styles.childrenWrapper}>{children}</div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    marginBottom: "var(--space-2)",
    cursor: "pointer",
  },
  hr: {
    border: "none",
    borderTop: "1px solid var(--border)",
    margin: "var(--space-6) 0",
  },
  expandIcon: {
    fontSize: 14,
    color: "var(--text-muted)",
    marginRight: "var(--space-2)",
  },
  header: {
    // seshat-flex-between class covers flex settings, but keep placeholder/custom overrides if needed
  },
  transitionWrapper: {
    display: "grid",
    transition:
      "grid-template-rows 0.3s ease, opacity 0.3s ease, transform 0.3s ease",
  },
  childrenWrapper: {
    overflow: "hidden",
  },
} satisfies Record<string, React.CSSProperties>;
