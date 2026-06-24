// ─────────────────────────────────────────────────────────────────────────────
// AIMessageBlock — renders a single chat message with think-tag collapsible,
// ReactMarkdown, copy button, regenerate button, and Add to Canon button.
// ─────────────────────────────────────────────────────────────────────────────

import ReactMarkdown from "react-markdown";
import { SmartToyIcon, AddIcon } from "../ui/icons";
import { showToast } from "../../store/toastStore";
import type { Message } from "./types";

interface Props {
  message: Message;
  index: number;
  totalMessages: number;
  isTyping: boolean;
  selectedBookId: string;
  /** Called when user clicks "Add to Canon" */
  onAddToCanon: (content: string) => void;
  /** Called when user clicks "Regenerate" */
  onRegenerate: () => void;
}

export default function AIMessageBlock({
  message: m,
  index: i,
  totalMessages,
  isTyping,
  selectedBookId,
  onAddToCanon,
  onRegenerate,
}: Props) {
  const isUser = m.role === "user";

  return (
    <div
      className={`ai-message-block ${isUser ? "ai-user-bg" : "ai-assistant-bg"}`}
    >
      <div className={`ai-avatar ${!isUser ? "ai-avatar-oracle" : ""}`}>
        {isUser ? "U" : <SmartToyIcon sx={{ fontSize: 18 }} />}
      </div>

      <div className={`ai-message-content ${isUser ? "ai-user-text" : ""}`}>
        {isUser ? (
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{m.content}</div>
        ) : (
          <AssistantContent content={m.content} />
        )}

        {!isUser && (
          <div
            className="ai-message-actions"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 8,
            }}
          >
            {/* Copy */}
            <button
              onClick={() => {
                const text = m.content.replace(/<think>[\s\S]*?<\/think>/, "").trim();
                navigator.clipboard.writeText(text);
                showToast("Copied to clipboard", "success");
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: 11,
                padding: "4px 8px",
                borderRadius: 4,
              }}
            >
              📋 Copy
            </button>

            {/* Regenerate — only on last message */}
            {i === totalMessages - 1 && (
              <button
                onClick={onRegenerate}
                disabled={isTyping}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-field)",
                  color: "var(--text-muted)",
                  borderRadius: 16,
                  padding: "4px 10px",
                  fontSize: 11,
                  cursor: isTyping ? "not-allowed" : "pointer",
                  opacity: isTyping ? 0.4 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                ↺ Regenerate
              </button>
            )}

            {/* Add to Canon — only when a book is selected */}
            {selectedBookId !== "none" && (
              <button
                onClick={() => onAddToCanon(m.content)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--color-purple)",
                  color: "var(--color-purple)",
                  borderRadius: 16,
                  padding: "4px 10px",
                  fontSize: 11,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <AddIcon sx={{ fontSize: 12 }} />
                Add to Canon
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Internal: renders assistant content with think-tag collapsible ────────────

function AssistantContent({ content }: { content: string }) {
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  const hasOpenThink = content.trimStart().startsWith("<think>") && !content.includes("</think>");

  const cleanContent = thinkMatch
    ? content.replace(/<think>[\s\S]*?<\/think>/, "").trim()
    : hasOpenThink
      ? "" // still thinking — show nothing until tag closes
      : content.trim();

  return (
    <>
      {thinkMatch && (
        <details
          style={{
            marginBottom: 16,
            fontSize: 12,
            background: "transparent",
            borderLeft: "2px solid var(--color-purple)",
            paddingLeft: 12,
            opacity: 0.6,
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              listStyle: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>▸</span> Reasoning trace
          </summary>
          <div
            style={{
              marginTop: 8,
              color: "var(--text-secondary)",
              whiteSpace: "pre-wrap",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              lineHeight: 1.6,
            }}
          >
            {thinkMatch[1].trim()}
          </div>
        </details>
      )}

      {cleanContent ? (
        <ReactMarkdown
          components={{
            p: ({ ...props }) => <p style={{ margin: "0 0 12px 0" }} {...props} />,
            ul: ({ ...props }) => (
              <ul style={{ margin: "0 0 12px 0", paddingLeft: 24 }} {...props} />
            ),
            ol: ({ ...props }) => (
              <ol style={{ margin: "0 0 12px 0", paddingLeft: 24 }} {...props} />
            ),
            li: ({ ...props }) => <li style={{ marginBottom: 6 }} {...props} />,
            strong: ({ ...props }) => (
              <strong
                style={{ color: "var(--text-primary)", fontWeight: 600 }}
                {...props}
              />
            ),
            h3: ({ ...props }) => (
              <h3
                style={{ margin: "16px 0 8px 0", fontSize: 16, color: "var(--text-primary)" }}
                {...props}
              />
            ),
          }}
        >
          {cleanContent}
        </ReactMarkdown>
      ) : null}
    </>
  );
}
