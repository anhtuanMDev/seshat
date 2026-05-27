import { useState } from "react";
import { useCharacters, useEvents } from "../hooks/useWorldStore";
import { S } from "../lib/utils";
import { EventPicker } from "../components/ui";
import { useAnimateIn } from "../hooks/useAnimateIn";
import type { Character, Event, Equipment, Condition } from "../lib/types";

interface Note {
  label: string;
  value: string;
  pts: number;
  positive: boolean;
  neutral?: boolean;
}

const POWER_SCORE: Record<string, number> = {
  Latent: 1,
  Awakening: 2,
  Capable: 3,
  Skilled: 4,
  Elite: 5,
  Peak: 6,
  Transcendent: 7,
};
const COND_PENALTY: Record<string, number> = {
  Physical: -1,
  Wounded: -1.5,
  Mental: -0.5,
  Cursed: -0.5,
  Spiritual: 0,
  Social: 0,
  Blessed: 1,
  Enhanced: 1,
};

function scoreFighter(char: Character, events: Event[], atEventId?: string) {
  let score = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notes: any[] = [];

  const resolveEvent = atEventId
    ? events.find((e) => e.id === atEventId)
    : [...events]
        .sort((a, b) => b.time - a.time)
        .find((e) => (e.characters || []).includes(char.id));
  const attr = resolveEvent ? char.attributes?.[resolveEvent.id] || {} : {};

  const powerTier = attr.power || "";
  const powerPts = POWER_SCORE[powerTier] || 0;
  if (powerPts) {
    score += powerPts * 3;
    notes.push({
      label: "Power tier",
      value: powerTier,
      pts: powerPts * 3,
      positive: true,
    });
  }

  const skills = char.skills || [];
  const skillPts = skills.length * 1.2;
  if (skillPts) {
    score += skillPts;
    notes.push({
      label: "Skills",
      value: `${skills.length} known`,
      pts: Math.round(skillPts * 10) / 10,
      positive: true,
    });
  }

  const equippedItems = (char.equipment || []).filter(
    (eq: Equipment) => (eq.accessState || "Equipped") === "Equipped",
  );
  const storedItems = (char.equipment || []).filter(
    (eq: Equipment) => (eq.accessState || "Equipped") === "Stored",
  );
  const noAccessItems = (char.equipment || []).filter(
    (eq: Equipment) => (eq.accessState || "Equipped") === "No Access",
  );
  const cursedEquipped = equippedItems.filter(
    (eq: Equipment) => eq.curses && eq.curses.trim(),
  );
  const equipPts = equippedItems.length * 1.0 - cursedEquipped.length * 0.5;
  if (equippedItems.length) {
    score += equipPts;
    notes.push({
      label: "Equipped items",
      value: `${equippedItems.length} on body${cursedEquipped.length ? `, ${cursedEquipped.length} cursed` : ""}`,
      pts: Math.round(equipPts * 10) / 10,
      positive: equipPts >= 0,
    });
  }
  if (noAccessItems.length)
    notes.push({
      label: "No access items",
      value: `${noAccessItems.length} unavailable`,
      pts: 0,
      positive: false,
      neutral: true,
    });
  if (storedItems.length)
    notes.push({
      label: "Stored items",
      value: `${storedItems.length} not worn`,
      pts: 0,
      positive: false,
      neutral: true,
    });

  const activeConditions = (char.conditions || []).filter(
    (cd: Condition) => cd.isActive,
  );
  for (const cd of activeConditions) {
    const pen = COND_PENALTY[cd.type] ?? 0;
    if (pen !== 0) {
      score += pen;
      notes.push({
        label: `Condition: ${cd.name}`,
        value: `[${cd.type}]`,
        pts: pen,
        positive: pen > 0,
      });
    }
  }

  const achievePts = (char.achievements || []).length * 0.3;
  const lossPts = (char.losses || []).length * -0.15;
  if (achievePts) {
    score += achievePts;
    notes.push({
      label: "Achievements",
      value: `${char.achievements.length}`,
      pts: Math.round(achievePts * 10) / 10,
      positive: true,
    });
  }
  if (lossPts) {
    score += lossPts;
    notes.push({
      label: "Losses",
      value: `${char.losses.length}`,
      pts: Math.round(lossPts * 10) / 10,
      positive: false,
    });
  }

  const ARC_MOD: Record<string, number> = {
    Unaware: 0,
    Questioning: 0.2,
    Resisting: 0.5,
    Breaking: 1,
    Transforming: 1.5,
    Integrated: 2,
  };
  const arcMod = (attr.arcStage ? ARC_MOD[attr.arcStage] : undefined) ?? 0;
  if (arcMod) {
    score += arcMod;
    notes.push({
      label: "Arc stage",
      value: attr.arcStage,
      pts: arcMod,
      positive: true,
    });
  }

  const emo = (attr.emotionalState || "").toLowerCase();
  if (
    emo.includes("grief") ||
    emo.includes("broken") ||
    emo.includes("despair")
  ) {
    score -= 1;
    notes.push({
      label: "Emotional state",
      value: attr.emotionalState,
      pts: -1,
      positive: false,
    });
  } else if (
    emo.includes("resolute") ||
    emo.includes("focused") ||
    emo.includes("calm")
  ) {
    score += 0.5;
    notes.push({
      label: "Emotional state",
      value: attr.emotionalState,
      pts: 0.5,
      positive: true,
    });
  } else if (emo.includes("rage") || emo.includes("fury")) {
    score += 0.3;
    notes.push({
      label: "Emotional state",
      value: attr.emotionalState,
      pts: 0.3,
      positive: true,
    });
  }

  return { score: Math.max(0.1, score), notes, attr, resolveEvent };
}

