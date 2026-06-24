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
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("seshat-ai-key") || "",
  );
  const [model, setModel] = useState(
    () => localStorage.getItem("seshat-ai-model") || "gpt-4o-mini",
  );

  // Auto-persist whenever any config value changes
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
      if (prov.models.length > 0) setModel(prov.models[0]);
    }
  };

  return {
    providerId,
    baseUrl,
    setBaseUrl,
    apiKey,
    setApiKey,
    model,
    setModel,
    handleProviderChange,
  };
}
