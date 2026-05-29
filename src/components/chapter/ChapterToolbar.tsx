import { S } from "../../lib/utils";
import { SaveIcon, CenterFocusStrongIcon, ArticleIcon } from "../ui/icons";

interface ChapterToolbarProps {
  words: number;
  focusMode: boolean;
  showPanel: boolean;
  onToggleFocus: () => void;
  onTogglePanel: () => void;
  onSave: () => void;
}

export function ChapterToolbar({
  words,
  focusMode,
  showPanel,
  onToggleFocus,
  onTogglePanel,
  onSave,
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
        onClick={onToggleFocus}
        title="Focus mode"
        style={{
          ...S.ghost,
          fontSize: 11,
          letterSpacing: 1,
          color: focusMode ? "var(--color-purple)" : "var(--text-muted)",
          borderBottom: focusMode ? "1px solid var(--color-purple)" : "none",
          display: "flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        <CenterFocusStrongIcon sx={{ fontSize: 12 }} />
        focus
      </button>
      {!focusMode && (
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
      )}
    </div>
  );
}
