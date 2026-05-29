import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import { useController } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import { useCallback } from 'react';

interface RichEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  control?: Control<any>;
  name?: string;
}

function MenuBar({ editor }: { editor: any }) {
  const btn = useCallback((label: string, action: () => void, active?: boolean) => (
    <button
      type="button"
      onClick={action}
      style={{
        background: active ? 'var(--bg-active)' : 'transparent',
        border: 'none',
        borderRadius: 2,
        cursor: 'pointer',
        fontSize: 12,
        padding: '2px 6px',
        color: 'var(--text-secondary)',
        fontFamily: "'Georgia',serif",
        lineHeight: '20px',
      }}
    >
      {label}
    </button>
  ), []);

  return (
    <div
      style={{
        display: 'flex',
        gap: 1,
        padding: '6px 0',
        borderBottom: '1px solid var(--border)',
        marginBottom: 12,
        flexWrap: 'wrap',
      }}
    >
      {btn('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
      {btn('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
      {btn('U', () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'))}
      {btn('S', () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'))}
      <span style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
      {btn('H1', () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }))}
      {btn('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
      {btn('H3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
      <span style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
      {btn('•', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
      {btn('1.', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
      {btn('❝', () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}
      <span style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
      {btn('≡', () => editor.chain().focus().toggleCodeBlock().run(), editor.isActive('codeBlock'))}
      {btn('🔗', () => {
        const url = prompt('Link URL:');
        if (url) editor.chain().focus().setLink({ href: url }).run();
      }, editor.isActive('link'))}
      {btn('⬜', () => editor.chain().focus().toggleHighlight().run(), editor.isActive('highlight'))}
    </div>
  );
}

function RichEditorInner({ content, onChange, placeholder }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Typography,
      Placeholder.configure({ placeholder: placeholder || 'Write here…' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function ControlledRichEditor({ control, name, ...props }: RichEditorProps) {
  const { field } = useController({ control: control!, name: name! });
  return (
    <RichEditorInner
      {...props}
      content={field.value ?? ''}
      onChange={(html: string) => field.onChange(html)}
    />
  );
}

export default function RichEditor(props: RichEditorProps) {
  if (props.control && props.name) {
    return <ControlledRichEditor {...props} />;
  }
  return <RichEditorInner {...props} />;
}
