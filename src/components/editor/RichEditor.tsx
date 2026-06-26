import { useEditor, EditorContent } from "@tiptap/react";
import { createPortal } from "react-dom";
import { TextSelection } from "@tiptap/pm/state";
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
  const [smartLinkEntities, setSmartLinkEntities] = useState<(MentionItem & { trigger: string })[]>([]);
  const [activeSmartLinkIdx, setActiveSmartLinkIdx] = useState(0);

  const smartLinkEntity = smartLinkEntities[activeSmartLinkIdx] || null;

  useEffect(() => {
    const handleInsert = (e: Event) => {
      const { item, trigger } = (e as CustomEvent).detail;
      setSmartLinkEntities((prev) => {
        const existingIdx = prev.findIndex((p) => p.id === item.id);
        if (existingIdx >= 0) {
          setActiveSmartLinkIdx(existingIdx);
          return prev;
        }
        setActiveSmartLinkIdx(prev.length);
        return [...prev, { ...item, trigger }];
      });
    };
    window.addEventListener("seshat-mention-inserted", handleInsert);
    return () => window.removeEventListener("seshat-mention-inserted", handleInsert);
  }, []);

  const removeCurrentSmartLink = useCallback(() => {
    setSmartLinkEntities((prev) => {
      const next = prev.filter((_, i) => i !== activeSmartLinkIdx);
      return next;
    });
    setActiveSmartLinkIdx((curr) => Math.max(0, curr - 1));
  }, [activeSmartLinkIdx]);





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
      StarterKit.configure({
        link: false,
        underline: false,
      }),
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
      handleKeyDown(view, event) {
        console.log(`[EDITOR EVENT] KeyDown: key="${event.key}" code="${event.code}"`);
        console.log(`[EDITOR STATE] Selection: from=${view.state.selection.from} to=${view.state.selection.to} empty=${view.state.selection.empty}`);
        console.log(`[EDITOR STATE] Active DOM Element:`, document.activeElement);
        // Let ProseMirror handle the event normally
        return false;
      },
      handlePaste(view, event) {
        console.log(`[EDITOR EVENT] Paste`);
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
    onUpdate: ({ editor, transaction }) => {
      console.log(`[EDITOR UPDATE] Document changed! Steps:`, transaction.steps.length);
      onChange?.(editor.getHTML());
      updatePinpoints(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      // Always cancel the previous pending debounce
      if (scanLinkDebounce.current) clearTimeout(scanLinkDebounce.current);

      if (characters.length === 0) return;
      const { state } = editor;
      const { selection } = state;
      
      console.log(`[EDITOR EVENT] SelectionUpdate: from=${selection.from} to=${selection.to} empty=${selection.empty}`);
      
      if (selection.empty) {
        closeScanLink();
        return;
      }

      // ⚠️ Bail out if the selection spans any entityMention atom nodes.
      // Calling textBetween across an atom causes ProseMirror to insert a
      // separator into the doc, which triggers a phantom document-change
      // and collapses the selection — this was the root cause of lost keystrokes.
      let selectionContainsMention = false;
      state.doc.nodesBetween(selection.from, selection.to, (node) => {
        if (node.type.name === "entityMention") {
          selectionContainsMention = true;
          return false;
        }
      });
      if (selectionContainsMention) {
        console.log(`[EDITOR EVENT] SelectionUpdate SKIPPED — selection spans an entityMention node`);
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

  // ── Smart link navigation handlers ─────────────────────────────
  const handleSmartLinkNext = useCallback(() => {
    if (!smartLinkEntity || !editor) return;
    const { state, view } = editor;
    const currentPos = state.selection.to;
    const escaped = smartLinkEntity.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    let matchAfter: { from: number; to: number } | null = null;
    let matchBefore: { from: number; to: number } | null = null;
    state.doc.descendants((node, pos) => {
      if (matchAfter) return false;
      if (node.isText) {
        const text = node.text || "";
        let m;
        while ((m = regex.exec(text)) !== null) {
          const from = pos + m.index;
          const to = from + m[0].length;
          if (from >= currentPos) { if (!matchAfter) matchAfter = { from, to }; }
          else { if (!matchBefore) matchBefore = { from, to }; }
        }
      }
    });
    const target = matchAfter || matchBefore;
    if (target) {
      view.dispatch(state.tr.setSelection(TextSelection.create(state.doc, target.from, target.to)).scrollIntoView());
      view.focus();
    } else {
      removeCurrentSmartLink();
    }
  }, [editor, smartLinkEntity, removeCurrentSmartLink]);

  const handleSmartLinkAccept = useCallback(() => {
    if (!smartLinkEntity || !editor) return;
    const { state, view } = editor;
    const { selection } = state;
    const selectedText = state.doc.textBetween(selection.from, selection.to, " ");
    if (selectedText.toLowerCase() === smartLinkEntity.name.toLowerCase()) {
      const tr = state.tr.replaceWith(
        selection.from, selection.to,
        state.schema.nodes.entityMention.create({
          id: smartLinkEntity.id,
          trigger: smartLinkEntity.trigger,
          label: selectedText,
          scanned: true,
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
    if (!smartLinkEntity || !editor) return;
    const { state, view } = editor;
    const escaped = smartLinkEntity.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    let tr = state.tr;
    const matches: { from: number; to: number; text: string }[] = [];
    state.doc.descendants((node, pos) => {
      if (node.isText) {
        const text = node.text || "";
        let m;
        while ((m = regex.exec(text)) !== null) {
          matches.push({ from: pos + m.index, to: pos + m.index + m[0].length, text: m[0] });
        }
      }
    });
    matches.sort((a, b) => b.from - a.from);
    for (const match of matches) {
      tr = tr.replaceWith(match.from, match.to,
        state.schema.nodes.entityMention.create({
          id: smartLinkEntity.id,
          trigger: smartLinkEntity.trigger,
          label: match.text,
          scanned: true,
        })
      );
    }
    view.dispatch(tr);
    view.focus();
    removeCurrentSmartLink();
  }, [editor, smartLinkEntity, removeCurrentSmartLink]);

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
      
      const allItems = buildAllScanItems(characters, [], extraEntities);
      let found: (MentionItem & { trigger: string }) | null = null;
      
      editor.state.doc.descendants((node) => {
        if (found) return false;
        if (node.type.name === "entityMention") {
          const { id, trigger, label } = node.attrs;
          const matched = allItems.find(item => item.id === id && item.trigger === trigger);
          if (matched) {
            found = { ...matched, name: label || matched.name };
          }
        }
      });
      
      if (found && smartLinkEntities.length === 0) {
        setSmartLinkEntities([found]);
        setActiveSmartLinkIdx(0);
      }
    }, 600); // Give the editor content time to mount and parse
    
    return () => clearTimeout(t);
  }, [editor, characters, extraEntities, smartLinkEntities.length]);

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
      />
      <EditorContent editor={editor} />

      {/* Smart Link floating bar — fixed portal so it persists during scroll */}
      {smartLinkEntity && editor && createPortal(
        <div style={floatingSmartBarStyle}>
          <div style={floatingSmartBarLeft}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M17.8 6.2 19 5M3 21l9-9M12.2 6.2 11 5" />
            </svg>
            <span style={floatingSmartLabel}>Smart Link</span>
            <span style={{ ...floatingSmartName, color: smartLinkEntity.color || "var(--color-primary)" }}>
              {smartLinkEntity.name}
            </span>
          </div>
          <div style={floatingSmartActions}>
            <button style={floatingSmartBtn} title="Jump to next occurrence" onClick={handleSmartLinkNext}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-active)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              Next
            </button>
            <button style={floatingSmartBtnPrimary} title="Link this occurrence and jump to next" onClick={handleSmartLinkAccept}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              Accept
            </button>
            <button style={{ ...floatingSmartBtnPrimary, opacity: 0.82 }} title="Link all occurrences in this chapter" onClick={handleSmartLinkAcceptAll}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.82"; }}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" /></svg>
              Accept All
            </button>
            <button style={floatingSmartDismiss} title="Dismiss Smart Link" onClick={removeCurrentSmartLink}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-active)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
          
          {/* Queue Navigation */}
          {smartLinkEntities.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8, paddingLeft: 8, borderLeft: "1px solid var(--border)" }}>
              {smartLinkEntities.map((entity, i) => (
                <button
                  key={entity.id}
                  onClick={() => setActiveSmartLinkIdx(i)}
                  title={`Switch to ${entity.name}`}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    background: i === activeSmartLinkIdx ? (entity.color || "var(--color-primary)") : "var(--border)",
                    opacity: i === activeSmartLinkIdx ? 1 : 0.5,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = i === activeSmartLinkIdx ? "1" : "0.5"; }}
                />
              ))}
            </div>
          )}
        </div>,
        document.body,
      )}

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

// ── Floating Smart Link bar styles (fixed portal) ────────────────────────────
const floatingSmartBarStyle: React.CSSProperties = {
  position: "fixed",
  bottom: 24,
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  background: "var(--bg-side)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
  zIndex: 1100,
  flexWrap: "wrap",
  maxWidth: "90vw",
};
const floatingSmartBarLeft: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexShrink: 0,
  color: "var(--text-muted)",
};
const floatingSmartLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
};
const floatingSmartName: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "var(--font-serif)",
};
const floatingSmartActions: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
};
const floatingSmartBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  border: "1px solid var(--border)",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 11,
  padding: "3px 9px",
  background: "transparent",
  color: "var(--text-secondary)",
  fontWeight: 500,
  transition: "background 0.1s ease",
};
const floatingSmartBtnPrimary: React.CSSProperties = {
  ...floatingSmartBtn,
  background: "var(--color-primary)",
  border: "1px solid transparent",
  color: "var(--bg-app)",
};
const floatingSmartDismiss: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  padding: "4px 5px",
  background: "transparent",
  color: "var(--text-muted)",
  transition: "background 0.1s ease",
  marginLeft: 2,
};

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
