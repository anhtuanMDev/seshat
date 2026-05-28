interface ContextTagProps {
  label: string;
  color?: string;
  onClick: () => void;
  active: boolean;
}

export function ContextTag({
  label,
  color,
  onClick,
  active,
}: ContextTagProps) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11,
        padding: "3px 10px",
        borderRadius: 3,
        border: `1px solid ${active ? color || "var(--color-purple)" : "var(--border)"}`,
        background: active
          ? `${color || "var(--color-purple)"}18`
          : "transparent",
        color: active ? color || "var(--color-purple)" : "var(--text-muted)",
        cursor: "pointer",
        fontFamily: "Georgia, serif",
        letterSpacing: 0.5,
        transition: "all 0.12s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}
