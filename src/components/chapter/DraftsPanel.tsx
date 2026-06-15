import { S } from "../../lib/utils";
import { AddIcon, HistoryIcon, DeleteIcon } from "../ui/icons";
import type { Draft } from "../../lib/types";
import { useState } from "react";
import { Modal } from "../ui/Modal";

interface DraftsPanelProps {
  drafts: Draft[];
  currentBody?: string;
  activeDraftId?: string | null;
  onSaveAsDraft: (name: string) => void;
  onRestoreDraft: (draft: Draft) => void;
  onDeleteDraft: (draftId: string) => Promise<void> | void;
  onUndeleteDraft: (draftIds: string[]) => Promise<void> | void;
}

export function DraftsPanel({
  drafts,
  currentBody,
  activeDraftId,
  onSaveAsDraft,
  onRestoreDraft,
  onDeleteDraft,
  onUndeleteDraft,
}: DraftsPanelProps) {
  const [showTrash, setShowTrash] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftToRestore, setDraftToRestore] = useState<Draft | null>(null);
  const [draftToDelete, setDraftToDelete] = useState<Draft | null>(null);
  const [processingDraftId, setProcessingDraftId] = useState<string | null>(
    null,
  );
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<string>>(new Set());

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

  const sortedDrafts = [...drafts].sort((a, b) => b.createdAt - a.createdAt);
  const inferredDraftId =
    activeDraftId ||
    (currentBody !== undefined
      ? sortedDrafts.find((d) => d.body === currentBody)?.id
      : undefined);
  const globalActiveDraft = sortedDrafts.find((d) => d.id === inferredDraftId);
  const isGloballyModified = globalActiveDraft
    ? currentBody !== undefined && globalActiveDraft.body !== currentBody
    : false;

  const handleRestore = (draft: Draft) => {
    if (!isGloballyModified) {
      onRestoreDraft(draft);
    } else {
      setDraftToRestore(draft);
    }
  };

  const confirmRestore = () => {
    if (draftToRestore) {
      onRestoreDraft(draftToRestore);
      setDraftToRestore(null);
    }
  };

  const confirmDelete = async () => {
    if (draftToDelete) {
      const draftId = draftToDelete.id;
      setDraftToDelete(null); // Hide modal immediately
      setProcessingDraftId(draftId);
      await onDeleteDraft(draftId);
      setProcessingDraftId(null);
    }
  };

  return (
    <div style={{ padding: "0 24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <p
          title="Version History"
          style={{
            ...S.h2,
            margin: 0,
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "var(--text-secondary)",
            textTransform: "none",
          }}
        >
          <HistoryIcon sx={{ fontSize: 14 }} />
          Drafts ({drafts.filter((d) => !d.isDeleted).length})
        </p>
        <button
          type="button"
          onClick={handleSave}
          title="Save current editor content as a new draft"
          style={{
            ...S.ghost,
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            gap: 3,
            color: "var(--color-blue)",
            padding: "4px 8px",
            background:
              "color-mix(in srgb, var(--color-blue) 10%, transparent)",
            borderRadius: 4,
          }}
        >
          <AddIcon sx={{ fontSize: 14 }} /> Draft
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {drafts.filter((d) => !d.isDeleted).length === 0 && (
          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              fontStyle: "italic",
              margin: 0,
            }}
          >
            No drafts saved yet.
          </p>
        )}

        {(() => {
          const visibleDrafts = drafts.filter((d) => !d.isDeleted);
          const sortedDrafts = [...visibleDrafts].sort(
            (a, b) => b.createdAt - a.createdAt,
          );
          const activeDraftsPool = drafts.filter((d) => !d.isDeleted);
          const sortedActiveDrafts = [...activeDraftsPool].sort(
            (a, b) => b.createdAt - a.createdAt,
          );
          const inferredDraftId =
            activeDraftId ||
            (currentBody !== undefined
              ? sortedActiveDrafts.find((d) => d.body === currentBody)?.id
              : undefined);

          return sortedDrafts.map((draft) => {
            const isLineage = inferredDraftId === draft.id;
            const isExact =
              currentBody !== undefined && draft.body === currentBody;
            const isActive = isLineage;
            const isModified = isActive && !isExact;

            return (
              <div
                key={draft.id}
                style={{
                  background: isActive ? "var(--bg-active)" : "var(--bg-card)",
                  border: "1px solid",
                  borderColor: isActive
                    ? isModified
                      ? "var(--color-orange)"
                      : "var(--color-blue)"
                    : "var(--border)",
                  borderRadius: 6,
                  padding: "12px 16px",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  overflow: "hidden",
                  opacity: processingDraftId === draft.id ? 0.5 : 1,
                  pointerEvents:
                    processingDraftId === draft.id ? "none" : "auto",
                  transition: "opacity 0.2s",
                }}
              >
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      background: isModified
                        ? "var(--color-orange)"
                        : "var(--color-blue)",
                    }}
                  />
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: isActive
                            ? isModified
                              ? "var(--color-orange)"
                              : "var(--color-blue)"
                            : "var(--text-primary)",
                        }}
                      >
                        {draft.name}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        letterSpacing: 0.2,
                      }}
                    >
                      {new Date(draft.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                      {" · "}
                      <span style={{ color: "var(--text-secondary)" }}>
                        {draft.body?.length?.toLocaleString() || 0} chars
                      </span>
                    </div>
                  </div>

                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <>
                      {!isActive ? (
                        <button
                          onClick={() => handleRestore(draft)}
                          style={{
                            ...S.ghost,
                            fontSize: 11,
                            color: "var(--color-blue)",
                            fontWeight: "600",
                            padding: "4px 10px",
                            border:
                              "1px solid color-mix(in srgb, var(--color-blue) 30%, transparent)",
                            borderRadius: 4,
                          }}
                        >
                          Load
                        </button>
                      ) : isModified ? (
                        <button
                          onClick={() => handleRestore(draft)}
                          style={{
                            ...S.ghost,
                            fontSize: 11,
                            color: "var(--color-orange)",
                            fontWeight: "600",
                            padding: "4px 10px",
                            border:
                              "1px solid color-mix(in srgb, var(--color-orange) 30%, transparent)",
                            borderRadius: 4,
                          }}
                          title="Discard current unsaved changes and revert to this draft"
                        >
                          Revert
                        </button>
                      ) : null}
                      {!isActive &&
                        drafts.filter((d) => !d.isDeleted).length > 1 && (
                          <button
                            onClick={() => {
                              setDraftToDelete(draft);
                            }}
                            style={{
                              ...S.ghost,
                              color: "var(--text-muted)",
                              padding: 4,
                              borderRadius: 4,
                            }}
                            title="Move to trash"
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color = "var(--color-red)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color =
                                "var(--text-muted)")
                            }
                          >
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </button>
                        )}
                    </>
                  </div>
                </div>
              </div>
            );
          });
        })()}
      </div>

      {drafts.some((d) => d.isDeleted) && (
        <div
          style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}
        >
          <button
            onClick={() => {
              setSelectedDraftIds(new Set());
              setShowTrash(true);
            }}
            style={{
              ...S.ghost,
              fontSize: 11,
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <DeleteIcon sx={{ fontSize: 12 }} />
            Trash Bin ({drafts.filter((d) => d.isDeleted).length})
          </button>
        </div>
      )}

      {showTrash && (
        <Modal title="Trash Bin" onClose={() => setShowTrash(false)}>
          <div style={{ padding: "0 24px 24px" }}>
            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              Deleted drafts are preserved here. Restoring a draft will return
              it to your active history.
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                maxHeight: "50vh",
                overflowY: "auto",
              }}
            >
              {drafts
                .filter((d) => d.isDeleted)
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((draft) => {
                  const isSelected = selectedDraftIds.has(draft.id);
                  return (
                  <div
                    key={draft.id}
                    onClick={() => {
                      if (processingDraftId) return;
                      const next = new Set(selectedDraftIds);
                      if (isSelected) next.delete(draft.id);
                      else next.add(draft.id);
                      setSelectedDraftIds(next);
                    }}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: isSelected ? "color-mix(in srgb, var(--color-blue) 10%, var(--bg-card))" : "var(--bg-card)",
                      padding: "12px",
                      borderRadius: 6,
                      border: isSelected ? "1px solid var(--color-blue)" : "1px solid var(--border)",
                      cursor: processingDraftId ? "default" : "pointer",
                      opacity: processingDraftId === "batch" || processingDraftId === draft.id ? 0.5 : 1,
                      pointerEvents:
                        processingDraftId === "batch" || processingDraftId === draft.id ? "none" : "auto",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, 
                        border: isSelected ? "none" : "1px solid var(--text-muted)",
                        background: isSelected ? "var(--color-blue)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        {isSelected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: "var(--text-primary)",
                            marginBottom: 4,
                          }}
                        >
                          {draft.name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {new Date(draft.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                          {" · "}
                          <span style={{ color: "var(--text-secondary)" }}>
                            {draft.body?.length?.toLocaleString() || 0} chars
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )})}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 24,
              }}
            >
              <button 
                onClick={async () => {
                  if (selectedDraftIds.size > 0) {
                    setProcessingDraftId("batch");
                    await onUndeleteDraft(Array.from(selectedDraftIds));
                    setProcessingDraftId(null);
                    setSelectedDraftIds(new Set());
                    if (drafts.filter(d => d.isDeleted).length === selectedDraftIds.size) {
                      setShowTrash(false);
                    }
                  }
                }}
                disabled={selectedDraftIds.size === 0 || processingDraftId === "batch"}
                style={{ 
                  ...S.pill, 
                  background: selectedDraftIds.size > 0 ? "var(--color-blue)" : "var(--bg-card-hover)", 
                  color: selectedDraftIds.size > 0 ? "#fff" : "var(--text-muted)", 
                  border: "none", 
                  padding: "6px 20px",
                  transition: "all 0.2s",
                  cursor: selectedDraftIds.size > 0 ? "pointer" : "default",
                  opacity: processingDraftId === "batch" ? 0.5 : 1
                }}
              >
                Restore Selected ({selectedDraftIds.size})
              </button>
              <button
                onClick={() => setShowTrash(false)}
                style={{ ...S.ghost, padding: "6px 16px" }}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showSaveModal && (
        <Modal title="Save Draft" onClose={() => setShowSaveModal(false)}>
          <div style={{ padding: "0 24px 24px" }}>
            <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
              Name this draft (e.g., 'First Draft', 'Editor Polish'):
            </p>
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmSave();
              }}
              style={{
                ...S.input,
                padding: "8px 12px",
                border: "1px solid var(--border)",
                borderRadius: 4,
                marginBottom: 24,
              }}
            />
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
            >
              <button
                onClick={() => setShowSaveModal(false)}
                style={{ ...S.ghost, padding: "6px 16px" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                disabled={!draftName.trim()}
                style={{
                  ...S.pill,
                  background: "var(--color-blue)",
                  color: "#fff",
                  border: "none",
                  padding: "6px 20px",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}

      {draftToRestore && (
        <Modal title="Restore Draft" onClose={() => setDraftToRestore(null)}>
          <div style={{ padding: "0 24px 24px" }}>
            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: 24,
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to restore '{draftToRestore.name}'? Your
              current unsaved text will be replaced. You can save it as a draft
              first if you want to keep it.
            </p>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
            >
              <button
                onClick={() => setDraftToRestore(null)}
                style={{ ...S.ghost, padding: "6px 16px" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRestore}
                style={{
                  ...S.pill,
                  background: "var(--color-red)",
                  color: "#fff",
                  border: "none",
                  padding: "6px 20px",
                }}
              >
                Restore
              </button>
            </div>
          </div>
        </Modal>
      )}

      {draftToDelete && (
        <Modal title="Move to Trash" onClose={() => setDraftToDelete(null)}>
          <div style={{ padding: "0 24px 24px" }}>
            <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
              Are you sure you want to move '{draftToDelete.name}' to the trash
              bin?
            </p>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
            >
              <button
                onClick={() => setDraftToDelete(null)}
                style={{ ...S.ghost, padding: "6px 16px" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  ...S.pill,
                  background: "var(--color-red)",
                  color: "#fff",
                  border: "none",
                  padding: "6px 20px",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
