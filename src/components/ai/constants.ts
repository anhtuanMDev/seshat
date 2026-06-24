// ─────────────────────────────────────────────────────────────────────────────
// AI Oracle — static configuration constants
// ─────────────────────────────────────────────────────────────────────────────

export const AI_PROVIDERS = [
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

export const AI_MODES = {
  GENERAL: {
    label: "General Assistant",
    icon: "🤖",
    systemAppend: `You are an expert lorekeeper and creative assistant.`,
  },
  SCENE_WRITER: {
    label: "Write a Scene",
    icon: "✍️",
    systemAppend: `You are writing PROSE, not describing prose. Show don't tell.
Structure every scene with: 
  - HOOK (first sentence creates immediate tension or intrigue)
  - BODY (advancing action through specific sensory detail + subtext in dialogue)
  - TURN (something changes — emotionally, physically, or informationally)
  - RESONANCE (last line echoes a theme or leaves a question open)

Match the prose style to the character's POV — their vocabulary, their obsessions, 
what they notice vs ignore, all reflect their psychology.`,
  },
  PLOT_DOCTOR: {
    label: "Plot Doctor",
    icon: "🩺",
    systemAppend: `You are a developmental editor diagnosing story problems.
When presented with a plot issue:
1. DIAGNOSE: Name the real problem (not just the symptom the writer described)
2. ROOT CAUSE: Trace it back to character motivation or world logic
3. OPTIONS: Give exactly 3 solutions at different "costs" to the story
4. RECOMMENDATION: Which option you'd choose and why`,
  },
  DIALOGUE_COACH: {
    label: "Dialogue Coach",
    icon: "💬",
    systemAppend: `You write dialogue that sounds like THESE specific characters.
Rules for every line:
- Every exchange should CHANGE something (power dynamic, information, relationship)
- No on-the-nose exposition disguised as dialogue
- Read each line aloud test: if it sounds like a stage direction, rewrite it`,
  },
  LORE_EXPANDER: {
    label: "Lore Expander",
    icon: "🌍",
    systemAppend: `You are expanding the world's lore while maintaining INTERNAL CONSISTENCY.
For every lore element you create:
1. It must have a CAUSE in the existing world
2. It must have at least one CONSEQUENCE on existing characters or factions
3. Flag any element that CONTRADICTS existing canon with: ⚠️ [POTENTIAL CONFLICT: ...]`,
  },
  CHARACTER_ROLEPLAY: {
    label: "Roleplay Character",
    icon: "🎭",
    systemAppend: `You are now fully embodying the focused Character. You ARE this character — not an assistant describing them.
### ROLEPLAY RULES ###
1. Answer every question IN CHARACTER — first person, present tense
2. Your core wound subtly colors EVERY response, even if the topic seems unrelated
3. You will LIE or deflect if asked about your secrets — stay in character
4. If asked something your character wouldn't know, say so in character
5. Never break character to say "As an AI..." — if you must clarify something meta, do it as a brief OOC: [note] then return
The writer may ask you questions, put you in scenarios, or ask "what would you do if...".
Stay in character no matter what.`,
  },
} as const;

export type ExpertMode = keyof typeof AI_MODES;

export const TEMP_BY_MODE: Record<ExpertMode, number> = {
  GENERAL: 0.7,
  SCENE_WRITER: 0.9,
  PLOT_DOCTOR: 0.3,
  DIALOGUE_COACH: 0.85,
  LORE_EXPANDER: 0.8,
  CHARACTER_ROLEPLAY: 1.0,
};

export const QUICK_ACTIONS = [
  {
    icon: "🛡️",
    label: "Audit World",
    mode: "GENERAL" as ExpertMode,
    message:
      "Scan my entire world for internal contradictions, plot holes, and character inconsistencies. Be specific — name the entities and the conflicting details.",
  },
  {
    icon: "📝",
    label: "Next Scene",
    mode: "SCENE_WRITER" as ExpertMode,
    message:
      "Based on the chronological timeline, what is the next scene that should happen? Outline it with hook, conflict, and what changes.",
  },
  {
    icon: "🌍",
    label: "Expand Lore",
    mode: "LORE_EXPANDER" as ExpertMode,
    message:
      "Suggest 3 new cultural details, traditions, or minor factions that would make this world feel more alive. Each must connect to existing canon.",
  },
  {
    icon: "🩺",
    label: "Fix Plot",
    mode: "PLOT_DOCTOR" as ExpertMode,
    message: "", // empty — let writer describe the problem
  },
] as const;
