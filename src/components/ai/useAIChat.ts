// ─────────────────────────────────────────────────────────────────────────────
// useAIChat — streaming message orchestration with AbortController
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from "react";
import { showToast } from "../../store/toastStore";
import type { BookData, Character } from "../../store/appStore";
import type { Message, AiMode } from "./types";
import type { ExpertMode } from "./constants";
import { TEMP_BY_MODE } from "./constants";
import {
  buildGenSystemPrompt,
  buildChatSystemPrompt,
  cleanMessagesForApi,
} from "./prompts";



interface UseAIChatOptions {
  sessionId: string;
  updateSessionTitle?: (id: string, title: string) => void;
  expertMode: ExpertMode;
  aiMode: AiMode;
  contextText: string;
  focusId: string | null;
  selectedBookId: string;
  books: BookData[];
  baseUrl: string;
  apiKey: string;
  model: string;
}

export function useAIChat({
  sessionId,
  updateSessionTitle,
  expertMode,
  aiMode,
  contextText,
  focusId,
  selectedBookId,
  books,
  baseUrl,
  apiKey,
  model,
}: UseAIChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);

  // Load messages when sessionId changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`seshat-chat-${sessionId}`);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages(saved ? JSON.parse(saved) : []);
    } catch {
      setMessages([]);
    }
  }, [sessionId]);

  const [isTyping, setIsTyping] = useState(false);
  const [generatedChar, setGeneratedChar] = useState<Partial<Character> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Persist messages to localStorage for this session
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`seshat-chat-${sessionId}`, JSON.stringify(messages));
    } else {
      localStorage.removeItem(`seshat-chat-${sessionId}`);
    }
  }, [messages, sessionId]);

  /** Build the roleplay persona injection for CHARACTER_ROLEPLAY mode */
  const buildRoleplayInjection = useCallback((): string => {
    if (expertMode !== "CHARACTER_ROLEPLAY" || !focusId) return "";
    const bookIdx = books.findIndex((b) => b?.id === selectedBookId);
    if (bookIdx < 0) return "";
    const char = books[bookIdx]?.characters?.find((c: Character) => c.id === focusId);
    if (!char) return "";
    return `
### YOU ARE: ${char.name} ###
Core Wound: ${char.coreWound}
Core Fear: ${char.coreFear}
Core Desire: ${char.coreDesire}
Philosophy: ${char.philosophy}
Secrets (you NEVER reveal these directly): ${char.secrets}
Current Arc Stage: ${char.statusTimeline?.[char.statusTimeline.length - 1]?.arcStage || "unknown"}
`;
  }, [expertMode, focusId, books, selectedBookId]);

  const sendMessage = useCallback(
    async (userContent: string, historyOverride?: Message[]): Promise<boolean> => {
      if (expertMode === "CHARACTER_ROLEPLAY" && !focusId) {
        showToast('Select a character first — use "Ask AI" from a Character page', "error");
        return false;
      }



      const baseMsgs = historyOverride ?? messages;
      const newMsgs = [...baseMsgs, { role: "user" as const, content: userContent }];
      setMessages(newMsgs);
      setIsTyping(true);

      // Auto-title if it's the first message
      if (newMsgs.length === 1 && updateSessionTitle) {
        updateSessionTitle(sessionId, userContent.slice(0, 30) + (userContent.length > 30 ? "..." : ""));
      }

      try {
        const systemMsgContent =
          aiMode === "generate"
            ? buildGenSystemPrompt(contextText)
            : buildChatSystemPrompt({
                expertMode,
                contextText,
                roleplayInjection: buildRoleplayInjection(),
                isFirstMessage: baseMsgs.length === 0,
                userContent,
              });

        const systemMsg = { role: "system", content: systemMsgContent };
        const cleanedMessages = cleanMessagesForApi(newMsgs);

        const payload = {
          model: model || "gpt-4o",
          messages: [systemMsg, ...cleanedMessages],
          temperature: aiMode === "generate" ? 0.85 : TEMP_BY_MODE[expertMode],
          stream: true,
        };

        abortControllerRef.current = new AbortController();

        const token = localStorage.getItem("seshat-auth-token") || "";
        const res = await fetch(`/api/ai/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) {
          let errText = await res.text();
          try {
            const parsed = JSON.parse(errText);
            const errObj = Array.isArray(parsed) ? parsed[0] : parsed;
            if (errObj?.error?.message) errText = errObj.error.message;
            else if (errObj?.message) errText = errObj.message;
          } catch {
            // keep raw errText
          }
          throw new Error(errText || res.statusText);
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        if (!reader) throw new Error("No response body stream");

        // Initialize empty assistant message to stream into
        const startTimestamp = Date.now();
        setMessages([...newMsgs, { role: "assistant", content: "", startTime: startTimestamp }]);


        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim() === "") continue;
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6);
              if (dataStr.trim() === "[DONE]") break;
              try {
                const data = JSON.parse(dataStr);
                if (data.choices && data.choices[0].delta?.content) {
                  const chunk = data.choices[0].delta.content;
                  setMessages((prev) => {
                    const arr = [...prev];
                    const last = arr[arr.length - 1];
                    arr[arr.length - 1] = {
                      ...last,
                      content: last.content + chunk,
                    };
                    return arr;
                  });
                }
              } catch (e) {
                console.error("Error parsing SSE chunk:", e);
              }
            }
          }
        }

        // Note: We no longer auto-open the modal. The user can open it manually from the chat UI.
        // Final latency update
        setMessages((prev) => {
          const arr = [...prev];
          const last = arr[arr.length - 1];
          if (last.role === "assistant" && last.startTime) {
            arr[arr.length - 1] = {
              ...last,
              latency: Date.now() - last.startTime,
            };
          }
          return arr;
        });

        return true;
      } catch (err: unknown) {
        console.error(err);
        if (err instanceof Error && err.name === "AbortError") return false;
        const msg = err instanceof Error ? err.message : String(err);
        
        // Show brief toast
        showToast("AI Request Failed", "error");
        
        // Append error to chat feed for better UX
        setMessages([
          ...newMsgs,
          { 
            role: "assistant", 
            content: `**Request Failed**\n\n${msg}`, 
            isError: true 
          }
        ]);
        
        return false;
      } finally {
        setIsTyping(false);
      }
    },
    [
      expertMode,
      focusId,
      aiMode,
      contextText,
      buildRoleplayInjection,
      baseUrl,
      apiKey,
      model,
      messages,
      sessionId,
      updateSessionTitle,
    ],
  );

  const stopGenerating = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsTyping(false);
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return {
    messages,
    setMessages,
    isTyping,
    generatedChar,
    setGeneratedChar,
    sendMessage,
    stopGenerating,
    clearMessages,
  };
}
