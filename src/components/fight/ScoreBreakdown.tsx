import { S } from "../../lib/utils";
import { NoteRow } from "./NoteRow";
import type { Note } from "../../lib/scoreFighter";

interface ScoreBreakdownProps {
  name: string;
  color: string;
  score: number;
  notes: Note[];
}

export function ScoreBreakdown({ name, color, score, notes }: ScoreBreakdownProps) {
  return (
    <div>
      <p style={{ ...styles.header, color }}>
        {name} — score: {Math.round(score * 10) / 10}
      </p>
      {notes.map((n, i) => (
        <NoteRow key={i} n={n} />
      ))}
      {!notes.length && (
        <p style={S.dim}>No data found.</p>
      )}
    </div>
  );
}

const styles = {
  header: {
    ...S.h2,
    marginBottom: "var(--space-2)",
  },
} satisfies Record<string, React.CSSProperties>;
