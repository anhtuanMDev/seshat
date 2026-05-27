import type { Character, Event, Condition, Equipment } from "../../lib/types";

interface CharStatusPanelProps {
  char: Character;
  events: Event[];
}

export function CharStatusPanel({ char, events }: CharStatusPanelProps) {
  const sortedEvts = [...events].sort((a, b) => b.time - a.time);
  const latestEvent = sortedEvts.find((e) =>
    (e.characters || []).includes(char.id),
  );
  const currentAttr = latestEvent
    ? char.attributes?.[latestEvent.id] || {}
    : {};
  const activeConditions = (char.conditions || []).filter(
    (cd: Condition) => cd.isActive,
  );
  const equippedItems = (char.equipment || []).filter(
    (eq: Equipment) => (eq.accessState || "Equipped") === "Equipped",
  );
  const cursedItems = equippedItems.filter(
    (eq: Equipment) => eq.curses && eq.curses.trim().length > 0,
  );
  const achievements = char.achievements || [];
  const losses = char.losses || [];

  if (
    !latestEvent &&
    !activeConditions.length &&
    !equippedItems.length &&
    !achievements.length &&
    !losses.length
  )
    return null;

  const badgeStyle = (color: string) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 2,
    fontSize: 11,
    border: `1px solid ${color}`,
    color: color,
    marginRight: 6,
    marginBottom: 4,
    letterSpacing: 1,
  });

  const h2Style = {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase" as const,
    margin: "0 0 10px",
    fontWeight: 400,
    color: char.color,
  };

  const dimStyle = { color: "var(--text-dim)", fontSize: 12 };

  return (
    <div
      style={{
        background: "var(--bg-status)",
        padding: 16,
        borderRadius: 2,
        marginBottom: 24,
        borderLeft: `3px solid ${char.color}`,
      }}
    >
      <p style={h2Style}>Current Status</p>

      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}
      >
        {currentAttr.power && (
          <span style={badgeStyle("var(--color-blue)")}>
            {currentAttr.power}
          </span>
        )}
        {currentAttr.arcStage && (
          <span style={badgeStyle("var(--color-purple)")}>
            {currentAttr.arcStage}
          </span>
        )}
        {currentAttr.emotionalState && (
          <span style={badgeStyle("var(--color-orange)")}>
            {currentAttr.emotionalState}
          </span>
        )}
        {currentAttr.physicalState && (
          <span
            style={badgeStyle(
              currentAttr.physicalState.toLowerCase().includes("injur") ||
                currentAttr.physicalState.toLowerCase().includes("wound")
                ? "var(--color-red)"
                : "var(--color-green)",
            )}
          >
            {currentAttr.physicalState}
          </span>
        )}
      </div>

      {latestEvent && (
        <p style={{ ...dimStyle, marginBottom: 8 }}>
          Last seen at:{" "}
          <strong>
            T{latestEvent.time} — {latestEvent.title}
          </strong>
        </p>
      )}

      {activeConditions.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <p style={{ ...dimStyle, marginBottom: 4 }}>Active conditions:</p>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {activeConditions.map((cd) => (
              <span
                key={cd.id}
                style={badgeStyle(
                  cd.type === "Cursed"
                    ? "var(--color-purple)"
                    : cd.type === "Wounded" || cd.type === "Physical"
                      ? "var(--color-red)"
                      : cd.type === "Blessed" || cd.type === "Enhanced"
                        ? "var(--color-green)"
                        : "var(--color-orange)",
                )}
              >
                {cd.name} [{cd.type}]
              </span>
            ))}
          </div>
        </div>
      )}

      {cursedItems.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <p style={{ ...dimStyle, marginBottom: 4 }}>Cursed equipment:</p>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {cursedItems.map((eq) => (
              <span key={eq.id} style={badgeStyle("var(--color-purple)")}>
                ⚠ {eq.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 16 }}>
        {achievements.length > 0 && (
          <p style={dimStyle}>
            <strong>{achievements.length}</strong> achievement
            {achievements.length !== 1 ? "s" : ""}
          </p>
        )}
        {losses.length > 0 && (
          <p style={{ ...dimStyle, color: "var(--color-red)" }}>
            <strong>{losses.length}</strong> loss
            {losses.length !== 1 ? "es" : ""}
          </p>
        )}
        {(char.skills || []).length > 0 && (
          <p style={dimStyle}>
            <strong>{char.skills.length}</strong> skill
            {char.skills.length !== 1 ? "s" : ""}
          </p>
        )}
        {equippedItems.length > 0 && (
          <p style={dimStyle}>
            <strong>{equippedItems.length}</strong> equipped
          </p>
        )}
      </div>
    </div>
  );
}
