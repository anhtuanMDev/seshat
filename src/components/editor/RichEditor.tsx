import { useEditor, EditorContent } from "@tiptap/react";
import { createPortal } from "react-dom";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";
import Placeholder from "@tiptap/extension-placeholder";
import { Controller } from "react-hook-form";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "@legendapp/state/react";
import { appStore } from "../../store/appStore";
import { useActiveBookIdx } from "../../hooks/useWorldStore";
import type { Character, Event } from "../../lib/types";
import type { Editor } from "@tiptap/core";
import { buildMentionExtension, type MentionItem } from "./MentionExtension";
import { EntityMention } from "./EntityMentionNode";
import { PinPointExtension } from "./PinPointExtension";
import CharMentionTooltip from "./CharMentionTooltip";
import UnsavedGuard from "./UnsavedGuard";
import MentionHelpButton from "./MentionHelpButton";

interface RichEditorProps<T extends FieldValues = FieldValues> {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  control?: Control<T>;
  name?: Path<T>;
  characters?: Character[];
  events?: Event[];
  pinnedEvents?: Event[];
  pinnedCharIds?: string[];
  isDirty?: boolean;
  onSave?: () => void;
  bookId?: string;
}

// ── MenuBar ───────────────────────────────────────────────────────────────────
function MenuBar({
  editor,
  showMentionHelp,
}: {
  editor: Editor;
  showMentionHelp: boolean;
}) {
  const btn = useCallback(
    (label: string, action: () => void, active?: boolean, title?: string) => (
      <button
        type="button"
        title={title}
        onClick={action}
        style={{
          background: active ? "var(--bg-active)" : "transparent",
          border: "none",
          borderRadius: 2,
          cursor: "pointer",
          fontSize: 12,
          padding: "2px 6px",
          color: "var(--text-secondary)",
          fontFamily: "var(--font-serif)",
          lineHeight: "20px",
        }}
      >
        {label}
      </button>
    ),
    [],
  );

  const [showPinpointModal, setShowPinpointModal] = useState(false);
  const [pinpointComment, setPinpointComment] = useState("");

  const handleAddPinpoint = useCallback(() => {
    setShowPinpointModal(true);
    setPinpointComment("");
  }, []);

  return (
    <div
      style={{
        display: "flex",
        gap: 1,
        padding: "6px 0",
        borderBottom: "1px solid var(--border)",
        marginBottom: 12,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
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
      <span
        style={{ width: 1, background: "var(--border)", margin: "0 4px" }}
      />
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
      <span
        style={{ width: 1, background: "var(--border)", margin: "0 4px" }}
      />
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
      <span
        style={{ width: 1, background: "var(--border)", margin: "0 4px" }}
      />
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
      <span
        style={{ width: 1, background: "var(--border)", margin: "0 4px" }}
      />
      {btn("📍", handleAddPinpoint, false, "Add Pinpoint Comment")}

      {/* @ mention help button — always shown when characters exist */}
      {showMentionHelp && (
        <>
          <span
            style={{ width: 1, background: "var(--border)", margin: "0 4px" }}
          />
          <MentionHelpButton />
        </>
      )}

      {/* Removed Continuity AI Checker */}

      <div style={{ flex: 1 }} />
      <WordCountDisplay editor={editor} />

      {showPinpointModal &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
            onClick={() => setShowPinpointModal(false)}
          >
            <div
              style={{
                background: "var(--bg-app)",
                padding: 24,
                borderRadius: 8,
                width: 400,
                border: "1px solid var(--border)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ margin: "0 0 16px 0", fontSize: 16 }}>
                Add Pinpoint
              </h3>
              <textarea
                autoFocus
                rows={3}
                style={{
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
                }}
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
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
              >
                <button
                  onClick={() => setShowPinpointModal(false)}
                  style={{
                    padding: "6px 12px",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                  }}
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
                          id: crypto.randomUUID(),
                          comment: pinpointComment.trim(),
                        })
                        .run();
                    }
                    setShowPinpointModal(false);
                  }}
                  style={{
                    padding: "6px 12px",
                    background: "var(--color-purple)",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    color: "#fff",
                    fontWeight: 600,
                  }}
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

// ── Word Count ────────────────────────────────────────────────────────────────

function WordCountDisplay({ editor }: { editor: Editor }) {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const handleUpdate = () => forceUpdate({});
    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor]);

  const text = editor.getText().trim();
  const wordCount = text === "" ? 0 : text.split(/\s+/).length;

  return (
    <span
      style={{
        fontSize: 11,
        color: "var(--text-muted)",
        letterSpacing: 1,
        paddingRight: 4,
        fontFamily: "var(--font-serif)",
      }}
    >
      {wordCount.toLocaleString()} w
    </span>
  );
}

