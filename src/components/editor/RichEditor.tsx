import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";
import Placeholder from "@tiptap/extension-placeholder";
import { useController } from "react-hook-form";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Character, Event } from "../../lib/types";
import type { Editor } from "@tiptap/core";
import CharMentionTooltip from "./CharMentionTooltip";
import UnsavedGuard from "./UnsavedGuard";
import MentionHelpButton from "./MentionHelpButton";
import { buildMentionExtension } from "./MentionExtension";
import type { MentionItem } from "./MentionList";

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
    (label: string, action: () => void, active?: boolean) => (
      <button
        type="button"
        onClick={action}
        style={{
          background: active ? "var(--bg-active)" : "transparent",
          border: "none",
          borderRadius: 2,
          cursor: "pointer",
          fontSize: 12,
          padding: "2px 6px",
          color: "var(--text-secondary)",
          fontFamily: "'Georgia',serif",
          lineHeight: "20px",
        }}
      >
        {label}
      </button>
    ),
    [],
  );

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

      {/* @ mention help button — always shown when characters exist */}
      {showMentionHelp && (
        <>
          <span
            style={{ width: 1, background: "var(--border)", margin: "0 4px" }}
          />
          <MentionHelpButton />
        </>
      )}
    </div>
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

  // ── Mention list: pinned chars first, fall back to all ────────────────────
  const mentionItems: MentionItem[] = (() => {
    // Only offer pinned characters in @ if any are pinned, else all
    const pinned =
      pinnedCharIds.length > 0
        ? characters.filter((c) => pinnedCharIds.includes(c.id))
        : characters;
    return pinned.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      role: c.role,
    }));
  })();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Typography,
      Placeholder.configure({ placeholder: placeholder || "Write here…" }),
      buildMentionExtension(mentionItems),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

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
    <>
      <MenuBar editor={editor} showMentionHelp={characters.length > 0} />
      <EditorContent editor={editor} />

      {tooltip && (
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
        </div>
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
    </>
  );
}

// ── Controlled wrapper ────────────────────────────────────────────────────────
function ControlledRichEditor<T extends FieldValues>({
  control,
  name,
  ...props
}: RichEditorProps<T>) {
  const { field } = useController({ control: control!, name: name! });
  return (
    <RichEditorCore
      {...props}
      content={field.value ?? ""}
      onChange={(html: string) => field.onChange(html)}
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
