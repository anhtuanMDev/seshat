import { useState } from "react";
import { S } from "../../lib/utils";
import { showToast } from "../../store/toastStore";
import { AutoFixHighIcon, CloseIcon } from "../ui/icons";
import type { Character } from "../../store/appStore";

interface Props {
  text: string;
  characters: Character[];
  onClose: () => void;
}

export default function ContinuityChecker({ text, characters, onClose }: Props) {
  const [apiKey, setApiKey] = useState(localStorage.getItem("seshat-openai-key") || "");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState("");

  const runCheck = async () => {
    if (!apiKey) {
      showToast("Please enter an OpenAI API key.", "error");
      return;
    }

    localStorage.setItem("seshat-openai-key", apiKey);
    setIsChecking(true);
    setResult("");

    // Build the character context
    // We only want to send characters that are actually mentioned or relevant to save tokens.
    // Let's just send all characters for now, or just their conditions/traumas.
    const charContext = characters
      .map(
        (c) =>
          `${c.name}:\n` +
          `  Role/Traits: ${c.role || "N/A"}\n` +
          `  Core Wound: ${c.coreWound || "N/A"}\n` +
          `  Traumas/Conditions: ${(c.traumas || [])
            .map((t) => t.description)
            .join(", ") || "None"}`
      )
      .join("\n\n");

    const prompt = `You are a continuity editor for a fantasy novel. 

Here is the world database of characters and their traits/conditions:
${charContext}

Here is the current chapter text:
${text}

Task: Identify any continuity errors or logical inconsistencies in the chapter text based on the world database. For example, if a character has a "lost left arm" condition but the text says they catch a sword with their left hand, that is a continuity error.
Also flag if a character acts wildly out of their defined traits or roles.

Be extremely concise. Use bullet points. If there are no errors, just say "No continuity errors found."`;

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // fast and cheap
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to fetch from OpenAI");
      }

      const data = await res.json();
      setResult(data.choices[0].message.content);
    } catch (e: unknown) {
      console.error(e);
      setResult(`Error: ${(e as Error).message}`);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: -320,
        width: 300,
        height: "100%",
        background: "var(--bg-panel)",
        borderLeft: "1px solid var(--border)",
        boxShadow: "-4px 0 15px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
      }}
      className="continuity-checker-panel"
    >
      <div style={{ padding: 16, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 14, display: "flex", alignItems: "center", gap: 6, color: "var(--color-purple)" }}>
          <AutoFixHighIcon sx={{ fontSize: 16 }} /> Continuity AI
        </h3>
        <button onClick={onClose} style={{ ...S.ghost, padding: 4 }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </button>
      </div>

      <div style={{ padding: 16, flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        {!result && !isChecking && (
          <p style={{ ...S.dim, fontSize: 12, margin: 0 }}>
            This will scan your chapter text and compare it against the traumas, conditions, and roles of all loaded characters to catch continuity errors.
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, color: "var(--text-secondary)" }}>OpenAI API Key (Stored Locally)</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ ...S.input, fontSize: 12 }}
            placeholder="sk-..."
          />
        </div>

        <button
          onClick={runCheck}
          disabled={isChecking || !apiKey}
          style={{ ...S.pill, background: "var(--color-purple)", color: "white", border: "none", width: "100%" }}
        >
          {isChecking ? "Analyzing..." : "Analyze Chapter"}
        </button>

        {result && (
          <div style={{ marginTop: 12 }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: 12, color: "var(--text-primary)" }}>Analysis Result:</h4>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
