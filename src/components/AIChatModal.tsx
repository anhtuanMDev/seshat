import { useState, useEffect, useRef } from "react";
import { Modal } from "./ui";
import { SmartToyIcon, SendIcon, DeleteIcon } from "./ui/icons";
import ReactMarkdown from "react-markdown";
import { showToast } from "../store/toastStore";

const AI_PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    url: "https://api.openai.com/v1",
    models: ["gpt-4o-mini", "gpt-4o", "o1-mini"],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    url: "https://openrouter.ai/api/v1",
    models: [
      "anthropic/claude-3.5-sonnet",
      "google/gemini-1.5-pro",
      "meta-llama/llama-3.1-70b-instruct",
    ],
  },
  {
    id: "groq",
    name: "Groq",
    url: "https://api.groq.com/openai/v1",
    models: ["llama3-8b-8192", "llama3-70b-8192", "mixtral-8x7b-32768"],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    url: "https://api.deepseek.com/v1",
    models: ["deepseek-chat", "deepseek-coder"],
  },
  {
    id: "grok",
    name: "xAI Grok",
    url: "https://api.x.ai/v1",
    models: ["grok-beta", "grok-vision-beta"],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    url: "https://generativelanguage.googleapis.com/v1beta/openai",
    models: ["gemini-1.5-pro-latest", "gemini-1.5-flash-latest"],
  },
  {
    id: "local",
    name: "Local (LMStudio/Ollama)",
    url: "http://localhost:1234/v1",
    models: ["local-model"],
  },
  {
    id: "custom",
    name: "Custom...",
    url: "",
    models: [],
  },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatModalProps {
  onClose: () => void;
  contextText: string;
}

