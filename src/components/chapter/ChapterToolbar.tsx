import { S } from "../../lib/utils";
import { SaveIcon, ArticleIcon, FileDownloadIcon } from "../ui/icons";

interface ChapterToolbarProps {
  showPanel: boolean;
  onTogglePanel: () => void;
  onSave: () => void;
  onExport: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
  isFloating?: boolean;
}

export function ChapterToolbar({
  showPanel,
  onTogglePanel,
  onSave,
  onExport,
  isSaving,
  isDirty,
  isFloating,
}: ChapterToolbarProps) {
  return (
    <div className={`seshat-chapter-toolbar ${showPanel ? "panel-open" : ""} ${isFloating ? "floating" : ""}`}>
      <button
        onClick={onSave}
        title="Save changes"
        disabled={!isDirty || isSaving}
        style={{
          ...S.ghost,
          fontSize: 11,
          letterSpacing: 1,
          color: "var(--color-green)",
          display: "flex",
          alignItems: "center",
          gap: 3,
          opacity: (!isDirty || isSaving) ? 0.5 : 1,
          cursor: (!isDirty || isSaving) ? "default" : "pointer",
        }}
      >
        <SaveIcon sx={{ fontSize: 12 }} />
        {isSaving ? "saving..." : "save"}
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
