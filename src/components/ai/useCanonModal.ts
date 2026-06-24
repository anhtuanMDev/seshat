// ─────────────────────────────────────────────────────────────────────────────
// useCanonModal — "Add to Canon" modal state + save logic
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { appStore } from "../../store/appStore";
import type { BookData } from "../../store/appStore";
import { showToast } from "../../store/toastStore";
import { updateFilesOnGitHub } from "../../lib/githubSync";
import { getCanonFieldsForType } from "./prompts";

export function useCanonModal(selectedBookId: string, books: BookData[]) {
  const [canonModalContent, setCanonModalContent] = useState<string | null>(null);
  const [canonTargetType, setCanonTargetType] = useState("character");
  const [canonTargetId, setCanonTargetId] = useState("");
  const [canonTargetField, setCanonTargetField] = useState("");

  const openCanonModal = (
    content: string,
    defaultType: string,
    defaultId: string,
  ) => {
    setCanonModalContent(content);
    setCanonTargetType(defaultType);
    setCanonTargetId(defaultId);
    setCanonTargetField(getCanonFieldsForType(defaultType)[0] || "");
  };

  const closeCanonModal = () => setCanonModalContent(null);

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
      const items = typeof collection.get === "function" ? collection.get() : [];
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

    closeCanonModal();
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

  return {
    canonModalContent,
    setCanonModalContent,
    canonTargetType,
    setCanonTargetType,
    canonTargetId,
    setCanonTargetId,
    canonTargetField,
    setCanonTargetField,
    openCanonModal,
    closeCanonModal,
    handleSaveToCanon,
  };
}
