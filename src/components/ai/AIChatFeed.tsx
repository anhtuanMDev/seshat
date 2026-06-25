// ─────────────────────────────────────────────────────────────────────────────
// AIChatFeed — scrollable message list, empty state, and typing indicator
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useMemo } from "react";
import { SmartToyIcon } from "../ui/icons";
import type { Message } from "./types";
import type { ExpertMode } from "./constants";
import { AI_MODES } from "./constants";
import AIMessageBlock from "./AIMessageBlock";
import type { BookData, Character, Event } from "../../store/appStore";

interface Props {
  messages: Message[];
  isTyping: boolean;
  selectedBookId: string;
  expertMode: ExpertMode;
  focusType: string | null;
  focusId: string | null;
  books: BookData[];
  onAddToCanon: (content: string) => void;
  onRegenerate: () => void;
  onOpenGeneratedCharModal: (char: Record<string, string>) => void;
  setInput: (v: string) => void;
}

export default function AIChatFeed({
  messages,
  isTyping,
  selectedBookId,
  expertMode,
  focusType,
  focusId,
  books,
  onAddToCanon,
  onRegenerate,
  onOpenGeneratedCharModal,
  setInput,
}: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const starterQuestions = useMemo(() => {
    const bookIdx = books.findIndex((b) => b && b.id === selectedBookId);
    const book = bookIdx >= 0 ? books[bookIdx] : null;

    if (!book)
      return [
        "What makes a compelling villain?",
        "How do I write a satisfying plot twist?",
      ];

    if (focusType === "character" && focusId) {
      const char = book.characters?.find((c: Character) => c.id === focusId);
      const name = char?.name || "this character";
      return [
        `What does ${name} do when they're completely alone?`,
        `How does ${name}'s core wound manifest in how they speak?`,
        `Write a scene where ${name} almost gets what they want — then sabotages it.`,
        `What lie does ${name} tell themselves every day?`,
        `Interview ${name} — ask them about their biggest regret.`,
      ];
    }

    if (focusType === "event" && focusId) {
      const ev = book.events?.find((e: Event) => e.id === focusId);
      const title = ev?.title || "this scene";
      return [
        `What is each character NOT saying in ${title}?`,
        `What's the worst thing that could happen in ${title}?`,
        `Write the opening paragraph of ${title}.`,
        `Which character leaves ${title} most changed?`,
      ];
    }

    return [
      `What is the biggest unresolved tension in ${book.title}?`,
      `Which character has the most interesting contradiction?`,
      `Audit my world for internal contradictions.`,
      `What scene should happen next based on the timeline?`,
    ];
  }, [selectedBookId, focusType, focusId, books]);

  return (
    <div className="ai-chat-feed">
      {messages.length === 0 ? (
        /* Empty state */
        <div style={{ padding: "40px", maxWidth: 700, margin: "0 auto", width: "100%" }}>
          <div
            style={{ textAlign: "center", marginBottom: 32, color: "var(--text-muted)" }}
          >
            <SmartToyIcon sx={{ fontSize: 40, opacity: 0.15, marginBottom: 12 }} />
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, fontSize: 15, margin: 0 }}>
              {selectedBookId !== "none" ? (
                <>
                  Oracle loaded. {AI_MODES[expertMode].icon} {AI_MODES[expertMode].label} mode.
                </>
              ) : (
                "The Oracle is ready."
              )}
            </div>
          </div>

          {selectedBookId !== "none" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  margin: "0 0 8px 0",
                }}
              >
                Suggested Questions
              </p>
              {starterQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  style={{
                    textAlign: "left",
                    padding: "12px 16px",
                    background: "var(--bg-panel)",
                    border: "1px solid var(--border-field)",
                    borderRadius: 8,
                    color: "var(--text-secondary)",
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    lineHeight: 1.4,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--text-primary)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-field)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        messages.map((m, i) => (
          <AIMessageBlock
            key={i}
            message={m}
            index={i}
            totalMessages={messages.length}
            isTyping={isTyping}
            selectedBookId={selectedBookId}
            onAddToCanon={onAddToCanon}
            onRegenerate={onRegenerate}
            onOpenGeneratedCharModal={onOpenGeneratedCharModal}
          />
        ))
      )}

      {/* Typing indicator */}
      {isTyping && (
        <div className="ai-message-block ai-assistant-bg">
          <div className="ai-avatar">
            <SmartToyIcon sx={{ fontSize: 18 }} />
          </div>
          <div className="ai-typing-indicator">
            <span className="ai-dot" />
            <span className="ai-dot" style={{ animationDelay: "0.2s" }} />
            <span className="ai-dot" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} style={{ height: 1 }} />
    </div>
  );
}
