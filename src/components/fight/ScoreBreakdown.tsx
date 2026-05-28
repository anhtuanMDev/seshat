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
      <p style={{ ...S.h2, color, marginBottom: 8 }}>
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
