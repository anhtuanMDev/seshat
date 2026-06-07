import { useState } from "react";
import { useCharacters, useEvents } from "../hooks/useWorldStore";
import { S } from "../lib/utils";
import { SportsKabaddiIcon } from "../components/ui/icons";
import { scoreFighter } from "../lib/scoreFighter";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { FighterPicker } from "../components/fight/FighterPicker";
import { WinBar } from "../components/fight/WinBar";
import { SnapshotCard } from "../components/fight/SnapshotCard";
import { ScoreBreakdown } from "../components/fight/ScoreBreakdown";

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

  const rawA = ready ? resultA!.score : 0;
  const rawB = ready ? resultB!.score : 0;
  const minScore = Math.min(rawA, rawB);
  const shift = minScore <= 0 ? Math.abs(minScore) + 0.1 : 0;

  const total = ready ? rawA + shift + (rawB + shift) : 1;
  const pctA = ready ? Math.round(((rawA + shift) / total) * 100) : 50;
  const pctB = ready ? 100 - pctA : 50;

  const colA = charA?.color || "var(--color-blue)";
  const colB = charB?.color || "var(--color-red)";

  const ref = useAnimateIn();

  return (
    <div ref={ref} className="seshat-page-container">
      <div style={{ marginBottom: 24 }}>
        <p
          style={{
            fontSize: 22,
            fontFamily: "Georgia,serif",
            color: "var(--text-primary)",
            marginBottom: 4,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <SportsKabaddiIcon sx={{ fontSize: 20 }} />
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 1fr",
              gap: "0 24px",
              alignItems: "center",
              marginBottom: 28,
            }}
          >
            <FighterPicker
              label="Fighter A"
              charId={aId}
              onCharChange={setAId}
              eventId={aEventId}
              onEventChange={setAEventId}
              characters={chars}
              events={events}
              selectedChar={charA}
            />
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
            <FighterPicker
              label="Fighter B"
              charId={bId}
              onCharChange={setBId}
              eventId={bEventId}
              onEventChange={setBEventId}
              characters={chars}
              events={events}
              selectedChar={charB}
            />
          </div>

          {!ready && (
            <p style={S.dim}>Select two different characters to simulate.</p>
          )}

          {ready && (
            <>
              <WinBar
                pctA={pctA}
                pctB={pctB}
                colA={colA}
                colB={colB}
                nameA={charA!.name}
                nameB={charB!.name}
              />

              <div
                style={{ ...S.grid2, marginBottom: 20 }}
                className="seshat-grid2"
              >
                <SnapshotCard
                  color={colA}
                  event={resultA!.resolveEvent}
                  power={resultA!.attr.power}
                />
                <SnapshotCard
                  color={colB}
                  event={resultB!.resolveEvent}
                  power={resultB!.attr.power}
                />
              </div>

              <div style={S.grid2} className="seshat-grid2">
                <ScoreBreakdown
                  name={charA!.name}
                  color={colA}
                  score={resultA!.score}
                  notes={resultA!.notes}
                />
                <ScoreBreakdown
                  name={charB!.name}
                  color={colB}
                  score={resultB!.score}
                  notes={resultB!.notes}
                />
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
