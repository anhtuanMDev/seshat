// ─────────────────────────────────────────────────────────────────────────────
// AISidebar — left panel: context injection, AI mode toggle, persona selector,
//             and collapsible Oracle Settings (provider / model / key).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { DeleteIcon, ChatIcon, AutoFixHighIcon, VisibilityIcon, VisibilityOffIcon } from "../ui/icons";
import { AI_PROVIDERS, AI_MODES, type ExpertMode } from "./constants";
import type { AiMode } from "./types";
import type { BookData } from "../../store/appStore";
import type { ChatSessionMeta } from "./useChatSessions";
import ModelDropdown from "./ModelDropdown";

interface Props {
  // Context
  books: BookData[];
  selectedBookId: string;
  setSelectedBookId: (id: string) => void;
  contextText: string;
  isLoadingContext: boolean;
  focusType: string | null;
  focusId: string | null;
  setFocusId?: (id: string | null) => void;
  // Mode
  aiMode: AiMode;
  setAiMode: (m: AiMode) => void;
  expertMode: ExpertMode;
  setExpertMode: (m: ExpertMode) => void;
  // Config
  providerId: string;
  handleProviderChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  baseUrl: string;
  setBaseUrl: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  apiKey: string;
  setApiKey: (v: string) => void;
  // Actions
  messagesLength: number;
  onClearChat: () => void;
  /** Extra CSS class — used by tablet drawer to add `.tablet-open` */
  className?: string;
  /** When true, renders as a plain div (used inside the mobile bottom sheet) */
  inSheet?: boolean;
  // Sessions
  sessions: ChatSessionMeta[];
  activeSessionId: string;
  setActiveSessionId: (id: string) => void;
  createSession: (mode?: AiMode) => void;
  deleteSession: (id: string) => void;
}