export default function FightPage() {
  const chars = useCharacters();
  const events = useEvents();
  const [aId, setAId] = useState(chars[0]?.id || "");
  const [bId, setBId] = useState(chars[1]?.id || "");
  const [aEventId, setAEventId] = useState("");
  const [bEventId, setBEventId] = useState("");

  const charA = chars.find((c) => c.id === aId);
  const charB = chars.find((c) => c.id === bId);

  const ready = charA && charB && charA.id !== charB.id;
  const resultA = ready ? scoreFighter(charA, events, aEventId) : null;
  const resultB = ready ? scoreFighter(charB, events, bEventId) : null;

  const total = ready ? resultA!.score + resultB!.score : 1;
  const pctA = ready ? Math.round((resultA!.score / total) * 100) : 50;
  const pctB = ready ? 100 - pctA : 50;

  const colA = charA?.color || "var(--color-blue)";
  const colB = charB?.color || "var(--color-red)";

  const ref = useAnimateIn();

  const NoteRow = ({ n }: { n: Note }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "3px 0",
        borderBottom: "1px solid var(--border)",
        fontSize: 12,
      }}
    >
      <span style={{ color: "var(--text-secondary)" }}>
        {n.label}:{" "}
        <span style={{ color: "var(--text-primary)" }}>{n.value}</span>
      </span>
      {!n.neutral && (
        <span
          style={{
            color: n.positive ? "var(--color-green)" : "var(--color-red)",
            fontWeight: 500,
            minWidth: 40,
            textAlign: "right",
          }}
        >
          {n.pts > 0 ? "+" : ""}
          {n.pts}
        </span>
      )}
      {n.neutral && (
        <span
          style={{
            color: "var(--text-muted)",
            fontSize: 11,
            minWidth: 40,
            textAlign: "right",
          }}
        >
          info
        </span>
      )}
    </div>
  );

  return (
    <div ref={ref}>
      <div style={{ marginBottom: 24 }}>
        <p
          style={{
            fontSize: 22,
            fontFamily: "Georgia,serif",
            color: "var(--text-primary)",
            marginBottom: 4,
          }}
        >
          Fight Simulation
        </p>
        <p style={S.dim}>
          Compare two characters at any point in the timeline. Win % is
          calculated from power tier, skills, equipped items, conditions, arc
          stage, and emotional state.
        </p>
      </div>

      {chars.length < 2 && (
        <p style={{ ...S.dim, fontStyle: "italic" }}>
          Add at least two characters to use the fight simulator.
        </p>
      )}

      {chars.length >= 2 && (
        <>
          {/* ── Fighter pickers ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 1fr",
              gap: "0 24px",
              alignItems: "center",
              marginBottom: 28,
            }}
          >
            <div>
              <label style={S.label}>Fighter A</label>
              <select
                value={aId}
                onChange={(e) => setAId(e.target.value)}
                style={{ ...S.select }}
              >
                <option value="">— select —</option>
                {chars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {charA && (
                <div style={{ marginTop: 8 }}>
                  <EventPicker
                    label="At timeline point"
                    value={aEventId}
                    onChange={setAEventId}
                    events={events.filter((e) =>
                      (e.characters || []).includes(charA.id),
                    )}
                  />
                </div>
              )}
            </div>
            <div
              style={{
                textAlign: "center",
                paddingTop: 20,
                fontSize: 16,
                color: "var(--text-muted)",
                letterSpacing: 2,
              }}
            >
              vs
            </div>
            <div>
              <label style={S.label}>Fighter B</label>
              <select
                value={bId}
                onChange={(e) => setBId(e.target.value)}
                style={{ ...S.select }}
              >
                <option value="">— select —</option>
                {chars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {charB && (
                <div style={{ marginTop: 8 }}>
                  <EventPicker
                    label="At timeline point"
                    value={bEventId}
                    onChange={setBEventId}
                    events={events.filter((e) =>
                      (e.characters || []).includes(charB.id),
                    )}
                  />
                </div>
              )}
            </div>
          </div>

          {!ready && (
            <p style={S.dim}>Select two different characters to simulate.</p>
          )}

          {ready && (
            <>
              {/* ── Win bar ── */}
              <div style={{ marginBottom: 28 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 13, color: colA, fontWeight: 500 }}>
                    {charA!.name} — {pctA}%
                  </span>
                  <span style={{ fontSize: 13, color: colB, fontWeight: 500 }}>
                    {pctB}% — {charB!.name}
                  </span>
                </div>
                <div
                  style={{
                    height: 24,
                    borderRadius: 2,
                    overflow: "hidden",
                    display: "flex",
                    background: "var(--bg-active)",
                  }}
                >
                  <div
                    style={{
                      width: `${pctA}%`,
                      background: colA,
                      transition: "width 0.4s",
                    }}
                  />
                  <div
                    style={{
                      width: `${pctB}%`,
                      background: colB,
                      transition: "width 0.4s",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: 8,
                  }}
                >
                  {pctA === pctB ? (
                    <span style={{ ...S.dim, fontSize: 13 }}>Even match</span>
                  ) : (
                    <span
                      style={{
                        fontSize: 13,
                        color: pctA > pctB ? colA : colB,
                        fontWeight: 500,
                      }}
                    >
                      {pctA > pctB ? charA!.name : charB!.name} has the edge (
                      {Math.abs(pctA - pctB)}% margin)
                    </span>
                  )}
                </div>
              </div>

              {/* ── Snapshot context ── */}
              <div style={{ ...S.grid2, marginBottom: 20 }}>
                <div
                  style={{
                    padding: "8px 12px",
                    background: "var(--bg-status)",
                    borderRadius: 2,
                    borderLeft: `3px solid ${colA}`,
                  }}
                >
                  <p style={{ ...S.dim, marginBottom: 4 }}>Snapshot</p>
                  <p style={{ fontSize: 12, color: "var(--text-primary)" }}>
                    {resultA!.resolveEvent
                      ? `T${resultA!.resolveEvent.time} — ${resultA!.resolveEvent.title}`
                      : "No timeline data"}
                  </p>
                  {resultA!.attr.power && (
                    <p style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                      Power: {resultA!.attr.power}
                    </p>
                  )}
                </div>
                <div
                  style={{
                    padding: "8px 12px",
                    background: "var(--bg-status)",
                    borderRadius: 2,
                    borderLeft: `3px solid ${colB}`,
                  }}
                >
                  <p style={{ ...S.dim, marginBottom: 4 }}>Snapshot</p>
                  <p style={{ fontSize: 12, color: "var(--text-primary)" }}>
                    {resultB!.resolveEvent
                      ? `T${resultB!.resolveEvent.time} — ${resultB!.resolveEvent.title}`
                      : "No timeline data"}
                  </p>
                  {resultB!.attr.power && (
                    <p style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                      Power: {resultB!.attr.power}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Score breakdowns ── */}
              <div style={S.grid2}>
                <div>
                  <p style={{ ...S.h2, color: colA, marginBottom: 8 }}>
                    {charA!.name} — score:{" "}
                    {Math.round(resultA!.score * 10) / 10}
                  </p>
                  {resultA!.notes.map((n, i) => (
                    <NoteRow key={i} n={n} />
                  ))}
                  {!resultA!.notes.length && (
                    <p style={S.dim}>No data found.</p>
                  )}
                </div>
                <div>
                  <p style={{ ...S.h2, color: colB, marginBottom: 8 }}>
                    {charB!.name} — score:{" "}
                    {Math.round(resultB!.score * 10) / 10}
                  </p>
                  {resultB!.notes.map((n, i) => (
                    <NoteRow key={i} n={n} />
                  ))}
                  {!resultB!.notes.length && (
                    <p style={S.dim}>No data found.</p>
                  )}
                </div>
              </div>

              <hr style={{ ...S.rule, margin: "24px 0 12px" }} />
              <p style={{ ...S.dim, fontSize: 11 }}>
                Scoring: power tier (×3), skills (×1.2 each), equipped items
                (×1, −0.5 per cursed), conditions (varies by type), arc stage
                (0–2), emotional state (±0.3–1.5), achievements (+0.3 each),
                losses (−0.15 each). Items not equipped or inaccessible do not
                contribute to combat score.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
