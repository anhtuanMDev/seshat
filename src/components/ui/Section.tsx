import { useState } from "react";
import { ExpandMoreIcon, ChevronRightIcon } from "./icons";

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
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("select, button, a, input")) return;
          setOpen((o) => !o);
        }}
        style={{
          ...styles.header,
          marginBottom: open ? "var(--space-4)" : 0,
          cursor: "pointer",
        }}
      >
        <div style={styles.titleWrapper}>
          {open ? (
            <ExpandMoreIcon sx={styles.expandIcon} />
          ) : (
            <ChevronRightIcon sx={styles.expandIcon} />
          )}
          <div style={styles.titleText}>{title}</div>
        </div>
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
  },
  hr: {
    border: "none",
    borderTop: "1px solid var(--border)",
    margin: "var(--space-6) 0",
  },
  titleWrapper: {
    display: "flex",
    alignItems: "center",
    padding: "4px 0",
  },
  titleText: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "var(--text-secondary)",
    display: "flex",
    alignItems: "center",
  },
  expandIcon: {
    fontSize: 14,
    color: "var(--text-muted)",
    marginRight: "var(--space-2)",
  },
  header: {
    // seshat-flex-between covers this
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
