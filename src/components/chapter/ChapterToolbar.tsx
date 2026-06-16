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
  const isSaveDisabled = !isDirty || isSaving;

  return (
    <div className={`seshat-chapter-toolbar ${showPanel ? "panel-open" : ""} ${isFloating ? "floating" : ""}`}>
      <button
        onClick={onSave}
        title="Save changes"
        disabled={isSaveDisabled}
        className="seshat-flex-align"
        style={{
          ...styles.saveBtn,
          opacity: isSaveDisabled ? 0.5 : 1,
          cursor: isSaveDisabled ? "default" : "pointer",
        }}
      >
        <SaveIcon sx={{ fontSize: 12 }} />
        {isSaving ? "saving..." : "save"}
      </button>
      <button
        onClick={onTogglePanel}
        className="seshat-flex-align"
        style={{
          ...styles.toggleBtn,
          color: showPanel ? "var(--color-primary)" : "var(--text-muted)",
          borderBottom: showPanel ? "1px solid var(--color-primary)" : "none",
        }}
      >
        <ArticleIcon sx={{ fontSize: 12 }} />
        refs
      </button>
      <button
        onClick={onExport}
        title="Export to plain text DOCX"
        className="seshat-flex-align"
        style={styles.exportBtn}
      >
        <FileDownloadIcon sx={{ fontSize: 12 }} />
        export
      </button>
    </div>
  );
}

const styles = {
  saveBtn: {
    ...S.ghost,
    fontSize: 11,
    letterSpacing: 1,
    color: "var(--color-green)",
    gap: 3,
  },
  toggleBtn: {
    ...S.ghost,
    fontSize: 11,
    letterSpacing: 1,
    gap: 3,
  },
  exportBtn: {
    ...S.ghost,
    fontSize: 11,
    letterSpacing: 1,
    color: "var(--text-muted)",
    gap: 3,
  },
} satisfies Record<string, React.CSSProperties>;
