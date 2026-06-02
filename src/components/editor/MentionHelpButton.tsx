import { useState } from "react";

export default function MentionHelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="How to mention characters"
        style={{
          background: "transparent",
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
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--bg-hover)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        @ mentions
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(3px)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            style={{
              background: "var(--bg-main)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              width: "min(520px, 100%)",
              padding: "32px 36px",
              fontFamily: "Georgia, serif",
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
                Character Mentions
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
                Link characters directly inside your prose. Their names become
                interactive — hover to inspect, click to navigate.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <Tip
                  symbol="@"
                  title="Type @ to summon"
                  body="While writing, type @ followed by a character's name. A filtered list appears — use arrow keys or click to select."
                />
                <Tip
                  symbol="◉"
                  title="Filtered by pinned characters"
                  body="The @ list shows only characters you've pinned in the reference panel. Pin them in the Characters tab on the right."
                />
                <Tip
                  symbol="◌"
                  title="Hover to preview"
                  body="Hover over any @mention in your prose to see that character's status — power tier, emotional state, wound — resolved to the chapter's current timeline position."
                />
                <Tip
                  symbol="→"
                  title="Click to navigate"
                  body="Click an @mention to open the character's full sheet. If you have unsaved changes, you'll be asked whether to save first or discard."
                />
                <Tip
                  symbol="⌚"
                  title="Time-aware status"
                  body="The tooltip shows the character's most recent status entry that falls within the chapter's pinned event timeframe — not necessarily their latest entry."
                />
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
                  (Events tab → click to toggle). The tooltip will then show
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
        </div>
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
