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
      style={{
        padding: "8px 24px",
        cursor: "pointer",
        background: active
          ? "var(--bg-active)"
          : hover
            ? "var(--bg-hover)"
            : "transparent",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        transition: "background 0.1s",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            color: color || "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {color && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: color,
                display: "inline-block",
                flexShrink: 0,
              }}
            />
          )}
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        </div>
        {sub && (
          <div
            style={{
              color: "var(--text-secondary)",
              fontSize: 12,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
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