// ── Core ──────────────────────────────────────────────────────────────────────
type RichEditorCoreProps = Omit<
  RichEditorProps<FieldValues>,
  "control" | "name"
>;

function RichEditorCore({
  content,
  onChange,
  placeholder,
  characters = [],
  events = [],
  pinnedEvents = [],
  pinnedCharIds = [],
  isDirty = false,
  onSave,
  bookId,
}: RichEditorCoreProps) {
  const navigate = useNavigate();

  const [tooltip, setTooltip] = useState<{
    char: Character;
    anchor: HTMLElement;
    x: number;
    y: number;
  } | null>(null);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [guard, setGuard] = useState<{ char: Character } | null>(null);
  const isSyncingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pinpoints, setPinpoints] = useState<
    { id: string; comment: string; top: number; node: HTMLElement }[]
  >([]);

  const bookIdx = useActiveBookIdx();
  const extraEntities = useSelector(() => {
    if (bookIdx < 0)
      return {
        nations: [],
        monsters: [],
        ingredients: [],
        techniques: [],
        treasures: [],
      };
    const b = appStore.books[bookIdx];
    return {
      nations: b.nations?.get() || [],
      monsters: b.monsters?.get() || [],
      ingredients: b.ingredients?.get() || [],
      techniques: b.techniques?.get() || [],
      treasures: b.treasures?.get() || [],
    };
  });

  // Keep a stable ref to the latest dependencies so the mention getter
  // doesn't suffer from stale closures (since Tiptap only configures it once)
  const mentionDepsRef = useRef({ characters, pinnedCharIds, extraEntities });
  useEffect(() => {
    mentionDepsRef.current = { characters, pinnedCharIds, extraEntities };
  }, [characters, pinnedCharIds, extraEntities]);

  // ── Mention list builder based on trigger ─────────────────────────────────
  const getMentionItems = useCallback((trigger: string): MentionItem[] => {
    const { characters, pinnedCharIds, extraEntities } = mentionDepsRef.current;
    const items: MentionItem[] = [];

    if (trigger === "@") {
      // Original logic: Only offer pinned characters if any are pinned, else all
      const pinned =
        pinnedCharIds.length > 0
          ? characters.filter((c) => pinnedCharIds.includes(c.id))
          : characters;
      pinned.forEach((c) =>
        items.push({
          id: c.id,
          name: c.name,
          color: c.color,
          role: c.role || "Character",
        }),
      );
    } else if (trigger === "#") {
      extraEntities.nations.forEach((n) =>
        items.push({
          id: n.id,
          name: n.name,
          color: "#5e35b1",
          role: "Nation",
        }),
      );
    } else if (trigger === "%") {
      extraEntities.monsters.forEach((m) =>
        items.push({
          id: m.id,
          name: m.name,
          color: "#d32f2f",
          role: "Monster",
        }),
      );
    } else if (trigger === "~") {
      extraEntities.ingredients.forEach((i) =>
        items.push({
          id: i.id,
          name: i.name,
          color: "#388e3c",
          role: "Ingredient",
        }),
      );
    } else if (trigger === "^") {
      extraEntities.techniques.forEach((t) =>
        items.push({
          id: t.id,
          name: t.name,
          color: "#0288d1",
          role: "Technique",
        }),
      );
    } else if (trigger === "$") {
      extraEntities.treasures.forEach((t) =>
        items.push({
          id: t.id,
          name: t.name,
          color: "#fbc02d",
          role: "Treasure",
        }),
      );
    }

    return items;
  }, []);

  const updatePinpoints = useCallback((editorInstance: Editor) => {
    if (!editorInstance || !containerRef.current) return;
    const el = editorInstance.view.dom;
    const nodes = Array.from(el.querySelectorAll("span.seshat-pinpoint-node"));

    const containerTop = containerRef.current.getBoundingClientRect().top;

    const newPinpoints = nodes.map((node) => {
      const n = node as HTMLElement;
      // Get exact pixel offset from the top of the RichEditor container
      const relativeTop = n.getBoundingClientRect().top - containerTop;

      return {
        id: n.getAttribute("data-id") || "",
        comment: n.getAttribute("data-comment") || "",
        top: relativeTop,
        node: n,
      };
    });
    setPinpoints(newPinpoints);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Typography,
      Placeholder.configure({
        placeholder: placeholder || "Write here…",
        emptyEditorClass: "is-editor-empty",
      }),
      // eslint-disable-next-line react-hooks/refs
      buildMentionExtension(getMentionItems),
      EntityMention,
      PinPointExtension,
    ],
    content,
    onUpdate: ({ editor }) => {
      if (isSyncingRef.current) return;
      onChange?.(editor.getHTML());
      updatePinpoints(editor);
    },
  });

  useEffect(() => {
    if (!editor || !containerRef.current) return;
    const obs = new ResizeObserver(() => updatePinpoints(editor));
    obs.observe(containerRef.current);
    obs.observe(editor.view.dom);
    return () => obs.disconnect();
  }, [editor, updatePinpoints]);

  // Sync external content changes (e.g. from lazy load or form reset) into the editor
  useEffect(() => {
    if (editor && content !== undefined) {
      const current = editor.getHTML();
      if (current !== content && !(current === "<p></p>" && content === "")) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
    }
  }, [editor, content]);

  // ── Hover + click on mention spans ────────────────────────────────────────
  useEffect(() => {
    if (!editor) return;
    const el = editor.view.dom as HTMLElement;

    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(
        ".char-mention",
      ) as HTMLElement | null;
      if (!target) return;
      const id = target.getAttribute("data-id");
      const char = characters.find((c) => c.id === id);
      if (!char) return;
      if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
      tooltipTimeout.current = setTimeout(() => {
        const rect = target.getBoundingClientRect();
        setTooltip({ char, anchor: target, x: rect.left, y: rect.bottom + 4 });
      }, 120);
    };

    const handleMouseOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (related?.closest?.(".char-mention-tooltip")) return;
      if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
      tooltipTimeout.current = setTimeout(() => setTooltip(null), 180);
    };

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(
        ".char-mention",
      ) as HTMLElement | null;
      if (!target) return;
      e.preventDefault();
      const id = target.getAttribute("data-id");
      const char = characters.find((c) => c.id === id);
      if (!char || !bookId) return;
      setTooltip(null);
      if (isDirty) {
        setGuard({ char });
      } else {
        navigate(`/book/${bookId}/characters/${char.id}`);
      }
    };

    el.addEventListener("mouseover", handleMouseOver);
    el.addEventListener("mouseout", handleMouseOut);
    el.addEventListener("click", handleClick);
    return () => {
      el.removeEventListener("mouseover", handleMouseOver);
      el.removeEventListener("mouseout", handleMouseOut);
      el.removeEventListener("click", handleClick);
      if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    };
  }, [editor, characters, isDirty, bookId, navigate]);

  if (!editor) return null;

  return (
    <div style={{ position: "relative" }}>
      <MenuBar editor={editor} showMentionHelp={characters.length > 0} />
      <EditorContent editor={editor} />

      {tooltip &&
        createPortal(
          <div
            className="char-mention-tooltip"
            style={{
              position: "fixed",
              top: tooltip.y,
              left: Math.min(tooltip.x, window.innerWidth - 300),
              zIndex: 1000,
            }}
            onMouseEnter={() => {
              if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
            }}
            onMouseLeave={() => {
              tooltipTimeout.current = setTimeout(() => setTooltip(null), 120);
            }}
          >
            <CharMentionTooltip
              char={tooltip.char}
              events={events}
              pinnedEvents={pinnedEvents}
              anchorEl={tooltip.anchor}
              onClose={() => setTooltip(null)}
            />
          </div>,
          document.body,
        )}

      {guard && (
        <UnsavedGuard
          characterName={guard.char.name}
          onCancel={() => setGuard(null)}
          onDiscard={() => {
            const char = guard.char;
            setGuard(null);
            navigate(`/book/${bookId}/characters/${char.id}`);
          }}
          onSaveFirst={() => {
            const char = guard.char;
            setGuard(null);
            onSave?.();
            setTimeout(() => {
              navigate(`/book/${bookId}/characters/${char.id}`);
            }, 80);
          }}
        />
      )}

      {pinpoints.length > 0 && (
        <div
          className="seshat-pinpoints-layer"
          style={{
            position: "absolute",
            top: 0,
            right: -32,
            bottom: 0,
            width: 24,
            zIndex: 10,
          }}
        >
          {pinpoints.map((p) => (
            <div
              key={p.id}
              title={p.comment}
              onClick={() => {
                p.node.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              style={{
                position: "absolute",
                top: `${p.top}px`,
                left: 0,
                width: 16,
                height: 16,
                backgroundColor: "var(--color-purple)",
                borderRadius: "50%",
                cursor: "pointer",
                transform: "translateY(-50%)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Controlled wrapper ────────────────────────────────────────────────────────
function ControlledRichEditor<T extends FieldValues>({
  control,
  name,
  ...props
}: RichEditorProps<T>) {
  return (
    <Controller
      control={control}
      name={name!}
      render={({ field }) => (
        <RichEditorCore
          {...props}
          content={field.value ?? ""}
          onChange={(html: string) => field.onChange(html)}
        />
      )}
    />
  );
}

export default function RichEditor<T extends FieldValues = FieldValues>({
  control,
  name,
  ...props
}: RichEditorProps<T>) {
  if (control && name) {
    return <ControlledRichEditor<T> control={control} name={name} {...props} />;
  }
  return <RichEditorCore {...props} />;
}
