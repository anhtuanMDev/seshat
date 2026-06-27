import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";

interface WordCountDisplayProps {
  editor: Editor;
}

export function WordCountDisplay({ editor }: WordCountDisplayProps) {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const handleUpdate = () => forceUpdate({});
    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor]);

  if (editor.isDestroyed) {
    return null;
  }

  const text = editor.getText().trim();
  const wordCount = text === "" ? 0 : text.split(/\s+/).length;

  return (
    <span style={styles.text}>
      {wordCount.toLocaleString()} w
    </span>
  );
}

const styles = {
  text: {
    fontSize: 11,
    color: "var(--text-muted)",
    letterSpacing: 1,
    paddingRight: 4,
    fontFamily: "var(--font-serif)",
  },
} satisfies Record<string, React.CSSProperties>;