export default function AISidebar({
  books,
  selectedBookId,
  setSelectedBookId,
  contextText,
  isLoadingContext,
  focusType,
  focusId,
  setFocusId,
  aiMode,
  setAiMode,
  expertMode,
  setExpertMode,
  providerId,
  handleProviderChange,
  baseUrl,
  setBaseUrl,
  model,
  setModel,
  apiKey,
  setApiKey,
  messagesLength,
  onClearChat,
  className = "",
  inSheet = false,
  sessions,
  activeSessionId,
  setActiveSessionId,
  createSession,
  deleteSession,
}: Props) {
  const [sidebarTab, setSidebarTab] = useState<"chat" | "history" | "settings">("chat");
  const [showApiKey, setShowApiKey] = useState(false);
  const rootClass = inSheet
    ? "" // no sidebar shell class when rendered inside the bottom sheet
    : `ai-page-sidebar${className ? ` ${className}` : ""}`;

  return (
    <div className={rootClass} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* ── Premium Tab Bar ── */}
      <div style={{ 
        display: "flex", 
        gap: 4, 
        marginBottom: 20, 
        padding: 4, 
        background: "rgba(0, 0, 0, 0.2)", 
        borderRadius: 8, 
        border: "1px solid rgba(255, 255, 255, 0.05)",
        flexShrink: 0 
      }}>
        {(["chat", "history", "settings"] as const).map((tab) => {
          const active = sidebarTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setSidebarTab(tab)}
              style={{
                flex: 1,
                padding: "6px 0",
                fontSize: 12,
                fontWeight: active ? 600 : 500,
                color: active ? "var(--bg-app)" : "var(--text-secondary)",
                background: active ? "var(--text-primary)" : "transparent",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                transition: "all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
                boxShadow: active ? "0 2px 8px rgba(255, 255, 255, 0.15)" : "none",
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {/* ── CHAT TAB ── */}
        {sidebarTab === "chat" && (
          <div>
        {/* Context Injection */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <h3 style={{ fontSize: 16, margin: 0, color: "var(--text-primary)" }}>
            Context Injection
          </h3>
          {contextText && (
            <span
              style={{
                fontSize: 11,
                background: "color-mix(in srgb, var(--text-primary) 10%, transparent)",
                color: "var(--text-primary)",
                padding: "2px 8px",
                borderRadius: 12,
                fontWeight: 600,
                border: "1px solid color-mix(in srgb, var(--text-primary) 20%, transparent)"
              }}
            >
              ~{Math.ceil(contextText.length / 4).toLocaleString()} tokens
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            lineHeight: 1.4,
            margin: "0 0 16px 0",
          }}
        >
          Select a book to inject its entire world, timeline, and characters into the
          AI's prompt.
        </p>
        <select
          className="ai-config-input"
          value={selectedBookId}
          onChange={(e) => setSelectedBookId(e.target.value)}
          disabled={isLoadingContext}
        >
          <option value="none">No Context (General AI)</option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title || "Untitled Book"}
            </option>
          ))}
        </select>
        {isLoadingContext && (
          <div style={{ fontSize: 11, color: "var(--text-primary)", marginTop: 8 }}>
            Loading context...
          </div>
        )}
        {contextText && (
          <div style={{ fontSize: 11, color: "var(--color-green)", marginTop: 8 }}>
            ✓ Context loaded ({Math.round(contextText.length / 4)} tokens)
            {focusType && focusId && focusType !== "none" && (
              <div style={{ color: "var(--text-primary)", marginTop: 4 }}>
                ✦ Focused on specific {focusType}. Irrelevant world data trimmed.
              </div>
            )}
          </div>
        )}

        {/* AI Mode toggle */}
        <h3
          style={{
            fontSize: 16,
            margin: "24px 0 8px 0",
            color: "var(--text-primary)",
          }}
        >
          AI Mode
        </h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["chat", "generate"] as AiMode[]).map((m) => {
            const active = aiMode === m;
            return (
              <button
                key={m}
                onClick={() => setAiMode(m)}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: 8,
                  border: "1px solid",
                  borderColor: active ? "var(--text-primary)" : "var(--border-field)",
                  background: active ? "color-mix(in srgb, var(--text-primary) 10%, transparent)" : "var(--bg-panel)",
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {m === "chat" ? <ChatIcon sx={{ fontSize: 16 }} /> : <AutoFixHighIcon sx={{ fontSize: 16 }} />}
                  {m === "chat" ? "Chat" : "Gen Char"}
                </div>
              </button>
            );
          })}
        </div>

        {/* Persona Mode */}
        {aiMode === "chat" && (
          <>
            <h3
              style={{
                fontSize: 16,
                margin: "0 0 8px 0",
                color: "var(--text-primary)",
              }}
            >
              Persona Mode
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}
            >
              {(Object.keys(AI_MODES) as Array<ExpertMode>).map((key) => {
                const mode = AI_MODES[key];
                const isSelected = expertMode === key;
                return (
                  <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <button
                      onClick={() => setExpertMode(key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: "1px solid",
                        borderColor: isSelected ? "var(--text-primary)" : "var(--border-field)",
                        background: isSelected
                          ? "color-mix(in srgb, var(--text-primary) 10%, transparent)"
                          : "var(--bg-panel)",
                        color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{mode.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400 }}>
                        {mode.label}
                      </span>
                      {key === "CHARACTER_ROLEPLAY" && !focusId && (
                        <span
                          style={{
                            fontSize: 10,
                            color: "var(--color-orange)",
                            marginLeft: "auto",
                          }}
                        >
                          needs focus
                        </span>
                      )}
                    </button>
                    
                    {/* Roleplay Character Selection Dropdown */}
                    {isSelected && key === "CHARACTER_ROLEPLAY" && (
                      <div
                        style={{
                          padding: "6px 12px",
                          background: "var(--bg-panel)",
                          borderRadius: 6,
                          border: "1px solid var(--border-field)",
                          marginTop: 2,
                          animation: "ai-fade-in 0.2s ease",
                        }}
                      >
                        <select
                          className="ai-config-input"
                          style={{ padding: "6px 10px", fontSize: 12, marginTop: 4, marginBottom: 4 }}
                          value={focusId || ""}
                          onChange={(e) => setFocusId?.(e.target.value || null)}
                        >
                          <option value="" disabled>Select a Character...</option>
                          {books.find(b => b.id === selectedBookId)?.characters?.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                          {(!books.find(b => b.id === selectedBookId)?.characters?.length) && (
                            <option value="" disabled>No characters in this book</option>
                          )}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {sidebarTab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={() => {
              createSession(aiMode);
              setSidebarTab("chat");
            }}
            style={{
              padding: "10px", 
              borderRadius: 8, 
              background: "var(--text-primary)", 
              color: "var(--bg-app)",
              border: "none", 
              fontWeight: 600, 
              cursor: "pointer", 
              marginBottom: 16, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: 8,
              transition: "all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
              boxShadow: "0 4px 12px rgba(255, 255, 255, 0.1)"
            }}
          >
            <ChatIcon sx={{ fontSize: 16 }} /> New Chat Session
          </button>
          
          {sessions.length === 0 && (
             <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>
               No chat history.
             </div>
          )}
          
          {sessions.map((s) => {
            const active = s.id === activeSessionId;
            return (
              <div key={s.id} style={{ display: "flex", gap: 4, alignItems: "stretch" }}>
                <button
                  onClick={() => setActiveSessionId(s.id)}
                  style={{
                    flex: 1, 
                    padding: "12px 14px", 
                    borderRadius: 8, 
                    border: "1px solid", 
                    textAlign: "left", 
                    cursor: "pointer",
                    borderColor: active ? "var(--text-primary)" : "var(--border-field)",
                    background: active ? "color-mix(in srgb, var(--text-primary) 5%, transparent)" : "var(--bg-panel)",
                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    display: "flex", 
                    flexDirection: "column", 
                    gap: 6,
                    transition: "all 0.2s ease"
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: active ? 600 : 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.title}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {s.aiMode === "chat" ? <ChatIcon sx={{ fontSize: 12 }} /> : <AutoFixHighIcon sx={{ fontSize: 12 }} />}
                      {s.aiMode === "chat" ? "Chat" : "Gen Char"}
                    </span>
                    <span>{new Date(s.updatedAt).toLocaleDateString()}</span>
                  </span>
                </button>
                <button
                  onClick={() => deleteSession(s.id)}
                  style={{
                    width: 40, 
                    background: "var(--bg-panel)", 
                    border: "1px solid var(--border-field)", 
                    borderRadius: 8,
                    color: "color-mix(in srgb, var(--text-primary) 50%, var(--bg-panel))", 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    transition: "all 0.2s ease"
                  }}
                  title="Delete Chat"
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-red)"; e.currentTarget.style.borderColor = "var(--color-red)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "color-mix(in srgb, var(--text-primary) 50%, var(--bg-panel))"; e.currentTarget.style.borderColor = "var(--border-field)"; }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {sidebarTab === "settings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, margin: "0 0 8px 0", color: "var(--text-primary)" }}>Oracle Settings</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4, margin: "0 0 16px 0" }}>
              Configure your BYOK AI provider. Auto-saved securely to your browser.
            </p>
          </div>

          <div className="ai-config-group">
            <label className="ai-config-label">Provider</label>
            <select className="ai-config-input" value={providerId} onChange={handleProviderChange}>
              {AI_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {providerId === "custom" && (
            <div className="ai-config-group">
              <label className="ai-config-label">API Base URL</label>
              <input type="text" className="ai-config-input" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.openai.com/v1" />
            </div>
          )}

          <div className="ai-config-group">
            <label className="ai-config-label">Model ID</label>
            <ModelDropdown providerId={providerId} apiKey={apiKey} baseUrl={baseUrl} model={model} setModel={setModel} />
          </div>

          <div className="ai-config-group">
            <label className="ai-config-label">API Key</label>
            <div style={{ position: "absolute", opacity: 0, pointerEvents: "none", zIndex: -1 }}>
              <input type="text" name="dummy-username" autoComplete="username" tabIndex={-1} />
              <input type="password" name="dummy-password" autoComplete="current-password" tabIndex={-1} />
            </div>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showApiKey ? "text" : "password"}
                className="ai-config-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                autoComplete="new-password"
                spellCheck="false"
                data-1p-ignore="true"
                data-lpignore="true"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                style={{ position: "absolute", right: 8, background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, display: "flex" }}
                aria-label={showApiKey ? "Hide API key" : "Show API key"}
              >
                {showApiKey ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {sidebarTab === "chat" && (
        <div style={{ marginTop: "auto", paddingTop: 16 }}>
          <button onClick={onClearChat} className="ai-clear-btn" disabled={messagesLength === 0}>
            <DeleteIcon sx={{ fontSize: 16 }} />
            Clear Chat Context
          </button>
        </div>
      )}
    </div>
  );
}
