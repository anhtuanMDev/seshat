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
  const modalRef = useRef<HTMLDivElement>(null);

  // Set initial focus
  useEffect(() => {
    if (modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        const autoFocusEl = Array.from(focusable).find((el) => el.hasAttribute("autofocus"));
        if (autoFocusEl) {
          autoFocusEl.focus();
        } else {
          focusable[0].focus();
        }
      } else {
        modalRef.current.focus();
      }
    }
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();

      if (e.key === "Tab" && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute("disabled"));

        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
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

  const titleId = "seshat-modal-title-id";

  return createPortal(
    <div
      className="seshat-modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div
        className="seshat-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="seshat-modal-header">
          <span className="seshat-modal-title" id={titleId}>{title}</span>
          <button
            onClick={onClose}
            className="seshat-flex-center"
            style={styles.closeBtn}
            aria-label="Close modal"
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
          <div className="seshat-flex-end" style={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

const styles = {
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--text-muted)",
    padding: "2px",
    lineHeight: 1,
  },
  footer: {
    marginTop: "var(--space-8)",
    paddingTop: "var(--space-4)",
    borderTop: "1px solid var(--border)",
    gap: "var(--space-3)",
  },
} satisfies Record<string, React.CSSProperties>;
