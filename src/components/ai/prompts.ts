// ─────────────────────────────────────────────────────────────────────────────
// AI Oracle — pure system-prompt builder functions
// ─────────────────────────────────────────────────────────────────────────────

import { AI_MODES, type ExpertMode } from "./constants";
import type { Message } from "./types";

const THINK_PROTOCOL = `
### THINKING PROTOCOL ###
You MUST reason before answering. Wrap your reasoning in <think></think> tags.
Your reasoning must cover:
1. What is the writer actually trying to solve? (surface request vs real need)
2. What does the canon already establish that is relevant?  
3. What would CONTRADICT the canon if I'm not careful?
4. What is the single most useful thing I can give them?

CRITICAL: The <think> block MUST appear FIRST, before any other text.
The user will NEVER see this block. Write freely and honestly in it.
Only what comes AFTER </think> is shown to the writer.
Format: <think>[your reasoning here]</think>\n\n[your actual response here]
`;

const PUSHBACK_INSTRUCTION = `
### PROFESSIONAL DISAGREEMENT PROTOCOL ###
If the writer asks you to do something that would HURT their story, say so first.
Format: "⚠️ Before I do this — [specific concern about story logic]. Do you want me to proceed anyway, or shall we find a version that preserves [the thing at risk]?"
Then comply either way. You're a collaborator, not a gatekeeper.`;

/**
 * System prompt for the character generation ("Gen Char") mode.
 * Instructs the model to return only a JSON object.
 */
export function buildGenSystemPrompt(contextText: string): string {
  return `You are an AI assistant that generates a Character node for a story database.
Given the canonical context, generate a new character based on the user's prompt.
Respond ONLY with a valid JSON object. No preamble, no markdown fences, no explanation.
Fill only these fields: name, role, archetype, coreWound, coreFear, coreDesire, philosophy, secrets, color.
JSON SCHEMA: { "name": "string", "role": "string", "archetype": "string", "coreWound": "string", "coreFear": "string", "coreDesire": "string", "philosophy": "string", "secrets": "string", "color": "string hex" }

### CANONICAL CONTEXT ###
${contextText}`;
}

/**
 * System prompt for normal chat mode.
 * Injects roleplay persona, pushback rules, interview protocol, and think-tag protocol.
 */
export function buildChatSystemPrompt(opts: {
  expertMode: ExpertMode;
  contextText: string;
  roleplayInjection: string;
  isFirstMessage: boolean;
  userContent: string;
}): string {
  const { expertMode, contextText, roleplayInjection, isFirstMessage, userContent } = opts;

  const basePrompt = AI_MODES[expertMode].systemAppend;

  if (!contextText) return basePrompt;

  const isGenerativeRequest = /write|create|generate|make|draft|describe|give me|suggest/i.test(
    userContent,
  );

  const INTERVIEW_PROMPT =
    isFirstMessage && isGenerativeRequest && expertMode !== "CHARACTER_ROLEPLAY"
      ? `
### RESPONSE PROTOCOL ###
This is the writer's FIRST message and they are requesting creative generation.
Ask 3 targeted questions BEFORE generating anything. Make them specific to THIS request.
After they answer, generate freely without asking more questions.
`
      : "";

  const isRoleplay = expertMode === "CHARACTER_ROLEPLAY";

  return `${basePrompt}
${roleplayInjection}
${!isRoleplay ? PUSHBACK_INSTRUCTION : ""}
${INTERVIEW_PROMPT}

### CANONICAL CONTEXT ###
${contextText}

${THINK_PROTOCOL}`;
}

/**
 * Strip <think>...</think> blocks from assistant history before sending
 * to the API, preventing context pollution.
 */
export function cleanMessagesForApi(messages: Message[]): Message[] {
  return messages
    .filter((msg) => !msg.isError)
    .map((msg) =>
      msg.role === "assistant"
        ? { ...msg, content: msg.content.replace(/<think>[\s\S]*?<\/think>/g, "").trim() }
        : msg,
    );
}

/** Returns the fields available for canon injection for a given entity type. */
export function getCanonFieldsForType(type: string): string[] {
  switch (type) {
    case "book":
      return ["synopsis", "setting", "themes", "rules"];
    case "character":
      return ["coreWound", "coreFear", "coreDesire", "philosophy", "secrets", "appearance"];
    case "event":
      return ["description", "consequence", "setting", "subplot"];
    case "nation":
      return ["geography", "culture", "military", "economy", "allianceLogic", "secrets", "lore"];
    case "technique":
      return ["description", "effect", "requirement", "cost", "secret", "lore"];
    case "ingredient":
      return ["appearance", "properties", "uses", "danger", "lore"];
    case "monster":
      return ["appearance", "abilities", "weaknesses", "drops", "lore", "behavior"];
    case "treasure":
      return ["description", "stats", "curses", "history"];
    default:
      return [];
  }
}
