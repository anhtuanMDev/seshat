import React, { useState } from "react";
import type { Foreshadow, Chapter } from "../../lib/types";
import { IconButton } from "@mui/material";
import { CloseIcon } from "../ui/icons";

interface ForeshadowItemProps {
  f: Foreshadow;
  chapters: Chapter[];
  onEdit: () => void;
  onDelete: () => void;
}

export function ForeshadowItem({
  f,
  chapters,
  onEdit,
  onDelete,
}: ForeshadowItemProps) {
  const [hovered, setHovered] = useState(false);

  const plantChapter = chapters.find((c) => c.id === f.plantChapterId);
  const payoffChapter = chapters.find((c) => c.id === f.payoffChapterId);

  const plantLabel = plantChapter
    ? plantChapter.title || `Ch. ${plantChapter.number || "?"}`
    : "None";
  const payoffLabel = payoffChapter
    ? payoffChapter.title || `Ch. ${payoffChapter.number || "?"}`
    : "None";

  // Define semantic status properties
  let statusTheme = {
    color: "var(--text-muted)",
    bg: "rgba(113, 113, 122, 0.08)",
    border: "rgba(113, 113, 122, 0.2)",
    glow: "rgba(113, 113, 122, 0.05)",
  };

  if (f.status === "Planted") {
    statusTheme = {
      color: "#3b82f6", // Royal blue
      bg: "rgba(59, 130, 246, 0.08)",
      border: "rgba(59, 130, 246, 0.3)",
      glow: "rgba(59, 130, 246, 0.12)",
    };
  } else if (f.status === "Payoffed") {
    statusTheme = {
      color: "#10b981", // Emerald
      bg: "rgba(16, 185, 129, 0.08)",
      border: "rgba(16, 185, 129, 0.3)",
      glow: "rgba(16, 185, 129, 0.12)",
    };
  } else if (f.status === "Abandoned") {
    statusTheme = {
      color: "#71717a", // Zinc / grey
      bg: "rgba(113, 113, 122, 0.08)",
      border: "rgba(113, 113, 122, 0.2)",
      glow: "rgba(113, 113, 122, 0.02)",
    };
  }

  const cardStyle = {
    ...styles.card,
    transform: hovered ? "translateY(-2px)" : "translateY(0)",
    borderColor: hovered ? statusTheme.color : "var(--border)",
    boxShadow: hovered
      ? `0 6px 20px -5px ${statusTheme.glow}, 0 0 0 1px ${statusTheme.border}`
      : "0 2px 8px rgba(0, 0, 0, 0.12)",
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header with status badge & quick actions */}
      <div style={styles.header}>
        <span
          style={{
            ...styles.statusBadge,
            color: statusTheme.color,
            background: statusTheme.bg,
            border: `1px solid ${statusTheme.border}`,
          }}
        >
          <span
            style={{
              ...styles.statusDot,
              background: statusTheme.color,
              boxShadow: `0 0 6px ${statusTheme.color}`,
            }}
          />
          {f.status}
        </span>

        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          size="small"
          style={{
            ...styles.deleteBtn,
            opacity: hovered ? 1 : 0.4,
          }}
        >
          <CloseIcon sx={{ fontSize: 13 }} />
        </IconButton>
      </div>

      {/* Main content click trigger */}
      <div onClick={onEdit} style={styles.clickableContent}>
        {/* Description body */}
        <p style={styles.description}>
          {f.description.trim() ? (
            f.description
          ) : (
            <span style={styles.placeholder}>(No description yet)</span>
          )}
        </p>

        {/* Visual path connectors */}
        <div style={styles.connectionFooter}>
          <div style={styles.chapterTag}>
            {/* Plant seedling icon */}
            <svg
              style={styles.tagIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 22V12M12 12c-2.5 0-6-1.5-6-5s3.5-3 6 0c2.5-3 6-3.5 6 0s-3.5 5-6 5z" />
            </svg>
            <span style={styles.tagLabel}>Plant:</span> {plantLabel}
          </div>

          <span style={styles.connectorArrow}>→</span>

          <div style={styles.chapterTag}>
            {/* Harvest star icon */}
            <svg
              style={styles.tagIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span style={styles.tagLabel}>Payoff:</span> {payoffLabel}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "rgba(255, 255, 255, 0.02)",
    backdropFilter: "blur(12px)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    padding: "2px 8px",
    borderRadius: "12px",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
  },
  deleteBtn: {
    color: "var(--text-muted)",
    padding: "2px",
    transition: "all 0.2s ease",
  },
  clickableContent: {
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  description: {
    fontSize: 13,
    color: "var(--text-primary)",
    lineHeight: 1.55,
    margin: 0,
    wordBreak: "break-word",
    letterSpacing: 0.15,
  },
  placeholder: {
    color: "var(--text-muted)",
    fontStyle: "italic",
  },
  connectionFooter: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 2,
  },
  chapterTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    background: "rgba(255, 255, 255, 0.03)",
    padding: "3px 8px",
    borderRadius: "6px",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    fontSize: 11,
    color: "var(--text-secondary)",
    letterSpacing: 0.1,
  },
  tagLabel: {
    color: "var(--text-muted)",
    fontWeight: 500,
  },
  tagIcon: {
    width: 11,
    height: 11,
    color: "var(--text-muted)",
  },
  connectorArrow: {
    color: "var(--text-muted)",
    fontSize: 12,
  },
} satisfies Record<string, React.CSSProperties>;
