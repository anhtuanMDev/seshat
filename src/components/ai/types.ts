// ─────────────────────────────────────────────────────────────────────────────
// AI Oracle — shared TypeScript interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface Message {
  role: "user" | "assistant";
  content: string;
}

/** State carried by the "Add to Canon" modal */
export interface CanonModalState {
  content: string;
  targetType: string;
  targetId: string;
  targetField: string;
}

export type AiMode = "chat" | "generate";
