import { S } from "../../lib/utils";
import { AddIcon, HistoryIcon } from "../ui/icons";
import type { Draft } from "../../lib/types";

interface DraftsPanelProps {
  drafts: Draft[];
  onSaveAsDraft: (name: string) => void;
  onRestoreDraft: (draft: Draft) => void;
}

export function DraftsPanel({ drafts, onSaveAsDraft, onRestoreDraft }: DraftsPanelProps) {
  const handleSave = () => {
    const name = prompt("Name this draft (e.g., 'First Draft', 'Editor Polish'):", `Draft ${drafts.length + 1}`);
    if (name) {
      onSaveAsDraft(name);
    }
  };

  const handleRestore = (draft: Draft) => {
    if (window.confirm(`Are you sure you want to restore '${draft.name}'? Your current unsaved text will be replaced. You can save it as a draft first if you want to keep it.`)) {
      onRestoreDraft(draft);
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
        
        {[...drafts].sort((a, b) => b.createdAt - a.createdAt).map((draft) => (
          <div
            key={draft.id}
            style={{
              background: "var(--bg-panel)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: "bold", color: "var(--text-primary)", marginBottom: 4 }}>
                {draft.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {new Date(draft.createdAt).toLocaleString()} · {draft.body.length.toLocaleString()} chars
              </div>
            </div>
            <button
              onClick={() => handleRestore(draft)}
              style={{ ...S.ghost, color: "var(--color-blue)", fontSize: 11 }}
            >
              Restore
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
