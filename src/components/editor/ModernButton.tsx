import React, { useState } from "react";

interface ModernButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant: "primary" | "secondary" | "danger";
}

export function ModernButton({ children, onClick, variant }: ModernButtonProps) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const variantStyles = {
    primary: {
      bg: hover ? "#f0f0f0" : "#ffffff",
      color: "#000000",
      border: "1px solid transparent",
      boxShadow: "0 2px 8px rgba(255,255,255,0.15)",
    },
    danger: {
      bg: hover ? "rgba(235, 87, 87, 0.12)" : "rgba(235, 87, 87, 0.05)",
      color: hover ? "#ff7b7b" : "#eb5757",
      border: hover
        ? "1px solid rgba(235, 87, 87, 0.3)"
        : "1px solid rgba(235, 87, 87, 0.15)",
      boxShadow: "none",
    },
    secondary: {
      bg: hover ? "rgba(255, 255, 255, 0.06)" : "transparent",
      color: hover ? "#e0e0e0" : "#888888",
      border: "1px solid transparent",
      boxShadow: "none",
    },
  };

  const current = variantStyles[variant];

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(false);
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        ...styles.base,
        padding: variant === "secondary" ? "8px 12px" : "8px 16px",
        fontWeight: variant === "primary" ? 600 : 500,
        background: current.bg,
        color: current.color,
        border: current.border,
        boxShadow: current.boxShadow,
        transform: active ? "scale(0.96)" : "scale(1)",
      }}
    >
      {children}
    </button>
  );
}

const styles = {
  base: {
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "all 0.15s ease",
    outline: "none",
  },
} satisfies Record<string, React.CSSProperties>;
