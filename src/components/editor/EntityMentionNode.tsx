/* eslint-disable react-refresh/only-export-components */
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useSelector } from "@legendapp/state/react";
import { appStore } from "../../store/appStore";

function MentionNodeView(props: NodeViewProps) {
  const { node } = props;
  const { id, trigger, label } = node.attrs;

  const entity = useSelector(() => {
    // Find the active book
    const activeBookId = appStore.activeBookId.get();
    if (!activeBookId) return null;
    const bookIdx = appStore.books
      .get()
      .findIndex((b) => b.id === activeBookId);
    if (bookIdx < 0) return null;

    const book = appStore.books[bookIdx].get();

    switch (trigger) {
      case "@":
        return book.characters?.find((c) => c.id === id);
      case "#":
        return book.nations?.find((c) => c.id === id);
      case "%":
        return book.monsters?.find((c) => c.id === id);
      case "~":
        return book.ingredients?.find((c) => c.id === id);
      case "^":
        return book.techniques?.find((c) => c.id === id);
      case "$":
        return book.treasures?.find((c) => c.id === id);
      default:
        return null;
    }
  });

  const displayName = entity ? entity.name : label || "Unknown";

  let color = "inherit";
  if (entity) {
    if (trigger === "@" && "color" in entity) color = entity.color || "inherit";
    else if (trigger === "#") color = "#5e35b1";
    else if (trigger === "%") color = "#d32f2f";
    else if (trigger === "~") color = "#388e3c";
    else if (trigger === "^") color = "#0288d1";
    else if (trigger === "$") color = "#fbc02d";
  }

  return (
    <NodeViewWrapper
      as="span"
      className="char-mention"
      data-id={id}
      data-trigger={trigger}
      style={{
        color,
        cursor: "pointer",
        display: "inline-block",
        fontWeight: 500,
        transition: "color 0.2s",
      }}
    >
      {trigger}
      {displayName}
    </NodeViewWrapper>
  );
}

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
      },
      trigger: {
        default: "@",
      },
      label: {
        default: null,
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

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        {
          "data-mention-id": node.attrs.id,
          "data-trigger": node.attrs.trigger,
          "data-label": node.attrs.label,
          class: "char-mention",
        },
        HTMLAttributes,
      ),
      `${node.attrs.trigger}${node.attrs.label}`,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MentionNodeView);
  },
});
