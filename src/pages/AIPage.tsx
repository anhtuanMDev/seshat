import { useState, useEffect, useRef, useCallback } from "react";
import { SmartToyIcon, SendIcon, DeleteIcon } from "../components/ui/icons";
import ReactMarkdown from "react-markdown";
import { showToast } from "../store/toastStore";
import { appStore } from "../store/appStore";
import type {
  BookData,
  Character,
  Event,
  Technique,
  Treasure,
  Nation,
  Ingredient,
  Monster,
} from "../store/appStore";
import { buildExport } from "../lib/export";
import { useSelector } from "@legendapp/state/react";
import { loadBookFromGitHub, updateFilesOnGitHub } from "../lib/githubSync";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Modal } from "../components/ui/Modal";
import { SaveIcon, AddIcon } from "../components/ui/icons";

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
    models: ["gemini-3.5-flash", "gemini-2.5-pro", "gemini-flash-latest"],
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

const PROMPT_TEMPLATES = [
  {
    icon: "🛡️",
    label: "Audit My World",
    prompt: `You are a story consistency auditor for a novelist.
You will be given the full canonical context of a book.
Your ONLY job is to find and list:
1. Internal contradictions (a character can't be in two places at once, timeline impossibilities)
2. Plot holes (setup without payoff, character motivations that don't add up)
3. Character inconsistencies (behavior that contradicts their coreWound/coreFear)
4. World-rule violations (characters using abilities they haven't acquired yet)

Format your response as a markdown list grouped by category.
Be specific: quote the entity name and the conflicting details.
Do not suggest fixes unless asked.`,
  },
  {
    icon: "🎭",
    label: "Interview Character",
    prompt:
      "Roleplay as a character from the provided context. I will ask you questions and you should answer exactly how they would, based on their psychology and history.",
  },
  {
    icon: "📝",
    label: "Suggest Next Scene",
    prompt:
      "Based on the chronological timeline of events, suggest what the next logical scene or major event should be, and outline what happens.",
  },
  {
    icon: "🌍",
    label: "Flesh out World",
    prompt:
      "Look at my world's setting, nations, and magic systems. Suggest 3 new cultural details, traditions, or minor factions that would make the world feel more alive.",
  },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusType = searchParams.get("focusType");
  const focusId = searchParams.get("focusId");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [aiMode, setAiMode] = useState<"chat" | "generate">("chat");
  const [generatedChar, setGeneratedChar] = useState<Partial<Character> | null>(null);

  const mkChar = (): Partial<Character> => ({
    id: crypto.randomUUID(),
    name: "New Character",
    color: "#8b5cf6",
    role: "minor",
    archetype: "",
    coreWound: "",
    coreFear: "",
    coreDesire: "",
    philosophy: "",
    secrets: "",
    arcs: [],
    statusTimeline: [],
    traumas: [],
    relationships: [],
    branch: [],
    attributes: {},
    conditions: [],
    skills: [],
    equipment: [],
    achievements: [],
    losses: [],
  });

  // Add to Canon Modal State
  const [canonModalContent, setCanonModalContent] = useState<string | null>(
    null,
  );
  const [canonTargetType, setCanonTargetType] = useState("character");
  const [canonTargetId, setCanonTargetId] = useState("");
  const [canonTargetField, setCanonTargetField] = useState("");

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

  const [selectedBookId, setSelectedBookId] = useState<string>(
    () => appStore.activeBookId.get() || "none",
  );
  const [contextText, setContextText] = useState("");
  const [isLoadingContext, setIsLoadingContext] = useState(false);

  // Load books list
  const books = useSelector(() => appStore.books.get() || []);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-save config when it changes
  useEffect(() => {
    localStorage.setItem("seshat-ai-provider", providerId);
    localStorage.setItem("seshat-ai-url", baseUrl);
    localStorage.setItem("seshat-ai-key", apiKey);
    localStorage.setItem("seshat-ai-model", model);
  }, [providerId, baseUrl, apiKey, model]);

  const generateContextFromBook = useCallback(
    (b: BookData) => {
      let contextData = {
        title: b.title || "",
        synopsis: b.synopsis || "",
        setting: b.setting || "",
        themes: b.themes || "",
        rules: b.rules || "",
        nations: b.nations || [],
        techniques: b.techniques || [],
        ingredients: b.ingredients || [],
        monsters: b.monsters || [],
        treasures: b.treasures || [],
        events: b.events || [],
        characters: b.characters || [],
      };

      if (focusType && focusId && focusType !== "none") {
        if (focusType === "character") {
          const char = contextData.characters.find(
            (c: Character) => c.id === focusId,
          );
          if (char) {
            const relatedCharIds =
              char.relationships?.map((r: { withId: string }) => r.withId) ||
              [];
            char.branch?.forEach((b: { crossings?: { withId: string }[] }) => {
              b.crossings?.forEach((cr: { withId: string }) =>
                relatedCharIds.push(cr.withId),
              );
            });
            const relatedChars = contextData.characters.filter(
              (c: Character) =>
                relatedCharIds.includes(c.id) && c.id !== char.id,
            );

            const skillStr = JSON.stringify(char.skills || []).toLowerCase();
            const relatedTechs = contextData.techniques.filter((t: Technique) =>
              skillStr.includes(t.name?.toLowerCase() || ""),
            );

            const equipStr = JSON.stringify(char.equipment || []).toLowerCase();
            const relatedTreasures = contextData.treasures.filter(
              (t: Treasure) => equipStr.includes(t.name?.toLowerCase() || ""),
            );

            contextData = {
              ...contextData,
              title: `${contextData.title} (Focus: Character - ${char.name})`,
              characters: [char, ...relatedChars],
              nations: contextData.nations,
              techniques: relatedTechs,
              ingredients: [],
              monsters: [],
              treasures: relatedTreasures,
            };
          }
        } else if (focusType === "event") {
          const ev = contextData.events.find((e: Event) => e.id === focusId);
          if (ev) {
            const charIds = ev.characters || [];
            const chars = contextData.characters.filter((c: Character) =>
              charIds.includes(c.id),
            );

            const skillStr = JSON.stringify(
              chars.map((c: Character) => c.skills || []),
            ).toLowerCase();
            const relatedTechs = contextData.techniques.filter((t: Technique) =>
              skillStr.includes(t.name?.toLowerCase() || ""),
            );

            const equipStr = JSON.stringify(
              chars.map((c: Character) => c.equipment || []),
            ).toLowerCase();
            const relatedTreasures = contextData.treasures.filter(
              (t: Treasure) => equipStr.includes(t.name?.toLowerCase() || ""),
            );

            contextData = {
              ...contextData,
              title: `${contextData.title} (Focus: Event - ${ev.title})`,
              events: contextData.events,
              characters: chars,
              nations: contextData.nations,
              techniques: relatedTechs,
              ingredients: [],
              monsters: [],
              treasures: relatedTreasures,
            };
          }
        } else {
          const collectionName = (focusType + "s") as keyof typeof contextData;
          type WorldItem = Nation | Technique | Ingredient | Monster | Treasure;
          const items = contextData[collectionName] as Array<WorldItem>;
          if (items) {
            const item = items.find((x) => x.id === focusId);
            if (item) {
              contextData = {
                ...contextData,
                title: `${contextData.title} (Focus: ${focusType.charAt(0).toUpperCase() + focusType.slice(1)} - ${item.name})`,
                characters: [],
                events: [],
                nations: focusType === "nation" ? [item as Nation] : [],
                techniques:
                  focusType === "technique" ? [item as Technique] : [],
                ingredients:
                  focusType === "ingredient" ? [item as Ingredient] : [],
                monsters: focusType === "monster" ? [item as Monster] : [],
                treasures: focusType === "treasure" ? [item as Treasure] : [],
              };
            }
          }
        }
      }

      const text = buildExport(contextData);
      setContextText(text);
    },
    [focusType, focusId],
  );

  // Handle book selection for context
  useEffect(() => {
    if (selectedBookId === "none") {
      setTimeout(() => setContextText(""), 0);
      return;
    }

    const loadContext = async () => {
      const bookIdx = books.findIndex((b) => b && b.id === selectedBookId);
      if (bookIdx < 0) return;

      const book = books[bookIdx];
      if (book.isFullyLoaded) {
        generateContextFromBook(book);
      } else {
        setIsLoadingContext(true);
        const token =
          localStorage.getItem("seshat-auth-token") ||
          sessionStorage.getItem("seshat-auth-token");
        if (token) {
          try {
            const fullBook = await loadBookFromGitHub(token, selectedBookId);
            if (fullBook) {
              // Update store so it's cached
              appStore.books[bookIdx].set(fullBook);
              generateContextFromBook(fullBook);
            }
          } catch (err) {
            console.error(err);
            showToast("Failed to load book context", "error");
            setSelectedBookId("none");
          }
        }
        setIsLoadingContext(false);
      }
    };
    loadContext();
  }, [selectedBookId, books, generateContextFromBook]);

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
      const genSystemPrompt = `You are an AI assistant that generates a Character node for a story database.
Given the canonical context, generate a new character based on the user's prompt.
Respond ONLY with a valid JSON object. No preamble, no markdown fences, no explanation.
Fill only these fields: name, role, archetype, coreWound, coreFear, coreDesire, philosophy, secrets, color.
JSON SCHEMA: { "name": "string", "role": "string", "archetype": "string", "coreWound": "string", "coreFear": "string", "coreDesire": "string", "philosophy": "string", "secrets": "string", "color": "string hex" }

### CANONICAL CONTEXT ###
${contextText}`;

      const systemMsgContent = aiMode === "generate" 
        ? genSystemPrompt
        : contextText
          ? `You are an expert lorekeeper, editor, and creative assistant for a novelist. 
You are given the full canonical context of the world, characters, rules, and timeline below. 
Never contradict this context. Use it to answer questions, brainstorm, or write prose. 
Respond in Markdown.\n\n### CANONICAL CONTEXT ###\n${contextText}`
          : `You are an expert creative assistant for a novelist. Respond in Markdown.`;

      const systemMsg = {
        role: "system",
        content: systemMsgContent,
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
            Authorization: `Bearer ${apiKey.trim()}`,
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

      if (aiMode === "generate") {
        try {
          const raw = assistantMessage.replace(/```json|```/g, "").trim();
          const generated = JSON.parse(raw);
          const merged = { ...mkChar(), ...generated };
          setGeneratedChar(merged as Partial<Character>);
        } catch (e) {
          console.error("Failed to parse generated character JSON", e);
          showToast("Failed to parse generated character JSON", "error");
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

  const getCanonFieldsForType = (type: string) => {
    switch (type) {
      case "book":
        return ["synopsis", "setting", "themes", "rules"];
      case "character":
        return [
          "coreWound",
          "coreFear",
          "coreDesire",
          "philosophy",
          "secrets",
          "appearance",
        ];
      case "event":
        return ["description", "consequence", "setting", "subplot"];
      case "nation":
        return [
          "geography",
          "culture",
          "military",
          "economy",
          "allianceLogic",
          "secrets",
          "lore",
        ];
      case "technique":
        return [
          "description",
          "effect",
          "requirement",
          "cost",
          "secret",
          "lore",
        ];
      case "ingredient":
        return ["appearance", "properties", "uses", "danger", "lore"];
      case "monster":
        return [
          "appearance",
          "abilities",
          "weaknesses",
          "drops",
          "lore",
          "behavior",
        ];
      case "treasure":
        return ["description", "stats", "curses", "history"];
      default:
        return [];
    }
  };

  const handleSaveToCanon = async () => {
    if (
      !canonModalContent ||
      !canonTargetType ||
      !canonTargetId ||
      !canonTargetField ||
      selectedBookId === "none"
    )
      return;

    const bookIdx = books.findIndex((b) => b && b.id === selectedBookId);
    if (bookIdx < 0) return;

    const book = appStore.books[bookIdx];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let targetObj: any = null;
    let fileNameToSync = "";

    if (canonTargetType === "book") {
      targetObj = book;
      fileNameToSync = "book.json";
    } else {
      const collectionName = canonTargetType + "s";
      const collection = book[
        collectionName as keyof typeof book
      ] as unknown as { get?: () => { id: string }[] };
      const items =
        typeof collection.get === "function" ? collection.get() : [];
      const idx = items.findIndex((x) => x.id === canonTargetId);
      if (idx >= 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        targetObj = (book[collectionName as keyof typeof book] as any)[idx];
        fileNameToSync =
          canonTargetType === "event"
            ? `events/event_${canonTargetId}.json`
            : canonTargetType === "character"
              ? `characters/character_${canonTargetId}.json`
              : `world/${collectionName}/${canonTargetType}_${canonTargetId}.json`;
      }
    }

    if (!targetObj) {
      showToast("Could not find target entity", "error");
      return;
    }

    const currentVal = targetObj[canonTargetField].get() || "";
    const newVal = currentVal
      ? `${currentVal}\n\n[AI Notes]:\n${canonModalContent}`
      : canonModalContent;
    targetObj[canonTargetField].set(newVal);

    setCanonModalContent(null);
    showToast(`Added to ${canonTargetField}!`, "success");

    const token =
      localStorage.getItem("seshat-auth-token") ||
      sessionStorage.getItem("seshat-auth-token");
    if (token && fileNameToSync) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let payload: any = targetObj.get();
        if (canonTargetType === "book") {
          payload = {
            id: payload.id,
            title: payload.title,
            synopsis: payload.synopsis,
            setting: payload.setting,
            themes: payload.themes,
            rules: payload.rules,
          };
        }
        await updateFilesOnGitHub(token, selectedBookId, [
          { path: fileNameToSync, content: JSON.stringify(payload, null, 2) },
        ]);
      } catch (e) {
        console.error("Failed background sync", e);
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        width: "100dvw",
        background: "var(--bg-app)",
      }}
    >
      <div
        className="seshat-top"
        style={{
          height: 50,
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          background: "var(--bg-top)",
        }}
      >
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
            gap: 8,
          }}
        >
          ← Back to Books
        </button>
        <div style={{ flex: 1 }} />
        <div
          style={{
            fontWeight: 600,
            color: "var(--color-purple)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <SmartToyIcon sx={{ fontSize: 18 }} />
          Oracle AI
        </div>
      </div>

      <div className="ai-page-layout">
        {/* LEFT SIDEBAR: Config & Controls */}
        <div className="ai-page-sidebar">
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <h3
                style={{
                  fontSize: 16,
                  margin: 0,
                  color: "var(--text-primary)",
                }}
              >
                Context Injection
              </h3>
              {contextText && (
                <span
                  style={{
                    fontSize: 11,
                    background: "rgba(139, 92, 246, 0.15)",
                    color: "var(--color-purple)",
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
              Select a book to inject its entire world, timeline, and characters
              into the AI's prompt.
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
              <div
                style={{
                  fontSize: 11,
                  color: "var(--color-purple)",
                  marginTop: 8,
                }}
              >
                Loading context...
              </div>
            )}
            {contextText && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--color-green)",
                  marginTop: 8,
                }}
              >
                ✓ Context loaded ({Math.round(contextText.length / 4)} tokens)
                {focusType && focusId && focusType !== "none" && (
                  <div style={{ color: "var(--color-purple)", marginTop: 4 }}>
                    ✦ Focused on specific {focusType}. Irrelevant world data
                    trimmed.
                  </div>
                )}
              </div>
            )}
            
            <h3 style={{ fontSize: 16, margin: "24px 0 8px 0", color: "var(--text-primary)" }}>AI Mode</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button 
                onClick={() => setAiMode("chat")}
                style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid", borderColor: aiMode === "chat" ? "var(--color-purple)" : "var(--border)", background: aiMode === "chat" ? "rgba(139, 92, 246, 0.1)" : "var(--bg-panel)", color: aiMode === "chat" ? "var(--color-purple)" : "var(--text-secondary)", fontWeight: 600, cursor: "pointer" }}
              >
                💬 Chat
              </button>
              <button 
                onClick={() => setAiMode("generate")}
                style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid", borderColor: aiMode === "generate" ? "var(--color-purple)" : "var(--border)", background: aiMode === "generate" ? "rgba(139, 92, 246, 0.1)" : "var(--bg-panel)", color: aiMode === "generate" ? "var(--color-purple)" : "var(--text-secondary)", fontWeight: 600, cursor: "pointer" }}
              >
                ✨ Gen Char
              </button>
            </div>
          </div>

          <div
            style={{ height: 1, background: "var(--border)", margin: "8px 0" }}
          />

          <div>
            <h3
              style={{
                fontSize: 16,
                margin: "0 0 8px 0",
                color: "var(--text-primary)",
              }}
            >
              Oracle Settings
            </h3>
            <p
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                lineHeight: 1.4,
                margin: "0 0 16px 0",
              }}
            >
              Configure your BYOK AI provider. Auto-saved securely to your
              browser.
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
            ) : null}
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
        <div className="ai-page-main">
          <div className="ai-chat-feed">
            {messages.length === 0 ? (
              <div className="ai-empty-state">
                <SmartToyIcon
                  sx={{ fontSize: 48, opacity: 0.1, marginBottom: 16 }}
                />
                <p>The Oracle is ready.</p>
                <span style={{ fontSize: 13, opacity: 0.6, marginTop: 8 }}>
                  {selectedBookId !== "none"
                    ? "Ask about your world, characters, or request a prose scene."
                    : "Ask anything! Select a book on the left to provide specific context."}
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
                    {m.role === "assistant" && selectedBookId !== "none" && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          marginTop: 8,
                        }}
                      >
                        <button
                          onClick={() => {
                            setCanonModalContent(m.content);
                            setCanonTargetType(
                              focusType && focusType !== "none"
                                ? focusType
                                : "character",
                            );
                            setCanonTargetId(focusId || "");
                            setCanonTargetField(
                              getCanonFieldsForType(
                                focusType && focusType !== "none"
                                  ? focusType
                                  : "character",
                              )[0] || "",
                            );
                          }}
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
            <div
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
              {PROMPT_TEMPLATES.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setInput(t.prompt)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    background: "var(--bg-panel)",
                    border: "1px solid var(--border-field)",
                    borderRadius: 16,
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-purple)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-field)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
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
            {selectedBookId !== "none" && (
              <div
                style={{
                  fontSize: 11,
                  textAlign: "center",
                  marginTop: 8,
                  color: "var(--text-muted)",
                }}
              >
                The entire context of the selected book is automatically
                included in every prompt.
              </div>
            )}
          </div>
        </div>
      </div>

      {showClearConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "var(--bg-main)",
              padding: 24,
              borderRadius: 8,
              width: 400,
              maxWidth: "90%",
              border: "1px solid var(--border)",
            }}
          >
            <h3 style={{ margin: "0 0 16px 0", color: "var(--text-primary)" }}>
              Clear Chat History
            </h3>
            <p style={{ color: "var(--text-primary)", marginBottom: 24 }}>
              Are you sure you want to clear the chat history?
            </p>
            <div
              className="seshat-flex-end"
              style={{ gap: 12, display: "flex", justifyContent: "flex-end" }}
            >
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
        </div>
      )}

      {canonModalContent !== null && (
        <Modal
          title="Add AI Response to Canon"
          onClose={() => setCanonModalContent(null)}
          variant="wide"
          footer={
            <div className="seshat-flex-end" style={{ width: "100%", gap: 12 }}>
              <button
                onClick={() => setCanonModalContent(null)}
                className="seshat-modal-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveToCanon}
                className="seshat-modal-btn-submit"
                disabled={
                  !canonTargetType || !canonTargetId || !canonTargetField
                }
              >
                <SaveIcon sx={{ fontSize: 16 }} /> Save to Canon
              </button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label
                  style={{
                    fontSize: 11,
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Entity Type
                </label>
                <select
                  value={canonTargetType}
                  onChange={(e) => {
                    const t = e.target.value;
                    setCanonTargetType(t);
                    setCanonTargetId("");
                    setCanonTargetField(getCanonFieldsForType(t)[0] || "");
                  }}
                  style={{
                    background: "var(--bg-card)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border)",
                    padding: "6px",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  <option value="book">Book (World Settings)</option>
                  <option value="character">Character</option>
                  <option value="event">Event (Timeline)</option>
                  <option value="nation">Nation / Faction</option>
                  <option value="technique">Technique</option>
                  <option value="ingredient">Ingredient</option>
                  <option value="monster">Monster</option>
                  <option value="treasure">Treasure</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label
                  style={{
                    fontSize: 11,
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Specific Entity
                </label>
                <select
                  value={canonTargetId}
                  onChange={(e) => setCanonTargetId(e.target.value)}
                  style={{
                    background: "var(--bg-card)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border)",
                    padding: "6px",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                  disabled={canonTargetType === "book"}
                >
                  <option value="" disabled>
                    Select {canonTargetType}...
                  </option>
                  {canonTargetType === "book" ? (
                    <option value={selectedBookId}>Active Book</option>
                  ) : (
                    (
                      (books.find((b) => b?.id === selectedBookId)?.[
                        (canonTargetType + "s") as keyof (typeof books)[0]
                      ] as Array<{
                        id: string;
                        name?: string;
                        title?: string;
                      }>) || []
                    ).map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name || x.title || "Untitled"}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label
                  style={{
                    fontSize: 11,
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Data Field
                </label>
                <select
                  value={canonTargetField}
                  onChange={(e) => setCanonTargetField(e.target.value)}
                  style={{
                    background: "var(--bg-card)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border)",
                    padding: "6px",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  {getCanonFieldsForType(canonTargetType).map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label
                style={{
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                }}
              >
                Text to Append
              </label>
              <textarea
                value={canonModalContent || ""}
                onChange={(e) => setCanonModalContent(e.target.value)}
                style={{
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                  padding: "12px",
                  borderRadius: 4,
                  fontSize: 13,
                  height: 200,
                  resize: "vertical",
                  fontFamily: "var(--font-mono)",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontStyle: "italic",
                }}
              >
                This text will be appended to the existing content in the
                selected field.
              </span>
            </div>
          </div>
        </Modal>
      )}

      {generatedChar && (
        <Modal title="Preview Generated Character" onClose={() => setGeneratedChar(null)} variant="wide" footer={
          <div className="seshat-flex-end" style={{ width: "100%", gap: 12 }}>
            <button onClick={() => setGeneratedChar(null)} className="seshat-modal-btn-cancel">Cancel</button>
            <button onClick={() => {
              const bookIdx = books.findIndex(b => b && b.id === selectedBookId);
              if (bookIdx >= 0) {
                 const book = appStore.books[bookIdx];
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                 (book.characters as any).push(generatedChar as Character);
                 const token = localStorage.getItem("seshat-auth-token") || sessionStorage.getItem("seshat-auth-token");
                 if (token) {
                   updateFilesOnGitHub(token, selectedBookId, [{ path: `characters/character_${generatedChar.id}.json`, content: JSON.stringify(generatedChar, null, 2) }]);
                 }
                 setGeneratedChar(null);
                 showToast("Character created successfully!", "success");
              }
            }} className="seshat-modal-btn-submit" disabled={selectedBookId === "none"}>
               <AddIcon sx={{ fontSize: 16 }} /> Save Character
            </button>
          </div>
        }>
          <div style={{ padding: 16 }}>
            <p style={{ margin: "0 0 16px 0", color: "var(--text-secondary)", fontSize: 13 }}>
              The AI generated the following structural data. Saving it will immediately add this character to your world database.
            </p>
            <pre style={{ whiteSpace: "pre-wrap", background: "var(--bg-card)", border: "1px solid var(--border)", padding: 16, borderRadius: 8, color: "var(--text-primary)", fontSize: 13, fontFamily: "var(--font-mono)", maxHeight: "50vh", overflowY: "auto" }}>
              {JSON.stringify(generatedChar, null, 2)}
            </pre>
          </div>
        </Modal>
      )}

      <style>{`
        .ai-page-layout {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .ai-page-sidebar {
          width: 320px;
          background: var(--bg-side);
          border-right: 1px solid var(--border);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow-y: auto;
        }

        @media (max-width: 768px) {
          .ai-page-layout {
            flex-direction: column;
          }
          .ai-page-sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid var(--border);
            flex-shrink: 0;
            max-height: 40vh;
          }
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

        .ai-page-main {
          display: flex;
          flex-direction: column;
          background: var(--bg-main);
          flex: 1;
          min-width: 0; 
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

        @media (max-width: 768px) {
          .ai-message-block {
            padding: 20px;
          }
          .ai-input-container {
            padding: 16px;
          }
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
          max-width: 1000px;
          margin: 0 auto;
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
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: var(--color-purple);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          margin-bottom: 4px;
          margin-left: 8px;
        }

        .ai-send-btn:hover:not(:disabled) {
          background: #7c3aed;
        }

        .ai-send-btn:disabled {
          background: var(--bg-panel);
          color: var(--text-muted);
          cursor: not-allowed;
          border: 1px solid var(--border-field);
        }

        .ai-typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 24px;
          padding-top: 6px;
        }

        .ai-dot {
          width: 6px;
          height: 6px;
          background: var(--text-muted);
          border-radius: 50%;
          animation: ai-bounce 1.4s infinite ease-in-out both;
        }

        @keyframes ai-bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
