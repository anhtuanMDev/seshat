
import { Node } from "@tiptap/core";
import { appStore } from "../../store/appStore";

export const EntityMention = Node.create({
  name: "entityMention",
  group: "inline",
  inline: true,
  selectable: false,
  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-mention-id"),
        renderHTML: (attrs) => {
          if (!attrs.id) return {};
          return { "data-mention-id": attrs.id };
        },
      },
      trigger: {
        default: "@",
        parseHTML: (el) => el.getAttribute("data-trigger") || "@",
        renderHTML: (attrs) => ({ "data-trigger": attrs.trigger }),
      },
      label: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-label"),
        renderHTML: (attrs) => {
          if (!attrs.label) return {};
          return { "data-label": attrs.label };
        },
      },
      scanned: {
        default: false,
        parseHTML: (el) => el.getAttribute("data-scanned") === "true",
        renderHTML: (attrs) => ({ "data-scanned": attrs.scanned ? "true" : undefined }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-mention-id]",
      },
    ];
  },

  renderHTML({ node }) {
    const { id, trigger, label, scanned } = node.attrs;
    
    // Look up the live entity from the store
    let entity: { name: string; color?: string } | undefined | null = null;
    const activeBookId = appStore.activeBookId.peek();
    if (activeBookId) {
      const book = appStore.books.peek().find(b => b.id === activeBookId);
      if (book) {
        switch (trigger) {
          case "@": entity = book.characters?.find(c => c.id === id); break;
          case "#": entity = book.nations?.find(c => c.id === id); break;
          case "%": entity = book.monsters?.find(c => c.id === id); break;
          case "~": entity = book.ingredients?.find(c => c.id === id); break;
          case "^": entity = book.techniques?.find(c => c.id === id); break;
          case "$": entity = book.treasures?.find(c => c.id === id); break;
        }
      }
    }

    const displayName = scanned
      ? (label || "Unknown")
      : (entity ? entity.name : label || "Unknown");

    const showTrigger = !scanned;

    let color = "inherit";
    if (entity) {
      if (trigger === "@" && "color" in entity) color = entity.color || "inherit";
      else if (trigger === "#") color = "#00acc1";
      else if (trigger === "%") color = "#d32f2f";
      else if (trigger === "~") color = "#388e3c";
      else if (trigger === "^") color = "#0288d1";
      else if (trigger === "$") color = "#fbc02d";
    }

    const content = showTrigger ? `${trigger}${displayName}` : displayName;

    return [
      "span",
      {
        "data-mention-id": id,
        "data-trigger": trigger,
        "data-label": label,
        "contenteditable": "false",
        ...(scanned ? { "data-scanned": "true" } : {}),
        class: "char-mention",
        style: `cursor: pointer; display: inline-block; font-weight: 500; transition: color 0.2s; color: ${color};`,
      },
      content,
    ];
  },
});
