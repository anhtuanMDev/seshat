import { useState } from "react";

export default function MentionHelpButton() {
  const [open, setOpen] = useState(false);
  const handleClick = () => {
    setOpen(!open);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title="How to use mentions"
        style={{
          background: open ? "var(--bg-active)" : "transparent",
          border: "1px solid var(--color-purple)",
          borderRadius: 3,
          cursor: "pointer",
          fontSize: 11,
          padding: "2px 8px",
          color: "var(--color-purple)",
          fontFamily: "Georgia, serif",
          letterSpacing: 0.5,
          display: "flex",
          alignItems: "center",
          gap: 4,
          transition: "background 0.12s",
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = "var(--bg-hover)";
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = "transparent";
        }}
      >
        @ Mentions Help
      </button>

      {open && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 199,
              background: "rgba(0,0,0,0.4)",
            }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
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
              fontFamily: "Georgia, serif",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
              zIndex: 200,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 24,
                paddingBottom: 16,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                }}
              >
                World Mentions
              </span>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  fontSize: 18,
                  lineHeight: 1,
                  padding: "2px 4px",
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ lineHeight: 1.8 }}>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  marginBottom: 20,
                }}
              >
                Link characters and world entities directly inside your prose. Using these triggers automatically generates interactive text.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "24px 32px",
                  marginBottom: 24,
                }}
              >
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
                <div style={{ gridColumn: "1 / -1" }}>
                  <Tip
                    symbol="◌"
                    title="Interactive Previews (Characters)"
                    body="Hover over any @character mention to see their status resolved to this chapter's timeline. Click to navigate. (Interactive previews for other world entities are not yet available.)"
                  />
                </div>
              </div>

              <div
                style={{
                  padding: "12px 16px",
                  background: "var(--bg-status)",
                  borderLeft: "2px solid var(--color-purple)",
                  borderRadius: "0 2px 2px 0",
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    margin: 0,
                  }}
                >
                  <strong>Tip:</strong> Pin the events this chapter covers first
                  (Events tab → click to toggle). The character tooltip will then show
                  each character exactly as they were at that moment in the
                  story.
                </p>
              </div>
            </div>

            <div
              style={{
                marginTop: 28,
                paddingTop: 16,
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "none",
                  border: "1px solid var(--border)",
                  borderRadius: 3,
                  cursor: "pointer",
                  fontSize: 12,
                  padding: "6px 20px",
                  color: "var(--text-secondary)",
                  fontFamily: "Georgia, serif",
                  letterSpacing: 1,
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Tip({
  symbol,
  title,
  body,
}: {
  symbol: string;
  title: string;
  body: string;
}) {
  return (
    <div style={{ display: "flex", gap: 14 }}>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: "1px solid var(--color-purple)",
          color: "var(--color-purple)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {symbol}
      </span>
      <div>
        <div
          style={{
            fontSize: 13,
            color: "var(--text-primary)",
            marginBottom: 2,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {body}
        </div>
      </div>
    </div>
  );
}
