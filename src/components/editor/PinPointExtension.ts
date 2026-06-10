import { Node, mergeAttributes } from '@tiptap/core'

export interface PinPointOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pinpoint: {
      setPinPoint: (options: { id: string; comment: string }) => ReturnType
    }
  }
}

export const PinPointExtension = Node.create<PinPointOptions>({
  name: 'pinpoint',
  inline: true,
  group: 'inline',
  atom: true,

  addAttributes() {
    return {
      id: { default: null },
      comment: { default: '' }
    }
  },

  parseHTML() {
    return [
      { tag: 'span[data-pinpoint]' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        { 'data-pinpoint': 'true', class: 'seshat-pinpoint-node', style: 'color: var(--color-purple); font-size: 14px; cursor: pointer; user-select: none;' },
        { 'data-id': HTMLAttributes.id, 'data-comment': HTMLAttributes.comment }
      ),
      '📍'
    ]
  },

  addCommands() {
    return {
      setPinPoint:
        (options) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: options,
            })
            .run()
        },
    }
  },
})
