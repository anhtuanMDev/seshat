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
  onRenameDraft: (draftId: string, newName: string) => Promise<void> | void;
}

export function DraftsPanel({
  drafts,
  currentBody,
  activeDraftId,
  onSaveAsDraft,
  onRestoreDraft,
  onDeleteDraft,
  onUndeleteDraft,
  onRenameDraft,
}: DraftsPanelProps) {
  const [showTrash, setShowTrash] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftToRestore, setDraftToRestore] = useState<Draft | null>(null);
  const [draftToDelete, setDraftToDelete] = useState<Draft | null>(null);
  const [processingDraftId, setProcessingDraftId] = useState<string | null>(
    null,
  );
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<string>>(
    new Set(),
  );
  const [draftToRename, setDraftToRename] = useState<Draft | null>(null);
  const [newDraftName, setNewDraftName] = useState("");

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

  const confirmRename = async () => {
    if (
      draftToRename &&
      newDraftName.trim() &&
      newDraftName.trim() !== draftToRename.name
    ) {
      const draftId = draftToRename.id;
      const finalName = newDraftName.trim();
      setDraftToRename(null);
      setProcessingDraftId(draftId);
      await onRenameDraft(draftId, finalName);
      setProcessingDraftId(null);
    } else {
      setDraftToRename(null);
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
      setDraftToDelete(null);
      setProcessingDraftId(draftId);
      await onDeleteDraft(draftId);
      setProcessingDraftId(null);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <p title="Version History" style={styles.title}>
          <HistoryIcon sx={{ fontSize: 14 }} />
          Drafts ({drafts.filter((d) => !d.isDeleted).length})
        </p>
        <button
          type="button"
          onClick={handleSave}
          title="Save current editor content as a new draft"
          style={styles.addDraftBtn}
        >
          <AddIcon sx={{ fontSize: 14 }} /> Draft
        </button>
      </div>

      <div style={styles.list}>
        {drafts.filter((d) => !d.isDeleted).length === 0 && (
          <p style={styles.emptyText}>
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
                  ...styles.cardBase,
                  background: isActive ? "var(--bg-active)" : "var(--bg-card)",
                  borderColor: isActive
                    ? isModified
                      ? "var(--color-orange)"
                      : "var(--color-blue)"
                    : "var(--border)",
                  borderWidth: 1,
                  borderStyle: "solid",
                  pointerEvents:
                    processingDraftId === draft.id ? "none" : "auto",
                  opacity: processingDraftId === draft.id ? 0.5 : 1,
                }}
              >
                {isActive && (
                  <div
                    style={{
                      ...styles.lineIndicator,
                      background: isModified
                        ? "var(--color-orange)"
                        : "var(--color-blue)",
                    }}
                  />
                )}

                <div style={styles.cardHeader}>
                  <div
                    onClick={() => {
                      setDraftToRename(draft);
                      setNewDraftName(draft.name);
                    }}
                    style={styles.renameTrigger}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.opacity = "0.7")
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    title="Click to rename draft"
                  >
                    <div style={styles.draftHeaderRow}>
                      <span
                        style={{
                          ...styles.draftName,
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
                    <div style={styles.draftMeta}>
                      {new Date(draft.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                      {" · "}
                      <span style={styles.charCount}>
                        {draft.body?.length?.toLocaleString() || 0} chars
                      </span>
                    </div>
                  </div>

                  <div style={styles.actionRow}>
                    <>
                      {!isActive ? (
                        <button
                          onClick={() => handleRestore(draft)}
                          style={styles.loadBtn}
                        >
                          Load
                        </button>
                      ) : isModified ? (
                        <button
                          onClick={() => handleRestore(draft)}
                          style={styles.revertBtn}
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
                            style={styles.deleteBtn}
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
        <div style={styles.trashTriggerWrapper}>
          <button
            onClick={() => {
              setSelectedDraftIds(new Set());
              setShowTrash(true);
            }}
            style={styles.trashTriggerBtn}
          >
            <DeleteIcon sx={{ fontSize: 12 }} />
            Trash Bin ({drafts.filter((d) => d.isDeleted).length})
          </button>
        </div>
      )}

      {showTrash && (
        <Modal title="Trash Bin" onClose={() => setShowTrash(false)}>
          <div style={styles.modalContent}>
            <p style={styles.modalSubText}>
              Deleted drafts are preserved here. Restoring a draft will return
              it to your active history.
            </p>
            <div style={styles.trashList}>
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
                        ...styles.trashRowBase,
                        background: isSelected
                          ? "color-mix(in srgb, var(--color-blue) 10%, var(--bg-card))"
                          : "var(--bg-card)",
                        border: isSelected
                          ? "1px solid var(--color-blue)"
                          : "1px solid var(--border)",
                        opacity:
                          processingDraftId === "batch" ||
                          processingDraftId === draft.id
                            ? 0.5
                            : 1,
                        pointerEvents:
                          processingDraftId === "batch" ||
                          processingDraftId === draft.id
                            ? "none"
                            : "auto",
                      }}
                    >
                      <div style={styles.trashRowLeft}>
                        <div
                          style={{
                            ...styles.trashCheckbox,
                            border: isSelected
                              ? "none"
                              : "1px solid var(--text-muted)",
                            background: isSelected
                              ? "var(--color-blue)"
                              : "transparent",
                          }}
                        >
                          {isSelected && (
                            <svg
                              width="10"
                              height="8"
                              viewBox="0 0 10 8"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M1 4L3.5 6.5L9 1"
                                stroke="var(--bg-app)"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div style={styles.trashDraftName}>
                            {draft.name}
                          </div>
                          <div style={styles.trashDraftMeta}>
                            {new Date(draft.createdAt).toLocaleString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              },
                            )}
                            {" · "}
                            <span style={styles.charCount}>
                              {draft.body?.length?.toLocaleString() || 0} chars
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div style={styles.trashFooterRow}>
              <button
                onClick={async () => {
                  if (selectedDraftIds.size > 0) {
                    setProcessingDraftId("batch");
                    await onUndeleteDraft(Array.from(selectedDraftIds));
                    setProcessingDraftId(null);
                    setSelectedDraftIds(new Set());
                    if (
                      drafts.filter((d) => d.isDeleted).length ===
                      selectedDraftIds.size
                    ) {
                      setShowTrash(false);
                    }
                  }
                }}
                disabled={
                  selectedDraftIds.size === 0 || processingDraftId === "batch"
                }
                style={{
                  ...styles.restoreSelectedBtnBase,
                  background:
                    selectedDraftIds.size > 0
                      ? "var(--color-blue)"
                      : "var(--bg-card-hover)",
                  color:
                    selectedDraftIds.size > 0
                      ? "var(--bg-app)"
                      : "var(--text-muted)",
                  cursor: selectedDraftIds.size > 0 ? "pointer" : "default",
                  opacity: processingDraftId === "batch" ? 0.5 : 1,
                }}
              >
                Restore Selected ({selectedDraftIds.size})
              </button>
              <button
                onClick={() => setShowTrash(false)}
                style={styles.closeBtn}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showSaveModal && (
        <Modal title="Save Draft" onClose={() => setShowSaveModal(false)}>
          <div style={styles.modalContent}>
            <p style={styles.modalSubText}>
              Name this draft (e.g., 'First Draft', 'Editor Polish'):
            </p>
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmSave();
              }}
              style={styles.inputField}
            />
            <div style={styles.modalButtonsRow}>
              <button
                onClick={() => setShowSaveModal(false)}
                style={styles.closeBtn}
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                disabled={!draftName.trim()}
                style={styles.savePillBtn}
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}

      {draftToRestore && (
        <Modal title="Restore Draft" onClose={() => setDraftToRestore(null)}>
          <div style={styles.modalContent}>
            <p style={styles.modalSubTextLong}>
              Are you sure you want to restore '{draftToRestore.name}'? Your
              current unsaved text will be replaced. You can save it as a draft
              first if you want to keep it.
            </p>
            <div style={styles.modalButtonsRow}>
              <button
                onClick={() => setDraftToRestore(null)}
                style={styles.closeBtn}
              >
                Cancel
              </button>
              <button onClick={confirmRestore} style={styles.redPillBtn}>
                Restore
              </button>
            </div>
          </div>
        </Modal>
      )}

      {draftToDelete && (
        <Modal title="Move to Trash" onClose={() => setDraftToDelete(null)}>
          <div style={styles.modalContent}>
            <p style={styles.modalSubTextLong}>
              Are you sure you want to move '{draftToDelete.name}' to the trash
              bin?
            </p>
            <div style={styles.modalButtonsRow}>
              <button
                onClick={() => setDraftToDelete(null)}
                style={styles.closeBtn}
              >
                Cancel
              </button>
              <button onClick={confirmDelete} style={styles.redPillBtn}>
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {draftToRename && (
        <Modal title="Rename Draft" onClose={() => setDraftToRename(null)}>
          <div style={styles.modalContent}>
            <p style={styles.modalSubText}>
              Enter a new name for this draft:
            </p>
            <input
              autoFocus
              value={newDraftName}
              onChange={(e) => setNewDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmRename();
              }}
              style={styles.inputField}
            />
            <div style={styles.modalButtonsRow}>
              <button
                onClick={() => setDraftToRename(null)}
                style={styles.closeBtn}
              >
                Cancel
              </button>
              <button
                onClick={confirmRename}
                disabled={
                  !newDraftName.trim() ||
                  newDraftName.trim() === draftToRename.name
                }
                style={{
                  ...styles.renameBtnBase,
                  cursor:
                    !newDraftName.trim() ||
                    newDraftName.trim() === draftToRename.name
                      ? "default"
                      : "pointer",
                  opacity:
                    !newDraftName.trim() ||
                    newDraftName.trim() === draftToRename.name
                      ? 0.5
                      : 1,
                }}
              >
                Rename
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "0 8px 0 0",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    ...S.h2,
    margin: 0,
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "var(--text-secondary)",
    textTransform: "none",
  },
  addDraftBtn: {
    ...S.ghost,
    fontSize: 11,
    display: "flex",
    alignItems: "center",
    gap: 3,
    color: "var(--color-blue)",
    padding: "4px 8px",
    background: "color-mix(in srgb, var(--color-blue) 10%, transparent)",
    borderRadius: 4,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  emptyText: {
    fontSize: 12,
    color: "var(--text-muted)",
    fontStyle: "italic",
    margin: 0,
  },
  cardBase: {
    borderRadius: 6,
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
    transition: "opacity 0.2s",
  },
  lineIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  renameTrigger: {
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  draftHeaderRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  draftName: {
    fontSize: 13,
    fontWeight: "600",
  },
  draftMeta: {
    fontSize: 11,
    color: "var(--text-muted)",
    letterSpacing: 0.2,
  },
  charCount: {
    color: "var(--text-secondary)",
  },
  actionRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  loadBtn: {
    ...S.ghost,
    fontSize: 11,
    color: "var(--color-blue)",
    fontWeight: "600",
    padding: "4px 10px",
    border: "1px solid color-mix(in srgb, var(--color-blue) 30%, transparent)",
    borderRadius: 4,
  },
  revertBtn: {
    ...S.ghost,
    fontSize: 11,
    color: "var(--color-orange)",
    fontWeight: "600",
    padding: "4px 10px",
    border: "1px solid color-mix(in srgb, var(--color-orange) 30%, transparent)",
    borderRadius: 4,
  },
  deleteBtn: {
    ...S.ghost,
    color: "var(--text-muted)",
    padding: 4,
    borderRadius: 4,
  },
  trashTriggerWrapper: {
    marginTop: 16,
    display: "flex",
    justifyContent: "flex-end",
  },
  trashTriggerBtn: {
    ...S.ghost,
    fontSize: 11,
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  modalContent: {
    padding: "0 24px 24px",
  },
  modalSubText: {
    color: "var(--text-secondary)",
    marginBottom: 16,
    fontSize: 13,
  },
  modalSubTextLong: {
    color: "var(--text-secondary)",
    marginBottom: 24,
    lineHeight: 1.5,
  },
  trashList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    maxHeight: "50vh",
    overflowY: "auto",
  },
  trashRowBase: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    borderRadius: 6,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  trashRowLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  trashCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  trashDraftName: {
    fontSize: 13,
    fontWeight: "600",
    color: "var(--text-primary)",
    marginBottom: 4,
  },
  trashDraftMeta: {
    fontSize: 11,
    color: "var(--text-muted)",
  },
  trashFooterRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
  },
  restoreSelectedBtnBase: {
    ...S.pill,
    border: "none",
    padding: "6px 20px",
    transition: "all 0.2s",
  },
  closeBtn: {
    ...S.ghost,
    padding: "6px 16px",
  },
  inputField: {
    ...S.input,
    padding: "8px 12px",
    border: "1px solid var(--border)",
    borderRadius: 4,
    marginBottom: 24,
  },
  modalButtonsRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
  },
  savePillBtn: {
    ...S.pill,
    background: "var(--color-blue)",
    color: "var(--bg-app)",
    border: "none",
    padding: "6px 20px",
  },
  redPillBtn: {
    ...S.pill,
    background: "var(--color-red)",
    color: "var(--bg-app)",
    border: "none",
    padding: "6px 20px",
  },
  renameBtnBase: {
    ...S.pill,
    background: "var(--color-blue)",
    color: "var(--bg-app)",
    border: "none",
    padding: "6px 20px",
    transition: "opacity 0.2s, cursor 0.2s",
  },
} satisfies Record<string, React.CSSProperties>;
