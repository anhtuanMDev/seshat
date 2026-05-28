import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useController } from 'react-hook-form';
import type { Control } from 'react-hook-form';

interface RichEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  control?: Control<any>;
  name?: string;
}

function RichEditorInner({ content, onChange }: RichEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  if (!editor) return null;

  return <EditorContent editor={editor} />;
}

function ControlledRichEditor({ control, name, ...props }: RichEditorProps) {
  const { field } = useController({ control: control!, name: name! });
  return <RichEditorInner {...props} content={field.value ?? ""} onChange={(html: string) => field.onChange(html)} />;
}

export default function RichEditor(props: RichEditorProps) {
  if (props.control && props.name) {
    return <ControlledRichEditor {...props} />;
  }
  return <RichEditorInner {...props} />;
}
