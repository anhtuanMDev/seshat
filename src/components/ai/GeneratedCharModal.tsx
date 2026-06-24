// ─────────────────────────────────────────────────────────────────────────────
// GeneratedCharModal — preview JSON of a generated character and save it
// ─────────────────────────────────────────────────────────────────────────────

import { AddIcon } from "../ui/icons";
import { Modal } from "../ui/Modal";
import { appStore } from "../../store/appStore";
import type { Character, BookData } from "../../store/appStore";
import { showToast } from "../../store/toastStore";
import { updateFilesOnGitHub } from "../../lib/githubSync";

interface Props {
  generatedChar: Partial<Character> | null;
  onClose: () => void;
  selectedBookId: string;
  books: BookData[];
}

export default function GeneratedCharModal({
  generatedChar,
  onClose,
  selectedBookId,
  books,
}: Props) {
  if (!generatedChar) return null;

  const handleSave = () => {
    const bookIdx = books.findIndex((b) => b && b.id === selectedBookId);
    if (bookIdx >= 0) {
      const book = appStore.books[bookIdx];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (book.characters as any).push(generatedChar as Character);

      const token =
        localStorage.getItem("seshat-auth-token") ||
        sessionStorage.getItem("seshat-auth-token");
      if (token) {
        updateFilesOnGitHub(token, selectedBookId, [
          {
            path: `characters/character_${generatedChar.id}.json`,
            content: JSON.stringify(generatedChar, null, 2),
          },
        ]);
      }
      onClose();
      showToast("Character created successfully!", "success");
    }
  };

  return (
    <Modal
      title="Preview Generated Character"
      onClose={onClose}
      variant="wide"
      footer={
        <div className="seshat-flex-end" style={{ width: "100%", gap: 12 }}>
          <button onClick={onClose} className="seshat-modal-btn-cancel">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="seshat-modal-btn-submit"
            disabled={selectedBookId === "none"}
          >
            <AddIcon sx={{ fontSize: 16 }} /> Save Character
          </button>
        </div>
      }
    >
      <div style={{ padding: 16 }}>
        <p
          style={{
            margin: "0 0 16px 0",
            color: "var(--text-secondary)",
            fontSize: 13,
          }}
        >
          The AI generated the following structural data. Saving it will immediately add
          this character to your world database.
        </p>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            padding: 16,
            borderRadius: 8,
            color: "var(--text-primary)",
            fontSize: 13,
            fontFamily: "var(--font-mono)",
            maxHeight: "50vh",
            overflowY: "auto",
          }}
        >
          {JSON.stringify(generatedChar, null, 2)}
        </pre>
      </div>
    </Modal>
  );
}
