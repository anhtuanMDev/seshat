import { useMemo } from "react";
import { S } from "../../lib/utils";
import { ShieldIcon, WarningIcon, CheckCircleIcon } from "../ui/icons";
import type { Character } from "../../lib/types";

interface Props {
  text: string;
  characters: Character[];
  pinnedCharIds: string[];
}

export function ContinuityTracker({ text, characters, pinnedCharIds }: Props) {
  // Find which characters are explicitly pinned OR mentioned in the text
  const activeCharacters = useMemo(() => {
    return characters.filter(c => {
      if (pinnedCharIds.includes(c.id)) return true;
      // Also check if they are @mentioned in the HTML or their name appears
      if (text.includes(`data-mention-id="${c.id}"`)) return true;
      // Simple text match as fallback
      if (text.includes(c.name)) return true;
      return false;
    });
  }, [characters, pinnedCharIds, text]);

  // Extract all continuity constraints (Traumas, Core Wounds, Rules)
  const constraints = useMemo(() => {
    const list: Array<{
      charId: string;
      charName: string;
      type: "Wound" | "Trauma";
      description: string;
    }> = [];

    activeCharacters.forEach(c => {
      if (c.coreWound && c.coreWound.trim().length > 0) {
        list.push({
          charId: c.id,
          charName: c.name,
          type: "Wound",
          description: c.coreWound,
        });
      }
      
      if (c.traumas && c.traumas.length > 0) {
        c.traumas.forEach(t => {
          list.push({
            charId: c.id,
            charName: c.name,
            type: "Trauma",
            description: t.description,
          });
        });
      }
    });

    return list;
  }, [activeCharacters]);

  if (activeCharacters.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
        <ShieldIcon sx={{ fontSize: 32, opacity: 0.5, marginBottom: 8 }} />
        <p style={{ margin: 0 }}>No characters pinned or mentioned.</p>
        <p style={{ fontSize: 11, marginTop: 4 }}>Tag a character to see their continuity rules.</p>
      </div>
    );
  }

  if (constraints.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: "center", color: "var(--color-green)", fontSize: 13 }}>
        <CheckCircleIcon sx={{ fontSize: 32, opacity: 0.8, marginBottom: 8 }} />
        <p style={{ margin: 0 }}>No active constraints.</p>
        <p style={{ fontSize: 11, marginTop: 4, color: "var(--text-muted)" }}>The present characters have no unresolved traumas or wounds to track.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <div style={{ paddingBottom: 16, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 14, display: "flex", alignItems: "center", gap: 6, color: "var(--text-primary)" }}>
          <ShieldIcon sx={{ fontSize: 16, color: "var(--color-orange)" }} /> Active Constraints
        </h3>
      </div>
      
      <p style={{ ...S.dim, fontSize: 12, margin: "12px 0" }}>
        Ensure your current scene doesn't violate these rules for the characters involved:
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {constraints.map((c, i) => (
          <div key={`${c.charId}-${i}`} style={{ background: "rgba(255, 152, 0, 0.05)", borderLeft: "2px solid var(--color-orange)", padding: "8px 12px", borderRadius: "0 4px 4px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <WarningIcon sx={{ fontSize: 12, color: "var(--color-orange)" }} />
              <strong style={{ fontSize: 12, color: "var(--text-primary)" }}>{c.charName}</strong>
              <span style={{ fontSize: 10, background: "var(--bg-active)", padding: "2px 6px", borderRadius: 10, color: "var(--text-secondary)" }}>
                {c.type}
              </span>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4 }}>
              {c.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
