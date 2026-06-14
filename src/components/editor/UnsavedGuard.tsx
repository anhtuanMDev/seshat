import { WarningAmberRounded } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { hidePopup } from "./MentionExtension";

interface UnsavedGuardProps {
  characterName: string;
  onCancel: () => void;
  onDiscard: () => void;
  onSaveFirst: () => void;
}

export default function UnsavedGuard({
  characterName,
  onCancel,
  onDiscard,
  onSaveFirst,
}: UnsavedGuardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hidePopup();
    const timer = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return createPortal(
    <div
      className="seshat-flex-center"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        padding: 24,
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.3s ease",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#121212",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02) inset",
          transform: mounted ? "translateY(0) scale(1)" : "translateY(16px) scale(0.96)",
          opacity: mounted ? 1 : 0,
          transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
          <div
            className="seshat-flex-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "rgba(235, 171, 87, 0.1)",
              color: "#ebab57",
              flexShrink: 0,
            }}
          >
            <WarningAmberRounded fontSize="small" />
          </div>
          <div>
            <h2
              style={{
                margin: "0 0 6px 0",
                fontSize: 17,
                fontWeight: 600,
                color: "#eeeeee",
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              Unsaved Changes
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.5,
                color: "#999999",
              }}
            >
              You have unsaved changes for <span style={{ color: "#ffffff", fontWeight: 500 }}>{characterName}</span>. 
              What would you like to do?
            </p>
            <div style={{ fontSize: 12, color: "#555555", marginTop: 8 }}>
              Last edited a few moments ago
            </div>
          </div>
        </div>

        <div
          className="seshat-flex-between"
          style={{
            marginTop: 32,
          }}
        >
          <ModernButton variant="secondary" onClick={onCancel}>
            Cancel
          </ModernButton>
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <ModernButton variant="danger" onClick={onDiscard}>
              Discard Changes
            </ModernButton>
            <ModernButton variant="primary" onClick={onSaveFirst}>
              Save Changes
            </ModernButton>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ModernButton({
  children,
  onClick,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant: "primary" | "secondary" | "danger";
}) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const styles = {
    primary: {
      bg: hover ? "#f0f0f0" : "#ffffff",
      color: "#000000",
      border: "1px solid transparent",
      boxShadow: "0 2px 8px rgba(255,255,255,0.15)",
    },
    danger: {
      bg: hover ? "rgba(235, 87, 87, 0.12)" : "rgba(235, 87, 87, 0.05)",
      color: hover ? "#ff7b7b" : "#eb5757",
      border: hover ? "1px solid rgba(235, 87, 87, 0.3)" : "1px solid rgba(235, 87, 87, 0.15)",
      boxShadow: "none",
    },
    secondary: {
      bg: hover ? "rgba(255, 255, 255, 0.06)" : "transparent",
      color: hover ? "#e0e0e0" : "#888888",
      border: "1px solid transparent",
      boxShadow: "none",
    },
  };

  const current = styles[variant];

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        padding: variant === "secondary" ? "8px 12px" : "8px 16px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: variant === "primary" ? 600 : 500,
        fontFamily: "inherit",
        cursor: "pointer",
        transition: "all 0.15s ease",
        background: current.bg,
        color: current.color,
        border: current.border,
        boxShadow: current.boxShadow,
        outline: "none",
        transform: active ? "scale(0.96)" : "scale(1)",
      }}
    >
      {children}
    </button>
  );
}