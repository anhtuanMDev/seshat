import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/core";
import MentionHelpButton from "./MentionHelpButton";
import { WordCountDisplay } from "./WordCountDisplay";

interface MenuBarProps {
  editor: Editor;
  showMentionHelp: boolean;
}

export function MenuBar({ editor, showMentionHelp }: MenuBarProps) {
  const [showPinpointModal, setShowPinpointModal] = useState(false);
  const [pinpointComment, setPinpointComment] = useState("");

  const handleAddPinpoint = useCallback(() => {
    setShowPinpointModal(true);
    setPinpointComment("");
  }, []);

  const btn = useCallback(
    (label: string, action: () => void, active?: boolean, title?: string) => {
      const activeBtnStyle = {
        ...styles.btn,
        background: active ? "var(--bg-active)" : "transparent",
      };
      return (
        <button
          type="button"
          title={title}
          onClick={action}
          style={activeBtnStyle}
        >
          {label}
        </button>
      );
    },
    [],
  );

  return (
    <div className="seshat-flex-align" style={styles.container}>
      {btn(
        "B",
        () => editor.chain().focus().toggleBold().run(),
        editor.isActive("bold"),
      )}
      {btn(
        "I",
        () => editor.chain().focus().toggleItalic().run(),
        editor.isActive("italic"),
      )}
      {btn(
        "U",
        () => editor.chain().focus().toggleUnderline().run(),
        editor.isActive("underline"),
      )}
      {btn(
        "S",
        () => editor.chain().focus().toggleStrike().run(),
        editor.isActive("strike"),
      )}
      <span style={styles.divider} />
      {btn(
        "H1",
        () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        editor.isActive("heading", { level: 1 }),
      )}
      {btn(
        "H2",
        () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        editor.isActive("heading", { level: 2 }),
      )}
      {btn(
        "H3",
        () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        editor.isActive("heading", { level: 3 }),
      )}
      <span style={styles.divider} />
      {btn(
        "•",
        () => editor.chain().focus().toggleBulletList().run(),
        editor.isActive("bulletList"),
      )}
      {btn(
        "1.",
        () => editor.chain().focus().toggleOrderedList().run(),
        editor.isActive("orderedList"),
      )}
      {btn(
        "❝",
        () => editor.chain().focus().toggleBlockquote().run(),
        editor.isActive("blockquote"),
      )}
      <span style={styles.divider} />
      {btn(
        "≡",
        () => editor.chain().focus().toggleCodeBlock().run(),
        editor.isActive("codeBlock"),
      )}
      {btn(
        "🔗",
        () => {
          const url = prompt("Link URL:");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        },
        editor.isActive("link"),
      )}
      {btn(
        "⬜",
        () => editor.chain().focus().toggleHighlight().run(),
        editor.isActive("highlight"),
      )}
      <span style={styles.divider} />
      {btn("📍", handleAddPinpoint, false, "Add Pinpoint Comment")}

      {/* @ mention help button — always shown when characters exist */}
      {showMentionHelp && (
        <>
          <span style={styles.divider} />
          <MentionHelpButton />
        </>
      )}

      <div style={styles.flexSpacer} />
      <WordCountDisplay editor={editor} />

      {showPinpointModal &&
        createPortal(
          <div className="seshat-flex-center" style={styles.overlay} onClick={() => setShowPinpointModal(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3 style={styles.modalTitle}>Add Pinpoint</h3>
              <textarea
                autoFocus
                rows={3}
                style={styles.textarea}
                value={pinpointComment}
                onChange={(e) => setPinpointComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (pinpointComment.trim()) {
                      editor
                        .chain()
                        .focus()
                        .setPinPoint({
                          id: crypto.randomUUID(),
                          comment: pinpointComment.trim(),
                        })
                        .run();
                    }
                    setShowPinpointModal(false);
                  } else if (e.key === "Escape") {
                    setShowPinpointModal(false);
                  }
                }}
                placeholder="What are your thoughts?"
              />
              <div className="seshat-flex-end" style={styles.modalFooter}>
                <button onClick={() => setShowPinpointModal(false)} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (pinpointComment.trim()) {
                      editor
                        .chain()
                        .focus()
                        .setPinPoint({
                          id: crypto.randomUUID(),
                          comment: pinpointComment.trim(),
                        })
                        .run();
                    }
                    setShowPinpointModal(false);
                  }}
                  style={styles.addBtn}
                >
                  Add
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

const styles = {
  container: {
    gap: 1,
    padding: "6px 0",
    borderBottom: "1px solid var(--border)",
    marginBottom: "var(--space-3)",
    flexWrap: "wrap",
  },
  btn: {
    border: "none",
    borderRadius: 2,
    cursor: "pointer",
    fontSize: 12,
    padding: "2px 6px",
    color: "var(--text-secondary)",
    fontFamily: "var(--font-serif)",
    lineHeight: "20px",
  },
  divider: {
    width: 1,
    background: "var(--border)",
    margin: "0 4px",
    height: 14,
  },
  flexSpacer: {
    flex: 1,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 2000,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modal: {
    background: "var(--bg-app)",
    padding: 24,
    borderRadius: 8,
    width: 400,
    border: "1px solid var(--border)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  },
  modalTitle: {
    margin: "0 0 16px 0",
    fontSize: 16,
  },
  textarea: {
    width: "100%",
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    padding: 8,
    color: "inherit",
    resize: "none",
    marginBottom: 16,
    outline: "none",
    fontFamily: "inherit",
  },
  modalFooter: {
    gap: "var(--space-3)",
  },
  cancelBtn: {
    padding: "6px 12px",
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: 4,
    cursor: "pointer",
    color: "var(--text-secondary)",
  },
  addBtn: {
    padding: "6px 12px",
    background: "var(--color-primary)",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    color: "var(--bg-app)",
    fontWeight: 600,
  },
} satisfies Record<string, React.CSSProperties>;
