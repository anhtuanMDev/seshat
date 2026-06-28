import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { useForm } from "react-hook-form";
import { appStore } from "../store/appStore";
import { showToast } from "../store/toastStore";
import { updateFilesOnGitHub, loadFileFromGitHub } from "../lib/githubSync";
import { computeEventSync } from "../lib/eventSync";
import { exportChapterToWord } from "../lib/exportUtils";
import { getUpdatedDrafts } from "../lib/draftUtils";
import { uid } from "../lib/utils";
import type { Draft, SceneCard } from "../lib/types";

export interface ChapterForm {
  number: string;
  title: string;
  timeRef: string;
  synopsis: string;
  body: string;
  notes: string;
  pinnedChars: string[];
  pinnedEventIds: string[];
  scenes: SceneCard[];
}

export function useChapterForm(
  bookId: string | undefined,
  id: string | undefined,
  bookIdx: number,
  chapterIdx: number,
  chapter: import("../store/appStore").Chapter | undefined
) {
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const [saveDoneAt, setSaveDoneAt] = useState(0);
  const formChapterIdRef = useRef<string | undefined>(undefined);

  const { register, control, reset, formState, getValues, setValue } =
    useForm<ChapterForm>({
      defaultValues: {
        number: "",
        title: "",
        timeRef: "",
        synopsis: "",
        body: "",
        notes: "",
        pinnedChars: [],
        pinnedEventIds: [],
        scenes: [],
      },
    });

  const isDirtyRef = useRef(formState.isDirty);

  useLayoutEffect(() => {
    isDirtyRef.current = formState.isDirty;
  });

  useEffect(() => {
    const loadChapterData = async () => {
      if (chapter && chapterIdx >= 0 && id) {
        const isNewChapter = formChapterIdRef.current !== chapter.id;
        const shouldReset = isNewChapter || (!isDirtyRef.current && !isSavingRef.current);
        if (chapter.body !== undefined) {
          if (shouldReset) {
            formChapterIdRef.current = chapter.id;
            reset({
              number: chapter.number || "",
              title: chapter.title || "",
              timeRef: chapter.timeRef || "",
              synopsis: chapter.synopsis || "",
              body: chapter.body || "",
              notes: chapter.notes || "",
              pinnedChars: chapter.pinnedChars || [],
              pinnedEventIds: chapter.pinnedEventIds || [],
              scenes: chapter.scenes || [],
            });
          }

          const localDraftsStr = localStorage.getItem("seshat-active-drafts");
          const localDrafts = localDraftsStr ? JSON.parse(localDraftsStr) : {};
          let actId = localDrafts[chapter.id];

          if (!actId && chapter.drafts && chapter.drafts.length > 0) {
            const sorted = [...chapter.drafts].sort(
              (a, b) => a.createdAt - b.createdAt,
            );
            actId = sorted[0].id;
          }

          if (actId) {
            const exists = chapter.drafts?.some((d) => d.id === actId);
            if (!exists && chapter.drafts && chapter.drafts.length > 0) {
              const sorted = [...chapter.drafts].sort(
                (a, b) => a.createdAt - b.createdAt,
              );
              actId = sorted[0].id;
            }
          }

          if (actId) {
            appStore.books[bookIdx].chapters[chapterIdx].activeDraftId?.set(actId);
            setActiveDraftId(actId);
            localDrafts[chapter.id] = actId;
            localStorage.setItem("seshat-active-drafts", JSON.stringify(localDrafts));
          } else {
            setActiveDraftId(null);
          }
        } else {
          if (shouldReset) {
            formChapterIdRef.current = chapter.id;
            reset({
              number: chapter.number || "",
              title: chapter.title || "",
              timeRef: chapter.timeRef || "",
              synopsis: chapter.synopsis || "",
              body: "",
              notes: "",
              pinnedChars: chapter.pinnedChars || [],
              pinnedEventIds: chapter.pinnedEventIds || [],
              scenes: chapter.scenes || [],
            });
          }

          const token =
            localStorage.getItem("seshat-auth-token") ||
            sessionStorage.getItem("seshat-auth-token");
          if (token && bookId) {
            try {
              let parsed: Record<string, unknown>;
              try {
                parsed = await loadFileFromGitHub(
                  token,
                  bookId,
                  `chapters/chapter_${chapter.id}/metadata.json`,
                );
              } catch {
                console.warn(`Metadata for chapter ${chapter.id} not found, initializing empty draft array.`);
                parsed = { drafts: [] };
              }

              let loadedDrafts = (parsed.drafts as Draft[]) || [];
              if (loadedDrafts.length === 0) {
                const newId = uid();
                loadedDrafts = [
                  {
                    id: newId,
                    name: "Draft 1",
                    body: "",
                    createdAt: Date.now(),
                  },
                ];
              }

              const localDraftsStr = localStorage.getItem("seshat-active-drafts");
              const localDrafts = localDraftsStr ? JSON.parse(localDraftsStr) : {};
              let actId = localDrafts[chapter.id];

              if (!actId && loadedDrafts.length > 0) {
                const sorted = [...loadedDrafts].sort((a, b) => a.createdAt - b.createdAt);
                actId = sorted[0].id;
              }

              if (actId) {
                const exists = loadedDrafts.some((d) => d.id === actId);
                if (!exists && loadedDrafts.length > 0) {
                  const sorted = [...loadedDrafts].sort((a, b) => a.createdAt - b.createdAt);
                  actId = sorted[0].id;
                }
              }

              const fullDrafts = await Promise.all(
                loadedDrafts.map(async (d) => {
                  try {
                    const df = await loadFileFromGitHub(
                      token,
                      bookId,
                      `chapters/chapter_${chapter.id}/${d.id}.json`,
                    );
                    return df as unknown as Draft;
                  } catch {
                    return { ...d, body: "" };
                  }
                }),
              );

              const activeDraft = fullDrafts.find((d) => d.id === actId) || fullDrafts[0] || { body: "" };
              const fetchedBody = activeDraft.body || "";
              const fetchedNotes = (parsed.notes as string) || "";

              appStore.books[bookIdx].chapters[chapterIdx].drafts.set(fullDrafts);
              if (parsed.notes) {
                appStore.books[bookIdx].chapters[chapterIdx].notes.set(fetchedNotes);
              }
              if (actId) {
                appStore.books[bookIdx].chapters[chapterIdx].activeDraftId?.set(actId);
                localDrafts[chapter.id] = actId;
                localStorage.setItem("seshat-active-drafts", JSON.stringify(localDrafts));
              }

              appStore.books[bookIdx].chapters[chapterIdx].body.set(fetchedBody);
              if (actId) {
                setActiveDraftId(actId);
              }

              formChapterIdRef.current = chapter.id;
              reset({
                number: chapter.number || "",
                title: chapter.title || "",
                timeRef: chapter.timeRef || "",
                synopsis: chapter.synopsis || "",
                body: fetchedBody,
                notes: (parsed.notes as string) || "",
                pinnedChars: (parsed.pinnedChars as string[]) || [],
                pinnedEventIds: (parsed.pinnedEventIds as string[]) || [],
                scenes: (parsed.scenes as SceneCard[]) || [],
              });
            } catch (err) {
              console.error("[ChapterPage] Failed to lazy load chapter body:", err);
            }
          }
        }
      }
    };
    loadChapterData();
  }, [chapter, chapterIdx, bookId, bookIdx, reset, saveDoneAt, id]);

  const saveRef = useRef<(overrideDrafts?: Draft[]) => Promise<boolean>>(async () => true);

  const handleDeleteDraft = useCallback(
    async (draftId: string) => {
      if (bookIdx >= 0 && chapterIdx >= 0 && bookId && id) {
        const currentDrafts = appStore.books[bookIdx].chapters[chapterIdx].drafts.get() || [];
        const newDrafts = currentDrafts.map((d) =>
          d.id === draftId ? { ...d, isDeleted: true } : d,
        );
        await saveRef.current(newDrafts);
      }
    },
    [bookIdx, chapterIdx, bookId, id],
  );

  const handleUndeleteDraft = useCallback(
    async (draftIds: string[]) => {
      if (bookIdx >= 0 && chapterIdx >= 0 && bookId && id) {
        const currentDrafts = appStore.books[bookIdx].chapters[chapterIdx].drafts.get() || [];
        const newDrafts = currentDrafts.map((d) =>
          draftIds.includes(d.id) ? { ...d, isDeleted: false } : d,
        );
        await saveRef.current(newDrafts);
      }
    },
    [bookIdx, chapterIdx, bookId, id],
  );

  const handleRenameDraft = useCallback(
    async (draftId: string, newName: string) => {
      if (bookIdx >= 0 && chapterIdx >= 0 && bookId && id) {
        const currentDrafts = appStore.books[bookIdx].chapters[chapterIdx].drafts.get() || [];
        const newDrafts = currentDrafts.map((d) =>
          d.id === draftId ? { ...d, name: newName } : d,
        );
        await saveRef.current(newDrafts);
      }
    },
    [bookIdx, chapterIdx, bookId, id],
  );

  const onSubmit = useCallback(
    async (overrideDrafts?: Draft[]): Promise<boolean> => {
      const data = getValues();
      if (bookIdx < 0 || !bookId || !id || chapterIdx < 0) return false;
      const ch = appStore.books[bookIdx].chapters[chapterIdx];

      const oldTimeRef = ch.timeRef.get();
      const oldPinnedEvents = ch.pinnedEventIds.get() || [];

      const eventPayloadsToSync: { eventId: string; payloadStr: string }[] = [];

      const processEventSync = (eventId: string) => {
        const syncPayload = computeEventSync(bookIdx, eventId, id, data.timeRef, data.pinnedChars);
        if (syncPayload) {
          syncPayload.mutate();
          eventPayloadsToSync.push({ eventId: syncPayload.eventId, payloadStr: syncPayload.payloadStr });
        }
      };

      const eventsToSync = new Set<string>();
      if (data.timeRef) eventsToSync.add(data.timeRef);
      if (oldTimeRef) eventsToSync.add(oldTimeRef);

      if (data.pinnedEventIds) {
        data.pinnedEventIds.forEach((eid) => eventsToSync.add(eid));
      }
      oldPinnedEvents.forEach((eid) => eventsToSync.add(eid));

      eventsToSync.forEach((eid) => processEventSync(eid));

      // Local store persistence
      ch.number.set(data.number);
      ch.title.set(data.title);
      ch.synopsis.set(data.synopsis);
      ch.body.set(data.body);
      ch.notes.set(data.notes);
      ch.pinnedChars.set(data.pinnedChars);
      ch.pinnedEventIds.set(data.pinnedEventIds);
      ch.scenes.set(data.scenes);
      ch.timeRef.set(data.timeRef);

      const draftUpdate = getUpdatedDrafts(overrideDrafts || ch.drafts.get(), activeDraftId, data.body);
      if (activeDraftId !== draftUpdate.newActiveDraftId) {
        setActiveDraftId(draftUpdate.newActiveDraftId);
      }
      ch.drafts.set(draftUpdate.updatedDrafts);

      if (formChapterIdRef.current === id) {
        reset(data);
      }
      showToast("Chapter saved locally", "success");
      setSaveDoneAt((n) => n + 1);
      return true;
    },
    [bookIdx, bookId, id, chapterIdx, getValues, reset, activeDraftId],
  );

  useLayoutEffect(() => {
    saveRef.current = onSubmit;
  }, [onSubmit]);

  const updateLocalActiveDraft = useCallback(
    (draftId: string) => {
      if (!id) return;
      const localDraftsStr = localStorage.getItem("seshat-active-drafts");
      const localDrafts = localDraftsStr ? JSON.parse(localDraftsStr) : {};
      localDrafts[id] = draftId;
      localStorage.setItem("seshat-active-drafts", JSON.stringify(localDrafts));
    },
    [id],
  );

  const handleSaveAsDraft = useCallback(
    (name: string) => {
      if (bookIdx < 0 || chapterIdx < 0) return;
      const ch = appStore.books[bookIdx].chapters[chapterIdx];
      const currentDrafts = ch.drafts.get() || [];
      const newDraft: Draft = {
        id: uid(),
        name,
        body: getValues("body"),
        createdAt: Date.now(),
      };
      const updatedDrafts = [...currentDrafts, newDraft];
      ch.drafts.set(updatedDrafts);
      setActiveDraftId(newDraft.id);
      updateLocalActiveDraft(newDraft.id);
      saveRef.current(updatedDrafts);
    },
    [bookIdx, chapterIdx, getValues, updateLocalActiveDraft],
  );

  const handleRestoreDraft = useCallback(
    (draft: Draft) => {
      setValue("body", draft.body, { shouldDirty: true });
      setActiveDraftId(draft.id);
      updateLocalActiveDraft(draft.id);
    },
    [setValue, updateLocalActiveDraft],
  );

  const handleExport = async () => {
    if (!chapter) return;
    showToast("Generating document...", "info");
    try {
      const body = getValues("body");
      await exportChapterToWord(chapter.title || "Untitled Chapter", body || "", bookIdx);
      showToast("Chapter exported successfully", "success");
    } catch (err) {
      console.error("[ChapterPage] Export failed:", err);
      showToast("Failed to export chapter", "error");
    }
  };

  return {
    register,
    control,
    reset,
    formState,
    getValues,
    setValue,
    isSaving,
    activeDraftId,
    saveRef,
    handleDeleteDraft,
    handleUndeleteDraft,
    handleRenameDraft,
    handleSaveAsDraft,
    handleRestoreDraft,
    handleExport,
  };
}
