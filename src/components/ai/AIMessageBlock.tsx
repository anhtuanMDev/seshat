// ─────────────────────────────────────────────────────────────────────────────
// AIMessageBlock — renders a single chat message with think-tag collapsible,
// ReactMarkdown, copy button, regenerate button, and Add to Canon button.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
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
  /** Called to open the Character Modal */
  onOpenGeneratedCharModal?: (char: Record<string, string>) => void;
}

export default function AIMessageBlock({
  message: m,
  index: i,
  totalMessages,
  isTyping,
  selectedBookId,
  onAddToCanon,
  onRegenerate,
  onOpenGeneratedCharModal,
}: Props) {
  const isUser = m.role === "user";
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isUser && isTyping && i === totalMessages - 1 && m.startTime) {
      const interval = setInterval(() => {
        setElapsed(Date.now() - m.startTime!);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isUser, isTyping, i, totalMessages, m.startTime]);

  const latencyStr = m.latency 
    ? (m.latency / 1000).toFixed(0) + "s" 
    : (isTyping && i === totalMessages - 1 && elapsed > 0)
      ? (elapsed / 1000).toFixed(0) + "s" 
      : "";

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
          <AssistantContent content={m.content} onOpenGeneratedCharModal={onOpenGeneratedCharModal} />
        )}

        {!isUser && latencyStr && (
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, fontFamily: "var(--font-mono)", opacity: 0.7 }}>
            {m.latency ? `Took ${latencyStr}` : `Thinking ${latencyStr}`}
          </div>
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
            {!m.isError && (
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
            )}

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
            {selectedBookId !== "none" && !m.isError && (
              <button
                onClick={() => onAddToCanon(m.content)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--text-primary)",
                  color: "var(--text-primary)",
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

function AssistantContent({ content, onOpenGeneratedCharModal }: { content: string, onOpenGeneratedCharModal?: (char: Record<string, string>) => void }) {
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  const hasOpenThink = content.trimStart().startsWith("<think>") && !content.includes("</think>");

  const cleanContent = thinkMatch
    ? content.replace(/<think>[\s\S]*?<\/think>/, "").trim()
    : hasOpenThink
      ? "" // still thinking — show nothing until tag closes
      : content.trim();

  // Custom renderer for Character JSON outputs
  let jsonPreview: Record<string, string> | null = null;
  const isLikelyJson = cleanContent.startsWith("{") || cleanContent.startsWith("```json");
  if (isLikelyJson) {
    try {
      const raw = cleanContent.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.name) {
        jsonPreview = parsed;
      }
    } catch {
      // JSON is likely incomplete due to streaming.
    }
  }

  // If it looks like raw JSON but isn't wrapped in markdown, wrap it so it streams nicely
  const finalContent = (!jsonPreview && isLikelyJson && !cleanContent.includes("```"))
    ? "```json\n" + cleanContent + "\n```"
    : cleanContent;

  return (
    <>
      {thinkMatch && (
        <details
          style={{
            marginBottom: 16,
            fontSize: 12,
            background: "transparent",
            borderLeft: "2px solid var(--text-primary)",
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

      {jsonPreview ? (
        <div style={{ background: "rgba(0,0,0,0.2)", padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", marginTop: 8 }}>
          <h3 style={{ margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 10, color: "var(--text-primary)" }}>
            {jsonPreview.name}
            {jsonPreview.role && (
              <span style={{ fontSize: 12, padding: "4px 10px", background: "rgba(255,255,255,0.05)", borderRadius: 12, fontWeight: 500, color: "var(--text-secondary)" }}>
                {jsonPreview.role}
              </span>
            )}
          </h3>
          <div style={{ display: "grid", gap: 10 }}>
            {jsonPreview.archetype && (
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                <strong>Archetype:</strong> {jsonPreview.archetype}
              </div>
            )}
            {jsonPreview.coreWound && (
              <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
                <strong style={{ color: "rgba(255, 100, 100, 0.9)" }}>Core Wound:</strong> {jsonPreview.coreWound}
              </div>
            )}
            {jsonPreview.coreDesire && (
              <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
                <strong style={{ color: "rgba(100, 255, 100, 0.9)" }}>Core Desire:</strong> {jsonPreview.coreDesire}
              </div>
            )}
            {jsonPreview.coreFear && (
              <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
                <strong style={{ color: "rgba(200, 150, 255, 0.9)" }}>Core Fear:</strong> {jsonPreview.coreFear}
              </div>
            )}
            {jsonPreview.philosophy && (
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, fontStyle: "italic" }}>
                "{jsonPreview.philosophy}"
              </div>
            )}
          </div>
          <button 
             onClick={() => onOpenGeneratedCharModal?.(jsonPreview)}
             className="ai-quick-action-btn"
             style={{ marginTop: 16, width: "fit-content", background: "rgba(255,255,255,0.05)" }}
          >
            <AddIcon sx={{ fontSize: 14 }} /> Review & Save Character
          </button>
        </div>
      ) : finalContent ? (
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
          {finalContent}
        </ReactMarkdown>
      ) : null}
    </>
  );
}
