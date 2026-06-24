import { AutoFixHighIcon, ChatIcon } from "../ui/icons";
import type { ExpertMode } from "./constants";
import { AI_MODES } from "./constants";
import type { AiMode } from "./types";

export function MobileContextStrip({
  expertMode,
  aiMode,
  isTyping,
  onOpenSheet,
}: {
  expertMode: ExpertMode;
  aiMode: AiMode;
  isTyping: boolean;
  onOpenSheet: () => void;
}) {
  return (
    <div
      className="ai-mobile-context-strip"
      style={{
        display: "none", // overridden by CSS media query
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-top)",
        overflowX: "auto",
        scrollbarWidth: "none",
        flexShrink: 0,
      }}
    >
      {/* Persona badge */}
      <button
        onClick={onOpenSheet}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 11,
          fontWeight: 600,
          padding: "4px 10px",
          borderRadius: 20,
          border: "1px solid var(--border-field)",
          background: "var(--bg-panel)",
          color: "var(--text-secondary)",
          cursor: "pointer",
          whiteSpace: "nowrap",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {AI_MODES[expertMode].icon}
        {AI_MODES[expertMode].label}
      </button>

      {/* Mode badge */}
      <span
        style={{
          fontSize: 11,
          padding: "4px 10px",
          borderRadius: 20,
          border: "1px solid var(--border-field)",
          background: "var(--bg-panel)",
          color: "var(--text-secondary)",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {aiMode === "chat" ? (
            <ChatIcon sx={{ fontSize: 12 }} />
          ) : (
            <AutoFixHighIcon sx={{ fontSize: 12 }} />
          )}
          {aiMode === "chat" ? "Chat" : "Gen Char"}
        </div>
      </span>

      {isTyping && (
        <span
          style={{
            fontSize: 11,
            color: "#c084fc",
            fontWeight: 700,
            whiteSpace: "nowrap",
            animation: "ai-pulse 1.5s infinite ease-in-out",
          }}
        >
          ● Thinking…
        </span>
      )}
    </div>
  );
}
