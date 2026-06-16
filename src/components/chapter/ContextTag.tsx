import { memo } from "react";

interface ContextTagProps {
  label: string;
  color?: string;
  onClick: () => void;
  active: boolean;
}

export const ContextTag = memo(function ContextTag({
  label,
  color,
  onClick,
  active,
}: ContextTagProps) {
  const baseColor = color || "var(--color-primary)";
  const isHex = baseColor.startsWith("#");
  
  const bg = active
    ? (isHex ? `${baseColor}18` : "var(--bg-active)")
    : "transparent";

  return (
    <button
      onClick={onClick}
      style={{
        ...styles.base,
        border: `1px solid ${active ? baseColor : "var(--border)"}`,
        background: bg,
        color: active ? baseColor : "var(--text-muted)",
      }}
    >
      {label}
    </button>
  );
});

const styles = {
  base: {
    fontSize: 11,
    padding: "3px 10px",
    borderRadius: 3,
    cursor: "pointer",
    letterSpacing: 0.5,
    transition: "all 0.12s",
    whiteSpace: "nowrap",
  },
} satisfies Record<string, React.CSSProperties>;
