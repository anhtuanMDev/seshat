/* eslint-disable react-refresh/only-export-components */
import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useSelector } from "@legendapp/state/react";
import { appStore } from "../../store/appStore";

function MentionNodeView(props: NodeViewProps) {
  const { node } = props;
  const { id, trigger, label } = node.attrs;

  const entity = useSelector(() => {
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

  // label attr = custom display text (e.g. original prose in scan-and-link).
  // If label is set and differs from entity.name, we respect it as the visual text.
  const hasCustomLabel = !!label && (!entity || label !== entity.name);
  const displayName = hasCustomLabel
    ? label
    : entity
      ? entity.name
      : label || "Unknown";

  let color = "inherit";
  if (entity) {
    if (trigger === "@" && "color" in entity) color = entity.color || "inherit";
    else if (trigger === "#") color = "#00acc1";
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
        ...styles.nodeWrapper,
        color,
      }}
    >
      {/* Only show trigger prefix for standard @mentions, not scan-linked prose */}
      {!hasCustomLabel && trigger}
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

  renderHTML({ node }) {
    const { id, trigger, label } = node.attrs;
    // If label differs from canonical name (scan-linked prose), render without trigger prefix
    const content = label ? label : `${trigger}${label || ""}`;
    return [
      "span",
      {
        "data-mention-id": id,
        "data-trigger": trigger,
        "data-label": label,
        class: "char-mention",
      },
      content,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MentionNodeView);
  },
});

const styles = {
  nodeWrapper: {
    cursor: "pointer",
    display: "inline-block",
    fontWeight: 500,
    transition: "color 0.2s",
  },
} satisfies Record<string, React.CSSProperties>;
