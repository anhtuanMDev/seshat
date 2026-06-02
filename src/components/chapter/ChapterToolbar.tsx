import { S } from "../../lib/utils";
import { SaveIcon, ArticleIcon, FileDownloadIcon } from "../ui/icons";

interface ChapterToolbarProps {
  words: number;
  showPanel: boolean;
  onTogglePanel: () => void;
  onSave: () => void;
  onExport: () => void;
}

export function ChapterToolbar({
  words,
  showPanel,
  onTogglePanel,
  onSave,
  onExport,
}: ChapterToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexShrink: 0,
        paddingTop: 28,
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          letterSpacing: 1,
        }}
      >
        {words.toLocaleString()} w
      </span>
      <button
        onClick={onSave}
        title="Save changes"
        style={{
          ...S.ghost,
          fontSize: 11,
          letterSpacing: 1,
          color: "var(--color-green)",
          display: "flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        <SaveIcon sx={{ fontSize: 12 }} />
        save
      </button>
      <button
        onClick={onTogglePanel}
        style={{
          ...S.ghost,
          fontSize: 11,
          letterSpacing: 1,
          color: showPanel ? "var(--color-purple)" : "var(--text-muted)",
          borderBottom: showPanel ? "1px solid var(--color-purple)" : "none",
          display: "flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        <ArticleIcon sx={{ fontSize: 12 }} />
        refs
      </button>
      <button
        onClick={onExport}
        title="Export to plain text DOCX"
        style={{
          ...S.ghost,
          fontSize: 11,
          letterSpacing: 1,
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        <FileDownloadIcon sx={{ fontSize: 12 }} />
        export
      </button>
    </div>
  );
}
