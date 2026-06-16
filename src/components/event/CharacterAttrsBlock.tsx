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

  const activeExpandedId = expandedId || (selectedIds.length === 1 ? selectedIds[0] : null);

  return (
    <Section title={<><PeopleAltIcon sx={{ fontSize: 12, marginRight: 4 }} />Characters present</>}>
      <div style={styles.addBtnContainer}>
        <button
          onClick={() => setShowPicker(true)}
          style={styles.addBtnOverride}
        >
          Manage Characters in Scene
        </button>
      </div>

      <div className="seshat-flex-col" style={styles.listContainer}>
        {selectedIds.map((cid: string) => {
          const c = characters.find((x: Character) => x.id === cid);
          if (!c) return null;
          const a = getAttr(cid);
          const isExpanded = activeExpandedId === cid;

          return (
            <div key={cid} style={styles.card}>
              <div
                onClick={() => setExpandedId(isExpanded ? null : cid)}
                style={{
                  ...styles.cardHeader,
                  background: isExpanded ? "var(--bg-active)" : "transparent",
                }}
              >
                <div className="seshat-flex-align" style={styles.cardHeaderLeft}>
                  <span
                    style={{
                      ...styles.colorDot,
                      background: c.color,
                    }}
                  />
                  <span
                    style={{
                      ...styles.charName,
                      fontWeight: isExpanded ? "bold" : "normal",
                    }}
                  >
                    {c.name}
                  </span>
                </div>
                <span style={styles.editDetailsLabel}>
                  {isExpanded ? "Collapse" : "Edit details"}
                </span>
              </div>

              {isExpanded && (
                <div
                  style={{
                    ...styles.cardBody,
                    borderLeft: `3px solid ${c.color}`,
                  }}
                >
                  {Object.keys(a).length > 0 && Object.values(a).some(Boolean) ? (
                    <div style={styles.attributesGrid}>
                      {a.power && <div style={styles.attributeItem}>
                        <span style={styles.attributeLabel}>Power tier:</span>{a.power}
                      </div>}
                      {a.difficulty && <div style={styles.attributeItem}>
                        <span style={styles.attributeLabel}>Difficulty:</span>{a.difficulty}
                      </div>}
                      {a.arcStage && <div style={styles.attributeItem}>
                        <span style={styles.attributeLabel}>Arc stage:</span>{a.arcStage}
                      </div>}
                      {a.emotionalState && <div style={styles.attributeItem}>
                        <span style={styles.attributeLabel}>Emotional:</span>{a.emotionalState}
                      </div>}
                      {a.physicalState && <div style={styles.attributeItem}>
                        <span style={styles.attributeLabel}>Physical:</span>{a.physicalState}
                      </div>}
                      {a.sceneMotive && <div style={styles.attributeItem}>
                        <span style={styles.attributeLabel}>Motive:</span>{a.sceneMotive}
                      </div>}
                      {a.knowledge && <div style={styles.attributeItem}>
                        <span style={styles.attributeLabel}>Knowledge:</span>{a.knowledge}
                      </div>}
                      {a.beliefs && <div style={styles.attributeItem}>
                        <span style={styles.attributeLabel}>Beliefs:</span>{a.beliefs}
                      </div>}
                      {a.secret && <div style={styles.attributeItem}>
                        <span style={styles.attributeLabel}>Secret:</span>{a.secret}
                      </div>}
                      {a.traumaActive && <div style={styles.attributeItem}>
                        <span style={styles.attributeLabel}>Trauma:</span>{a.traumaActive}
                      </div>}
                      {a.arcBefore && <div style={styles.attributeItem}>
                        <span style={styles.attributeLabel}>Before:</span>{a.arcBefore}
                      </div>}
                      {a.arcAfter && <div style={styles.attributeItem}>
                        <span style={styles.attributeLabel}>After:</span>{a.arcAfter}
                      </div>}
                      {a.notes && <div style={styles.notesValue}>
                        <span style={styles.notesLabel}>AI Note:</span>{a.notes}
                      </div>}
                    </div>
                  ) : (
                    <div style={styles.emptyDetails}>No scene details set yet.</div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditModalCid(cid);
                    }}
                    style={styles.editBtn}
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
            <div style={styles.modalContent}>
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
          <div style={styles.pickerContainer}>
            {characters.map((c: Character) => {
              const active = selectedIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => onToggle(c.id)}
                  style={{
                    ...styles.pickerPill,
                    color: active ? c.color : "var(--text-muted)",
                    borderColor: active ? c.color : "var(--border)",
                    background: active ? `${c.color}10` : "transparent",
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

const styles = {
  addBtnContainer: {
    marginBottom: 16,
  },
  addBtnOverride: {
    ...S.addBtn,
    padding: "6px 12px",
    borderStyle: "solid",
  },
  listContainer: {
    gap: "var(--space-2)",
  },
  card: {
    border: "1px solid var(--border)",
    borderRadius: 6,
    background: "var(--bg-panel)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: "10px 14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    transition: "background 0.1s ease",
  },
  cardHeaderLeft: {
    gap: "var(--space-2)",
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    display: "inline-block",
  },
  charName: {
    fontSize: 14,
  },
  editDetailsLabel: {
    fontSize: 11,
    color: "var(--text-muted)",
  },
  cardBody: {
    padding: "16px",
    borderTop: "1px solid var(--border)",
    background: "var(--bg-app)",
  },
  attributesGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px 24px",
    marginBottom: "var(--space-4)",
  },
  attributeItem: {
    fontSize: 14,
  },
  attributeLabel: {
    ...S.h2,
    margin: 0,
    marginRight: 8,
  },
  notesLabel: {
    ...S.h2,
    margin: 0,
    marginRight: 8,
    display: "block",
    marginBottom: 4,
  },
  notesValue: {
    width: "100%",
    fontSize: 14,
  },
  emptyDetails: {
    ...S.dim,
    fontStyle: "italic",
    marginBottom: 16,
  },
  editBtn: {
    ...S.button,
    fontSize: 12,
    padding: "6px 12px",
  },
  modalContent: {
    marginTop: 16,
  },
  pickerContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "var(--space-3)",
    marginTop: "var(--space-4)",
  },
  pickerPill: {
    ...S.pill,
    fontSize: 14,
    padding: "8px 16px",
  },
} satisfies Record<string, React.CSSProperties>;
