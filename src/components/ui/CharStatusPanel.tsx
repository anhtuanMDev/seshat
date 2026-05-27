import { S } from '../../lib/utils';

interface CharStatusPanelProps {
  char: any;
  events: any[];
}

export function CharStatusPanel({ char, events }: CharStatusPanelProps) {
  const sortedEvts = [...events].sort((a: any, b: any) => b.time - a.time);
  const latestEvent = sortedEvts.find((e: any) => (e.characters || []).includes(char.id));
  const currentAttr = latestEvent ? (char.attributes?.[latestEvent.id] || {}) : {};
  const activeConditions = (char.conditions || []).filter((cd: any) => cd.isActive);
  const equippedItems = (char.equipment || []).filter((eq: any) => (eq.accessState || "Equipped") === "Equipped");
  const cursedItems = equippedItems.filter((eq: any) => eq.curses && eq.curses.trim().length > 0);
  const achievements = (char.achievements || []);
  const losses = (char.losses || []);

  if (!latestEvent && !activeConditions.length && !equippedItems.length && !achievements.length && !losses.length) return null;

  const badgeStyle = (color: string) => ({
    display: "inline-block", padding: "2px 8px", borderRadius: 2, fontSize: 11,
    border: `1px solid ${color}`, color: color, marginRight: 6, marginBottom: 4, letterSpacing: 1,
  });

  return (
    <div style={{ background: "#f0ede8", padding: 16, borderRadius: 2, marginBottom: 24, borderLeft: `3px solid ${char.color}` }}>
      <p style={{ ...S.h2, marginBottom: 10, color: char.color }}>Current Status</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
        {currentAttr.power && <span style={badgeStyle("#2980b9")}>{currentAttr.power}</span>}
        {currentAttr.arcStage && <span style={badgeStyle("#8e44ad")}>{currentAttr.arcStage}</span>}
        {currentAttr.emotionalState && <span style={badgeStyle("#e67e22")}>{currentAttr.emotionalState}</span>}
        {currentAttr.physicalState && (
          <span style={badgeStyle(currentAttr.physicalState.toLowerCase().includes("injur") || currentAttr.physicalState.toLowerCase().includes("wound") ? "#c0392b" : "#27ae60")}>
            {currentAttr.physicalState}
          </span>
        )}
      </div>
      {latestEvent && (
        <p style={{ ...S.dim, marginBottom: 8 }}>Last seen at: <strong>T{latestEvent.time} — {latestEvent.title}</strong></p>
      )}
      {activeConditions.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <p style={{ ...S.dim, marginBottom: 4 }}>Active conditions:</p>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {activeConditions.map((cd: any) => (
              <span key={cd.id} style={badgeStyle(
                cd.type === "Cursed" ? "#8e44ad" : cd.type === "Wounded" || cd.type === "Physical" ? "#c0392b" :
                  cd.type === "Blessed" || cd.type === "Enhanced" ? "#27ae60" : "#e67e22"
              )}>
                {cd.name} [{cd.type}]
              </span>
            ))}
          </div>
        </div>
      )}
      {cursedItems.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <p style={{ ...S.dim, marginBottom: 4 }}>Cursed equipment:</p>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {cursedItems.map((eq: any) => (
              <span key={eq.id} style={badgeStyle("#8e44ad")}>⚠ {eq.name}</span>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 16 }}>
        {achievements.length > 0 && <p style={{ ...S.dim }}><strong>{achievements.length}</strong> achievement{achievements.length !== 1 ? "s" : ""}</p>}
        {losses.length > 0 && <p style={{ ...S.dim, color: "#c0392b" }}><strong>{losses.length}</strong> loss{losses.length !== 1 ? "es" : ""}</p>}
        {(char.skills || []).length > 0 && <p style={S.dim}><strong>{char.skills.length}</strong> skill{char.skills.length !== 1 ? "s" : ""}</p>}
        {equippedItems.length > 0 && <p style={S.dim}><strong>{equippedItems.length}</strong> equipped</p>}
      </div>
    </div>
  );
}