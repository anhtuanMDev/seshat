// ─────────────────────────────────────────────────────────────────────────────
// CanonModal — "Add AI Response to Canon" entity / field selector + text editor
// ─────────────────────────────────────────────────────────────────────────────

import { SaveIcon } from "../ui/icons";
import { Modal } from "../ui/Modal";
import { getCanonFieldsForType } from "./prompts";
import type { BookData } from "../../store/appStore";

interface Props {
  canonModalContent: string | null;
  setCanonModalContent: (v: string | null) => void;
  canonTargetType: string;
  setCanonTargetType: (v: string) => void;
  canonTargetId: string;
  setCanonTargetId: (v: string) => void;
  canonTargetField: string;
  setCanonTargetField: (v: string) => void;
  selectedBookId: string;
  books: BookData[];
  onSave: () => void;
}

const selectStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  border: "1px solid var(--border)",
  padding: "6px",
  borderRadius: 4,
  fontSize: 12,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--text-secondary)",
  fontWeight: 600,
};

export default function CanonModal({
  canonModalContent,
  setCanonModalContent,
  canonTargetType,
  setCanonTargetType,
  canonTargetId,
  setCanonTargetId,
  canonTargetField,
  setCanonTargetField,
  selectedBookId,
  books,
  onSave,
}: Props) {
  if (canonModalContent === null) return null;

  const activeBook = books.find((b) => b?.id === selectedBookId);
  const collectionKey = (canonTargetType + "s") as keyof typeof activeBook;
  const entityList =
    canonTargetType === "book"
      ? []
      : ((activeBook?.[collectionKey] as Array<{ id: string; name?: string; title?: string }>) ??
        []);

  return (
    <Modal
      title="Add AI Response to Canon"
      onClose={() => setCanonModalContent(null)}
      variant="wide"
      footer={
        <div className="seshat-flex-end" style={{ width: "100%", gap: 12 }}>
          <button
            onClick={() => setCanonModalContent(null)}
            className="seshat-modal-btn-cancel"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="seshat-modal-btn-submit"
            disabled={!canonTargetType || !canonTargetId || !canonTargetField}
          >
            <SaveIcon sx={{ fontSize: 16 }} /> Save to Canon
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* 3-column selectors — auto-collapse to 1 column below ~480px */}
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}
        >
          {/* Entity Type */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={labelStyle}>Entity Type</label>
            <select
              value={canonTargetType}
              onChange={(e) => {
                const t = e.target.value;
                setCanonTargetType(t);
                setCanonTargetId("");
                setCanonTargetField(getCanonFieldsForType(t)[0] || "");
              }}
              style={selectStyle}
            >
              <option value="book">Book (World Settings)</option>
              <option value="character">Character</option>
              <option value="event">Event (Timeline)</option>
              <option value="nation">Nation / Faction</option>
              <option value="technique">Technique</option>
              <option value="ingredient">Ingredient</option>
              <option value="monster">Monster</option>
              <option value="treasure">Treasure</option>
            </select>
          </div>

          {/* Specific Entity */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={labelStyle}>Specific Entity</label>
            <select
              value={canonTargetId}
              onChange={(e) => setCanonTargetId(e.target.value)}
              style={selectStyle}
              disabled={canonTargetType === "book"}
            >
              <option value="" disabled>
                Select {canonTargetType}...
              </option>
              {canonTargetType === "book" ? (
                <option value={selectedBookId}>Active Book</option>
              ) : (
                entityList.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name || x.title || "Untitled"}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Data Field */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={labelStyle}>Data Field</label>
            <select
              value={canonTargetField}
              onChange={(e) => setCanonTargetField(e.target.value)}
              style={selectStyle}
            >
              {getCanonFieldsForType(canonTargetType).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Editable text to append */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={labelStyle}>Text to Append</label>
          <textarea
            value={canonModalContent || ""}
            onChange={(e) => setCanonModalContent(e.target.value)}
            style={{
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              padding: "12px",
              borderRadius: 4,
              fontSize: 13,
              height: 200,
              resize: "vertical",
              fontFamily: "var(--font-mono)",
            }}
          />
          <span
            style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}
          >
            This text will be appended to the existing content in the selected field.
          </span>
        </div>
      </div>
    </Modal>
  );
}
