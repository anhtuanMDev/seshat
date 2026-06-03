import { S } from "../../lib/utils";
import { Field, Sel, Section } from "../ui";
import { PeopleAltIcon, PsychologyIcon, NotesIcon } from "../ui/icons";
import {
  POWER_TIERS,
  DIFFICULTY,
  ARC_STAGES,
} from "../../lib/constants";
import type { Character, EventAttributes } from "../../lib/types";

interface CharacterAttrsBlockProps {
  characters: Character[];
  selectedIds: string[];
  charAttrs: Record<string, EventAttributes>;
  onToggle: (id: string) => void;
  onPatchAttr: (charId: string, field: string, value: string) => void;
}

export function CharacterAttrsBlock({
  characters,
  selectedIds,
  charAttrs,
  onToggle,
  onPatchAttr,
}: CharacterAttrsBlockProps) {
  const getAttr = (cid: string) => charAttrs[cid] || {};

  return (
    <Section title={<><PeopleAltIcon sx={{ fontSize: 12, marginRight: 4 }} />Characters present</>}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 20,
        }}
      >
        {characters.map((c: Character) => {
          const active = selectedIds.includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => onToggle(c.id)}
              style={{
                ...S.pill,
                color: active ? c.color : "var(--text-muted)",
                borderColor: active ? c.color : "var(--border)",
                fontFamily: "'Georgia', serif",
              }}
            >
              {c.name}
            </button>
          );
        })}
        {!characters.length && (
          <span style={S.dim}>Add characters first.</span>
        )}
      </div>

      {selectedIds.map((cid: string) => {
        const c = characters.find((x: Character) => x.id === cid);
        if (!c) return null;
        const a = getAttr(cid);
        return (
          <div
            key={cid}
            style={{
              marginBottom: 28,
              paddingLeft: 14,
              borderLeft: `2px solid ${c.color}60`,
            }}
          >
            <p
              style={{
                ...S.dim,
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: c.color,
                  display: "inline-block",
                }}
              />
              {c.name}
            </p>
            <div style={S.grid3} className="seshat-grid3">
              <Sel
                label="Power tier"
                value={a.power || ""}
                onChange={(v) => onPatchAttr(cid, "power", v)}
                opts={POWER_TIERS}
              />
              <Sel
                label="Difficulty faced"
                value={a.difficulty || ""}
                onChange={(v) => onPatchAttr(cid, "difficulty", v)}
                opts={DIFFICULTY}
              />
              <Sel
                label="Arc stage"
                value={a.arcStage || ""}
                onChange={(v) => onPatchAttr(cid, "arcStage", v)}
                opts={ARC_STAGES}
              />
              <Field
                label="Emotional state"
                value={a.emotionalState || ""}
                onChange={(v) => onPatchAttr(cid, "emotionalState", v)}
                placeholder="Grief, resolute…"
              />
              <Field
                label="Physical state"
                value={a.physicalState || ""}
                onChange={(v) => onPatchAttr(cid, "physicalState", v)}
                placeholder="Injured, peak…"
              />
              <Field
                label={<><PsychologyIcon sx={{ fontSize: 10, marginRight: 3, verticalAlign: "middle" }} />Scene motive</>}
                value={a.sceneMotive || ""}
                onChange={(v) => onPatchAttr(cid, "sceneMotive", v)}
                placeholder="What they want right now"
              />
            </div>
            <div style={S.grid2} className="seshat-grid2">
              <Field
                label="Knowledge held"
                value={a.knowledge || ""}
                onChange={(v) => onPatchAttr(cid, "knowledge", v)}
                placeholder="What they know here…"
              />
              <Field
                label="Active beliefs"
                value={a.beliefs || ""}
                onChange={(v) => onPatchAttr(cid, "beliefs", v)}
                placeholder="Truths they hold now…"
              />
              <Field
                label="Secret in this scene"
                value={a.secret || ""}
                onChange={(v) => onPatchAttr(cid, "secret", v)}
                placeholder="What they're hiding here…"
              />
              <Field
                label="Trauma surfacing"
                value={a.traumaActive || ""}
                onChange={(v) => onPatchAttr(cid, "traumaActive", v)}
                placeholder="Which wound is active?"
              />
            </div>
            <div style={S.grid2} className="seshat-grid2">
              <Field
                label="Before this event"
                value={a.arcBefore || ""}
                onChange={(v) => onPatchAttr(cid, "arcBefore", v)}
                placeholder="Who they are walking in…"
              />
              <Field
                label="After this event"
                value={a.arcAfter || ""}
                onChange={(v) => onPatchAttr(cid, "arcAfter", v)}
                placeholder="How this changes them…"
              />
            </div>
            <Field
              label={<><NotesIcon sx={{ fontSize: 10, marginRight: 3, verticalAlign: "middle" }} />AI narrator note</>}
              value={a.notes || ""}
              onChange={(v) => onPatchAttr(cid, "notes", v)}
              multi
              rows={2}
              placeholder="Private instruction. Subtext, what they can't say, how to betray the wound without naming it."
            />
          </div>
        );
      })}
    </Section>
  );
}
