import { useState } from "react";
import { createPortal } from "react-dom";
import { Tip } from "./Tip";

export default function MentionHelpButton() {
  const [open, setOpen] = useState(false);
  const handleClick = () => {
    setOpen(!open);
  };

  const buttonStyle = {
    ...styles.helpButton,
    background: open ? "var(--bg-active)" : "transparent",
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title="How to use mentions"
        className="seshat-flex-align"
        style={buttonStyle}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = "var(--bg-hover)";
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = "transparent";
        }}
      >
        @ Mentions Help
      </button>

      {open &&
        createPortal(
          <>
            <div style={styles.overlay} onClick={() => setOpen(false)} />
            <div style={styles.modal}>
              {/* Header */}
              <div className="seshat-flex-between" style={styles.header}>
                <span style={styles.headerTitle}>World Mentions</span>
                <button onClick={() => setOpen(false)} style={styles.closeBtn}>
                  ×
                </button>
              </div>

              {/* Content */}
              <div style={styles.content}>
                <p style={styles.subtitle}>
                  Link characters and world entities directly inside your prose.
                  Using these triggers automatically generates interactive text.
                </p>

                <div style={styles.grid}>
                  <Tip
                    symbol="@"
                    title="Mention Characters"
                    body="Type @ to mention a character. The list is filtered to only show characters you've pinned in the reference panel (or all characters if none are pinned)."
                  />
                  <Tip
                    symbol="#"
                    title="Mention Nations & Locations"
                    body="Type # to summon a list of nations, empires, hidden ruins, and tribes."
                  />
                  <Tip
                    symbol="%"
                    title="Mention Monsters"
                    body="Type % to link terrifying beasts and world threats."
                  />
                  <Tip
                    symbol="~"
                    title="Mention Ingredients"
                    body="Type ~ to reference rare herbs, metals, and alchemical items."
                  />
                  <Tip
                    symbol="^"
                    title="Mention Techniques"
                    body="Type ^ to cite martial arts, spells, or forgotten lore."
                  />
                  <Tip
                    symbol="$"
                    title="Mention Treasures"
                    body="Type $ to reference mythical artifacts and relics."
                  />
                  <div style={styles.fullWidthCol}>
                    <Tip
                      symbol="◌"
                      title="Interactive Previews (Characters)"
                      body="Hover over any @character mention to see their status resolved to this chapter's timeline. Click to navigate. (Interactive previews for other world entities are not yet available.)"
                    />
                  </div>
                </div>

                <div style={styles.tipBox}>
                  <p style={styles.tipText}>
                    <strong>Tip:</strong> Pin the events this chapter covers
                    first (Events tab → click to toggle). The character tooltip
                    will then show each character exactly as they were at that
                    moment in the story.
                  </p>
                </div>
              </div>

              <div className="seshat-flex-end" style={styles.footer}>
                <button onClick={() => setOpen(false)} style={styles.gotItBtn}>
                  Got it
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

const styles = {
  helpButton: {
    border: "1px solid var(--color-primary)",
    borderRadius: 3,
    cursor: "pointer",
    fontSize: 11,
    padding: "2px 8px",
    color: "var(--color-primary)",
    letterSpacing: 0.5,
    gap: 4,
    transition: "background 0.12s",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 199,
    background: "rgba(0,0,0,0.4)",
  },
  modal: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "var(--bg-main)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    width: 760,
    maxWidth: "90vw",
    maxHeight: "80vh",
    overflowY: "auto",
    padding: "24px 32px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
    zIndex: 200,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: "1px solid var(--border)",
  },
  headerTitle: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "var(--text-secondary)",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--text-muted)",
    fontSize: 18,
    lineHeight: 1,
    padding: "2px 4px",
  },
  content: {
    lineHeight: 1.8,
  },
  subtitle: {
    fontSize: 13,
    color: "var(--text-secondary)",
    marginBottom: 20,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px 32px",
    marginBottom: 24,
  },
  fullWidthCol: {
    gridColumn: "1 / -1",
  },
  tipBox: {
    padding: "12px 16px",
    background: "var(--bg-status)",
    borderLeft: "2px solid var(--color-primary)",
    borderRadius: "0 2px 2px 0",
  },
  tipText: {
    fontSize: 12,
    color: "var(--text-secondary)",
    margin: 0,
  },
  footer: {
    marginTop: 28,
    paddingTop: 16,
    borderTop: "1px solid var(--border)",
  },
  gotItBtn: {
    background: "none",
    border: "1px solid var(--border)",
    borderRadius: 3,
    cursor: "pointer",
    fontSize: 12,
    padding: "6px 20px",
    color: "var(--text-secondary)",
    letterSpacing: 1,
  },
} satisfies Record<string, React.CSSProperties>;
