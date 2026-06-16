import { useNavigate, useParams } from "react-router-dom";
import { appStore } from "../store/appStore";
import { useCharacters, useEvents, useActiveBookIdx } from "../hooks/useWorldStore";
import { S, mkChar } from "../lib/utils";
import { PeopleIcon, AddIcon, ArticleIcon } from "../components/ui/icons";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { CHAR_COLORS } from "../lib/constants";
import type { Character } from "../lib/types";
import { useCallback, useState, useMemo } from "react";
import { Modal } from "../components/ui/Modal";
import { buildExport } from "../lib/export";
import { CharacterCard } from "../components/character/CharacterCard";

export default function CharacterListPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const characters = useCharacters();
  const events = useEvents();
  const bookIdx = useActiveBookIdx();
  const ref = useAnimateIn();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const add = useCallback(() => {
    if (bookIdx < 0) return;
    const c = mkChar(
      `Character ${characters.length + 1}`,
      CHAR_COLORS[characters.length % CHAR_COLORS.length],
    );
    appStore.books[bookIdx].characters.push(c);
    navigate(`/book/${bookId}/characters/${c.id}`);
  }, [characters.length, bookIdx, bookId, navigate]);

  const toggleSelect = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const exportText = useMemo(() => {
    if (!showExport) return "";
    const selectedChars = characters.filter((c) => selectedIds.has(c.id));
    return buildExport({
      title: "",
      synopsis: "",
      setting: "",
      themes: "",
      rules: "",
      nations: [],
      techniques: [],
      ingredients: [],
      monsters: [],
      treasures: [],
      events: events,
      characters: selectedChars,
    });
  }, [showExport, selectedIds, characters, events]);

  return (
    <div ref={ref} className="seshat-page-container">
      {/* Header */}
      <div className="seshat-flex-between" style={styles.header}>
        <div className="seshat-flex-align" style={styles.headerTitleRow}>
          <PeopleIcon sx={styles.headerIcon} />
          <span style={styles.headerText}>
            Characters ({characters.length})
          </span>
        </div>
        <div style={styles.headerButtonsContainer}>
          {isSelectionMode ? (
            <>
              {selectedIds.size > 0 && (
                <button
                  onClick={() => setShowExport(true)}
                  style={styles.exportActiveBtn}
                >
                  <ArticleIcon sx={{ fontSize: 14 }} />
                  export ({selectedIds.size})
                </button>
              )}
              <button
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedIds(new Set());
                }}
                style={styles.cancelSelectionBtn}
              >
                cancel
              </button>
            </>
          ) : (
            <>
              {characters.length > 0 && (
                <button
                  onClick={() => setIsSelectionMode(true)}
                  style={styles.exportBtn}
                >
                  <ArticleIcon sx={{ fontSize: 14 }} />
                  export
                </button>
              )}
              <button onClick={add} style={styles.addBtn}>
                <AddIcon sx={{ fontSize: 14 }} />
                add character
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cards */}
      <div style={styles.cardsContainer}>
        {characters.map((c: Character) => (
          <CharacterCard
            key={c.id}
            character={c}
            onClick={() => {
              if (isSelectionMode) {
                toggleSelect(
                  { stopPropagation: () => {} } as React.MouseEvent,
                  c.id,
                );
              } else {
                navigate(`/book/${bookId}/characters/${c.id}`);
              }
            }}
            selected={selectedIds.has(c.id)}
            onToggleSelect={(e) => toggleSelect(e, c.id)}
            isSelectionMode={isSelectionMode}
          />
        ))}
      </div>

      {!characters.length && (
        <div style={styles.emptyContainer}>
          No characters yet. Add one to begin.
        </div>
      )}

      {/* Export Modal */}
      {showExport && (
        <Modal
          title={`Export ${selectedIds.size} Characters`}
          onClose={() => setShowExport(false)}
          footer={
            <div style={styles.modalFooter}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(exportText);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{
                  ...styles.modalCopyBtn,
                  color: copied ? "var(--color-green)" : "var(--color-primary)",
                }}
              >
                {copied ? "Copied!" : "Copy all"}
              </button>
              <button onClick={() => setShowExport(false)} style={styles.modalCloseBtn}>
                Close
              </button>
            </div>
          }
        >
          <div style={styles.modalBody}>
            <p style={styles.modalSub}>
              Paste into your AI's system prompt. Includes full psychological
              profile, history, state, and relationships for selected
              characters.
            </p>
            <textarea
              readOnly
              value={exportText}
              style={styles.exportTextarea}
              onFocus={(e) => e.target.select()}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

const styles = {
  header: {
    marginBottom: "var(--space-8)",
  },
  headerTitleRow: {
    gap: "var(--space-2)",
  },
  headerIcon: {
    fontSize: 14,
    color: "var(--text-muted)",
  },
  headerText: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "var(--text-secondary)",
  },
  headerButtonsContainer: {
    display: "flex",
    gap: 12,
  },
  exportActiveBtn: {
    ...S.ghost,
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
    color: "var(--color-primary)",
  },
  cancelSelectionBtn: {
    ...S.ghost,
    fontSize: 12,
    color: "var(--text-secondary)",
  },
  exportBtn: {
    ...S.ghost,
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
    color: "var(--text-secondary)",
  },
  addBtn: {
    ...S.ghost,
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
    color: "var(--text-secondary)",
  },
  cardsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  emptyContainer: {
    paddingTop: 60,
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: 13,
    fontStyle: "italic",
  },
  modalFooter: {
    display: "flex",
    gap: 12,
  },
  modalBody: {
    padding: 12,
  },
  modalSub: {
    ...S.dim,
    marginBottom: 16,
  },
  exportTextarea: {
    ...S.textarea,
    border: "none",
    background: "var(--bg-export-ta)",
    padding: 16,
    borderRadius: 4,
    height: 360,
    width: 500,
    resize: "none",
    fontFamily: "monospace",
    fontSize: 13,
    outline: "none",
  },
  modalCopyBtn: {
    ...S.ghost,
  },
  modalCloseBtn: {
    ...S.ghost,
  },
} satisfies Record<string, React.CSSProperties>;
