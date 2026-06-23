import { uid } from "./utils";
import type { Draft } from "./types";

export function getUpdatedDrafts(
  currentDrafts: Draft[] | undefined,
  activeDraftId: string | null,
  body: string
): { updatedDrafts: Draft[]; newActiveDraftId: string; activeDraft: Draft } {
  const drafts = [...(currentDrafts || [])];

  if (drafts.length === 0) {
    const newId = uid();
    const newDraft: Draft = {
      id: newId,
      name: "Draft 1",
      body,
      createdAt: Date.now(),
    };
    return {
      updatedDrafts: [newDraft],
      newActiveDraftId: newId,
      activeDraft: newDraft,
    };
  }

  let activeIdx = drafts.findIndex((d) => d.id === activeDraftId);
  let currentId = activeDraftId;
  
  if (activeIdx === -1) {
    activeIdx = 0;
    currentId = drafts[0].id;
  }

  drafts[activeIdx] = {
    ...drafts[activeIdx],
    body,
  };

  return {
    updatedDrafts: drafts,
    newActiveDraftId: currentId!,
    activeDraft: drafts[activeIdx],
  };
}
