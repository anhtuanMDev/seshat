import { Extension } from "@tiptap/core";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Plugin } from "@tiptap/pm/state";

interface MentionOptions {
  HTMLAttributes: Record<string, unknown>;
  mentionItems: {
    id: string;
    name: string;
    color: string;
    role: string;
  }[];
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mention: {
      setMention: (options: { id: string; name: string; color: string; role: string }) => ReturnType;
      toggleMention: (options: { id: string; name: string; color: string; role: string }) => ReturnType;
      unsetMention: () => ReturnType;
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const Mention = Extension.create<MentionOptions, {}>({
  name: "mention",

  addOptions() {
    return {
      HTMLAttributes: {
        class: "char-mention",
      },
      mentionItems: [],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: ["text"],
        attributes: {
          dataId: {
            default: null,
            parseHTML: element => element.getAttribute("data-id"),
            renderHTML: attributes => {
              if (attributes.dataId) {
                return {
                  "data-id": attributes.dataId,
                };
              }
              return {};
            },
          },
        },
      },
    ];
  },



  addCommands() {
    return {
      setMention:
        options => ({ commands }) => {
          const text = `@${options.name}`;

          return commands.insertContent({
            type: "text",
            text,
            attrs: {
              dataId: options.id,
            },
          });
        },
      toggleMention:
        options => ({ commands }) => {
          return commands.setMention(options);
        },
      unsetMention:
        () => ({ commands, state }) => {
          const { selection } = state;
          const { from, to } = selection;
          const $from = state.doc.resolve(from);
          const range = $from.blockRange();

          if (!range) {
            return false;
          }

          const textBetween = state.doc.textBetween(from, to);
          const match = textBetween.match(/^@(\w+)/);

          if (!match) {
            return false;
          }

          return commands.deleteRange({
            from: from - 1,
            to: to,
          });
        },
    };
  },

  addProseMirrorPlugins() {
    const { mentionItems } = this.options;
    return [
      new Plugin({
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];

            state.doc.descendants((node, pos) => {
              if (node.type.name === "text" && node.text) {
                const text = node.text;
                const match = text.match(/@(\w+)/g);

                if (match) {
                  let offset = 0;
                  let matchResult;

                  while ((matchResult = /@(\w+)/g.exec(text)) !== null) {
                    const [fullMatch, mentionText] = matchResult;
                    const start = pos + offset + matchResult.index;
                    const end = start + fullMatch.length;

                    const item = mentionItems.find(
                      (item) => item.name === mentionText
                    );

                    if (item) {
                      const decoration = Decoration.inline(start, end, {
                        class: "char-mention",
                        "data-id": item.id,
                      });

                      decorations.push(decoration);
                    }

                    offset += matchResult.index + fullMatch.length;
                  }
                }
              }
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

export function buildMentionExtension(mentionItems: {
  id: string;
  name: string;
  color: string;
  role: string;
}[]) {
  return Mention.configure({
    mentionItems,
  });
}