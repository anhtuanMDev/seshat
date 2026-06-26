import type { Editor } from "@tiptap/core";
import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { uid } from "../../lib/utils";
import { Modal } from "../ui/Modal";
import MentionHelpButton from "./MentionHelpButton";
import { WordCountDisplay } from "./WordCountDisplay";
interface MenuBarProps {
  editor: Editor;
  showMentionHelp: boolean;
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 14 }: { d: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const icons = {
  bold: "M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z",
  italic: "M19 4h-9M14 20H5M15 4L9 20",
  underline: "M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3M4 21h16",
  strike:
    "M17.3 12H6.7M10 7.7C10.4 6.7 11.4 6 12.5 6c1.7 0 2.5 1 2.5 2s-.8 1.6-2 2M14 16.3C13.6 17.3 12.6 18 11.5 18c-1.7 0-2.5-1-2.5-2s.8-1.6 2-2",
  h1: "M4 12h8M4 6v12M16 6v12M14 10l6-4v12",
  h2: "M4 12h8M4 6v12M16 6v12M21 16c-5 0-5-4 0-4",
  h3: "M4 12h8M4 6v12M16 6v12M21 10c-3 0-5 2-5 3s2 3 5 3",
  bullet: "M9 6h11M9 12h11M9 18h11M5 6v.01M5 12v.01M5 18v.01",
  ordered:
    "M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M4 14h1.5a1.5 1.5 0 0 1 0 3H4",
  quote:
    "M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zM15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z",
  code: "M8 6L2 12l6 6M16 6l6 6-6 6",
  link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  highlight: "M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z",
  pin: "M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7zM12 9h.01",
  wand: "M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M17.8 6.2 19 5M3 21l9-9M12.2 6.2 11 5",
  next: "M5 12h14M12 5l7 7-7 7",
  accept: "M20 6 9 17l-5-5",
  acceptAll: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
  dismiss: "M18 6 6 18M6 6l12 12",
};

export function MenuBar({
  editor,
  showMentionHelp,
}: MenuBarProps) {
  const [showPinpointModal, setShowPinpointModal] = useState(false);
  const [pinpointComment, setPinpointComment] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const handleAddPinpoint = useCallback(() => {
    setShowPinpointModal(true);
    setPinpointComment("");
  }, []);

  const btn = useCallback(
    (icon: string, action: () => void, active?: boolean, title?: string) => (
      <button
        type="button"
        title={title}
        onClick={action}
        style={{
          ...styles.btn,
          background: active ? "var(--bg-active)" : "transparent",
          color: active ? "var(--text-primary)" : "var(--text-secondary)",
        }}
        onMouseEnter={(e) => {
          if (!active)
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--bg-hover)";
          (e.currentTarget as HTMLButtonElement).style.color =
            "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = active
            ? "var(--bg-active)"
            : "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = active
            ? "var(--text-primary)"
            : "var(--text-secondary)";
        }}
      >
        <Icon d={icon} />
      </button>
    ),
    [],
  );

  return (
    <div style={styles.wrapper}>
      {/* ── Main toolbar row ── */}
      <div className="seshat-flex-align" style={styles.container}>
        {/* Text formatting group */}
        <div style={styles.group}>
          {btn(
            icons.bold,
            () => editor.chain().focus().toggleBold().run(),
            editor.isActive("bold"),
            "Bold",
          )}
          {btn(
            icons.italic,
            () => editor.chain().focus().toggleItalic().run(),
            editor.isActive("italic"),
            "Italic",
          )}
          {btn(
            icons.underline,
            () => editor.chain().focus().toggleUnderline().run(),
            editor.isActive("underline"),
            "Underline",
          )}
          {btn(
            icons.strike,
            () => editor.chain().focus().toggleStrike().run(),
            editor.isActive("strike"),
            "Strikethrough",
          )}
        </div>

        <span style={styles.divider} />

        {/* Heading group */}
        <div style={styles.group}>
          {btn(
            icons.h1,
            () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
            editor.isActive("heading", { level: 1 }),
            "Heading 1",
          )}
          {btn(
            icons.h2,
            () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
            editor.isActive("heading", { level: 2 }),
            "Heading 2",
          )}
          {btn(
            icons.h3,
            () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
            editor.isActive("heading", { level: 3 }),
            "Heading 3",
          )}
        </div>

        <span style={styles.divider} />

        {/* Block group */}
        <div style={styles.group}>
          {btn(
            icons.bullet,
            () => editor.chain().focus().toggleBulletList().run(),
            editor.isActive("bulletList"),
            "Bullet list",
          )}
          {btn(
            icons.ordered,
            () => editor.chain().focus().toggleOrderedList().run(),
            editor.isActive("orderedList"),
            "Ordered list",
          )}
          {btn(
            icons.quote,
            () => editor.chain().focus().toggleBlockquote().run(),
            editor.isActive("blockquote"),
            "Blockquote",
          )}
        </div>

        <span style={styles.divider} />

        {/* Insert group */}
        <div style={styles.group}>
          {btn(
            icons.code,
            () => editor.chain().focus().toggleCodeBlock().run(),
            editor.isActive("codeBlock"),
            "Code block",
          )}
          {btn(
            icons.link,
            () => {
              setShowLinkModal(true);
              setLinkUrl("");
            },
            editor.isActive("link"),
            "Add link",
          )}
          {btn(
            icons.highlight,
            () => editor.chain().focus().toggleHighlight().run(),
            editor.isActive("highlight"),
            "Highlight",
          )}
          {btn(icons.pin, handleAddPinpoint, false, "Add pinpoint comment")}
        </div>

        {/* @ Mention help — right-aligned */}
        {showMentionHelp && (
          <>
            <span style={styles.divider} />
            <MentionHelpButton />
          </>
        )}

        <div style={styles.flexSpacer} />
        <WordCountDisplay editor={editor} />
      </div>

      {/* ── Pinpoint modal ── */}
      {showPinpointModal &&
        createPortal(
          <div
            className="seshat-flex-center"
            style={styles.overlay}
            onClick={() => setShowPinpointModal(false)}
          >
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
                          id: uid(),
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
                <button
                  onClick={() => setShowPinpointModal(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (pinpointComment.trim()) {
                      editor
                        .chain()
                        .focus()
                        .setPinPoint({
                          id: uid(),
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

      {showLinkModal && (
        <Modal title="Add Link" onClose={() => setShowLinkModal(false)}>
          <div style={{ padding: "0 var(--space-5) var(--space-5)" }}>
            <input
              autoFocus
              style={styles.textarea}
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (linkUrl)
                    editor.chain().focus().setLink({ href: linkUrl }).run();
                  setShowLinkModal(false);
                }
              }}
            />
            <div className="seshat-flex-end" style={styles.modalFooter}>
              <button
                onClick={() => setShowLinkModal(false)}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (linkUrl)
                    editor.chain().focus().setLink({ href: linkUrl }).run();
                  setShowLinkModal(false);
                }}
                style={styles.addBtn}
              >
                Add Link
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    marginBottom: "var(--space-3)",
  },
  container: {
    gap: 2,
    padding: "4px 0",
    borderBottom: "1px solid var(--border)",
    paddingBottom: 6,
    flexWrap: "wrap" as const,
  },
  group: {
    display: "flex",
    alignItems: "center",
    gap: 1,
  },
  btn: {
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    padding: "5px 6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.1s ease, color 0.1s ease",
  },
  divider: {
    width: 1,
    background: "var(--border)",
    margin: "0 5px",
    height: 14,
    flexShrink: 0,
  },
  flexSpacer: {
    flex: 1,
  },

  // ── Modals ─────────────────────────────────────────────────────────────────
  overlay: {
    position: "fixed" as const,
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
    resize: "none" as const,
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
    color: "#fff",
    fontWeight: 600,
  },
} satisfies Record<string, React.CSSProperties>;
