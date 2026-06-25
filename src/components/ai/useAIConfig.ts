// ─────────────────────────────────────────────────────────────────────────────
// useAIConfig — persists provider / key / model to localStorage
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { AI_PROVIDERS } from "./constants";

export function useAIConfig() {
  const [providerId, setProviderId] = useState(
    () => localStorage.getItem("seshat-ai-provider") || "openai",
  );
  const [baseUrl, setBaseUrl] = useState(
    () => localStorage.getItem("seshat-ai-url") || "https://api.openai.com/v1",
  );
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem("seshat-ai-keys");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // ignore
      console.error(e);
    }
    // Fallback: migrate old single key if present
    const oldKey = localStorage.getItem("seshat-ai-key");
    const initProvider = localStorage.getItem("seshat-ai-provider") || "openai";
    if (oldKey) {
      return { [initProvider]: oldKey };
    }
    return {};
  });

  const [model, setModel] = useState(
    () => localStorage.getItem("seshat-ai-model") || "gpt-4o-mini",
  );

  // Auto-persist whenever config values change
  useEffect(() => {
    localStorage.setItem("seshat-ai-provider", providerId);
    localStorage.setItem("seshat-ai-url", baseUrl);
    localStorage.setItem("seshat-ai-keys", JSON.stringify(apiKeys));
    localStorage.setItem("seshat-ai-model", model);
  }, [providerId, baseUrl, apiKeys, model]);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pid = e.target.value;
    setProviderId(pid);
    const prov = AI_PROVIDERS.find((p) => p.id === pid);
    if (prov && pid !== "custom") {
      setBaseUrl(prov.url);
      if (prov.models.length > 0) setModel(prov.models[0]);
    }
  };

  const currentApiKey = apiKeys[providerId] || "";
  const setApiKey = (v: string) => {
    setApiKeys((prev) => ({ ...prev, [providerId]: v }));
  };

  return {
    providerId,
    baseUrl,
    setBaseUrl,
    apiKey: currentApiKey,
    setApiKey,
    model,
    setModel,
    handleProviderChange,
  };
}
