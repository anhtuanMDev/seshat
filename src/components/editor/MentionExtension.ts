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
      font-family: var(--font-serif);
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

export function hidePopup() {
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
  getMentionItems: (trigger: string) => MentionItem[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const Mention = Extension.create<MentionOptions, {}>({
  name: "mention",

  addOptions() {
    return { getMentionItems: () => [] };
  },

  addProseMirrorPlugins() {
    const { getMentionItems } = this.options;

    // ── Decoration plugin (renders @Name spans) ───────────────────────────
    const decorationPlugin = new Plugin({
      props: {
        decorations: (state: EditorState) => {
          const decorations: Decoration[] = [];
          // Pre-fetch lists for each trigger so we can sort them once
          const triggers = ["@", "#", "%", "~", "^", "$"];
          const listsByTrigger: Record<string, MentionItem[]> = {};
          
          for (const t of triggers) {
            const items = getMentionItems(t) || [];
            listsByTrigger[t] = [...items].sort((a, b) => b.name.length - a.name.length);
          }

          state.doc.descendants((node, pos) => {
            if (node.type.name === "text" && node.text) {
              const text = node.text;
              const textLower = text.toLowerCase();
              let searchIdx = 0;

              while (searchIdx < text.length) {
                // Find next trigger character
                const subStr = text.slice(searchIdx);
                const match = subStr.match(/([@#%~^$])/);
                if (!match || match.index === undefined) break;

                const atIdx = searchIdx + match.index;
                const trigger = match[1];
                const sortedItems = listsByTrigger[trigger];

                let matchedItem: MentionItem | null = null;
                
                for (const item of sortedItems) {
                  const nameLen = item.name.length;
                  const candidate = textLower.slice(atIdx + 1, atIdx + 1 + nameLen);
                  
                  if (candidate === item.name.toLowerCase()) {
                    // Ensure it matches a boundary at the end (e.g. @Ali doesn't match @Alice)
                    const nextChar = text[atIdx + 1 + nameLen];
                    const isBoundary = !nextChar || /[^\w]/.test(nextChar);
                    
                    if (isBoundary) {
                      matchedItem = item;
                      break;
                    }
                  }
                }

                if (matchedItem) {
                  const matchLen = 1 + matchedItem.name.length;
                  decorations.push(
                    Decoration.inline(
                      pos + atIdx,
                      pos + atIdx + matchLen,
                      {
                        class: "char-mention",
                        "data-id": matchedItem.id,
                        style: `color: ${matchedItem.color}; cursor: pointer;`,
                      }
                    )
                  );
                  searchIdx = atIdx + matchLen;
                } else {
                  searchIdx = atIdx + 1;
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
    let currentTrigger = "";

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
              view.coordsAtPos(state.to),
              (item) => insertMention(view, item, currentRange!, currentTrigger),
              selectedIdx,
            );
            return true;
          }
          if (event.key === "ArrowUp") {
            selectedIdx =
              (selectedIdx - 1 + currentItems.length) % currentItems.length;
            showPopup(
              currentItems,
              view.coordsAtPos(state.to),
              (item) => insertMention(view, item, currentRange!, currentTrigger),
              selectedIdx,
            );
            return true;
          }
          if (event.key === "Enter" || event.key === "Tab") {
            if (currentItems[selectedIdx]) {
              insertMention(view, currentItems[selectedIdx], currentRange!, currentTrigger);
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
        handleDOMEvents: {
          blur(view) {
            hidePopup();
            const state = suggestionKey.getState(view.state) as SuggestionState;
            if (state.active) {
              view.dispatch(
                view.state.tr.setMeta(suggestionKey, {
                  active: false,
                  query: "",
                  from: 0,
                  to: 0,
                })
              );
            }
            return false;
          },
        },
      },

      view() {
        return {
          update(view: EditorView) {
            const { state } = view;
            const { selection } = state;
            const { $from } = selection;

            // Find trigger query before cursor
            const textBefore = $from.parent.textContent.slice(
              0,
              $from.parentOffset,
            );
            let match = /([@#%~^$])([\w ]*)$/.exec(textBefore);

            if (match) {
              const trigger = match[1];
              const query = match[2].toLowerCase();
              
              const mentionItems = getMentionItems(trigger);
              const filtered = mentionItems.filter((x) =>
                x.name.toLowerCase().startsWith(query),
              );

              // If there are no matches and the query ends with a space, it means the user 
              // is just typing a normal sentence after a valid or invalid mention. Close the popup.
              if (filtered.length === 0 && query.includes(" ")) {
                match = null;
              }
              
              if (match) {
                const from = $from.pos - match[0].length;
                const to = $from.pos;
                currentRange = { from, to };
                currentTrigger = trigger;

                currentItems = filtered;
                selectedIdx = 0;

                const coords = view.coordsAtPos(to);
                showPopup(
                  filtered,
                  coords,
                  (item) => insertMention(view, item, { from, to }, trigger),
                  selectedIdx,
                );

                const pluginState = suggestionKey.getState(view.state) as SuggestionState;
                const needsUpdate = 
                  !pluginState.active || 
                  pluginState.query !== query || 
                  pluginState.from !== from || 
                  pluginState.to !== to;

                if (needsUpdate) {
                  view.dispatch(
                    state.tr.setMeta(suggestionKey, {
                      active: true,
                      query,
                      from,
                      to,
                    }),
                  );
                }
              }
            } 
            
            if (!match) {
              const pluginState = suggestionKey.getState(
                view.state,
              ) as SuggestionState;
              if (pluginState.active) {
                hidePopup();
                currentRange = null;
                currentTrigger = "";
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
            if (popupEl && popupEl.parentNode) {
              popupEl.parentNode.removeChild(popupEl);
              popupEl = null;
            }
          },
        };
      },
    });

    return [decorationPlugin, suggestionPlugin];
  },
});

function insertMention(view: EditorView, item: MentionItem, range: Range, trigger: string) {
  const { state, dispatch } = view;
  const tr = state.tr.replaceWith(
    range.from,
    range.to,
    state.schema.nodes.entityMention.create({
      id: item.id,
      trigger: trigger,
      label: item.name
    })
  );
  // Insert a space after the mention
  const insertPos = range.from + 1; // Since node size is 1
  tr.insertText(" ", insertPos);
  dispatch(tr);
  hidePopup();
  view.focus();
}

export function buildMentionExtension(getMentionItems: (trigger: string) => MentionItem[]) {
  return Mention.configure({ getMentionItems });
}
