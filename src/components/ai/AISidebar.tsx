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
  // Granular selections
  selectedCharacterIds: Set<string>;
  setSelectedCharacterIds: (ids: Set<string>) => void;
  selectedEventIds: Set<string>;
  setSelectedEventIds: (ids: Set<string>) => void;
  selectedChapterIds: Set<string>;
  setSelectedChapterIds: (ids: Set<string>) => void;
  selectedFileContents: string[];
  setSelectedFileContents: (fc: string[]) => void;
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
  className?: string;
  inSheet?: boolean;
  // Sessions
  sessions: ChatSessionMeta[];
  activeSessionId: string;
  setActiveSessionId: (id: string) => void;
  createSession: (mode?: AiMode) => void;
  deleteSession: (id: string) => void;
}

// ── Multi-select toggle helper ─────────────────────────────────────────────

function toggleId(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

// ── Chip list component ────────────────────────────────────────────────────

function ChipList<T extends { id: string; name?: string; title?: string; number?: string }>({
  items,
  selected,
  onToggle,
  emptyLabel,
  getLabel,
}: {
  items: T[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  emptyLabel: string;
  getLabel: (item: T) => string;
}) {
  if (!items.length) {
    return (
      <div style={{ fontSize: 11, color: "var(--text-muted)", padding: "6px 0" }}>
        {emptyLabel}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, paddingTop: 6 }}>
      {items.map((item) => {
        const active = selected.has(item.id);
        return (
          <button
            key={item.id}
            onClick={() => onToggle(item.id)}
            title={getLabel(item)}
            style={{
              padding: "3px 9px",
              borderRadius: 12,
              fontSize: 11,
              fontWeight: active ? 600 : 400,
              border: "1px solid",
              borderColor: active
                ? "var(--text-primary)"
                : "color-mix(in srgb, var(--text-primary) 20%, transparent)",
              background: active
                ? "color-mix(in srgb, var(--text-primary) 12%, transparent)"
                : "transparent",
              color: active ? "var(--text-primary)" : "var(--text-muted)",
              cursor: "pointer",
              maxWidth: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
            }}
          >
            {getLabel(item)}
          </button>
        );
      })}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────

function SectionLabel({ label, count, total }: { label: string; count: number; total: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, marginBottom: 2 }}>
      <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "1.2px", color: "var(--text-muted)", fontWeight: 700 }}>
        {label}
      </span>
      {total > 0 && (
        <span style={{ fontSize: 10, color: count > 0 ? "var(--color-green)" : "var(--text-muted)" }}>
          {count === 0 ? "all" : `${count}/${total}`}
        </span>
      )}
    </div>
  );
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
  selectedCharacterIds,
  setSelectedCharacterIds,
  selectedEventIds,
  setSelectedEventIds,
  selectedChapterIds,
  setSelectedChapterIds,
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
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);

  const rootClass = inSheet
    ? ""
    : `ai-page-sidebar${className ? ` ${className}` : ""}`;

  const activeBook = books.find((b) => b.id === selectedBookId);
  const characters = activeBook?.characters || [];
  const events = activeBook?.events || [];
  const chapters = activeBook?.chapters || [];

  return (
    <div className={rootClass} style={inSheet ? { display: "flex", flexDirection: "column", height: "100%" } : {}}>
      {/* ── Tab Bar ── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, padding: 4, background: "var(--bg-active)", borderRadius: 8, flexShrink: 0 }}>
        {(["chat", "history", "settings"] as const).map((tab) => {
          const active = sidebarTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setSidebarTab(tab)}
              style={{
                flex: 1, padding: "6px 0", fontSize: 12,
                fontWeight: active ? 600 : 500,
                color: active ? "var(--bg-app)" : "var(--text-secondary)",
                background: active ? "var(--text-primary)" : "transparent",
                border: "none", borderRadius: 4, cursor: "pointer",
                textTransform: "capitalize", letterSpacing: "0.5px",
                transition: "all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
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
            {/* Context Injection header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ fontSize: 16, margin: 0, color: "var(--text-primary)" }}>Context Injection</h3>
              {contextText && (
                <span style={{
                  fontSize: 11,
                  background: "color-mix(in srgb, var(--text-primary) 10%, transparent)",
                  color: "var(--text-primary)",
                  padding: "2px 8px", borderRadius: 12, fontWeight: 600,
                  border: "1px solid color-mix(in srgb, var(--text-primary) 20%, transparent)",
                }}>
                  ~{Math.ceil(contextText.length / 4).toLocaleString()} tokens
                </span>
              )}
            </div>

            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4, margin: "0 0 10px 0" }}>
              Choose a book then refine which characters, events, and chapters to include.
            </p>

            {/* Book selector */}
            <select
              className="ai-config-input"
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              disabled={isLoadingContext}
            >
              <option value="none">No Context (General AI)</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>{b.title || "Untitled Book"}</option>
              ))}
            </select>

            {isLoadingContext && (
              <div style={{ fontSize: 11, color: "var(--text-primary)", marginTop: 8 }}>Loading context…</div>
            )}

            {/* ── Granular selectors (only when a book is chosen) ── */}
            {selectedBookId !== "none" && !isLoadingContext && (
              <div style={{ marginTop: 6 }}>

                {/* Characters */}
                <SectionLabel
                  label="Characters"
                  count={selectedCharacterIds.size}
                  total={characters.length}
                />
                <ChipList
                  items={characters}
                  selected={selectedCharacterIds}
                  onToggle={(id) => setSelectedCharacterIds(toggleId(selectedCharacterIds, id))}
                  emptyLabel="No characters in this book"
                  getLabel={(c) => c.name || c.id}
                />

                {/* Events */}
                <SectionLabel
                  label="Events"
                  count={selectedEventIds.size}
                  total={events.length}
                />
                <ChipList
                  items={events}
                  selected={selectedEventIds}
                  onToggle={(id) => setSelectedEventIds(toggleId(selectedEventIds, id))}
                  emptyLabel="No events in this book"
                  getLabel={(e) => e.title || e.id}
                />

                {/* Chapters */}
                <SectionLabel
                  label="Chapters"
                  count={selectedChapterIds.size}
                  total={chapters.length}
                />
                <ChipList
                  items={chapters}
                  selected={selectedChapterIds}
                  onToggle={(id) => setSelectedChapterIds(toggleId(selectedChapterIds, id))}
                  emptyLabel="No chapters in this book"
                  getLabel={(ch) => `Ch.${ch.number}${ch.title ? ` ${ch.title}` : ""}`}
                />

                {/* Clear all button */}
                {(selectedCharacterIds.size > 0 || selectedEventIds.size > 0 || selectedChapterIds.size > 0) && (
                  <button
                    onClick={() => {
                      setSelectedCharacterIds(new Set());
                      setSelectedEventIds(new Set());
                      setSelectedChapterIds(new Set());
                    }}
                    style={{
                      marginTop: 10, fontSize: 11, color: "var(--text-muted)",
                      background: "transparent", border: "none", cursor: "pointer",
                      padding: "2px 0", textDecoration: "underline",
                    }}
                  >
                    Reset to full book context
                  </button>
                )}
              </div>
            )}

            {contextText && (
              <div style={{ fontSize: 11, color: "var(--color-green)", marginTop: 10 }}>
                ✓ Context ready ({Math.round(contextText.length / 4)} tokens)
                {focusType && focusId && focusType !== "none" && (
                  <div style={{ color: "var(--text-primary)", marginTop: 4 }}>
                    ✦ Focused on specific {focusType}.
                  </div>
                )}
              </div>
            )}

            {/* AI Mode toggle */}
            <h3 style={{ fontSize: 16, margin: "24px 0 8px 0", color: "var(--text-primary)" }}>AI Mode</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {(["chat", "generate"] as AiMode[]).map((m) => {
                const active = aiMode === m;
                return (
                  <button
                    key={m}
                    onClick={() => setAiMode(m)}
                    style={{
                      flex: 1, padding: "8px", borderRadius: 8, border: "1px solid",
                      borderColor: active ? "var(--text-primary)" : "var(--border-field)",
                      background: active ? "color-mix(in srgb, var(--text-primary) 10%, transparent)" : "var(--bg-panel)",
                      color: active ? "var(--text-primary)" : "var(--text-secondary)",
                      fontWeight: 600, cursor: "pointer",
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
                <h3 style={{ fontSize: 16, margin: "0 0 8px 0", color: "var(--text-primary)" }}>Persona Mode</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                  {(Object.keys(AI_MODES) as Array<ExpertMode>).map((key) => {
                    const mode = AI_MODES[key];
                    const isSelected = expertMode === key;
                    return (
                      <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <button
                          onClick={() => setExpertMode(key)}
                          style={{
                            display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                            borderRadius: 6, border: "1px solid",
                            borderColor: isSelected ? "var(--text-primary)" : "var(--border-field)",
                            background: isSelected ? "color-mix(in srgb, var(--text-primary) 10%, transparent)" : "var(--bg-panel)",
                            color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                            textAlign: "left", cursor: "pointer", transition: "all 0.2s",
                          }}
                        >
                          <span style={{ fontSize: 16 }}>{mode.icon}</span>
                          <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400 }}>{mode.label}</span>
                          {key === "CHARACTER_ROLEPLAY" && !focusId && (
                            <span style={{ fontSize: 10, color: "var(--color-orange)", marginLeft: "auto" }}>
                              needs focus
                            </span>
                          )}
                        </button>

                        {isSelected && key === "CHARACTER_ROLEPLAY" && (
                          <div style={{
                            padding: "6px 12px", background: "var(--bg-panel)", borderRadius: 6,
                            border: "1px solid var(--border-field)", marginTop: 2,
                            animation: "ai-fade-in 0.2s ease",
                          }}>
                            <select
                              className="ai-config-input"
                              style={{ padding: "6px 10px", fontSize: 12, marginTop: 4, marginBottom: 4 }}
                              value={focusId || ""}
                              onChange={(e) => setFocusId?.(e.target.value || null)}
                            >
                              <option value="" disabled>Select a Character…</option>
                              {characters.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                              {!characters.length && (
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
              onClick={() => { createSession(aiMode); setSidebarTab("chat"); }}
              style={{
                padding: "12px", borderRadius: 8, background: "transparent",
                color: "var(--text-primary)", border: "1px solid var(--border-field)",
                fontWeight: 600, cursor: "pointer", marginBottom: 16,
                display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 12,
                transition: "all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
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
                <div
                  key={s.id}
                  onMouseEnter={() => setHoveredSessionId(s.id)}
                  onMouseLeave={() => setHoveredSessionId(null)}
                  className={`ai-session-item ${active ? "active" : ""}`}
                >
                  <div
                    onClick={() => setActiveSessionId(s.id)}
                    style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}
                  >
                    <span style={{
                      fontSize: 14, fontWeight: active ? 600 : 400,
                      color: active ? "var(--text-primary)" : "var(--text-secondary)",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {s.title}
                    </span>
                    <span style={{
                      fontSize: 11, color: "color-mix(in srgb, var(--text-secondary) 70%, transparent)",
                      display: "flex", gap: 6, alignItems: "center",
                    }}>
                      {s.aiMode === "chat" ? <ChatIcon sx={{ fontSize: 10 }} /> : <AutoFixHighIcon sx={{ fontSize: 10 }} />}
                      {s.aiMode === "chat" ? "Chat" : "Gen Char"} • {new Date(s.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                    style={{
                      width: 28, height: 28, background: "transparent", border: "none",
                      color: "color-mix(in srgb, var(--text-secondary) 50%, transparent)",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: hoveredSessionId === s.id ? 1 : 0,
                      pointerEvents: hoveredSessionId === s.id ? "auto" : "none",
                      transition: "all 0.2s ease",
                    }}
                    title="Delete Chat"
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-red)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "color-mix(in srgb, var(--text-secondary) 50%, transparent)"; }}
                    className="ai-session-delete"
                  >
                    <DeleteIcon sx={{ fontSize: 14 }} />
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
