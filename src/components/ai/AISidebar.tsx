// ─────────────────────────────────────────────────────────────────────────────
// AISidebar — left panel: context injection, AI mode toggle, persona selector,
//             and collapsible Oracle Settings (provider / model / key).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { DeleteIcon, ChatIcon, AutoFixHighIcon } from "../ui/icons";
import { AI_PROVIDERS, AI_MODES, type ExpertMode } from "./constants";
import type { AiMode } from "./types";
import type { BookData } from "../../store/appStore";

interface Props {
  // Context
  books: BookData[];
  selectedBookId: string;
  setSelectedBookId: (id: string) => void;
  contextText: string;
  isLoadingContext: boolean;
  focusType: string | null;
  focusId: string | null;
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
}

export default function AISidebar({
  books,
  selectedBookId,
  setSelectedBookId,
  contextText,
  isLoadingContext,
  focusType,
  focusId,
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
}: Props) {
  const [showSettings, setShowSettings] = useState(false);
  const currentProvider = AI_PROVIDERS.find((p) => p.id === providerId);

  const rootClass = inSheet
    ? "" // no sidebar shell class when rendered inside the bottom sheet
    : `ai-page-sidebar${className ? ` ${className}` : ""}`;

  return (
    <div className={rootClass}>
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
                background: "rgba(139, 92, 246, 0.15)",
                color: "var(--text-primary)",
                padding: "2px 8px",
                borderRadius: 12,
                fontWeight: 600,
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
                  borderColor: active ? "var(--text-primary)" : "var(--border)",
                  background: active ? "rgba(139, 92, 246, 0.1)" : "var(--bg-panel)",
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
                  <button
                    key={key}
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
                        ? "rgba(139, 92, 246, 0.1)"
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
                );
              })}
            </div>
          </>
        )}
      </div>

      <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />

      {/* Oracle Settings — collapsible */}
      <div
        onClick={() => setShowSettings((s) => !s)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          padding: "8px 0",
        }}
      >
        <h3 style={{ fontSize: 16, margin: 0, color: "var(--text-primary)" }}>
          Oracle Settings
        </h3>
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
          {showSettings ? "▴" : "▾"}
        </span>
      </div>

      {showSettings && (
        <>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              lineHeight: 1.4,
              margin: "0 0 16px 0",
            }}
          >
            Configure your BYOK AI provider. Auto-saved securely to your browser.
          </p>

          <div className="ai-config-group">
            <label className="ai-config-label">Provider</label>
            <select
              className="ai-config-input"
              value={providerId}
              onChange={handleProviderChange}
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {providerId === "custom" && (
            <div className="ai-config-group">
              <label className="ai-config-label">API Base URL</label>
              <input
                type="text"
                className="ai-config-input"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
              />
            </div>
          )}

          <div className="ai-config-group">
            <label className="ai-config-label">Model ID</label>
            <input
              type="text"
              className="ai-config-input"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o"
            />
            {currentProvider && currentProvider.models.length > 0 && (
              <div
                style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}
              >
                {currentProvider.models.map((m) => (
                  <button
                    key={m}
                    onClick={() => setModel(m)}
                    className="ai-model-pill"
                    style={{
                      background: model === m ? "var(--bg-active)" : "var(--bg-panel)",
                      borderColor:
                        model === m ? "var(--text-primary)" : "var(--border-field)",
                      color:
                        model === m ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ai-config-group">
            <label className="ai-config-label">API Key</label>
            <input
              type="password"
              className="ai-config-input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
          </div>
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Clear chat */}
      <button
        onClick={onClearChat}
        className="ai-clear-btn"
        disabled={messagesLength === 0}
      >
        <DeleteIcon sx={{ fontSize: 16 }} />
        Clear Context History
      </button>
    </div>
  );
}
