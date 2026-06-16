import { useState } from "react";
import { CloseIcon } from "../ui/icons";

interface ArrayItemCardProps {
  color: string;
  title: string;
  subtitle?: string;
  body?: string;
  tags?: string[];
  onEdit: () => void;
  onDelete: () => void;
}

export function ArrayItemCard({
  color,
  title,
  subtitle,
  body,
  tags,
  onEdit,
  onDelete,
}: ArrayItemCardProps) {
  const [hover, setHover] = useState(false);

  const actionButtonHoverColor = hover ? "var(--color-red)" : "var(--text-muted)";

  return (
    <div
      style={{
        ...styles.containerBase,
        border: `1px solid ${hover ? "var(--border-field)" : "var(--border)"}`,
        borderLeft: `3px solid ${color}`,
        background: hover ? "var(--bg-hover)" : "var(--bg-entry)",
        boxShadow: hover ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onEdit}
    >
      <div style={styles.contentContainer}>
        <div
          style={{
            ...styles.titleRow,
            marginBottom: body || (tags && tags.length) ? 6 : 0,
          }}
        >
          <span style={styles.titleText}>{title}</span>
          {subtitle && <span style={styles.subtitleText}>{subtitle}</span>}
        </div>
        {body && (
          <p style={styles.bodyText}>
            {body.length > 120 ? body.slice(0, 117) + "…" : body}
          </p>
        )}
        {tags && tags.length > 0 && (
          <div style={styles.tagsContainer}>
            {tags.map((tag, i) => (
              <span key={i} style={styles.tagText}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          ...styles.actionsContainer,
          opacity: hover ? 1 : 0,
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            ...styles.deleteButton,
            color: actionButtonHoverColor,
          }}
          title="Delete item"
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </button>
      </div>
    </div>
  );
}

const styles = {
  containerBase: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    transition: "background 0.1s, border 0.1s, box-shadow 0.1s",
    cursor: "pointer",
    borderRadius: "4px",
  },
  contentContainer: {
    flex: 1,
    padding: "12px 16px",
  },
  titleRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 10,
  },
  titleText: {
    fontSize: 14,
    color: "var(--text-primary)",
  },
  subtitleText: {
    fontSize: 11,
    color: "var(--text-muted)",
    letterSpacing: 0.5,
  },
  bodyText: {
    fontSize: 12,
    color: "var(--text-secondary)",
    margin: "0 0 4px",
    lineHeight: 1.55,
  },
  tagsContainer: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  tagText: {
    fontSize: 11,
    color: "var(--text-muted)",
    fontStyle: "italic",
  },
  actionsContainer: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    padding: "0 12px",
    transition: "opacity 0.15s",
  },
  deleteButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
  },
} satisfies Record<string, React.CSSProperties>;
