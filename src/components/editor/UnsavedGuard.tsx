import { WarningAmberRounded } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { hidePopup } from "./MentionExtension";
import { ModernButton } from "./ModernButton";

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

  const overlayStyle = {
    ...styles.overlay,
    opacity: mounted ? 1 : 0,
  };

  const modalStyle = {
    ...styles.modal,
    transform: mounted
      ? "translateY(0) scale(1)"
      : "translateY(16px) scale(0.96)",
    opacity: mounted ? 1 : 0,
  };

  return createPortal(
    <div
      className="seshat-flex-center"
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div style={modalStyle}>
        <div style={styles.header}>
          <div className="seshat-flex-center" style={styles.warningIconWrapper}>
            <WarningAmberRounded fontSize="small" />
          </div>
          <div>
            <h2 style={styles.title}>Unsaved Changes</h2>
            <p style={styles.subtitle}>
              You have unsaved changes for{" "}
              <span style={styles.characterNameSpan}>{characterName}</span>.
              What would you like to do?
            </p>
            <div style={styles.timestamp}>Last edited a few moments ago</div>
          </div>
        </div>

        <div className="seshat-flex-between" style={styles.footer}>
          <ModernButton variant="secondary" onClick={onCancel}>
            Cancel
          </ModernButton>
          <div style={styles.actionButtonsContainer}>
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
    document.body,
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    padding: 24,
    transition: "opacity 0.3s ease",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  modal: {
    width: "100%",
    maxWidth: 420,
    background: "#121212",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 32,
    boxShadow:
      "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02) inset",
    transition:
      "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    gap: "var(--space-4)",
    marginBottom: "var(--space-5)",
  },
  warningIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: "rgba(235, 171, 87, 0.1)",
    color: "#ebab57",
    flexShrink: 0,
  },
  title: {
    margin: "0 0 6px 0",
    fontSize: 17,
    fontWeight: 600,
    color: "#eeeeee",
    letterSpacing: "-0.01em",
    lineHeight: 1.2,
  },
  subtitle: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.5,
    color: "#999999",
  },
  characterNameSpan: {
    color: "#ffffff",
    fontWeight: 500,
  },
  timestamp: {
    fontSize: 12,
    color: "#555555",
    marginTop: 8,
  },
  footer: {
    marginTop: 32,
  },
  actionButtonsContainer: {
    display: "flex",
    gap: "var(--space-3)",
  },
} satisfies Record<string, React.CSSProperties>;