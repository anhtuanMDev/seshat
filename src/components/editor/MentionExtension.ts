import { Extension, type Range } from "@tiptap/core";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorState } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

export interface MentionItem {
  id: string;
  name: string;
  color: string;
  role: string;
}

// ── Suggestion popup key ──────────────────────────────────────────────────
const suggestionKey = new PluginKey("mentionSuggestion");

interface SuggestionState {
  active: boolean;
  query: string;
  from: number;
  to: number;
}

// ── DOM popup element (singleton) ─────────────────────────────────────────
let popupEl: HTMLElement | null = null;

function getPopup(): HTMLElement {
  if (!popupEl) {
    popupEl = document.createElement("div");
    popupEl.id = "seshat-mention-popup";
    popupEl.style.cssText = `
      position: fixed;
      z-index: 9999;
      background: var(--bg-side, #faf9f7);
      border: 1px solid var(--border, #e0ddd8);
      border-radius: 4px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      font-family: Georgia, serif;
      min-width: 180px;
      max-width: 280px;
      max-height: 220px;
      overflow-y: auto;
      display: none;
    `;
    document.body.appendChild(popupEl);
  }
  return popupEl;
}

function hidePopup() {
  const el = getPopup();
  el.style.display = "none";
  el.innerHTML = "";
}

function showPopup(
  items: MentionItem[],
  coords: { top: number; left: number },
  onSelect: (item: MentionItem) => void,
  selectedIdx: number,
) {
  const el = getPopup();
  el.innerHTML = "";

  if (!items.length) {
    hidePopup();
    return;
  }

  items.forEach((item, i) => {
    const row = document.createElement("div");
    row.dataset.idx = String(i);
    row.style.cssText = `
      padding: 8px 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      background: ${i === selectedIdx ? "var(--bg-active, #f0ede8)" : "transparent"};
      transition: background 0.08s;
    `;

    const dot = document.createElement("span");
    dot.style.cssText = `
      width: 7px; height: 7px; border-radius: 50%;
      background: ${item.color}; flex-shrink: 0; display: inline-block;
    `;

    const nameEl = document.createElement("span");
    nameEl.style.cssText = `font-size: 13px; color: var(--text-primary, #1a1a1a);`;
    nameEl.textContent = item.name;

    const roleEl = document.createElement("span");
    roleEl.style.cssText = `font-size: 11px; color: var(--text-muted, #888); margin-left: auto;`;
    roleEl.textContent = item.role || "";

    row.appendChild(dot);
    row.appendChild(nameEl);
    if (item.role) row.appendChild(roleEl);

    row.addEventListener("mousedown", (e) => {
      e.preventDefault();
      onSelect(item);
    });
    row.addEventListener("mouseenter", () => {
      row.style.background = "var(--bg-hover, #f5f3f0)";
    });
    row.addEventListener("mouseleave", () => {
      row.style.background =
        i === selectedIdx ? "var(--bg-active, #f0ede8)" : "transparent";
    });

    el.appendChild(row);
  });

  el.style.display = "block";
  el.style.top = `${coords.top + 22}px`;
  el.style.left = `${coords.left}px`;
}

