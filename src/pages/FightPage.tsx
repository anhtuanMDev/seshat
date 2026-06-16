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
    <div ref={ref} className="seshat-page-container" data-testid="fight-page-container">
      <div style={styles.headerWrapper}>
        <h1 style={styles.title}>
          <SportsKabaddiIcon sx={styles.titleIcon} />
          Fight Simulation
        </h1>
        <p style={styles.subtitle}>
          Compare two characters at any point in the timeline. Win % is
          calculated from power tier, skills, equipped items, conditions, arc
          stage, and emotional state.
        </p>
      </div>

      {chars.length < 2 && (
        <p style={styles.emptyText}>
          Add at least two characters to use the fight simulator.
        </p>
      )}

      {chars.length >= 2 && (
        <>
          <div data-testid="fighter-picker-grid" style={styles.pickerGrid}>
            <div data-testid="fighter-a-container">
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
            </div>
            <div style={styles.vsDivider}>
              vs
            </div>
            <div data-testid="fighter-b-container">
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
          </div>

          {!ready && (
            <p style={styles.selectPrompt}>Select two different characters to simulate.</p>
          )}

          {ready && (
            <div data-testid="fight-results-container">
              <WinBar
                pctA={pctA}
                pctB={pctB}
                colA={colA}
                colB={colB}
                nameA={charA!.name}
                nameB={charB!.name}
              />

              <div
                style={styles.snapshotGrid}
                className="seshat-grid2"
                data-testid="snapshot-cards"
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

              <div style={styles.scoreBreakdownGrid} className="seshat-grid2" data-testid="score-breakdowns">
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

              <hr style={styles.divider} />
              <p style={styles.footerRules}>
                Scoring: power tier (×3), skills (×1.2 each), equipped items
                (×1, −0.5 per cursed), conditions (varies by type), arc stage
                (0–2), emotional state (±0.3–1.5), achievements (+0.3 each),
                losses (−0.15 each). Items not equipped or inaccessible do not
                contribute to combat score.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  headerWrapper: {
    marginBottom: "var(--space-6)",
  },
  title: {
    fontSize: "var(--text-2xl)",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: "var(--space-2)",
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    margin: 0,
  },
  titleIcon: {
    fontSize: 24,
  },
  subtitle: {
    ...S.dim,
    fontSize: "var(--text-sm)",
    marginTop: "var(--space-2)",
  },
  emptyText: {
    ...S.dim,
    fontStyle: "italic",
  },
  pickerGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 80px 1fr",
    gap: "0 var(--space-6)",
    alignItems: "center",
    marginBottom: "var(--space-6)",
  },
  vsDivider: {
    textAlign: "center",
    paddingTop: "var(--space-4)",
    fontSize: "var(--text-base)",
    color: "var(--text-muted)",
    letterSpacing: 2,
  },
  selectPrompt: {
    ...S.dim,
  },
  snapshotGrid: {
    ...S.grid2,
    marginBottom: "var(--space-4)",
  },
  scoreBreakdownGrid: {
    ...S.grid2,
  },
  divider: {
    ...S.rule,
    margin: "var(--space-6) 0 var(--space-3)",
  },
  footerRules: {
    ...S.dim,
    fontSize: "var(--text-xs)",
  },
} satisfies Record<string, React.CSSProperties>;
