import React, { useState, useEffect, useRef } from "react";
import { Modal } from "./ui";
import { S } from "../lib/utils";
import { SmartToyIcon, SendIcon, SettingsIcon } from "./ui/icons";
import ReactMarkdown from "react-markdown";
import { showToast } from "../store/toastStore";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatModalProps {
  onClose: () => void;
  contextText: string;
}

export function AIChatModal({ onClose, contextText }: AIChatModalProps) {
  const [tab, setTab] = useState<"chat" | "config">(() => {
    return localStorage.getItem("seshat-ai-key") ? "chat" : "config";
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Config State
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem("seshat-ai-url") || "https://api.openai.com/v1");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("seshat-ai-key") || "");
  const [model, setModel] = useState(() => localStorage.getItem("seshat-ai-model") || "gpt-4o-mini");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const saveConfig = () => {
    localStorage.setItem("seshat-ai-url", baseUrl);
    localStorage.setItem("seshat-ai-key", apiKey);
    localStorage.setItem("seshat-ai-model", model);
    showToast("AI Configuration saved", "success");
    setTab("chat");
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
      setTab("config");
      return;
    }

    const newMsgs = [...messages, { role: "user" as const, content: input.trim() }];
    setMessages(newMsgs);
    setInput("");
    setIsTyping(true);

    try {
      const systemMsg = {
        role: "system",
        content: `You are an expert lorekeeper, editor, and creative assistant for a novelist. 
You are given the full canonical context of the world, characters, rules, and timeline below. 
Never contradict this context. Use it to answer questions, brainstorm, or write prose. 
Respond in Markdown.\n\n### CANONICAL CONTEXT ###\n${contextText}`
      };

      const payload = {
        model: model || "gpt-4o",
        messages: [systemMsg, ...newMsgs],
        temperature: 0.7,
      };

      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || res.statusText);
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "";

      setMessages([...newMsgs, { role: "assistant", content: reply }]);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`AI Error: ${msg}`, "error");
      setMessages([...newMsgs, { role: "assistant", content: `**Error:** ${msg}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    if (confirm("Are you sure you want to clear the chat history?")) {
      setMessages([]);
    }
  };

  return (
    <Modal title="Ask AI" onClose={onClose} width="800px">
      <div style={{ display: "flex", flexDirection: "column", height: "70vh", maxHeight: "800px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 16, borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 16 }}>
          <button
            onClick={() => setTab("chat")}
            style={{
              ...S.ghost,
              color: tab === "chat" ? "var(--color-purple)" : "var(--text-secondary)",
              fontWeight: tab === "chat" ? 600 : 400,
              display: "flex", alignItems: "center", gap: 6
            }}
          >
            <SmartToyIcon sx={{ fontSize: 16 }} />
            Chat
          </button>
          <button
            onClick={() => setTab("config")}
            style={{
              ...S.ghost,
              color: tab === "config" ? "var(--color-purple)" : "var(--text-secondary)",
              fontWeight: tab === "config" ? 600 : 400,
              display: "flex", alignItems: "center", gap: 6
            }}
          >
            <SettingsIcon sx={{ fontSize: 16 }} />
            Configuration
          </button>
          {tab === "chat" && messages.length > 0 && (
            <button
              onClick={clearChat}
              style={{ ...S.ghost, marginLeft: "auto", color: "var(--text-muted)", fontSize: 12 }}
            >
              Clear Chat
            </button>
          )}
        </div>

        {tab === "config" && (
          <div style={{ flex: 1, overflowY: "auto", paddingRight: 8 }}>
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>Unified AI Interface (BYOK)</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.5 }}>
              Seshat passes your entire world state directly to the AI model of your choice using an OpenAI-compatible interface. 
              Your API key is stored <b>only in your local browser</b> and is never synced to the server.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>API Base URL</label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  style={S.input}
                  placeholder="https://api.openai.com/v1"
                />
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                  Examples: <code>https://api.openai.com/v1</code>, <code>https://openrouter.ai/api/v1</code>, <code>http://localhost:1234/v1</code> (LMStudio)
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={S.input}
                  placeholder="sk-..."
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Model ID</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  style={S.input}
                  placeholder="gpt-4o"
                />
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                  Examples: <code>gpt-4o</code>, <code>anthropic/claude-3.5-sonnet</code> (OpenRouter), <code>google/gemini-1.5-pro</code>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <button onClick={saveConfig} style={S.primaryBtn}>
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "chat" && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
            <div style={{ flex: 1, overflowY: "auto", paddingRight: 8, display: "flex", flexDirection: "column", gap: 16 }}>
              {messages.length === 0 ? (
                <div style={{ margin: "auto", textAlign: "center", color: "var(--text-muted)" }}>
                  <SmartToyIcon sx={{ fontSize: 48, opacity: 0.2, marginBottom: 16 }} />
                  <p>Send a message to start brainstorming with your world lore.</p>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} style={{ 
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    background: m.role === "user" ? "var(--bg-active)" : "var(--bg-card)",
                    border: "1px solid var(--border)",
                    padding: "12px 16px",
                    borderRadius: m.role === "user" ? "12px 12px 0 12px" : "12px 12px 12px 0",
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "var(--text)",
                    wordBreak: "break-word"
                  }}>
                    {m.role === "assistant" ? (
                      <ReactMarkdown
                        components={{
                          p: ({ ...props }) => <p style={{ margin: "0 0 8px 0" }} {...props} />,
                          ul: ({ ...props }) => <ul style={{ margin: "0 0 8px 0", paddingLeft: 20 }} {...props} />,
                          li: ({ ...props }) => <li style={{ marginBottom: 4 }} {...props} />,
                          strong: ({ ...props }) => <strong style={{ color: "var(--text-secondary)" }} {...props} />,
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    ) : (
                      <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                    )}
                  </div>
                ))
              )}
              {isTyping && (
                <div style={{ 
                  alignSelf: "flex-start",
                  background: "transparent",
                  color: "var(--text-muted)",
                  padding: "8px 16px",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}>
                  <span className="seshat-typing-dot">●</span>
                  <span className="seshat-typing-dot" style={{ animationDelay: "0.2s" }}>●</span>
                  <span className="seshat-typing-dot" style={{ animationDelay: "0.4s" }}>●</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "flex-end" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about your world, characters, or ask it to write a scene..."
                style={{
                  ...S.input,
                  flex: 1,
                  resize: "none",
                  minHeight: "44px",
                  maxHeight: "150px",
                  paddingTop: 12,
                  paddingBottom: 12,
                }}
                rows={Math.min(5, input.split("\n").length)}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                style={{
                  ...S.primaryBtn,
                  height: "44px",
                  padding: "0 16px",
                  opacity: (!input.trim() || isTyping) ? 0.5 : 1
                }}
              >
                <SendIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .seshat-typing-dot {
          animation: typingPulse 1.4s infinite ease-in-out both;
        }
        @keyframes typingPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </Modal>
  );
}
