// ─────────────────────────────────────────────────────────────────────────────
// GeneratedCharModal — preview JSON of a generated character and save it
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
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
  selectedBookId: initialSelectedBookId,
  books,
}: Props) {
  const [targetBookId, setTargetBookId] = useState(initialSelectedBookId);
  const [overwriteConfirm, setOverwriteConfirm] = useState<{
    finalChar: Character;
    existingIdx: number;
    bookIdx: number;
  } | null>(null);

  if (!generatedChar) return null;

  const handleSave = () => {
    try {
      const bookIdx = books.findIndex((b) => b && b.id === targetBookId);
      if (bookIdx >= 0) {
        const book = appStore.books[bookIdx];
        const currentChars = book.characters.get() || [];

        const finalChar = {
          ...mkChar(
            generatedChar.name || "Unknown",
            generatedChar.color || "#ffffff",
          ),
          ...generatedChar,
        } as Character;

        if (!finalChar.name || finalChar.name === "Unknown") {
          showToast("Character name is missing!", "error");
          return;
        }

        const existingIdx = currentChars.findIndex(
          (c) =>
            c?.name && c.name.toLowerCase() === finalChar.name.toLowerCase(),
        );

        if (existingIdx >= 0) {
          setOverwriteConfirm({ finalChar, existingIdx, bookIdx });
          return;
        }

        performSave(finalChar, -1, bookIdx);
      } else {
        showToast("Error: No active book selected.", "error");
      }
    } catch (err) {
      console.error("Failed to save character:", err);
      showToast("Error saving character. See console.", "error");
    }
  };

  const performSave = (
    finalChar: Character,
    existingIdx: number,
    bookIdx: number,
  ) => {
    const book = appStore.books[bookIdx];
    const currentChars = book.characters.get() || [];
    const newChars = [...currentChars];

    if (existingIdx >= 0) {
      finalChar = {
        ...currentChars[existingIdx],
        ...finalChar,
        id: currentChars[existingIdx].id,
      };
      newChars[existingIdx] = finalChar;
    } else {
      newChars.push(finalChar);
    }

    book.characters.set(newChars);

    const token =
      localStorage.getItem("seshat-auth-token") ||
      sessionStorage.getItem("seshat-auth-token");
    if (token) {
      updateFilesOnGitHub(token, targetBookId, [
        {
          path: `characters/character_${finalChar.id}.json`,
          content: JSON.stringify(finalChar, null, 2),
        },
      ]);
    }
    setOverwriteConfirm(null);
    onClose();
    showToast("Character saved successfully!", "success");
  };

  return (
    <Modal
      title="Preview Generated Character"
      onClose={onClose}
      variant="wide"
      footer={
        overwriteConfirm ? (
          <div
            className="seshat-flex-end"
            style={{ width: "100%", gap: 12, alignItems: "center" }}
          >
            <span
              style={{
                color: "var(--color-orange)",
                fontSize: 13,
                flex: 1,
                textAlign: "left",
                fontWeight: 600,
              }}
            >
              A character named "{overwriteConfirm.finalChar.name}" already
              exists. Overwrite?
            </span>
            <button
              onClick={() => setOverwriteConfirm(null)}
              className="seshat-modal-btn-cancel"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                performSave(
                  overwriteConfirm.finalChar,
                  overwriteConfirm.existingIdx,
                  overwriteConfirm.bookIdx,
                )
              }
              className="seshat-modal-btn-submit"
              style={{ background: "var(--color-red)" }}
            >
              Confirm Overwrite
            </button>
          </div>
        ) : (
          <div
            className="seshat-flex-end"
            style={{ width: "100%", gap: 12, alignItems: "center" }}
          >
            {targetBookId === "none" && (
              <span
                style={{
                  color: "var(--color-red)",
                  fontSize: 12,
                  flex: 1,
                  textAlign: "right",
                }}
              >
                Please select a book destination
              </span>
            )}
            <button onClick={onClose} className="seshat-modal-btn-cancel">
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="seshat-modal-btn-submit"
              disabled={targetBookId === "none"}
            >
              <AddIcon sx={{ fontSize: 16 }} /> Save Character
            </button>
          </div>
        )
      }
    >
      <div style={{ padding: 16 }}>
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            Save Destination:
          </label>
          <select
            value={targetBookId}
            onChange={(e) => setTargetBookId(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 6,
              background: "var(--bg-main)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              fontSize: 14,
            }}
          >
            <option value="none">-- Select a Book --</option>
            {books.filter(Boolean).map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </div>

        <p
          style={{
            margin: "0 0 16px 0",
            color: "var(--text-secondary)",
            fontSize: 13,
          }}
        >
          The AI generated the following structural data. Saving it will
          immediately add this character to your world database.
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
