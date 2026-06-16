import React from "react";
import type { Event, Character } from "../../lib/types";

const EVENT_TYPE_COLORS: Record<string, string> = {
  Story: "var(--color-blue)",
  Trauma: "var(--color-red)",
  Revelation: "var(--color-primary)",
  Conflict: "var(--color-orange)",
  Bond: "var(--color-green)",
  Loss: "var(--color-red)",
  Growth: "var(--color-teal)",
  Mystery: "var(--color-dark)",
};

interface EventCardProps {
  event: Event;
  characters: Character[];
  onClick: () => void;
}

export function EventCard({ event: e, characters, onClick }: EventCardProps) {
  const typeColor = EVENT_TYPE_COLORS[e.type] || "var(--text-muted)";
  const presentChars = (e.characters || [])
    .map((id: string) => characters.find((c: Character) => c.id === id))
    .filter(Boolean) as Character[];

  const dateTag = [
    e.startDate && e.startDate.replace("T", " "),
    e.endDate && `→ ${e.endDate.replace("T", " ")}`,
  ]
    .filter(Boolean)
    .join(" ");

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget.querySelector(".event-card-inner") as HTMLElement;
    const node = e.currentTarget.querySelector(".event-node") as HTMLElement;
    const arrow = e.currentTarget.querySelector(".hover-arrow") as HTMLElement;
    if (card) {
      card.style.background = "var(--bg-hover)";
      card.style.borderColor = "var(--border)";
      card.style.transform = "translateY(-2px)";
      card.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
    }
    if (node) {
      node.style.boxShadow = `0 0 12px ${typeColor}88`;
      node.style.background = typeColor;
      node.style.color = "#000";
    }
    if (arrow) {
      arrow.style.opacity = "1";
      arrow.style.transform = "translateY(-50%) translateX(4px)";
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget.querySelector(".event-card-inner") as HTMLElement;
    const node = e.currentTarget.querySelector(".event-node") as HTMLElement;
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
      node.style.color = typeColor;
    }
    if (arrow) {
      arrow.style.opacity = "0";
      arrow.style.transform = "translateY(-50%)";
    }
  };

  const nodeStyle = {
    ...styles.node,
    border: `2.5px solid ${typeColor}`,
  };

  const typeBadgeStyle = {
    ...styles.typeBadge,
    color: typeColor,
    background: `${typeColor}15`,
    border: `1px solid ${typeColor}33`,
  };

  return (
    <div
      onClick={onClick}
      className="seshat-event-card-container"
      style={styles.container}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Time bubble (now an elegant minimal node ring) */}
      <div style={styles.timeCol}>
        <div className="event-node" style={nodeStyle} />
      </div>

      {/* Card body */}
      <div className="event-card-inner seshat-event-card-inner" style={styles.cardBody}>
        {/* Header Row */}
        <div className="seshat-event-card-header" style={styles.cardHeader}>
          <div className="seshat-event-card-title-wrapper" style={styles.titleWrapper}>
            <span style={styles.timeTag}>T{e.time}</span>
            <span style={styles.eventTitle}>
              {e.title || "Untitled event"}
            </span>
            <span style={typeBadgeStyle}>{e.type}</span>
          </div>

          {dateTag && (
            <span className="seshat-event-card-date" style={styles.dateBadge}>{dateTag}</span>
          )}
        </div>

        {/* Content Row */}
        {(e.subplot || e.description || e.consequence) && (
          <div style={styles.contentCol}>
            {e.subplot && (
              <div>
                <span style={styles.plotBadge}>Plot: {e.subplot}</span>
              </div>
            )}

            {e.description && (
              <p style={styles.descriptionText}>
                {e.description.length > 200
                  ? e.description.slice(0, 197) + "…"
                  : e.description}
              </p>
            )}

            {e.consequence && (
              <p
                style={{
                  ...styles.consequenceText,
                  borderLeft: `2.5px solid ${typeColor}`,
                }}
              >
                {e.consequence.length > 150
                  ? e.consequence.slice(0, 147) + "…"
                  : e.consequence}
              </p>
            )}
          </div>
        )}

        {/* Characters Row */}
        {presentChars.length > 0 && (
          <div style={styles.charactersRow}>
            {presentChars.map((c: Character) => (
              <span
                key={c.id}
                style={{
                  ...styles.characterTag,
                  color: c.color,
                  background: `${c.color}11`,
                  border: `1px solid ${c.color}33`,
                }}
              >
                <span
                  style={{
                    ...styles.characterTagDot,
                    background: c.color,
                  }}
                />
                {c.name}
              </span>
            ))}
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
    cursor: "pointer",
    position: "relative",
  },
  timeCol: {
    position: "relative",
    width: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  node: {
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: "var(--bg-app)",
    flexShrink: 0,
    zIndex: 1,
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    marginTop: 24,
    alignSelf: "flex-start",
  },
  timeTag: {
    fontFamily: "monospace",
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-secondary)",
    background: "var(--bg-hover)",
    border: "1px solid var(--border)",
    padding: "2px 6px",
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  cardBody: {
    position: "relative",
  },
  cardHeader: {},
  titleWrapper: {},
  eventTitle: {
    fontSize: "var(--text-sm)",
    fontWeight: 500,
    color: "var(--text-primary)",
    letterSpacing: 0.2,
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: "uppercase",
    padding: "3px 10px",
    borderRadius: "12px",
  },
  dateBadge: {},
  contentCol: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  plotBadge: {
    fontSize: 11,
    padding: "2px 6px",
    borderRadius: 4,
    background: "var(--bg-hover)",
    color: "var(--text-secondary)",
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 13,
    color: "var(--text-secondary)",
    lineHeight: 1.6,
    margin: 0,
  },
  consequenceText: {
    fontSize: 12.5,
    color: "var(--text-muted)",
    margin: "8px 0 0 0",
    fontStyle: "italic",
    paddingLeft: 12,
    lineHeight: 1.5,
  },
  charactersRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    marginTop: "auto",
    paddingTop: 8,
  },
  characterTag: {
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  characterTagDot: {
    width: 4,
    height: 4,
    borderRadius: "50%",
  },
  hoverArrow: {
    position: "absolute",
    right: 20,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 14,
    color: "var(--text-muted)",
    opacity: 0,
    transition: "opacity 0.2s, transform 0.2s",
  },
} satisfies Record<string, React.CSSProperties>;
