import { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AutoStoriesIcon, SmartToyIcon } from "../components/ui/icons";

// AI-feature modules
import "../components/ai/ai-page-mobile.css";
import "../components/ai/ai-page.css";
import type { ExpertMode } from "../components/ai/constants";
import { getCanonFieldsForType } from "../components/ai/prompts";
import type { AiMode } from "../components/ai/types";
import { useAIChat } from "../components/ai/useAIChat";
import { useAIConfig } from "../components/ai/useAIConfig";
import { useCanonModal } from "../components/ai/useCanonModal";
import { useContextBuilder } from "../components/ai/useContextBuilder";

// Sub-components
import AIChatFeed from "../components/ai/AIChatFeed";
import AIInputBar from "../components/ai/AIInputBar";
import AISidebar from "../components/ai/AISidebar";
import CanonModal from "../components/ai/CanonModal";
import GeneratedCharModal from "../components/ai/GeneratedCharModal";
import { MobileContextStrip } from "../components/ai/MobileContextStrip";

export default function AIPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusType = searchParams.get("focusType");
  const focusId = searchParams.get("focusId");

  const setFocusId = useCallback(
    (newId: string | null) => {
      const newParams = new URLSearchParams(searchParams);
      if (!newId) {
        newParams.delete("focusId");
        newParams.delete("focusType");
      } else {
        newParams.set("focusId", newId);
        newParams.set("focusType", "character");
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  // ── Local UI state ──────────────────────────────────────────────────────────
  const [input, setInput] = useState("");
  const [aiMode, setAiMode] = useState<AiMode>("chat");
  const [expertMode, setExpertMode] = useState<ExpertMode>("GENERAL");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Mobile bottom sheet + tablet drawer
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tabletDrawerOpen, setTabletDrawerOpen] = useState(false);

  // ── Hooks ───────────────────────────────────────────────────────────────────
  const config = useAIConfig();

  const {
    books,
    selectedBookId,
    setSelectedBookId,
    contextText,
    isLoadingContext,
  } = useContextBuilder(focusType, focusId);

  const {
    messages,
    setMessages,
    isTyping,
    generatedChar,
    setGeneratedChar,
    sendMessage,
    stopGenerating,
    clearMessages,
  } = useAIChat({
    expertMode,
    aiMode,
    contextText,
    focusId,
    selectedBookId,
    books,
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    model: config.model,
  });

  const canonModal = useCanonModal(selectedBookId, books);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    const previousInput = input.trim();
    setInput("");
    const success = await sendMessage(previousInput);
    if (!success) {
      setInput(previousInput);
    }
  }, [input, sendMessage]);

  const handleRegenerate = useCallback(async () => {
    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserIndex = i;
        break;
      }
    }
    if (lastUserIndex === -1 || isTyping) return;
    
    const lastUser = messages[lastUserIndex];
    const trimmed = messages.slice(0, lastUserIndex);
    
    setMessages(trimmed);
    const success = await sendMessage(lastUser.content, trimmed);
    if (!success && lastUser.content) {
       setInput(lastUser.content);
    }
  }, [messages, isTyping, setMessages, sendMessage]);

  const handleOpenCanon = useCallback(
    async (content: string) => {
      const defaultType =
        focusType && focusType !== "none" ? focusType : "character";
      canonModal.openCanonModal(content, defaultType, focusId || "");

      if (config.apiKey && selectedBookId !== "none") {
        try {
          const classRes = await fetch(
            `${config.baseUrl.replace(/\/$/, "")}/chat/completions`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.apiKey}`,
              },
              body: JSON.stringify({
                model: config.model,
                max_tokens: 20,
                temperature: 0,
                messages: [
                  {
                    role: "user",
                    content: `Which field does this AI response best describe for a ${defaultType}?\nAvailable fields: ${getCanonFieldsForType(defaultType).join(", ")}\nResponse: "${content.slice(0, 400)}"\nReply with ONLY the field name, nothing else.`,
                  },
                ],
              }),
            },
          );
          const classData = await classRes.json();
          const suggested = classData.choices?.[0]?.message?.content
            ?.trim()
            .toLowerCase();
          if (
            suggested &&
            getCanonFieldsForType(defaultType).includes(suggested)
          ) {
            canonModal.setCanonTargetField(suggested);
          }
        } catch {
          /* keep default */
        }
      }
    },
    [focusType, focusId, canonModal, config, selectedBookId],
  );

  // The active book name for the mobile context badge
  const activeBookName =
    selectedBookId !== "none"
      ? books.find((b) => b?.id === selectedBookId)?.title || "Book"
      : null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        width: "100dvw",
        background: "var(--bg-app)",
        overflow: "hidden",
      }}
    >
      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          height: 50,
          minHeight: 50,
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          padding: "0 12px 0 8px",
          background: "var(--bg-top)",
          gap: 8,
          flexShrink: 0,
        }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 8px",
            borderRadius: 6,
            flexShrink: 0,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          ←<span className="ai-back-label">Back to Books</span>
        </button>

        <div style={{ flex: 1 }} />

        {/* ── Responsive: context badge + mobile settings ───────────────── */}
        <div className="ai-responsive-topbar-extras">
          {activeBookName && (
            <button
              className="ai-context-badge"
              onClick={() => {
                if (window.innerWidth <= 768) {
                  setSheetOpen(true);
                } else {
                  setTabletDrawerOpen(true);
                }
              }}
              title="Change context"
            >
              <AutoStoriesIcon sx={{ fontSize: 14 }} />
              {activeBookName}
            </button>
          )}
          <button
            className={`ai-settings-btn ai-mobile-settings-btn${sheetOpen ? " active" : ""}`}
            onClick={() => setSheetOpen((v) => !v)}
            title="Oracle settings"
            aria-label="Open Oracle settings"
          >
            {/* Sliders icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
            </svg>
          </button>
        </div>

        {/* ── Tablet: sidebar drawer toggle ─────────────────────────────── */}
        <button
          className={`ai-settings-btn ai-tablet-sidebar-btn${tabletDrawerOpen ? " active" : ""}`}
          onClick={() => setTabletDrawerOpen((v) => !v)}
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </button>

        {/* ── Desktop: Oracle AI wordmark ────────────────────────────────── */}
        <div
          style={{
            fontWeight: 600,
            color: "var(--color-purple)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          <SmartToyIcon sx={{ fontSize: 18 }} />
          <span className="ai-oracle-label">Oracle AI</span>
        </div>
      </div>

      {/* ── Main layout ──────────────────────────────────────────────────────── */}
      <div className="ai-page-layout" style={{ flex: 1, overflow: "hidden" }}>
        {/* Tablet backdrop (closes drawer on outside click) */}
        <div
          className={`ai-tablet-backdrop${tabletDrawerOpen ? " open" : ""}`}
          onClick={() => setTabletDrawerOpen(false)}
        />

        {/* Desktop + tablet sidebar */}
        <AISidebar
          className={tabletDrawerOpen ? "tablet-open" : ""}
          books={books}
          selectedBookId={selectedBookId}
          setSelectedBookId={setSelectedBookId}
          contextText={contextText}
          isLoadingContext={isLoadingContext}
          focusType={focusType}
          focusId={focusId}
          setFocusId={setFocusId}
          aiMode={aiMode}
          setAiMode={setAiMode}
          expertMode={expertMode}
          setExpertMode={setExpertMode}
          providerId={config.providerId}
          handleProviderChange={config.handleProviderChange}
          baseUrl={config.baseUrl}
          setBaseUrl={config.setBaseUrl}
          model={config.model}
          setModel={config.setModel}
          apiKey={config.apiKey}
          setApiKey={config.setApiKey}
          messagesLength={messages.length}
          onClearChat={() => setShowClearConfirm(true)}
        />

        {/* Chat area */}
        <div className="ai-page-main">
          {/* Mobile mode/persona chip row */}
          <MobileContextStrip
            expertMode={expertMode}
            aiMode={aiMode}
            isTyping={isTyping}
            onOpenSheet={() => {
              if (window.innerWidth <= 768) {
                setSheetOpen(true);
              } else {
                setTabletDrawerOpen(true);
              }
            }}
          />

          <AIChatFeed
            messages={messages}
            isTyping={isTyping}
            selectedBookId={selectedBookId}
            expertMode={expertMode}
            focusType={focusType}
            focusId={focusId}
            books={books}
            onAddToCanon={handleOpenCanon}
            onRegenerate={handleRegenerate}
            setInput={setInput}
          />

          <AIInputBar
            input={input}
            setInput={setInput}
            isTyping={isTyping}
            selectedBookId={selectedBookId}
            onSend={handleSend}
            onStop={stopGenerating}
            setExpertMode={setExpertMode}
            setAiMode={setAiMode}
          />
        </div>
      </div>

      {/* ── Mobile bottom sheet (settings) ───────────────────────────────────── */}
      <div
        className={`ai-sheet-backdrop${sheetOpen ? " open" : ""}`}
        onClick={() => setSheetOpen(false)}
      />
      <div
        className={`ai-bottom-sheet${sheetOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="ai-sheet-handle" />

        {/* Sheet header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: 16,
              color: "var(--text-primary)",
            }}
          >
            Oracle Settings
          </span>
          <button
            onClick={() => setSheetOpen(false)}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "4px 8px",
              lineHeight: 1,
            }}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        {/* Embed the full sidebar contents inside the sheet */}
        <AISidebar
          inSheet
          books={books}
          selectedBookId={selectedBookId}
          setSelectedBookId={setSelectedBookId}
          contextText={contextText}
          isLoadingContext={isLoadingContext}
          focusType={focusType}
          focusId={focusId}
          setFocusId={setFocusId}
          aiMode={aiMode}
          setAiMode={(m) => {
            setAiMode(m);
            setSheetOpen(false);
          }}
          expertMode={expertMode}
          setExpertMode={(m) => {
            setExpertMode(m);
            setSheetOpen(false);
          }}
          providerId={config.providerId}
          handleProviderChange={config.handleProviderChange}
          baseUrl={config.baseUrl}
          setBaseUrl={config.setBaseUrl}
          model={config.model}
          setModel={config.setModel}
          apiKey={config.apiKey}
          setApiKey={config.setApiKey}
          messagesLength={messages.length}
          onClearChat={() => {
            setShowClearConfirm(true);
            setSheetOpen(false);
          }}
        />
      </div>

      {/* ── Clear Confirm Dialog ──────────────────────────────────────────────── */}
      {showClearConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 16px",
          }}
        >
          <div
            style={{
              background: "var(--bg-main)",
              padding: 24,
              borderRadius: 12,
              width: "100%",
              maxWidth: 380,
              border: "1px solid var(--border)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
            }}
          >
            <h3
              style={{
                margin: "0 0 12px 0",
                color: "var(--text-primary)",
                fontSize: 16,
              }}
            >
              Clear Chat History
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: 24,
                fontSize: 14,
              }}
            >
              Are you sure? This will erase the current conversation.
            </p>
            <div
              style={{ gap: 10, display: "flex", justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  padding: "8px 16px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  fontSize: 14,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearMessages();
                  setShowClearConfirm(false);
                }}
                style={{
                  padding: "8px 16px",
                  background: "var(--color-red)",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  color: "white",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      <CanonModal
        canonModalContent={canonModal.canonModalContent}
        setCanonModalContent={canonModal.setCanonModalContent}
        canonTargetType={canonModal.canonTargetType}
        setCanonTargetType={canonModal.setCanonTargetType}
        canonTargetId={canonModal.canonTargetId}
        setCanonTargetId={canonModal.setCanonTargetId}
        canonTargetField={canonModal.canonTargetField}
        setCanonTargetField={canonModal.setCanonTargetField}
        selectedBookId={selectedBookId}
        books={books}
        onSave={canonModal.handleSaveToCanon}
      />

      <GeneratedCharModal
        generatedChar={generatedChar}
        onClose={() => setGeneratedChar(null)}
        selectedBookId={selectedBookId}
        books={books}
      />
    </div>
  );
}