export function AIChatModal({ onClose, contextText }: AIChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Config State
  const [providerId, setProviderId] = useState(
    () => localStorage.getItem("seshat-ai-provider") || "openai",
  );
  const [baseUrl, setBaseUrl] = useState(
    () => localStorage.getItem("seshat-ai-url") || "https://api.openai.com/v1",
  );
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("seshat-ai-key") || "",
  );
  const [model, setModel] = useState(
    () => localStorage.getItem("seshat-ai-model") || "gpt-4o-mini",
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-save config when it changes
  useEffect(() => {
    localStorage.setItem("seshat-ai-provider", providerId);
    localStorage.setItem("seshat-ai-url", baseUrl);
    localStorage.setItem("seshat-ai-key", apiKey);
    localStorage.setItem("seshat-ai-model", model);
  }, [providerId, baseUrl, apiKey, model]);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pid = e.target.value;
    setProviderId(pid);
    const prov = AI_PROVIDERS.find((p) => p.id === pid);
    if (prov && pid !== "custom") {
      setBaseUrl(prov.url);
      if (prov.models.length > 0) {
        setModel(prov.models[0]);
      }
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!apiKey.trim() && !baseUrl.includes("localhost")) {
      showToast("Please enter an API Key in settings first", "error");
      return;
    }

    const newMsgs = [
      ...messages,
      { role: "user" as const, content: input.trim() },
    ];
    setMessages(newMsgs);
    setInput("");
    setIsTyping(true);

    try {
      const systemMsg = {
        role: "system",
        content: `You are an expert lorekeeper, editor, and creative assistant for a novelist. 
You are given the full canonical context of the world, characters, rules, and timeline below. 
Never contradict this context. Use it to answer questions, brainstorm, or write prose. 
Respond in Markdown.\n\n### CANONICAL CONTEXT ###\n${contextText}`,
      };

      const payload = {
        model: model || "gpt-4o",
        messages: [systemMsg, ...newMsgs],
        temperature: 0.7,
        stream: true,
      };

      const res = await fetch(
        `${baseUrl.replace(/\/$/, "")}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        let errText = await res.text();
        try {
          const parsed = JSON.parse(errText);
          const errObj = Array.isArray(parsed) ? parsed[0] : parsed;

          if (errObj?.error?.message) {
            errText = errObj.error.message;
          } else if (errObj?.message) {
            errText = errObj.message;
          }
        } catch {
          // If it's not JSON, we just use the raw errText
        }
        throw new Error(errText || res.statusText);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) throw new Error("No response body stream");

      // Initialize an empty assistant message
      setMessages([...newMsgs, { role: "assistant", content: "" }]);

      let assistantMessage = "";
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() === "") continue;
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr.trim() === "[DONE]") break;
            try {
              const data = JSON.parse(dataStr);
              if (data.choices && data.choices[0].delta?.content) {
                assistantMessage += data.choices[0].delta.content;
                setMessages((prev) => {
                  const newArray = [...prev];
                  newArray[newArray.length - 1] = {
                    role: "assistant",
                    content: assistantMessage,
                  };
                  return newArray;
                });
              }
            } catch (e) {
              console.error("errors on incomplete JSON or generic lines:", e);
            }
          }
        }
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`AI Error: ${msg}`, "error");

      // Revert the UI state so the user doesn't lose their typed prompt
      setMessages(messages);
      setInput(input.trim());
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setShowClearConfirm(true);
  };

  return (
    <Modal title="AI Co-Pilot" onClose={onClose} variant="wide">
      <div className="ai-modal-layout">
        {/* LEFT SIDEBAR: Config & Controls */}
        <div className="ai-modal-sidebar">
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <div className="ai-brand-icon">
                <SmartToyIcon sx={{ fontSize: 20 }} />
              </div>
              <h3 style={{ fontSize: 16, margin: 0 }}>Oracle Settings</h3>
            </div>
            <p
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                lineHeight: 1.4,
                margin: "0 0 24px 0",
              }}
            >
              Configure your BYOK AI provider. Model settings auto-save securely
              to your browser.
            </p>
          </div>

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
            {AI_PROVIDERS.find((p) => p.id === providerId)?.models.length ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 4,
                }}
              >
                {AI_PROVIDERS.find((p) => p.id === providerId)?.models.map(
                  (m) => (
                    <button
                      key={m}
                      onClick={() => setModel(m)}
                      className="ai-model-pill"
                      style={{
                        background:
                          model === m ? "var(--bg-active)" : "var(--bg-panel)",
                        borderColor:
                          model === m
                            ? "var(--color-purple)"
                            : "var(--border-field)",
                        color:
                          model === m
                            ? "var(--color-purple)"
                            : "var(--text-secondary)",
                      }}
                    >
                      {m}
                    </button>
                  ),
                )}
              </div>
            ) : (
              <span className="ai-config-hint">
                Type the model ID manually.
              </span>
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
            <span className="ai-config-hint">Requires sufficient credits.</span>
          </div>

          <div style={{ flex: 1 }} />

          <button
            onClick={clearChat}
            className="ai-clear-btn"
            disabled={messages.length === 0}
          >
            <DeleteIcon sx={{ fontSize: 16 }} />
            Clear Context History
          </button>
        </div>

        {/* RIGHT AREA: Chat Interface */}
        <div className="ai-modal-main">
          <div className="ai-chat-feed">
            {messages.length === 0 ? (
              <div className="ai-empty-state">
                <SmartToyIcon
                  sx={{ fontSize: 48, opacity: 0.1, marginBottom: 16 }}
                />
                <p>The Oracle is ready.</p>
                <span style={{ fontSize: 13, opacity: 0.6, marginTop: 8 }}>
                  Ask about your world, characters, or request a prose scene.
                </span>
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`ai-message-block ${m.role === "user" ? "ai-user-bg" : "ai-assistant-bg"}`}
                >
                  <div className="ai-avatar">
                    {m.role === "user" ? (
                      "U"
                    ) : (
                      <SmartToyIcon sx={{ fontSize: 18 }} />
                    )}
                  </div>
                  <div
                    className={`ai-message-content ${m.role === "user" ? "ai-user-text" : ""}`}
                  >
                    {m.role === "assistant" ? (
                      <ReactMarkdown
                        components={{
                          p: ({ ...props }) => (
                            <p style={{ margin: "0 0 12px 0" }} {...props} />
                          ),
                          ul: ({ ...props }) => (
                            <ul
                              style={{ margin: "0 0 12px 0", paddingLeft: 24 }}
                              {...props}
                            />
                          ),
                          ol: ({ ...props }) => (
                            <ol
                              style={{ margin: "0 0 12px 0", paddingLeft: 24 }}
                              {...props}
                            />
                          ),
                          li: ({ ...props }) => (
                            <li style={{ marginBottom: 6 }} {...props} />
                          ),
                          strong: ({ ...props }) => (
                            <strong
                              style={{
                                color: "var(--text-primary)",
                                fontWeight: 600,
                              }}
                              {...props}
                            />
                          ),
                          h3: ({ ...props }) => (
                            <h3
                              style={{
                                margin: "16px 0 8px 0",
                                fontSize: 16,
                                color: "var(--text-primary)",
                              }}
                              {...props}
                            />
                          ),
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    ) : (
                      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                        {m.content}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {isTyping && (
              <div className="ai-message-block ai-assistant-bg">
                <div className="ai-avatar">
                  <SmartToyIcon sx={{ fontSize: 18 }} />
                </div>
                <div className="ai-typing-indicator">
                  <span className="ai-dot"></span>
                  <span
                    className="ai-dot"
                    style={{ animationDelay: "0.2s" }}
                  ></span>
                  <span
                    className="ai-dot"
                    style={{ animationDelay: "0.4s" }}
                  ></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} style={{ height: 1 }} />
          </div>

          <div className="ai-input-container">
            <div className="ai-input-wrapper">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask the Oracle..."
                className="ai-textarea"
                rows={1}
                style={{
                  height: Math.min(
                    200,
                    Math.max(44, input.split("\n").length * 20 + 24),
                  ),
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="ai-send-btn"
              >
                <SendIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
            <div
              style={{
                fontSize: 11,
                textAlign: "center",
                marginTop: 8,
                color: "var(--text-muted)",
              }}
            >
              The entire world context is automatically included in every
              prompt.
            </div>
          </div>
        </div>
      </div>

      {showClearConfirm && (
        <Modal
          title="Clear Chat History"
          onClose={() => setShowClearConfirm(false)}
        >
          <div style={{ padding: "0 var(--space-5) var(--space-5)" }}>
            <p style={{ color: "var(--text-primary)", marginBottom: 24 }}>
              Are you sure you want to clear the chat history?
            </p>
            <div className="seshat-flex-end" style={{ gap: 12 }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  padding: "6px 12px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setMessages([]);
                  setShowClearConfirm(false);
                }}
                style={{
                  padding: "6px 12px",
                  background: "var(--color-red)",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  color: "white",
                  fontWeight: 600,
                }}
              >
                Yes, clear it
              </button>
            </div>
          </div>
        </Modal>
      )}

      <style>{`
        .ai-modal-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          height: 70vh;
          min-height: 500px;
          max-height: 800px;
          background: var(--bg-main);
          border-radius: 8px;
          border: 1px solid var(--border);
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }

        .ai-modal-sidebar {
          background: var(--bg-side);
          border-right: 1px solid var(--border);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow-y: auto;
        }

        .ai-brand-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: var(--color-purple);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-config-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ai-config-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .ai-config-input {
          background: var(--bg-panel);
          border: 1px solid var(--border-field);
          color: var(--text-primary);
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
          box-sizing: border-box;
        }

        .ai-config-input option {
          background: var(--bg-main);
          color: var(--text-primary);
        }

        .ai-model-pill {
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid var(--border-field);
          background: var(--bg-panel);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .ai-model-pill:hover {
          border-color: var(--text-muted);
        }

        .ai-config-input:focus {
          border-color: var(--color-purple);
        }

        .ai-config-hint {
          font-size: 11px;
          color: var(--text-muted);
        }

        .ai-clear-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          background: transparent;
          border: 1px solid var(--border-field);
          color: var(--text-secondary);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 13px;
        }

        .ai-clear-btn:not(:disabled):hover {
          background: rgba(255, 0, 0, 0.1);
          color: var(--color-red);
          border-color: var(--color-red);
        }

        .ai-clear-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ai-modal-main {
          display: flex;
          flex-direction: column;
          background: var(--bg-main);
          position: relative;
          min-width: 0; /* Prevent flex items from blowing out grid cells */
        }

        .ai-chat-feed {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .ai-empty-state {
          margin: auto;
          text-align: center;
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px;
        }

        .ai-message-block {
          padding: 32px 40px;
          border-bottom: 1px solid var(--border);
          display: flex;
          gap: 20px;
        }

        .ai-user-bg {
          background: var(--bg-active);
        }

        .ai-assistant-bg {
          background: var(--bg-main);
        }

        .ai-avatar {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: var(--bg-panel);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .ai-message-content {
          flex: 1;
          min-width: 0;
          color: var(--text-primary);
          font-size: 15px;
          line-height: 1.7;
        }

        .ai-message-content p:last-child {
          margin-bottom: 0 !important;
        }

        .ai-user-text {
          color: var(--text-secondary);
          font-size: 15px;
        }

        .ai-input-container {
          padding: 24px 40px;
          background: var(--bg-main);
          border-top: 1px solid var(--border);
        }

        .ai-input-wrapper {
          position: relative;
          background: var(--bg-panel);
          border: 1px solid var(--border-field);
          border-radius: 12px;
          display: flex;
          align-items: flex-end;
          padding: 8px 8px 8px 16px;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .ai-input-wrapper:focus-within {
          border-color: var(--color-purple);
          box-shadow: 0 4px 16px rgba(var(--color-purple-rgb), 0.1);
        }

        .ai-textarea {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          resize: none;
          font-family: inherit;
          font-size: 15px;
          line-height: 1.5;
          padding: 10px 0;
        }

        .ai-textarea::placeholder {
          color: var(--text-dim);
        }

        .ai-send-btn {
          background: var(--color-purple);
          color: white;
          border: none;
          border-radius: 8px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          margin-left: 12px;
          margin-bottom: 2px;
          transition: all 0.2s;
        }

        .ai-send-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        .ai-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .ai-typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 24px;
        }

        .ai-dot {
          width: 6px;
          height: 6px;
          background: var(--text-muted);
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out both;
        }

        @keyframes typing {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </Modal>
  );
}
