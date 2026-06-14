import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "./icons";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ title, onClose, children, footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return createPortal(
    <div
      className="seshat-modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className="seshat-modal">
        <div className="seshat-modal-header">
          <span className="seshat-modal-title">{title}</span>
          <button
            onClick={onClose}
            className="seshat-flex-center"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "2px",
              lineHeight: 1,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--color-red)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-muted)")
            }
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </button>
        </div>
        <div>{children}</div>
        {footer && (
          <div
            className="seshat-flex-end"
            style={{
              marginTop: "var(--space-8)",
              paddingTop: "var(--space-4)",
              borderTop: "1px solid var(--border)",
              gap: "var(--space-3)",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
