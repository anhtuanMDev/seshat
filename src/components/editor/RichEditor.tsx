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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "@legendapp/state/react";
import { appStore } from "../../store/appStore";
import { useActiveBookIdx } from "../../hooks/useWorldStore";
import type { Character, Event as AppEvent } from "../../lib/types";
import type { Editor } from "@tiptap/core";
import { DOMParser } from "@tiptap/pm/model";
import {
  buildMentionExtension,
  insertMentionAtRange,
  type MentionItem,
} from "./MentionExtension";
import { EntityMention } from "./EntityMentionNode";
import { PinPointExtension } from "./PinPointExtension";
import CharMentionTooltip from "./CharMentionTooltip";
import UnsavedGuard from "./UnsavedGuard";
import { MenuBar } from "./MenuBar";

interface RichEditorProps<T extends FieldValues = FieldValues> {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  control?: Control<T>;
  name?: Path<T>;
  characters?: Character[];
  events?: AppEvent[];
  pinnedEvents?: AppEvent[];
  pinnedCharIds?: string[];
  isDirty?: boolean;
  onSave?: () => void;
  bookId?: string;
}

interface ExtraEntity {
  id: string;
  name: string;
}

function buildMentionItems(
  trigger: string,
  characters: Character[],
  pinnedCharIds: string[],
  extraEntities: {
    nations: ExtraEntity[];
    monsters: ExtraEntity[];
    ingredients: ExtraEntity[];
    techniques: ExtraEntity[];
    treasures: ExtraEntity[];
  },
): MentionItem[] {
  const items: MentionItem[] = [];

  if (trigger === "@") {
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
      items.push({ id: n.id, name: n.name, color: "#5e35b1", role: "Nation" }),
    );
  } else if (trigger === "%") {
    extraEntities.monsters.forEach((m) =>
      items.push({ id: m.id, name: m.name, color: "#d32f2f", role: "Monster" }),
    );
  } else if (trigger === "~") {
    extraEntities.ingredients.forEach((i) =>
      items.push({ id: i.id, name: i.name, color: "#388e3c", role: "Ingredient" }),
    );
  } else if (trigger === "^") {
    extraEntities.techniques.forEach((t) =>
      items.push({ id: t.id, name: t.name, color: "#0288d1", role: "Technique" }),
    );
  } else if (trigger === "$") {
    extraEntities.treasures.forEach((t) =>
      items.push({ id: t.id, name: t.name, color: "#fbc02d", role: "Treasure" }),
    );
  }

  return items;
}

/** Build the full scan list — uses ALL characters (ignores pin filter), Unicode-normalised. */
type ScanItem = MentionItem & { trigger: string };
function buildAllScanItems(
  characters: Character[],
  pinnedCharIds: string[],
  extraEntities: {
    nations: ExtraEntity[];
    monsters: ExtraEntity[];
    ingredients: ExtraEntity[];
    techniques: ExtraEntity[];
    treasures: ExtraEntity[];
  },
): ScanItem[] {
  // Only show pinned characters (if any are pinned), same logic as @ mention typing
  const chars = pinnedCharIds.length > 0
    ? characters.filter((c) => pinnedCharIds.includes(c.id))
    : characters;
  return [
    ...chars.map((c) => ({ id: c.id, name: c.name, color: c.color, role: c.role || "Character", trigger: "@" })),
    ...extraEntities.nations.map((n) => ({ id: n.id, name: n.name, color: "#5e35b1", role: "Nation", trigger: "#" })),
    ...extraEntities.monsters.map((m) => ({ id: m.id, name: m.name, color: "#d32f2f", role: "Monster", trigger: "%" })),
    ...extraEntities.ingredients.map((i) => ({ id: i.id, name: i.name, color: "#388e3c", role: "Ingredient", trigger: "~" })),
    ...extraEntities.techniques.map((t) => ({ id: t.id, name: t.name, color: "#0288d1", role: "Technique", trigger: "^" })),
    ...extraEntities.treasures.map((t) => ({ id: t.id, name: t.name, color: "#fbc02d", role: "Treasure", trigger: "$" })),
  ].filter((item) => !!item.name);
}

