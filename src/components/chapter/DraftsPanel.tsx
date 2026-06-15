import { S } from "../../lib/utils";
import { AddIcon, HistoryIcon } from "../ui/icons";
import type { Draft } from "../../lib/types";
import { useState } from "react";
import { Modal } from "../ui/Modal";

interface DraftsPanelProps {
  drafts: Draft[];
  currentBody?: string;
  activeDraftId?: string | null;
  onSaveAsDraft: (name: string) => void;
  onRestoreDraft: (draft: Draft) => void;
}

export function DraftsPanel({ drafts, currentBody, activeDraftId, onSaveAsDraft, onRestoreDraft }: DraftsPanelProps) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftToRestore, setDraftToRestore] = useState<Draft | null>(null);

  const handleSave = () => {
    setDraftName(`Draft ${drafts.length + 1}`);
    setShowSaveModal(true);
  };

  const confirmSave = () => {
    if (draftName.trim()) {
      onSaveAsDraft(draftName.trim());
      setShowSaveModal(false);
      setDraftName("");
    }
  };

  const handleRestore = (draft: Draft) => {
    setDraftToRestore(draft);
  };

  const confirmRestore = () => {
    if (draftToRestore) {
      onRestoreDraft(draftToRestore);
      setDraftToRestore(null);
    }
  };

  return (
    <div style={{ padding: "0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ ...S.h2, margin: 0, fontSize: 13, display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)" }}>
          <HistoryIcon sx={{ fontSize: 14 }} />
          Version History ({drafts.length})
        </p>
        <button
          type="button"
          onClick={handleSave}
          style={{ ...S.ghost, fontSize: 11, display: "flex", alignItems: "center", gap: 3, color: "var(--text-secondary)" }}
        >
          <AddIcon sx={{ fontSize: 13 }} /> save current as draft
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {drafts.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", margin: 0 }}>
            No drafts saved yet.
          </p>
        )}
        
        {(() => {
          const sortedDrafts = [...drafts].sort((a, b) => b.createdAt - a.createdAt);
          const inferredDraftId = activeDraftId || (currentBody !== undefined ? sortedDrafts.find(d => d.body === currentBody)?.id : undefined);

          return sortedDrafts.map((draft) => {
            const isLineage = inferredDraftId === draft.id;
            const isExact = currentBody !== undefined && draft.body === currentBody;
            const isActive = isLineage;
            const isModified = isActive && !isExact;

          return (
            <div
              key={draft.id}
              style={{
                background: isActive ? "var(--bg-active)" : "var(--bg-card)",
                border: isActive ? "1px solid var(--color-blue)" : "1px solid var(--border)",
                borderLeft: isActive ? "4px solid var(--color-blue)" : "1px solid var(--border)",
                borderRadius: 6,
                padding: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: "600", color: isActive ? "var(--color-blue)" : "var(--text-primary)", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                  {draft.name}
                  {isActive && (
                    <span
                      style={{
                        fontSize: 10,
                        background: "var(--bg-app)",
                        color: isModified ? "var(--color-orange)" : "var(--color-blue)",
                        border: `1px solid ${isModified ? "var(--color-orange)" : "var(--color-blue)"}`,
                        padding: "2px 6px",
                        borderRadius: 12,
                        fontWeight: "600",
                        letterSpacing: 0.5,
                        lineHeight: 1
                      }}
                    >
                      {isModified ? "MODIFIED" : "ACTIVE"}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {new Date(draft.createdAt).toLocaleString()} · {draft.body?.length?.toLocaleString() || 0} chars
                </div>
              </div>
              <button
                onClick={() => handleRestore(draft)}
                disabled={isActive && !isModified}
                style={{
                  ...S.ghost,
                  color: isActive && !isModified ? "var(--text-muted)" : "var(--color-blue)",
                  fontSize: 11,
                  fontWeight: "600",
                  padding: "4px 8px",
                  borderRadius: 4,
                  border: isActive && !isModified ? "1px solid transparent" : "1px solid var(--color-blue)",
                  opacity: isActive && !isModified ? 0.6 : 1
                }}
              >
                {isActive && !isModified ? "Loaded" : "Restore"}
              </button>
            </div>
          );
        })})()}
      </div>

      {showSaveModal && (
        <Modal title="Save Draft" onClose={() => setShowSaveModal(false)}>
          <div style={{ padding: "0 24px 24px" }}>
            <p style={{ ...S.dim, marginBottom: 16 }}>
              Name this draft (e.g., 'First Draft', 'Editor Polish'):
            </p>
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmSave();
              }}
              style={{ ...S.input, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 4, marginBottom: 24 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={() => setShowSaveModal(false)} style={{ ...S.ghost, padding: "6px 16px" }}>Cancel</button>
              <button onClick={confirmSave} disabled={!draftName.trim()} style={{ ...S.pill, background: "var(--color-blue)", color: "#fff", border: "none", padding: "6px 20px" }}>Save</button>
            </div>
          </div>
        </Modal>
      )}

      {draftToRestore && (
        <Modal title="Restore Draft" onClose={() => setDraftToRestore(null)}>
          <div style={{ padding: "0 24px 24px" }}>
            <p style={{ ...S.dim, marginBottom: 24 }}>
              Are you sure you want to restore '{draftToRestore.name}'? Your current unsaved text will be replaced. You can save it as a draft first if you want to keep it.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={() => setDraftToRestore(null)} style={{ ...S.ghost, padding: "6px 16px" }}>Cancel</button>
              <button onClick={confirmRestore} style={{ ...S.pill, background: "var(--color-red)", color: "#fff", border: "none", padding: "6px 20px" }}>Restore</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
