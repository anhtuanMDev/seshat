import { useState } from "react";
import { IconButton } from "@mui/material";
import { CloseIcon } from "./icons";

interface SideItemProps {
  label: string;
  sub?: string;
  active?: boolean;
  color?: string;
  onClick: () => void;
  onDelete?: () => void;
}

export function SideItem({
  label,
  sub,
  active,
  color,
  onClick,
  onDelete,
}: SideItemProps) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="seshat-flex-between"
      style={{
        ...styles.containerBase,
        background: hover ? "var(--bg-hover)" : "transparent",
        borderLeft: active ? `2px solid ${color || "var(--color-primary)"}` : "2px solid transparent",
      }}
    >
      <div style={styles.contentWrapper}>
        <div
          className="seshat-flex-align"
          style={{
            ...styles.labelRowBase,
            color: color || "var(--text-primary)",
          }}
        >
          {color && (
            <span
              style={{
                ...styles.colorDot,
                background: color,
              }}
            />
          )}
          <span style={styles.labelText}>
            {label}
          </span>
        </div>
        {sub && (
          <div style={styles.subText}>
            {sub}
          </div>
        )}
      </div>
      {(hover || active) && onDelete && (
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          size="small"
          sx={{
            color: "var(--text-muted)",
            padding: "2px",
            marginLeft: "6px",
            flexShrink: 0,
            "&:hover": { color: "var(--color-red)" },
          }}
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </IconButton>
      )}
    </div>
  );
}

const styles = {
  containerBase: {
    padding: "8px 24px",
    cursor: "pointer",
    transition: "background 0.1s, border-left 0.1s",
  },
  contentWrapper: {
    minWidth: 0,
  },
  labelRowBase: {
    fontSize: 14,
    gap: 6,
  },
  colorDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    display: "inline-block",
    flexShrink: 0,
  },
  labelText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  subText: {
    color: "var(--text-secondary)",
    fontSize: 13,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
} satisfies Record<string, React.CSSProperties>;
