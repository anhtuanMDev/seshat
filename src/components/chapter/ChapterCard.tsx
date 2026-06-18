import { useState } from "react";
import type { Chapter } from "../../store/appStore";

interface ChapterCardProps {
  chapter: Chapter;
  onClick: () => void;
  selected?: boolean;
  onToggle?: () => void;
}

export function ChapterCard({ chapter: c, onClick, selected, onToggle }: ChapterCardProps) {
  const [hover, setHover] = useState(false);
  const wordCount = c.body?.trim() ? c.body.trim().split(/\s+/).length : 0;

  const cardStyle = {
    ...styles.card,
    borderLeftColor: hover
      ? "var(--color-purple)"
      : "color-mix(in srgb, var(--color-purple) 40%, transparent)",
    background: selected ? "var(--bg-active)" : hover ? "var(--bg-hover)" : "transparent",
  };

  const infoTitleStyle = {
    ...styles.infoTitle,
    color: c.title ? "var(--text-primary)" : "var(--text-muted)",
    fontStyle: c.title ? "normal" : "italic" as const,
    fontFamily: c.title ? "serif" : "inherit",
  };

  const connectorStyle = {
    ...styles.connector,
    opacity: hover ? 0.8 : 0.3,
  };

  const arrowIconContainerStyle = {
    ...styles.arrowIconContainer,
    width: hover ? 24 : 0,
    opacity: hover ? 1 : 0,
    marginLeft: hover ? 16 : 0,
  };

  const arrowIconStyle = {
    ...styles.arrowIcon,
    transform: hover ? "translateX(0)" : "translateX(-8px)",
  };

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Chapter Number Column */}
      <div style={styles.numberCol}>
        {onToggle && (
          <span style={styles.checkbox}>
            {selected ? "☑" : "☐"}
          </span>
        )}
        {c.number ? (
          <span style={styles.numberSpan}>{c.number}</span>
        ) : (
          <span style={styles.emptyNumberSpan}>—</span>
        )}
      </div>

      {/* Info Column */}
      <div style={styles.infoCol}>
        <div className="seshat-flex-align" style={styles.infoRow}>
          <span style={infoTitleStyle}>
            {c.title || "Untitled chapter"}
          </span>

          {c.timeRef && (
            <span style={styles.timeBadge}>{c.timeRef}</span>
          )}

          <div className="toc-connector" style={connectorStyle} />

          {wordCount > 0 && (
            <span style={styles.wordBadge}>
              {wordCount >= 1000
                ? `${(wordCount / 1000).toFixed(1)}k`
                : wordCount}
            </span>
          )}
        </div>

        {c.synopsis && (
          <div style={styles.synopsisContainer}>
            <p style={styles.synopsisText}>{c.synopsis}</p>
          </div>
        )}
      </div>

      {/* Icon Column */}
      <div style={arrowIconContainerStyle}>
        <span style={arrowIconStyle}>→</span>
      </div>
    </div>
  );
}

const styles = {
  card: {
    padding: "20px 24px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    borderBottom: "1px solid var(--border)",
    borderLeft: "3px solid var(--color-purple)",
    display: "flex",
    alignItems: "center",
  },
  numberCol: {
    width: 80,
    flexShrink: 0,
    alignSelf: "flex-start",
    paddingTop: 2,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  checkbox: {
    fontSize: 16,
    color: "var(--color-purple)",
    lineHeight: 1,
    userSelect: "none",
    pointerEvents: "none",
  },
  numberSpan: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "var(--color-purple)",
    fontWeight: 600,
    opacity: 0.9,
  },
  emptyNumberSpan: {
    fontSize: 11,
    color: "var(--text-muted)",
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  infoRow: {
    width: "100%",
  },
  infoTitle: {
    fontSize: 14,
    letterSpacing: 0.3,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  timeBadge: {
    fontSize: 10,
    color: "var(--text-secondary)",
    background: "var(--bg-entry)",
    border: "1px solid var(--border-field)",
    padding: "2px 8px",
    borderRadius: "12px",
    marginLeft: 12,
    letterSpacing: 0.5,
    flexShrink: 0,
  },
  connector: {
    flex: 1,
    borderBottom: "1px dotted var(--text-muted)",
    margin: "0 16px",
    transition: "opacity 0.2s ease",
  },
  wordBadge: {
    fontSize: 12,
    color: "var(--text-muted)",
    fontVariantNumeric: "tabular-nums",
    background: "var(--bg-active)",
    padding: "2px 8px",
    borderRadius: "12px",
    flexShrink: 0,
  },
  synopsisContainer: {
    marginTop: 8,
    paddingRight: 24,
  },
  synopsisText: {
    fontSize: 13,
    color: "var(--text-secondary)",
    lineHeight: 1.6,
    margin: 0,
    fontStyle: "italic",
  },
  arrowIconContainer: {
    overflow: "hidden",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flexShrink: 0,
  },
  arrowIcon: {
    fontSize: 14,
    color: "var(--color-purple)",
    transition: "transform 0.2s ease",
  },
} satisfies Record<string, React.CSSProperties>;
