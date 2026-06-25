import { useState, useEffect, useRef, useCallback } from "react";
import { showToast } from "../../store/toastStore";
import { AI_PROVIDERS } from "./constants";

export default function ModelDropdown({
  providerId,
  apiKey,
  baseUrl,
  model,
  setModel,
}: {
  providerId: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  setModel: (m: string) => void;
}) {
  const currentProvider = AI_PROVIDERS.find((p) => p.id === providerId);
  const [isOpen, setIsOpen] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [prevProvider, setPrevProvider] = useState(providerId);

  if (providerId !== prevProvider) {
    setPrevProvider(providerId);
    setFetchedModels([]);
    setNextPageToken(null);
  }

  const baseModels = currentProvider?.models || [];
  const options = Array.from(new Set([...baseModels, ...fetchedModels]));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchGeminiModels = useCallback(
    async (token?: string) => {
      const keyToUse = apiKey;
      if (!keyToUse) return;
      await Promise.resolve();
      setLoading(true);
    try {
      let url = `https://generativelanguage.googleapis.com/v1beta/models?key=${keyToUse}`;
      if (token) url += `&pageToken=${token}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.models) {
        const newModels = data.models
          .filter((m: { supportedGenerationMethods?: string[] }) => 
            m.supportedGenerationMethods?.includes("generateContent")
          )
          .map((m: { name: string }) => m.name.replace("models/", ""));
        setFetchedModels((prev) => {
          const base = token ? prev : [];
          return Array.from(new Set([...base, ...newModels]));
        });
      }
      setNextPageToken(data.nextPageToken || null);
    } catch (e) {
      console.error("Failed to fetch models", e);
    } finally {
      setLoading(false);
    }
  }, [apiKey, setLoading, setFetchedModels, setNextPageToken]);

  const fetchGenericModels = useCallback(async () => {
    if (!apiKey && providerId !== "local") return;
    const urlBase =
      providerId === "custom" ? baseUrl : currentProvider?.url || "";
    if (!urlBase) return;

    await Promise.resolve();
    setLoading(true);
    try {
      const modelsUrl = `${urlBase.replace(/\/chat\/completions|\/completions|\/openai$/, "")}/models`;
      const headers: Record<string, string> = {};
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const res = await fetch(modelsUrl, { headers });
      const data = await res.json();

      if (data && data.data && Array.isArray(data.data)) {
        const newModels = data.data.map((m: { id: string }) => m.id);
        setFetchedModels(newModels);
      }
    } catch (e) {
      console.error("Failed to fetch generic models", e);
    } finally {
      setLoading(false);
    }
  }, [apiKey, providerId, baseUrl, currentProvider, setLoading, setFetchedModels]);

  const handleOpen = (e?: React.MouseEvent | React.FocusEvent) => {
    if (!apiKey && providerId !== "local") {
      if (e) {
        e.preventDefault();
        showToast("Please enter an API Key to load models", "error");
        if (e.type === "focus") {
          (e.target as HTMLInputElement).blur();
        }
      }
      return false;
    }
    
    if (!isOpen) {
      setIsOpen(true);
      if (fetchedModels.length === 0 && !loading) {
        if (providerId === "gemini") {
          void fetchGeminiModels();
        } else if (providerId !== "local") {
          void fetchGenericModels();
        }
      }
    }
    return true;
  };

  const handleToggle = (e: React.MouseEvent) => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      handleOpen(e);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLUListElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 20) {
      if (!loading && nextPageToken && providerId === "gemini") {
        fetchGeminiModels(nextPageToken);
      }
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <input
        type="text"
        className="ai-config-input"
        value={model}
        onChange={(e) => {
          setModel(e.target.value);
          handleOpen();
        }}
        onClick={handleOpen}
        onFocus={handleOpen}
        readOnly={!apiKey && providerId !== "local"}
        placeholder="Type or select a model..."
        autoComplete="off"
        spellCheck="false"
        autoCorrect="off"
        data-1p-ignore="true"
        data-lpignore="true"
      />

      {/* Dropdown toggle button to make it feel more like a select */}
      <div
        onClick={handleToggle}
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          cursor: "pointer",
          color: "var(--text-muted)",
          padding: 4,
        }}
      >
        {isOpen ? "▴" : "▾"}
      </div>

      {isOpen && options.length > 0 && (
        <ul
          onScroll={handleScroll}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: 200,
            overflowY: "auto",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            marginTop: 4,
            padding: 0,
            margin: "4px 0 0 0",
            listStyle: "none",
            zIndex: 100,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          {options.map((opt) => (
            <li
              key={opt}
              onClick={() => {
                setModel(opt);
                setIsOpen(false);
              }}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                borderBottom: "1px solid var(--border)",
                color:
                  model === opt
                    ? "var(--color-primary)"
                    : "var(--text-primary)",
                background: model === opt ? "var(--bg-active)" : "transparent",
                fontSize: 13,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  model === opt ? "var(--bg-active)" : "transparent";
              }}
            >
              {opt}
            </li>
          ))}
          {loading && (
            <li
              style={{
                padding: "8px 12px",
                color: "var(--text-muted)",
                fontSize: 12,
                textAlign: "center",
              }}
            >
              Loading...
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
