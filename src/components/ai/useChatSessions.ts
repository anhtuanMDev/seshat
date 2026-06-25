import { useState, useEffect, useCallback } from "react";
import type { AiMode } from "./types";

export interface ChatSessionMeta {
  id: string;
  title: string;
  updatedAt: number;
  aiMode: AiMode;
}

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSessionMeta[]>(() => {
    try {
      const saved = localStorage.getItem("seshat-chat-sessions");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [{ id: "default", title: "New Chat", updatedAt: Date.now(), aiMode: "chat" }];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>("default");

  useEffect(() => {
    localStorage.setItem("seshat-chat-sessions", JSON.stringify(sessions));
  }, [sessions]);

  const createSession = useCallback((aiMode: AiMode = "chat") => {
    const newId = Date.now().toString();
    const newSession: ChatSessionMeta = {
      id: newId,
      title: "New Chat",
      updatedAt: Date.now(),
      aiMode,
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        return [{ id: "default", title: "New Chat", updatedAt: Date.now(), aiMode: "chat" }];
      }
      return filtered;
    });
    if (activeSessionId === id) {
      setActiveSessionId((prev) => {
        const remaining = sessions.filter((s) => s.id !== id);
        return remaining.length > 0 ? remaining[0].id : "default";
      });
    }
    localStorage.removeItem(`seshat-chat-${id}`);
  }, [activeSessionId, sessions]);

  const updateSessionTitle = useCallback((id: string, title: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title, updatedAt: Date.now() } : s))
    );
  }, []);

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    deleteSession,
    updateSessionTitle,
  };
}
