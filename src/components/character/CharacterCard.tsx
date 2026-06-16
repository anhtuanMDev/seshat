import React from "react";
import type { Character } from "../../lib/types";
import { StatPill } from "./StatPill";

interface CharacterCardProps {
  character: Character;
  onClick: () => void;
  selected: boolean;
  onToggleSelect: (e: React.MouseEvent) => void;
  isSelectionMode: boolean;
}

export function CharacterCard({
  character: c,
  onClick,
  selected,
  onToggleSelect,
  isSelectionMode,
}: CharacterCardProps) {
  const hasContent =
    c.role || c.archetype || c.coreWound || c.coreFear || c.coreDesire;
  const conditionCount = (c.conditions || []).filter(
    (cd) => cd.isActive,
  ).length;
  const skillCount = (c.skills || []).length;

  const charColor = c.color || "var(--border)";
  const initial = c.name ? c.name.charAt(0).toUpperCase() : "?";

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget.querySelector(".char-card-inner") as HTMLElement;
    const node = e.currentTarget.querySelector(".char-node") as HTMLElement;
    const arrow = e.currentTarget.querySelector(".hover-arrow") as HTMLElement;
    if (card) {
      card.style.background = "var(--bg-hover)";
      card.style.borderColor = "var(--border)";
      card.style.transform = "translateY(-1px)";
      card.style.boxShadow = "0 3px 8px rgba(0,0,0,0.1)";
    }
    if (node) {
      node.style.boxShadow = `0 0 10px ${charColor}88`;
      node.style.background = charColor;
      node.style.color = "#000";
    }
    if (arrow) {
      arrow.style.opacity = "1";
      arrow.style.transform = "translateY(-50%) translateX(2px)";
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget.querySelector(".char-card-inner") as HTMLElement;
    const node = e.currentTarget.querySelector(".char-node") as HTMLElement;
    const arrow = e.currentTarget.querySelector(".hover-arrow") as HTMLElement;
    if (card) {
      card.style.background = "var(--bg-entry)";
      card.style.borderColor = "transparent";
      card.style.transform = "translateY(0)";
      card.style.boxShadow = "none";
    }
    if (node) {
      node.style.boxShadow = "none";
      node.style.background = `var(--bg-app)`;
      node.style.color = charColor;
    }
    if (arrow) {
      arrow.style.opacity = "0";
      arrow.style.transform = "translateY(-50%)";
    }
  };

  const avatarStyle = {
    ...styles.avatar,
    border: `2px solid ${charColor}`,
    color: charColor,
  };

  const archetypeStyle = {
    ...styles.archetypeBadge,
    color: charColor,
    background: `${charColor}15`,
    border: `1px solid ${charColor}33`,
  };

  return (
    <div
      onClick={onClick}
      style={styles.container}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Checkbox */}
      {isSelectionMode && (
        <div onClick={onToggleSelect} style={styles.checkboxContainer}>
          <input
            type="checkbox"
            checked={selected}
            readOnly
            style={styles.checkbox}
          />
        </div>
      )}

      {/* Avatar Node */}
      <div style={styles.avatarWrapper}>
        <div className="char-node" style={avatarStyle}>
          <span style={styles.avatarInitial}>{initial}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="char-card-inner" style={styles.cardBody}>
        {/* Header Row */}
        <div style={styles.cardHeader}>
          <span style={styles.characterName}>
            {c.name || "Unnamed"}
          </span>
          {c.role && <span style={styles.roleText}>{c.role}</span>}
          {c.archetype && (
            <span style={archetypeStyle}>{c.archetype}</span>
          )}
        </div>

        {/* Content Section */}
        {hasContent && (
          <div style={styles.contentSection}>
            {c.coreWound && (
              <p style={styles.coreWoundText}>{c.coreWound}</p>
            )}

            {(c.coreFear || c.coreDesire) && (
              <div style={styles.fearDesireContainer}>
                {c.coreFear && (
                  <span style={styles.fearText}>
                    <span style={styles.fearIcon}>▲</span>
                    {c.coreFear}
                  </span>
                )}
                {c.coreDesire && (
                  <span style={styles.desireText}>
                    <span style={styles.desireIcon}>◆</span>
                    {c.coreDesire}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stat pills */}
        {(conditionCount > 0 ||
          skillCount > 0 ||
          (c.traumas || []).length > 0) && (
          <div style={styles.statPillsContainer}>
            {skillCount > 0 && (
              <StatPill
                label={`${skillCount} skill${skillCount !== 1 ? "s" : ""}`}
              />
            )}
            {conditionCount > 0 && (
              <StatPill
                label={`${conditionCount} condition${conditionCount !== 1 ? "s" : ""}`}
                color="var(--color-orange)"
              />
            )}
            {(c.traumas || []).length > 0 && (
              <StatPill
                label={`${c.traumas.length} trauma${c.traumas.length !== 1 ? "s" : ""}`}
                color="var(--color-red)"
              />
            )}
          </div>
        )}

        {/* Hover arrow indicator */}
        <span className="hover-arrow" style={styles.hoverArrow}>
          →
        </span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    gap: 16,
    cursor: "pointer",
    position: "relative",
    marginBottom: 12,
  },
  checkboxContainer: {
    width: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 17,
  },
  checkbox: {
    cursor: "pointer",
    width: 14,
    height: 14,
    accentColor: "var(--color-purple)",
  },
  avatarWrapper: {
    position: "relative",
    width: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    background: "var(--bg-app)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    zIndex: 1,
    transition: "all 0.2s ease",
    marginTop: 12,
    alignSelf: "flex-start",
  },
  avatarInitial: {
    fontSize: 12,
    fontWeight: 600,
    color: "inherit",
  },
  cardBody: {
    flex: 1,
    padding: "8px 12px",
    background: "var(--bg-entry)",
    borderRadius: "6px",
    border: "1px solid transparent",
    transition: "all 0.2s ease",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  characterName: {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--text-primary)",
    letterSpacing: 0.2,
  },
  roleText: {
    fontSize: 11,
    color: "var(--text-muted)",
    fontStyle: "italic",
  },
  archetypeBadge: {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: "uppercase",
    padding: "1px 6px",
    borderRadius: "10px",
    marginLeft: "auto",
  },
  contentSection: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  coreWoundText: {
    fontSize: 12,
    color: "var(--text-secondary)",
    lineHeight: 1.5,
    margin: 0,
  },
  fearDesireContainer: {
    display: "flex",
    gap: 16,
    marginTop: 4,
  },
  fearText: {
    fontSize: 11,
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  fearIcon: {
    color: "var(--color-red)",
    fontSize: 9,
  },
  desireText: {
    fontSize: 11,
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  desireIcon: {
    color: "var(--color-green)",
    fontSize: 9,
  },
  statPillsContainer: {
    display: "flex",
    gap: 6,
    marginTop: "auto",
    paddingTop: 4,
  },
  hoverArrow: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 12,
    color: "var(--text-muted)",
    opacity: 0,
    transition: "opacity 0.2s, transform 0.2s",
  },
} satisfies Record<string, React.CSSProperties>;
