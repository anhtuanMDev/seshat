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
  const { contextDate, contextWindowStart, contextEventTime } =
    chapterContext(pinnedEvents);
  const status = resolveStatusAt(
    char,
    events,
    contextDate,
    contextEventTime,
    contextWindowStart,
  );

  const activeRole = (status && status.role) || char.role;
  const activeGender = (status && status.gender) || char.gender;
  const activeDob = (status && status.dob) || char.dob;
  const activeAppearance = (status && status.appearance) || char.appearance;

  const charEvents = events
    .filter((e) => (e.characters || []).includes(char.id))
    .sort((a, b) => a.time - b.time);

  return (
    <div style={styles.tooltipContainer}>
      {/* Header */}
      <div style={styles.headerRow}>
        <span
          style={{
            ...styles.colorIndicator,
            background: char.color,
          }}
        />
        <div>
          <div style={styles.nameText}>{char.name}</div>
          {activeRole && <div style={styles.roleText}>{activeRole}</div>}
        </div>
        <button onClick={onClose} style={styles.closeBtn}>
          ×
        </button>
      </div>

      {/* Status at chapter time */}
      {status && (
        <div
          style={{
            ...styles.statusBox,
            borderLeft: `2px solid ${char.color}`,
          }}
        >
          <div style={styles.statusSectionLabel}>
            {contextDate || contextEventTime != null
              ? "Status at this point"
              : "Latest status"}
          </div>
          {status.power && (
            <div style={styles.statusItem}>
              <span style={styles.textMuted}>power: </span>
              {status.power}
              {status.arcStage && (
                <span style={styles.textMuted}>
                  {" · "}
                  {status.arcStage}
                </span>
              )}
            </div>
          )}
          {status.emotionalState && (
            <div style={styles.statusItem}>
              <span style={styles.textMuted}>feeling: </span>
              {status.emotionalState}
            </div>
          )}
          {status.physicalState && (
            <div style={styles.statusItem}>
              <span style={styles.textMuted}>physical: </span>
              {status.physicalState}
            </div>
          )}
          {activeGender && (
            <div style={styles.statusItem}>
              <span style={styles.textMuted}>gender: </span>
              {activeGender}
            </div>
          )}
          {activeDob && (
            <div style={styles.statusItem}>
              <span style={styles.textMuted}>dob: </span>
              {activeDob}
            </div>
          )}
          {activeAppearance && (
            <div style={styles.statusItem}>
              <span style={styles.textMuted}>looks: </span>
              {activeAppearance.length > 80
                ? activeAppearance.slice(0, 77) + "…"
                : activeAppearance}
            </div>
          )}
          {status.note && (
            <div style={styles.statusNoteText}>
              {status.note}
            </div>
          )}
        </div>
      )}

      {/* Psych quick-ref */}
      {(char.coreWound || char.coreFear || char.coreDesire) && (
        <div style={styles.psychSection}>
          {char.coreWound && (
            <div style={styles.psychItem}>
              <span style={styles.textMuted}>wound: </span>
              {char.coreWound.length > 80
                ? char.coreWound.slice(0, 77) + "…"
                : char.coreWound}
            </div>
          )}
          {char.coreFear && (
            <div style={styles.psychItem}>
              <span style={styles.textMuted}>fear: </span>
              {char.coreFear}
            </div>
          )}
          {char.coreDesire && (
            <div style={styles.psychWants}>
              <span style={styles.textMuted}>wants: </span>
              {char.coreDesire}
            </div>
          )}
        </div>
      )}

      {/* Events this character appears in */}
      {charEvents.length > 0 && (
        <div>
          <div style={styles.timelineHeader}>
            Timeline ({charEvents.length})
          </div>
          <div style={styles.timelineList}>
            {charEvents.slice(0, 6).map((e) => (
              <span key={e.id} style={styles.timelineBadge}>
                T{e.time}
              </span>
            ))}
            {charEvents.length > 6 && (
              <span style={styles.timelineMoreText}>
                +{charEvents.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  tooltipContainer: {
    position: "fixed",
    background: "var(--bg-side)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    padding: "14px 16px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
    zIndex: 1000,
    maxWidth: 280,
    pointerEvents: "auto",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: "1px solid var(--border)",
  },
  colorIndicator: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    display: "inline-block",
    flexShrink: 0,
  },
  nameText: {
    fontSize: 14,
    color: "var(--text-primary)",
    fontWeight: 400,
  },
  roleText: {
    fontSize: 11,
    color: "var(--text-muted)",
    fontStyle: "italic",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--text-muted)",
    padding: "2px 4px",
    marginLeft: "auto",
    fontSize: 14,
    lineHeight: 1,
  },
  statusBox: {
    marginBottom: 10,
    padding: "8px 10px",
    background: "var(--bg-status)",
    borderRadius: "0 2px 2px 0",
  },
  statusSectionLabel: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "var(--text-muted)",
    marginBottom: 5,
  },
  statusItem: {
    fontSize: 12,
    color: "var(--text-secondary)",
    marginBottom: 2,
  },
  textMuted: {
    color: "var(--text-muted)",
  },
  statusNoteText: {
    fontSize: 11,
    color: "var(--text-muted)",
    fontStyle: "italic",
    marginTop: 4,
  },
  psychSection: {
    marginBottom: 10,
  },
  psychItem: {
    fontSize: 12,
    color: "var(--text-secondary)",
    marginBottom: 3,
  },
  psychWants: {
    fontSize: 12,
    color: "var(--text-secondary)",
  },
  timelineHeader: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "var(--text-muted)",
    marginBottom: 5,
  },
  timelineList: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
  },
  timelineBadge: {
    fontSize: 11,
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
    padding: "1px 6px",
    borderRadius: 2,
  },
  timelineMoreText: {
    fontSize: 11,
    color: "var(--text-muted)",
  },
} satisfies Record<string, React.CSSProperties>;
