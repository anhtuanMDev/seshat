import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import MentionHelpButton from "./MentionHelpButton";
import { WordCountDisplay } from "./WordCountDisplay";
import { uid } from "../../lib/utils";
import { Modal } from "../ui/Modal";
import type { MentionItem } from "./MentionExtension";

interface MenuBarProps {
  editor: Editor;
  showMentionHelp: boolean;
  smartLinkEntity?: (MentionItem & { trigger: string }) | null;
  onClearSmartLink?: () => void;
}

export function MenuBar({ editor, showMentionHelp, smartLinkEntity, onClearSmartLink }: MenuBarProps) {
  const [showPinpointModal, setShowPinpointModal] = useState(false);
  const [pinpointComment, setPinpointComment] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

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

  const handleSmartLinkNext = useCallback(() => {
    if (!smartLinkEntity) return;
    const { state, view } = editor;
    const { selection } = state;
    const currentPos = selection.to;
    
    const escaped = smartLinkEntity.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    
    let matchAfter: { from: number, to: number } | null = null;
    let matchBefore: { from: number, to: number } | null = null;

    state.doc.descendants((node, pos) => {
      if (matchAfter) return false;
      if (node.isText) {
        const text = node.text || "";
        let match;
        while ((match = regex.exec(text)) !== null) {
          const from = pos + match.index;
          const to = from + match[0].length;
          
          if (from >= currentPos) {
            if (!matchAfter) matchAfter = { from, to };
          } else {
            if (!matchBefore) matchBefore = { from, to };
          }
        }
      }
    });

    const targetMatch = matchAfter || matchBefore;
    
    if (targetMatch) {
      view.dispatch(state.tr.setSelection(
        TextSelection.create(state.doc, targetMatch.from, targetMatch.to)
      ).scrollIntoView());
      view.focus();
    } else {
      onClearSmartLink?.();
    }
  }, [editor, smartLinkEntity, onClearSmartLink]);

  const handleSmartLinkAccept = useCallback(() => {
    if (!smartLinkEntity) return;
    const { state, view } = editor;
    const { selection } = state;
    
    const selectedText = state.doc.textBetween(selection.from, selection.to, " ");
    if (selectedText.toLowerCase() === smartLinkEntity.name.toLowerCase()) {
      const tr = state.tr.replaceWith(
        selection.from,
        selection.to,
        state.schema.nodes.entityMention.create({
          id: smartLinkEntity.id,
          trigger: smartLinkEntity.trigger,
          label: selectedText
        })
      );
      view.dispatch(tr);
      view.focus();
      setTimeout(handleSmartLinkNext, 10);
    } else {
      handleSmartLinkNext();
    }
  }, [editor, smartLinkEntity, handleSmartLinkNext]);

  const handleSmartLinkAcceptAll = useCallback(() => {
    if (!smartLinkEntity) return;
    const { state, view } = editor;
    const escaped = smartLinkEntity.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    
    let tr = state.tr;
    const matches: { from: number, to: number, text: string }[] = [];
    
    state.doc.descendants((node, pos) => {
      if (node.isText) {
        const text = node.text || "";
        let match;
        while ((match = regex.exec(text)) !== null) {
          matches.push({ from: pos + match.index, to: pos + match.index + match[0].length, text: match[0] });
        }
      }
    });

    matches.sort((a, b) => b.from - a.from);
    for (const m of matches) {
      tr = tr.replaceWith(
        m.from,
        m.to,
        state.schema.nodes.entityMention.create({
          id: smartLinkEntity.id,
          trigger: smartLinkEntity.trigger,
          label: m.text
        })
      );
    }
    view.dispatch(tr);
    view.focus();
    onClearSmartLink?.();
  }, [editor, smartLinkEntity, onClearSmartLink]);

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
          setShowLinkModal(true);
          setLinkUrl("");
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

      {/* Smart Link UI */}
      {smartLinkEntity && (
        <>
          <span style={styles.divider} />
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--bg-hover)", padding: "2px 6px", borderRadius: 4 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>🪄 {smartLinkEntity.name}</span>
            <button style={{ ...styles.btn, color: "var(--color-primary)", fontWeight: 500 }} onClick={handleSmartLinkNext} title="Find next">Next</button>
            <button style={{ ...styles.btn, color: "var(--color-primary)", fontWeight: 500 }} onClick={handleSmartLinkAccept} title="Replace and find next">Accept</button>
            <button style={{ ...styles.btn, color: "var(--color-primary)", fontWeight: 500 }} onClick={handleSmartLinkAcceptAll} title="Replace all in document">All</button>
            <button style={styles.btn} onClick={onClearSmartLink} title="Dismiss">×</button>
          </div>
        </>
      )}

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
                  if (linkUrl) editor.chain().focus().setLink({ href: linkUrl }).run();
                  setShowLinkModal(false);
                }
              }}
            />
            <div className="seshat-flex-end" style={styles.modalFooter}>
              <button onClick={() => setShowLinkModal(false)} style={styles.cancelBtn}>
                Cancel
              </button>
              <button
                onClick={() => {
                  if (linkUrl) editor.chain().focus().setLink({ href: linkUrl }).run();
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
