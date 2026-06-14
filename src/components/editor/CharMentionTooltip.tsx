import type { Character, Event } from "../../lib/types";
import { resolveStatusAt, chapterContext } from "../../lib/resolveStatus";

interface CharMentionTooltipProps {
  char: Character;
  events: Event[];
  pinnedEvents: Event[];
  anchorEl: HTMLElement;
  onClose: () => void;
}

export default function CharMentionTooltip({
  char,
  events,
  pinnedEvents,
  onClose,
}: CharMentionTooltipProps) {
  // Resolve the character's status at the chapter's time context
  const { contextDate, contextWindowStart, contextEventTime } =
    chapterContext(pinnedEvents);
  const status = resolveStatusAt(
    char,
    events,
    contextDate,
    contextEventTime,
    contextWindowStart,
  );

  // Events this character is present in, sorted by time
  const charEvents = events
    .filter((e) => (e.characters || []).includes(char.id))
    .sort((a, b) => a.time - b.time);

  return (
    <div
      style={{
        position: "fixed",
        background: "var(--bg-side)",
        border: "1px solid var(--border)",
        borderRadius: 4,
        padding: "14px 16px",
        boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
        zIndex: 1000,
        maxWidth: 280,
        pointerEvents: "auto",
      }}
    >
      {/* Header */}
      <div
        className="seshat-flex-align"
        style={{
          gap: "var(--space-2)",
          marginBottom: "var(--space-3)",
          paddingBottom: "var(--space-2)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: char.color,
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        <div>
          <div
            style={{
              fontSize: 14,
              color: "var(--text-primary)",
              fontWeight: 400,
            }}
          >
            {char.name}
          </div>
          {char.role && (
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontStyle: "italic",
              }}
            >
              {char.role}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            padding: "2px 4px",
            marginLeft: "auto",
            fontSize: 14,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Status at chapter time */}
      {status && (
        <div
          style={{
            marginBottom: 10,
            padding: "8px 10px",
            background: "var(--bg-status)",
            borderLeft: `2px solid ${char.color}`,
            borderRadius: "0 2px 2px 0",
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 5,
            }}
          >
            {contextDate || contextEventTime != null
              ? "Status at this point"
              : "Latest status"}
          </div>
          {status.power && (
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginBottom: 2,
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>power: </span>
              {status.power}
              {status.arcStage && (
                <span style={{ color: "var(--text-muted)" }}>
                  {" · "}
                  {status.arcStage}
                </span>
              )}
            </div>
          )}
          {status.emotionalState && (
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginBottom: 2,
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>feeling: </span>
              {status.emotionalState}
            </div>
          )}
          {status.physicalState && (
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginBottom: 2,
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>physical: </span>
              {status.physicalState}
            </div>
          )}
          {status.note && (
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontStyle: "italic",
                marginTop: 4,
              }}
            >
              {status.note}
            </div>
          )}
        </div>
      )}

      {/* Psych quick-ref */}
      {(char.coreWound || char.coreFear || char.coreDesire) && (
        <div style={{ marginBottom: 10 }}>
          {char.coreWound && (
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginBottom: 3,
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>wound: </span>
              {char.coreWound.length > 80
                ? char.coreWound.slice(0, 77) + "…"
                : char.coreWound}
            </div>
          )}
          {char.coreFear && (
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginBottom: 3,
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>fear: </span>
              {char.coreFear}
            </div>
          )}
          {char.coreDesire && (
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--text-muted)" }}>wants: </span>
              {char.coreDesire}
            </div>
          )}
        </div>
      )}

      {/* Events this character appears in */}
      {charEvents.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 5,
            }}
          >
            Timeline ({charEvents.length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)" }}>
            {charEvents.slice(0, 6).map((e) => (
              <span
                key={e.id}
                style={{
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                  padding: "1px 6px",
                  borderRadius: 2,
                }}
              >
                T{e.time}
              </span>
            ))}
            {charEvents.length > 6 && (
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                +{charEvents.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
