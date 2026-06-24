// ─────────────────────────────────────────────────────────────────────────────
// AIInputBar — textarea + send/stop button + quick-action pills
// ─────────────────────────────────────────────────────────────────────────────

import { SendIcon } from "../ui/icons";
import { QUICK_ACTIONS, type ExpertMode } from "./constants";
import type { AiMode } from "./types";

interface Props {
  input: string;
  setInput: (v: string) => void;
  isTyping: boolean;
  selectedBookId: string;
  onSend: () => void;
  onStop: () => void;
  setExpertMode: (mode: ExpertMode) => void;
  setAiMode: (mode: AiMode) => void;
}

export default function AIInputBar({
  input,
  setInput,
  isTyping,
  selectedBookId,
  onSend,
  onStop,
  setExpertMode,
  setAiMode,
}: Props) {
  return (
    <div className="ai-input-container">
      {/* Quick-action pills */}
      <div
        className="ai-quick-actions"
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 12,
          maxWidth: 1000,
          margin: "0 auto",
          scrollbarWidth: "none",
        }}
      >
        {QUICK_ACTIONS.map((action, i) => (
          <button
            key={i}
            className="ai-quick-action-btn"
            onClick={() => {
              setExpertMode(action.mode);
              setAiMode("chat");
              if (action.message) setInput(action.message);
            }}
          >
            <span>{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>

      {/* Textarea + send/stop */}
      <div className="ai-input-wrapper">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Ask the Oracle..."
          className="ai-textarea"
          rows={1}
          style={{
            height: Math.min(200, Math.max(44, input.split("\n").length * 20 + 24)),
          }}
        />
        {isTyping ? (
          <button onClick={onStop} className="ai-send-btn" title="Stop generating">
            <span style={{ fontSize: 14 }}>⏹</span>
          </button>
        ) : (
          <button onClick={onSend} disabled={!input.trim()} className="ai-send-btn">
            <SendIcon sx={{ fontSize: 18 }} />
          </button>
        )}
      </div>

      {selectedBookId !== "none" && (
        <div
          style={{
            fontSize: 11,
            textAlign: "center",
            marginTop: 8,
            color: "var(--text-muted)",
          }}
        >
          The entire context of the selected book is automatically included in every prompt.
        </div>
      )}
    </div>
  );
}
