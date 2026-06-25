// ─────────────────────────────────────────────────────────────────────────────
// GeneratedCharModal — preview JSON of a generated character and save it
// ─────────────────────────────────────────────────────────────────────────────

import { AddIcon } from "../ui/icons";
import { Modal } from "../ui/Modal";
import { appStore } from "../../store/appStore";
import type { Character, BookData } from "../../store/appStore";
import { showToast } from "../../store/toastStore";
import { updateFilesOnGitHub } from "../../lib/githubSync";
import { mkChar } from "../../lib/utils";

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
      const currentChars = book.characters.get() || [];
      
      let finalChar = { ...mkChar(generatedChar.name || "Unknown", generatedChar.color || "#ffffff"), ...generatedChar } as Character;
      
      if (!finalChar.name || finalChar.name === "Unknown") {
        showToast("Character name is missing!", "error");
        return;
      }

      const existingIdx = currentChars.findIndex(
        (c) => c.name.toLowerCase() === finalChar.name.toLowerCase()
      );

      const newChars = [...currentChars];

      if (existingIdx >= 0) {
        if (
          !window.confirm(
            `A character named "${finalChar.name}" already exists. Do you want to overwrite it?`
          )
        ) {
          return;
        }
        // Overwrite existing, keep original ID
        finalChar = { ...currentChars[existingIdx], ...finalChar, id: currentChars[existingIdx].id };
        newChars[existingIdx] = finalChar;
      } else {
        newChars.push(finalChar);
      }

      book.characters.set(newChars);

      const token =
        localStorage.getItem("seshat-auth-token") ||
        sessionStorage.getItem("seshat-auth-token");
      if (token) {
        updateFilesOnGitHub(token, selectedBookId, [
          {
            path: `characters/character_${finalChar.id}.json`,
            content: JSON.stringify(finalChar, null, 2),
          },
        ]);
      }
      onClose();
      showToast("Character saved successfully!", "success");
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
