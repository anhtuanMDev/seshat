import { S } from "../../lib/utils";
import { Field, Sel, Section } from "../ui";
import { Modal } from "../ui/Modal";
import { PeopleAltIcon, PsychologyIcon, NotesIcon } from "../ui/icons";
import {
  POWER_TIERS,
  DIFFICULTY,
  ARC_STAGES,
} from "../../lib/constants";
import { useState } from "react";
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editModalCid, setEditModalCid] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  // Auto-expand if only one character is selected
  const activeExpandedId = expandedId || (selectedIds.length === 1 ? selectedIds[0] : null);

  return (
    <Section title={<><PeopleAltIcon sx={{ fontSize: 12, marginRight: 4 }} />Characters present</>}>
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setShowPicker(true)}
          style={{ ...S.addBtn, padding: "6px 12px", borderStyle: "solid" }}
        >
          Manage Characters in Scene
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {selectedIds.map((cid: string) => {
          const c = characters.find((x: Character) => x.id === cid);
          if (!c) return null;
          const a = getAttr(cid);
          const isExpanded = activeExpandedId === cid;

          return (
            <div
              key={cid}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 6,
                background: "var(--bg-panel)",
                overflow: "hidden",
              }}
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : cid)}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: isExpanded ? "var(--bg-active)" : "transparent",
                  transition: "background 0.1s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: c.color,
                      display: "inline-block",
                    }}
                  />
                  <span style={{ fontSize: 14, fontWeight: isExpanded ? "bold" : "normal" }}>{c.name}</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {isExpanded ? "Collapse" : "Edit details"}
                </span>
              </div>

              {isExpanded && (
                <div
                  style={{
                    padding: "16px",
                    borderTop: "1px solid var(--border)",
                    borderLeft: `3px solid ${c.color}`,
                    background: "var(--bg-app)",
                  }}
                >
                  {Object.keys(a).length > 0 && Object.values(a).some(Boolean) ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 24px", marginBottom: 16 }}>
                      {a.power && <div style={{ fontSize: 14 }}><span style={{ ...S.h2, margin: 0, marginRight: 8 }}>Power tier:</span>{a.power}</div>}
                      {a.difficulty && <div style={{ fontSize: 14 }}><span style={{ ...S.h2, margin: 0, marginRight: 8 }}>Difficulty:</span>{a.difficulty}</div>}
                      {a.arcStage && <div style={{ fontSize: 14 }}><span style={{ ...S.h2, margin: 0, marginRight: 8 }}>Arc stage:</span>{a.arcStage}</div>}
                      {a.emotionalState && <div style={{ fontSize: 14 }}><span style={{ ...S.h2, margin: 0, marginRight: 8 }}>Emotional:</span>{a.emotionalState}</div>}
                      {a.physicalState && <div style={{ fontSize: 14 }}><span style={{ ...S.h2, margin: 0, marginRight: 8 }}>Physical:</span>{a.physicalState}</div>}
                      {a.sceneMotive && <div style={{ fontSize: 14 }}><span style={{ ...S.h2, margin: 0, marginRight: 8 }}>Motive:</span>{a.sceneMotive}</div>}
                      {a.knowledge && <div style={{ fontSize: 14 }}><span style={{ ...S.h2, margin: 0, marginRight: 8 }}>Knowledge:</span>{a.knowledge}</div>}
                      {a.beliefs && <div style={{ fontSize: 14 }}><span style={{ ...S.h2, margin: 0, marginRight: 8 }}>Beliefs:</span>{a.beliefs}</div>}
                      {a.secret && <div style={{ fontSize: 14 }}><span style={{ ...S.h2, margin: 0, marginRight: 8 }}>Secret:</span>{a.secret}</div>}
                      {a.traumaActive && <div style={{ fontSize: 14 }}><span style={{ ...S.h2, margin: 0, marginRight: 8 }}>Trauma:</span>{a.traumaActive}</div>}
                      {a.arcBefore && <div style={{ fontSize: 14 }}><span style={{ ...S.h2, margin: 0, marginRight: 8 }}>Before:</span>{a.arcBefore}</div>}
                      {a.arcAfter && <div style={{ fontSize: 14 }}><span style={{ ...S.h2, margin: 0, marginRight: 8 }}>After:</span>{a.arcAfter}</div>}
                      {a.notes && <div style={{ width: "100%", fontSize: 14 }}><span style={{ ...S.h2, margin: 0, marginRight: 8, display: "block", marginBottom: 4 }}>AI Note:</span>{a.notes}</div>}
                    </div>
                  ) : (
                    <div style={{ ...S.dim, fontStyle: "italic", marginBottom: 16 }}>No scene details set yet.</div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditModalCid(cid);
                    }}
                    style={{ ...S.button, fontSize: 12, padding: "6px 12px" }}
                  >
                    Edit details
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editModalCid && (() => {
        const c = characters.find(x => x.id === editModalCid);
        if (!c) return null;
        const a = getAttr(editModalCid);
        return (
          <Modal
            title={`Edit Details: ${c.name}`}
            onClose={() => setEditModalCid(null)}
            footer={
              <button style={S.button} onClick={() => setEditModalCid(null)}>
                Done
              </button>
            }
          >
            <div style={{ marginTop: 16 }}>
              <div style={S.grid3} className="seshat-grid3">
                <Sel
                  label="Power tier"
                  value={a.power || ""}
                  onChange={(v) => onPatchAttr(editModalCid, "power", v)}
                  opts={POWER_TIERS}
                />
                <Sel
                  label="Difficulty faced"
                  value={a.difficulty || ""}
                  onChange={(v) => onPatchAttr(editModalCid, "difficulty", v)}
                  opts={DIFFICULTY}
                />
                <Sel
                  label="Arc stage"
                  value={a.arcStage || ""}
                  onChange={(v) => onPatchAttr(editModalCid, "arcStage", v)}
                  opts={ARC_STAGES}
                />
                <Field
                  label="Emotional state"
                  value={a.emotionalState || ""}
                  onChange={(v) => onPatchAttr(editModalCid, "emotionalState", v)}
                  placeholder="Grief, resolute…"
                />
                <Field
                  label="Physical state"
                  value={a.physicalState || ""}
                  onChange={(v) => onPatchAttr(editModalCid, "physicalState", v)}
                  placeholder="Injured, peak…"
                />
                <Field
                  label={<><PsychologyIcon sx={{ fontSize: 10, marginRight: 3, verticalAlign: "middle" }} />Scene motive</>}
                  value={a.sceneMotive || ""}
                  onChange={(v) => onPatchAttr(editModalCid, "sceneMotive", v)}
                  placeholder="What they want right now"
                />
              </div>
              <div style={S.grid2} className="seshat-grid2">
                <Field
                  label="Knowledge held"
                  value={a.knowledge || ""}
                  onChange={(v) => onPatchAttr(editModalCid, "knowledge", v)}
                  placeholder="What they know here…"
                />
                <Field
                  label="Active beliefs"
                  value={a.beliefs || ""}
                  onChange={(v) => onPatchAttr(editModalCid, "beliefs", v)}
                  placeholder="Truths they hold now…"
                />
                <Field
                  label="Secret in this scene"
                  value={a.secret || ""}
                  onChange={(v) => onPatchAttr(editModalCid, "secret", v)}
                  placeholder="What they're hiding here…"
                />
                <Field
                  label="Trauma surfacing"
                  value={a.traumaActive || ""}
                  onChange={(v) => onPatchAttr(editModalCid, "traumaActive", v)}
                  placeholder="Which wound is active?"
                />
              </div>
              <div style={S.grid2} className="seshat-grid2">
                <Field
                  label="Before this event"
                  value={a.arcBefore || ""}
                  onChange={(v) => onPatchAttr(editModalCid, "arcBefore", v)}
                  placeholder="Who they are walking in…"
                />
                <Field
                  label="After this event"
                  value={a.arcAfter || ""}
                  onChange={(v) => onPatchAttr(editModalCid, "arcAfter", v)}
                  placeholder="How this changes them…"
                />
              </div>
              <Field
                label={<><NotesIcon sx={{ fontSize: 10, marginRight: 3, verticalAlign: "middle" }} />AI narrator note</>}
                value={a.notes || ""}
                onChange={(v) => onPatchAttr(editModalCid, "notes", v)}
                multi
                rows={2}
                placeholder="Private instruction. Subtext, what they can't say, how to betray the wound without naming it."
              />
            </div>
          </Modal>
        );
      })()}

      {showPicker && (
        <Modal
          title="Select Characters in Scene"
          onClose={() => setShowPicker(false)}
          footer={
            <button style={S.button} onClick={() => setShowPicker(false)}>
              Done
            </button>
          }
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
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
                    background: active ? `${c.color}10` : "transparent",
                    fontFamily: "'Georgia', serif",
                    fontSize: 14,
                    padding: "8px 16px",
                  }}
                >
                  {c.name}
                </button>
              );
            })}
            {!characters.length && (
              <span style={S.dim}>No characters created in this book yet.</span>
            )}
          </div>
        </Modal>
      )}
    </Section>
  );
}