// ── Extension ─────────────────────────────────────────────────────────────
interface MentionOptions {
  mentionItems: MentionItem[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const Mention = Extension.create<MentionOptions, {}>({
  name: "mention",

  addOptions() {
    return { mentionItems: [] };
  },

  addProseMirrorPlugins() {
    const { mentionItems } = this.options;

    // ── Decoration plugin (renders @Name spans) ───────────────────────────
    const decorationPlugin = new Plugin({
      props: {
        decorations(state: EditorState) {
          const decorations: Decoration[] = [];
          state.doc.descendants((node, pos) => {
            if (node.type.name === "text" && node.text) {
              const text = node.text;
              const re = /@(\w[\w\s]*?)(?=\s|$|[^a-zA-Z0-9_ ])/g;
              let m: RegExpExecArray | null;
              while ((m = re.exec(text)) !== null) {
                const matched = m[0];
                const item = mentionItems.find(
                  (x) =>
                    x.name.toLowerCase() === m![1].toLowerCase() ||
                    matched.slice(1).toLowerCase() === x.name.toLowerCase(),
                );
                if (item) {
                  decorations.push(
                    Decoration.inline(
                      pos + m.index,
                      pos + m.index + matched.length,
                      {
                        class: "char-mention",
                        "data-id": item.id,
                        style: `color: ${item.color}; cursor: pointer;`,
                      },
                    ),
                  );
                }
              }
              // Also match exact names with spaces
              for (const item of mentionItems) {
                const escaped = item.name.replace(
                  /[.*+?^${}()|[\]\\]/g,
                  "\\$&",
                );
                const nameRe = new RegExp(`@${escaped}`, "gi");
                let nm: RegExpExecArray | null;
                while ((nm = nameRe.exec(text)) !== null) {
                  // Avoid double-decorating (already covered by simple \w+ match)
                  if (!item.name.includes(" ")) continue;
                  decorations.push(
                    Decoration.inline(
                      pos + nm.index,
                      pos + nm.index + nm[0].length,
                      {
                        class: "char-mention",
                        "data-id": item.id,
                        style: `color: ${item.color}; cursor: pointer;`,
                      },
                    ),
                  );
                }
              }
            }
          });
          return DecorationSet.create(state.doc, decorations);
        },
      },
    });

    // ── Suggestion plugin (@... dropdown) ────────────────────────────────
    let selectedIdx = 0;
    let currentItems: MentionItem[] = [];
    let currentRange: Range | null = null;

    const suggestionPlugin = new Plugin({
      key: suggestionKey,

      state: {
        init(): SuggestionState {
          return { active: false, query: "", from: 0, to: 0 };
        },
        apply(tr, prev): SuggestionState {
          const meta = tr.getMeta(suggestionKey);
          if (meta !== undefined) return meta;
          if (!prev.active) return prev;
          // update positions
          const from = tr.mapping.map(prev.from);
          const to = tr.mapping.map(prev.to);
          return { ...prev, from, to };
        },
      },

      props: {
        handleKeyDown(view: EditorView, event: KeyboardEvent): boolean {
          const state = suggestionKey.getState(view.state) as SuggestionState;
          if (!state.active) return false;

          if (event.key === "ArrowDown") {
            selectedIdx = (selectedIdx + 1) % currentItems.length;
            showPopup(
              currentItems,
              view.coordsAtPos(state.from),
              (item) => insertMention(view, item, currentRange!),
              selectedIdx,
            );
            return true;
          }
          if (event.key === "ArrowUp") {
            selectedIdx =
              (selectedIdx - 1 + currentItems.length) % currentItems.length;
            showPopup(
              currentItems,
              view.coordsAtPos(state.from),
              (item) => insertMention(view, item, currentRange!),
              selectedIdx,
            );
            return true;
          }
          if (event.key === "Enter" || event.key === "Tab") {
            if (currentItems[selectedIdx]) {
              insertMention(view, currentItems[selectedIdx], currentRange!);
              return true;
            }
          }
          if (event.key === "Escape") {
            hidePopup();
            view.dispatch(
              view.state.tr.setMeta(suggestionKey, {
                active: false,
                query: "",
                from: 0,
                to: 0,
              }),
            );
            return true;
          }
          return false;
        },

        handleClick(): boolean {
          hidePopup();
          return false;
        },
      },

      view() {
        return {
          update(view: EditorView) {
            const { state } = view;
            const { selection } = state;
            const { $from } = selection;

            // Find @query before cursor
            const textBefore = $from.parent.textContent.slice(
              0,
              $from.parentOffset,
            );
            const match = /@(\w[\w ]*)$/.exec(textBefore);

            if (match) {
              const query = match[1].toLowerCase();
              const from = $from.pos - match[0].length;
              const to = $from.pos;
              currentRange = { from, to };

              const filtered = mentionItems.filter((x) =>
                x.name.toLowerCase().startsWith(query),
              );
              currentItems = filtered;
              selectedIdx = 0;

              const coords = view.coordsAtPos(from);
              showPopup(
                filtered,
                coords,
                (item) => insertMention(view, item, { from, to }),
                selectedIdx,
              );

              view.dispatch(
                state.tr.setMeta(suggestionKey, {
                  active: true,
                  query,
                  from,
                  to,
                }),
              );
            } else {
              const pluginState = suggestionKey.getState(
                view.state,
              ) as SuggestionState;
              if (pluginState.active) {
                hidePopup();
                currentRange = null;
                view.dispatch(
                  view.state.tr.setMeta(suggestionKey, {
                    active: false,
                    query: "",
                    from: 0,
                    to: 0,
                  }),
                );
              }
            }
          },
          destroy() {
            hidePopup();
          },
        };
      },
    });

    return [decorationPlugin, suggestionPlugin];
  },
});

function insertMention(view: EditorView, item: MentionItem, range: Range) {
  const { state, dispatch } = view;
  const mentionText = `@${item.name}`;
  const tr = state.tr.replaceWith(
    range.from,
    range.to,
    state.schema.text(mentionText),
  );
  // Insert a space after the mention
  const insertPos = range.from + mentionText.length;
  tr.insertText(" ", insertPos);
  dispatch(tr);
  hidePopup();
  view.focus();
}

export function buildMentionExtension(mentionItems: MentionItem[]) {
  return Mention.configure({ mentionItems });
}