function filterScanItems(items: ScanItem[], query: string): ScanItem[] {
  if (!query) return items;
  const q = query.normalize("NFC").toLowerCase();
  return items.filter((item) => item.name.normalize("NFC").toLowerCase().includes(q));
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
    nodeLabel: string;
  } | null>(null);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanLinkDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [guard, setGuard] = useState<{ char: Character } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pinpoints, setPinpoints] = useState<
    { id: string; comment: string; top: number; node: HTMLElement }[]
  >([]);

  // ── Scan-and-link bubble state ─────────────────────────────────────────
  const [scanLink, setScanLink] = useState<{
    from: number;
    to: number;
    text: string;
    rect: {
      top: number;
      left: number;
      right: number;
      bottom: number;
      width: number;
    };
    query: string;
  } | null>(null);
  // pickerOpen = false → show only the tiny 'Link' pill
  // pickerOpen = true  → show the full entity-picker dropdown
  const [pickerOpen, setPickerOpen] = useState(false);

  const closeScanLink = () => { setScanLink(null); setPickerOpen(false); };

  // ── Smart link state ─────────────────────────────────────────
  const [smartLinkEntity, setSmartLinkEntity] = useState<(MentionItem & { trigger: string }) | null>(null);

  useEffect(() => {
    const handleInsert = (e: Event) => {
      const { item, trigger } = (e as CustomEvent).detail;
      setSmartLinkEntity({ ...item, trigger });
    };
    window.addEventListener("seshat-mention-inserted", handleInsert);
    return () => window.removeEventListener("seshat-mention-inserted", handleInsert);
  }, []);



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
    return buildMentionItems(trigger, characters, pinnedCharIds, extraEntities);
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
    editorProps: {
      handlePaste(view, event) {
        const text = event.clipboardData?.getData("text/plain");
        if (text) {
          const isHtml =
            /<\/?[a-z]+[^>]*>/i.test(text) &&
            (/<\/[a-z]+>/i.test(text) ||
              /<br\s*\/?>/i.test(text) ||
              /<img\s[^>]*\/?>/i.test(text));
          if (isHtml) {
            const parser = DOMParser.fromSchema(view.state.schema);
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = text;
            const slice = parser.parseSlice(tempDiv);
            view.dispatch(view.state.tr.replaceSelection(slice));
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
      updatePinpoints(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      // Always cancel the previous pending debounce
      if (scanLinkDebounce.current) clearTimeout(scanLinkDebounce.current);

      if (characters.length === 0) return;
      const { state } = editor;
      const { selection } = state;
      if (selection.empty) {
        closeScanLink();
        return;
      }
      const selectedText = state.doc
        .textBetween(selection.from, selection.to, " ")
        .trim();
      if (!selectedText) {
        closeScanLink();
        return;
      }
      // Debounce: only show the bubble once the selection has been stable for 400ms
      scanLinkDebounce.current = setTimeout(() => {
        const domRange = window.getSelection()?.getRangeAt(0);
        if (!domRange || domRange.collapsed) return;
        const rect = domRange.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        setPickerOpen(false); // Reset to pill-only each time selection changes
        setScanLink({
          from: selection.from,
          to: selection.to,
          text: selectedText,
          rect: {
            top: rect.top,
            left: rect.left,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
          },
          query: selectedText.toLowerCase(),
        });
      }, 400);
    },
  });

  useEffect(() => {
    if (!editor || !containerRef.current) return;
    const obs = new ResizeObserver(() => updatePinpoints(editor));
    obs.observe(containerRef.current);
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

  const hasAutoInitializedSmartLink = useRef(false);

  useEffect(() => {
    if (!editor || characters.length === 0 || hasAutoInitializedSmartLink.current) return;
    
    const t = setTimeout(() => {
      if (hasAutoInitializedSmartLink.current) return;
      hasAutoInitializedSmartLink.current = true;
      
      let found: (MentionItem & { trigger: string }) | null = null;
      editor.state.doc.descendants((node) => {
        if (found) return false;
        if (node.type.name === "entityMention") {
          const { id, trigger, label } = node.attrs;
          if (trigger === "@") {
            const char = characters.find(c => c.id === id);
            if (char) {
              found = { id: char.id, name: label || char.name, color: char.color, role: char.role || "Character", trigger: "@" };
            }
          }
        }
      });
      
      if (found && !smartLinkEntity) {
        setSmartLinkEntity(found);
      }
    }, 600); // Give the editor content time to mount and parse
    
    return () => clearTimeout(t);
  }, [editor, characters, smartLinkEntity]);

  // ── Hover + click on mention spans ────────────────────────────────────────
  useEffect(() => {
    if (!editor || !containerRef.current) return;
    const el = containerRef.current;

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
        const nodeLabel = target.getAttribute("data-label") || char.name;
        setTooltip({ char, anchor: target, x: rect.left, y: rect.bottom + 4, nodeLabel });
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

  const scanBubble = useMemo(() => {
    if (!scanLink || !editor) return null;

    const allItems = buildAllScanItems(characters, pinnedCharIds, extraEntities);
    const filtered = filterScanItems(allItems, scanLink.query);

    const bubbleCentreX = scanLink.rect.left + scanLink.rect.width / 2;
    const bubbleTop = scanLink.rect.top - 8;

    if (!pickerOpen) {
      // ── Phase 1: tiny non-intrusive pill ───────────────────────────────
      const pillLeft = Math.min(Math.max(4, bubbleCentreX - 44), window.innerWidth - 96);
      return createPortal(
        <div
          className="seshat-scan-pill"
          style={{
            position: "fixed",
            top: bubbleTop,
            left: pillLeft,
            transform: "translateY(-100%)",
            zIndex: 1200,
            display: "flex",
            alignItems: "center",
            gap: 1,
            background: "var(--bg-side)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            overflow: "hidden",
            fontFamily: "var(--font-serif)",
            fontSize: 11,
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-primary)",
              padding: "4px 10px",
              fontSize: 11,
              letterSpacing: 0.5,
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            onMouseDown={(e) => {
              e.preventDefault();
              setPickerOpen(true);
            }}
          >
            ⬡ Link entity
          </button>
          <button
            style={{
              background: "none",
              border: "none",
              borderLeft: "1px solid var(--border)",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "4px 7px",
              fontSize: 12,
              lineHeight: 1,
            }}
            onMouseDown={(e) => { e.preventDefault(); closeScanLink(); }}
          >
            ×
          </button>
        </div>,
        document.body,
      );
    }

    // ── Phase 2: full entity picker ─────────────────────────────────────
    const pickerLeft = Math.min(Math.max(8, bubbleCentreX - 120), window.innerWidth - 248);
    return createPortal(
      <div
        className="seshat-scan-bubble"
        style={{
          position: "fixed",
          top: bubbleTop,
          left: pickerLeft,
          transform: "translateY(-100%)",
          zIndex: 1200,
          background: "var(--bg-side)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
          minWidth: 230,
          maxWidth: 290,
          overflow: "hidden",
          fontFamily: "var(--font-serif)",
        }}
        onMouseDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div
          style={{
            padding: "7px 12px",
            fontSize: 10,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "var(--text-muted)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>Link "{scanLink.text}"</span>
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: 13,
              lineHeight: 1,
              padding: "0 2px",
            }}
            onMouseDown={(e) => { e.preventDefault(); closeScanLink(); }}
          >
            ×
          </button>
        </div>
        {/* Search box */}
        <div
          style={{
            padding: "6px 10px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <input
            autoFocus
            value={scanLink.query}
            onChange={(e) =>
              setScanLink((s) =>
                s ? { ...s, query: e.target.value } : null,
              )
            }
            placeholder={`Filter "${scanLink.text}"…`}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 12,
              color: "var(--text-primary)",
              fontFamily: "var(--font-serif)",
            }}
          />
        </div>
        {/* Entity list */}
        <div style={{ maxHeight: 200, overflowY: "auto" }}>
          {filtered.slice(0, 14).map((item) => (
            <div
              key={`${item.trigger}-${item.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 12px",
                cursor: "pointer",
                transition: "background 0.08s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "transparent";
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                if (!editor) return;
                insertMentionAtRange(
                  editor.view,
                  item,
                  scanLink.from,
                  scanLink.to,
                  item.trigger,
                  scanLink.text, // keep original text visible, not character's canonical name
                );
                closeScanLink();
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: item.color,
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
              <span
                style={{ fontSize: 13, color: "var(--text-primary)", flex: 1 }}
              >
                {item.name}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {item.role}
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div
              style={{
                padding: "10px 12px",
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              No entities match
            </div>
          )}
        </div>
      </div>,
      document.body,
    );
  }, [scanLink, pickerOpen, editor, characters, pinnedCharIds, extraEntities]);

  if (!editor) return null;

  const tooltipStyle = tooltip
    ? {
        ...styles.tooltipWrapper,
        top: tooltip.y,
        left: Math.min(tooltip.x, window.innerWidth - 300),
      }
    : undefined;

  return (
    <div ref={containerRef} style={styles.container}>
      <MenuBar
        editor={editor}
        showMentionHelp={characters.length > 0}
        smartLinkEntity={smartLinkEntity}
        onClearSmartLink={() => setSmartLinkEntity(null)}
      />
      <EditorContent editor={editor} />

      {tooltip &&
        createPortal(
          <div
            className="char-mention-tooltip"
            style={tooltipStyle}
            onMouseEnter={() => {
              if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
            }}
            onMouseLeave={() => {
              tooltipTimeout.current = setTimeout(() => setTooltip(null), 120);
            }}
          >
            <CharMentionTooltip
              char={tooltip.char}
              nodeLabel={tooltip.nodeLabel}
              events={events}
              pinnedEvents={pinnedEvents}
              anchorEl={tooltip.anchor}
              onClose={() => setTooltip(null)}
            />
          </div>,
          document.body,
        )}

      {/* Scan-and-link bubble */}
      {scanBubble}

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
        <div className="seshat-pinpoints-layer" style={styles.pinpointsLayer}>
          {pinpoints.map((p) => (
            <div
              key={p.id}
              title={p.comment}
              onClick={() => {
                p.node.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              style={{
                ...styles.pinpointDot,
                top: `${p.top}px`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
  },
  tooltipWrapper: {
    position: "fixed",
    zIndex: 1000,
  },
  pinpointsLayer: {
    position: "absolute",
    top: 0,
    right: -32,
    bottom: 0,
    width: 24,
    zIndex: 10,
  },
  pinpointDot: {
    position: "absolute",
    left: 0,
    width: 16,
    height: 16,
    backgroundColor: "var(--color-primary)",
    borderRadius: "50%",
    cursor: "pointer",
    transform: "translateY(-50%)",
    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
  },
} satisfies Record<string, React.CSSProperties>;

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
