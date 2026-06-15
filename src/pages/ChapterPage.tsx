import { useParams } from "react-router-dom";
import { Skeleton } from "@mui/material";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { useSelector } from "@legendapp/state/react";
import { appStore } from "../store/appStore";
import { showToast } from "../store/toastStore";
import { updateFileOnGitHub, updateFilesOnGitHub } from "../lib/githubSync";
import { computeEventSync } from "../lib/eventSync";
import {
  useEvents,
  useCharacters,
  useActiveBookIdx,
} from "../hooks/useWorldStore";
import { S } from "../lib/utils";

import { useAnimateIn } from "../hooks/useAnimateIn";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import type { Character, Event } from "../lib/types";
import RichEditor from "../components/editor/RichEditor";
import { ReferencePanel } from "../components/chapter/ReferencePanel";
import { PinnedContextStrip } from "../components/chapter/PinnedContextStrip";
import { ChapterToolbar } from "../components/chapter/ChapterToolbar";
import { SceneOutlinePanel } from "../components/chapter/SceneOutlinePanel";
import { DraftsPanel } from "../components/chapter/DraftsPanel";
import { ForeshadowPanel } from "../components/chapter/ForeshadowPanel";
import { EventPicker } from "../components/ui/EventPicker";
import { ContinuityTracker } from "../components/chapter/ContinuityTracker";
import type { Draft, Foreshadow } from "../lib/types";

export interface ChapterForm {
  number: string;
  title: string;
  timeRef: string;
  synopsis: string;
  body: string;
  notes: string;
  pinnedChars: string[];
  pinnedEventIds: string[];
  scenes: import("../lib/types").SceneCard[];
}

export default function ChapterPage() {
  const { id, bookId } = useParams();
  const events = useEvents();
  const characters = useCharacters();
  const bookIdx = useActiveBookIdx();

  const chapter = useSelector(() => {
    if (bookIdx < 0) return undefined;
    return appStore.books[bookIdx].chapters?.get()?.find((c) => c.id === id);
  });
  const chapterIdx = useSelector(() => {
    if (bookIdx < 0) return -1;
    return (
      appStore.books[bookIdx].chapters?.get()?.findIndex((c) => c.id === id) ??
      -1
    );
  });

  const [showPanel, setShowPanel] = useState(window.innerWidth > 1024);
  const [panelTab, setPanelTab] = useState<
    | "chars"
    | "events"
    | "world"
    | "notes"
    | "drafts"
    | "foreshadows"
    | "continuity"
  >("chars");
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFloating, setIsFloating] = useState(false);



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

  useEffect(() => {
    const loadChapterData = async () => {
      if (chapter && chapterIdx >= 0) {
        if (chapter.body !== undefined) {
          // If we have the body, populate the form
          if (!formState.isDirty) {
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
            const sorted = [...chapter.drafts].sort((a, b) => a.createdAt - b.createdAt);
            actId = sorted[0].id;
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
          // Body is missing (stripped by loadBook.ts to save RAM), fetch it lazily
          
          // Clear the form immediately so we don't show the previous chapter's data while fetching
          if (!formState.isDirty) {
            reset({
              number: chapter.number || "",
              title: chapter.title || "",
              timeRef: chapter.timeRef || "",
              synopsis: chapter.synopsis || "",
              body: "", // Clear body immediately
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
              const { loadFileFromGitHub } = await import("../lib/githubSync");
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
              
              let loadedDrafts = (parsed.drafts as import("../lib/types").Draft[]) || [];
              if (loadedDrafts.length === 0) {
                const newId = crypto.randomUUID();
                loadedDrafts = [{ id: newId, name: "Draft 1", body: "", createdAt: Date.now() }];
              }
              
              const localDraftsStr = localStorage.getItem("seshat-active-drafts");
              const localDrafts = localDraftsStr ? JSON.parse(localDraftsStr) : {};
              let actId = localDrafts[chapter.id];

              if (!actId && loadedDrafts.length > 0) {
                // Fallback to Draft 1 (oldest)
                const sorted = [...loadedDrafts].sort((a, b) => a.createdAt - b.createdAt);
                actId = sorted[0].id;
              }

              const fullDrafts = await Promise.all(loadedDrafts.map(async (d) => {
                try {
                  const df = await loadFileFromGitHub(token, bookId, `chapters/chapter_${chapter.id}/${d.id}.json`);
                  return df as unknown as import("../lib/types").Draft;
                } catch {
                  return { ...d, body: "" };
                }
              }));
              
              const activeDraft = fullDrafts.find(d => d.id === actId) || fullDrafts[0] || { body: "" };
              const fetchedBody = activeDraft.body || "";
              const fetchedNotes = (parsed.notes as string) || "";

              // Update appStore with the missing massive text fields
              appStore.books[bookIdx].chapters[chapterIdx].body.set(
                fetchedBody,
              );
              // Also sync notes if they were somehow stripped
              if (parsed.notes)
                appStore.books[bookIdx].chapters[chapterIdx].notes.set(
                  fetchedNotes,
                );
              
              appStore.books[bookIdx].chapters[chapterIdx].drafts.set(fullDrafts);
              if (actId) {
                appStore.books[bookIdx].chapters[chapterIdx].activeDraftId?.set(actId);
                setActiveDraftId(actId);
                // Ensure it's in local storage
                localDrafts[chapter.id] = actId;
                localStorage.setItem("seshat-active-drafts", JSON.stringify(localDrafts));
              }

              // Immediately inject into the form so the Rich Editor picks it up without waiting for a re-render cycle
              reset({
                number: chapter.number || "",
                title: chapter.title || "",
                timeRef: chapter.timeRef || "",
                synopsis: chapter.synopsis || "",
                body: fetchedBody,
                notes: (parsed.notes as string) || "",
                pinnedChars: (parsed.pinnedChars as string[]) || [],
                pinnedEventIds: (parsed.pinnedEventIds as string[]) || [],
                scenes: (parsed.scenes as import("../lib/types").SceneCard[]) || [],
              });
            } catch (err) {
              console.error("Failed to lazy load chapter body:", err);
            }
          }
        }
      }
    };
    loadChapterData();
    // We intentionally don't include formState.isDirty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter?.id, chapter?.body, chapterIdx, bookId, bookIdx, reset]);

  const ref = useAnimateIn();

  useEffect(() => {
    const handleBodyClass = () => {
      if (showPanel && window.innerWidth <= 1024) {
        document.body.classList.add("panel-open-mobile");
      } else {
        document.body.classList.remove("panel-open-mobile");
      }
    };
    handleBodyClass();
    window.addEventListener("resize", handleBodyClass);
    return () => {
      window.removeEventListener("resize", handleBodyClass);
      document.body.classList.remove("panel-open-mobile");
    };
  }, [showPanel]);

  const body = useWatch({ control, name: "body" });
  const pinnedChars = useWatch({ control, name: "pinnedChars" }) || [];
  const pinnedEventIds = useWatch({ control, name: "pinnedEventIds" }) || [];

  const onSubmit = useCallback(async () => {
    const data = getValues();
    if (bookIdx < 0 || !bookId || !id || chapterIdx < 0) return;
    const ch = appStore.books[bookIdx].chapters[chapterIdx];
    ch.number.set(data.number);
    ch.title.set(data.title);
    const oldTimeRef = ch.timeRef.get();
    
    ch.synopsis.set(data.synopsis);
    ch.body.set(data.body);
    ch.notes.set(data.notes);
    ch.pinnedChars.set(data.pinnedChars);
    ch.pinnedEventIds.set(data.pinnedEventIds);
    ch.scenes.set(data.scenes);
    ch.timeRef.set(data.timeRef);

    const eventPayloadsToSync: { eventId: string; payloadStr: string }[] = [];
    
    const processEventSync = (eventId: string) => {
      const syncPayload = computeEventSync(bookIdx, eventId, id, data.timeRef, data.pinnedChars);
      if (syncPayload) {
        eventPayloadsToSync.push(syncPayload);
      }
    };

    // Collect all events that need to be synced
    const eventsToSync = new Set<string>();
    if (data.timeRef) eventsToSync.add(data.timeRef);
    if (oldTimeRef) eventsToSync.add(oldTimeRef);
    
    // Also trigger sync for mentioned events so they can clean up their chapters lists
    if (data.pinnedEventIds) {
      data.pinnedEventIds.forEach(eid => eventsToSync.add(eid));
    }
    const oldPinnedEvents = ch.pinnedEventIds.get() || [];
    oldPinnedEvents.forEach(eid => eventsToSync.add(eid));

    eventsToSync.forEach(eid => processEventSync(eid));

    // Background delta sync
    const token =
      localStorage.getItem("seshat-auth-token") ||
      sessionStorage.getItem("seshat-auth-token");
    if (token) {
      try {
        setIsSaving(true);
        let currentDrafts = ch.drafts.get() || [];
        let curActiveDraftId = activeDraftId;

        if (currentDrafts.length === 0) {
           const newId = crypto.randomUUID();
           currentDrafts = [{ id: newId, name: "Draft 1", body: data.body, createdAt: Date.now() }];
           curActiveDraftId = newId;
           ch.drafts.set(currentDrafts);
           setActiveDraftId(newId);
        } else {
           const activeIdx = currentDrafts.findIndex(d => d.id === curActiveDraftId);
           if (activeIdx !== -1) {
              currentDrafts[activeIdx] = { ...currentDrafts[activeIdx], body: data.body };
              ch.drafts.set(currentDrafts);
           }
        }

        const metadataPayload = {
          id: id,
          order: ch.order.get(),
          number: data.number,
          title: data.title,
          timeRef: data.timeRef,
          synopsis: data.synopsis,
          notes: data.notes,
          pinnedChars: data.pinnedChars,
          pinnedEventIds: data.pinnedEventIds,
          scenes: data.scenes,
          drafts: currentDrafts.map(d => ({ id: d.id, name: d.name, createdAt: d.createdAt })), // Without body
        };

        const activeDraftObj = currentDrafts.find(d => d.id === curActiveDraftId);

        const filesToSync = [
          {
            path: `chapters/chapter_${id}/metadata.json`,
            content: JSON.stringify(metadataPayload, null, 2),
          }
        ];

        if (activeDraftObj) {
          filesToSync.push({
            path: `chapters/chapter_${id}/${activeDraftObj.id}.json`,
            content: JSON.stringify(activeDraftObj, null, 2),
          });
        }
        
        // Also push eventPayloads
        for (const ep of eventPayloadsToSync) {
          filesToSync.push({
            path: `events/event_${ep.eventId}.json`,
            content: ep.payloadStr,
          });
        }

        await updateFilesOnGitHub(token, bookId, filesToSync);
        showToast("Chapter synced to cloud", "success");
        // Reset the form with the saved data to clear the dirty state
        reset(data);
      } catch (err) {
        console.error(err);
        showToast("Failed to sync chapter to cloud", "error");
      } finally {
        setIsSaving(false);
      }
    } else {
      reset(data);
      showToast("Chapter saved locally", "success");
    }
  }, [bookIdx, bookId, id, chapterIdx, getValues, reset, activeDraftId]);

  // Keep a stable ref for save so RichEditor's onSave doesn't go stale
  const saveRef = useRef<() => void>(() => {});
  useLayoutEffect(() => {
    saveRef.current = onSubmit;
  }, [onSubmit]);

  const updateLocalActiveDraft = useCallback((draftId: string) => {
    if (!id) return;
    const localDraftsStr = localStorage.getItem("seshat-active-drafts");
    const localDrafts = localDraftsStr ? JSON.parse(localDraftsStr) : {};
    localDrafts[id] = draftId;
    localStorage.setItem("seshat-active-drafts", JSON.stringify(localDrafts));
  }, [id]);

  const handleSaveAsDraft = useCallback(
    (name: string) => {
      if (bookIdx < 0 || chapterIdx < 0) return;
      const ch = appStore.books[bookIdx].chapters[chapterIdx];
      const currentDrafts = ch.drafts.get() || [];
      const newDraft: Draft = {
        id: crypto.randomUUID(),
        name,
        body: getValues("body"),
        createdAt: Date.now(),
      };
      ch.drafts.set([...currentDrafts, newDraft]);
      setActiveDraftId(newDraft.id);
      updateLocalActiveDraft(newDraft.id);
      // Use setTimeout to ensure the store is flushed if there are any async batching
      setTimeout(() => saveRef.current(), 0);
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

  const allChapters = useSelector(() =>
    bookIdx >= 0 ? appStore.books[bookIdx].chapters.get() : [],
  );
  const foreshadows = useSelector(() =>
    bookIdx >= 0 ? appStore.books[bookIdx].foreshadows.get() : [],
  );

  if (!chapter) {
    return (
      <div style={{ padding: "40px", color: "var(--text-secondary)" }}>
        Chapter not found.
      </div>
    );
  }

  const isLoading = chapter.body === undefined;

  const handleExport = () => {
    if (!chapter) return;

    // Convert HTML to plain text paragraphs
    const temp = document.createElement("div");
    temp.innerHTML = body || "";

    // Refresh mention names before export
    const mentionSpans = temp.querySelectorAll("span[data-mention-id]");
    if (mentionSpans.length > 0 && bookIdx >= 0) {
      const book = appStore.books[bookIdx].get();
      mentionSpans.forEach((span) => {
        const id = span.getAttribute("data-mention-id");
        const trigger = span.getAttribute("data-trigger");
        let entity = null;
        switch (trigger) {
          case "@":
            entity = book.characters?.find((c) => c.id === id);
            break;
          case "#":
            entity = book.nations?.find((c) => c.id === id);
            break;
          case "%":
            entity = book.monsters?.find((c) => c.id === id);
            break;
          case "~":
            entity = book.ingredients?.find((c) => c.id === id);
            break;
          case "^":
            entity = book.techniques?.find((c) => c.id === id);
            break;
          case "$":
            entity = book.treasures?.find((c) => c.id === id);
            break;
        }
        if (entity) {
          span.textContent = `${trigger}${entity.name}`;
        }
      });
    }

    // Get text and split by newlines (block elements like <p> will have newlines if we use innerText, or we can just split by \n)
    // Actually, Tiptap uses <p> tags. We can select all paragraphs.
    const paragraphs = Array.from(temp.querySelectorAll("p")).map(
      (p) => p.textContent || "",
    );
    // If no <p> tags were found, fallback to innerText split
    const lines =
      paragraphs.length > 0 ? paragraphs : temp.innerText.split("\n");

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: chapter.title || "Untitled Chapter",
                  bold: true,
                  size: 32, // 16pt
                }),
              ],
              spacing: { after: 400 },
            }),
            ...lines
              .filter((line) => line.trim().length > 0)
              .map(
                (line) =>
                  new Paragraph({
                    text: line,
                    spacing: { after: 200 },
                  }),
              ),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `${chapter.title || "chapter"}.docx`);
    });
  };

  const pinnedCharObjs = characters.filter((c: Character) =>
    pinnedChars.includes(c.id),
  );
  const pinnedEventObjs = events
    .filter((e: Event) => pinnedEventIds.includes(e.id))
    .sort((a: Event, b: Event) => a.time - b.time);

  const sortedEvents = [...events].sort((a, b) => a.time - b.time);

  const worldData = {
    synopsis: bookIdx >= 0 ? appStore.books[bookIdx].synopsis.get() : "",
    setting: bookIdx >= 0 ? appStore.books[bookIdx].setting.get() : "",
    themes: bookIdx >= 0 ? appStore.books[bookIdx].themes.get() : "",
    rules: bookIdx >= 0 ? appStore.books[bookIdx].rules.get() : "",
  };

  return (
    <div ref={ref} className="seshat-chapter-layout">
      {/* ── Prose column ── */}
      <div 
        className={`seshat-chapter-prose ${showPanel ? "panel-open" : ""}`}
        onScroll={(e) => setIsFloating(e.currentTarget.scrollTop > 120)}
      >
        <div className="seshat-chapter-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <input
                {...register("number")}
                placeholder="Ch. 1"
                style={{
                  ...S.input,
                  width: 64,
                  fontSize: 11,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  border: "none",
                  borderBottom: "1px solid var(--border)",
                  padding: "2px 0",
                }}
              />
              <div style={{ width: 240 }}>
                <EventPicker
                  control={control}
                  name="timeRef"
                  events={events}
                  placeholder="When did this chapter take place ?"
                  sx={{ marginBottom: 0 }}
                />
              </div>
            </div>
            <input
              {...register("title")}
              placeholder="Chapter title…"
              style={{
                ...S.input,
                fontSize: 28,
                fontFamily: "var(--font-serif)",
                fontWeight: 400,
                border: "none",
                padding: 0,
                color: "var(--text-primary)",
                letterSpacing: 0.5,
              }}
            />
          </div>

          <ChapterToolbar
            showPanel={showPanel}
            onTogglePanel={() => setShowPanel((s) => !s)}
            onSave={() => saveRef.current()}
            onExport={handleExport}
            isSaving={isSaving}
            isDirty={formState.isDirty}
            isFloating={isFloating}
          />
        </div>

        <textarea
          {...register("synopsis")}
          placeholder="Scene note or synopsis for this chapter (not part of the prose)…"
          rows={2}
          style={{
            width: "100%",
            fontSize: 12,
            color: "var(--text-muted)",
            fontStyle: "italic",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid var(--border)",
            outline: "none",
            resize: "none",
            lineHeight: 1.6,
            marginBottom: 28,
            paddingRight: "24px",
            padding: "4px 0",
          }}
        />

        {pinnedCharObjs.length + pinnedEventObjs.length > 0 && (
          <PinnedContextStrip
            pinnedCharObjs={pinnedCharObjs}
            pinnedEventObjs={pinnedEventObjs}
            onRemoveChar={(charId) => {
              const current = getValues("pinnedChars") || [];
              setValue(
                "pinnedChars",
                current.filter((x) => x !== charId),
                { shouldDirty: true },
              );
            }}
            onRemoveEvent={(eventId) => {
              const current = getValues("pinnedEventIds") || [];
              setValue(
                "pinnedEventIds",
                current.filter((x) => x !== eventId),
                { shouldDirty: true },
              );
            }}
          />
        )}

        {/* ── Scene Outline (Beat Sheet) ── */}
        <SceneOutlinePanel control={control} />

        {/* ── Rich editor — all context props wired ── */}
        {isLoading ? (
          <div style={{ marginTop: 24 }}>
            {/* Toolbar skeleton */}
            <div
              style={{
                display: "flex",
                gap: 4,
                padding: "6px 0",
                borderBottom: "1px solid var(--border)",
                marginBottom: "var(--space-3)",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <Skeleton animation="wave" variant="rounded" width={16} height={20} sx={{ bgcolor: "var(--bg-hover)" }} />
                <Skeleton animation="wave" variant="rounded" width={16} height={20} sx={{ bgcolor: "var(--bg-hover)" }} />
                <Skeleton animation="wave" variant="rounded" width={16} height={20} sx={{ bgcolor: "var(--bg-hover)" }} />
                <Skeleton animation="wave" variant="rounded" width={16} height={20} sx={{ bgcolor: "var(--bg-hover)" }} />
                
                <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 4px" }} />
                
                <Skeleton animation="wave" variant="rounded" width={24} height={20} sx={{ bgcolor: "var(--bg-hover)" }} />
                <Skeleton animation="wave" variant="rounded" width={24} height={20} sx={{ bgcolor: "var(--bg-hover)" }} />
                <Skeleton animation="wave" variant="rounded" width={24} height={20} sx={{ bgcolor: "var(--bg-hover)" }} />
                
                <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 4px" }} />
                
                <Skeleton animation="wave" variant="rounded" width={16} height={20} sx={{ bgcolor: "var(--bg-hover)" }} />
                <Skeleton animation="wave" variant="rounded" width={16} height={20} sx={{ bgcolor: "var(--bg-hover)" }} />
                <Skeleton animation="wave" variant="rounded" width={16} height={20} sx={{ bgcolor: "var(--bg-hover)" }} />
                
                <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 4px" }} />
                
                <Skeleton animation="wave" variant="rounded" width={90} height={22} sx={{ bgcolor: "var(--bg-hover)", borderRadius: 12, ml: 1 }} />
              </div>
              <Skeleton animation="wave" width={30} height={16} sx={{ bgcolor: "var(--bg-hover)" }} />
            </div>

            {/* Prose skeleton */}
            <div style={{ padding: "0 0 12px 0" }}>
              {/* Paragraph 1 */}
              <div style={{ marginBottom: 28 }}>
                <Skeleton animation="wave" height={22} width="95%" sx={{ bgcolor: "var(--bg-hover)", transform: "scale(1)", mb: 1.2 }} />
                <Skeleton animation="wave" height={22} width="90%" sx={{ bgcolor: "var(--bg-hover)", transform: "scale(1)", mb: 1.2 }} />
                <Skeleton animation="wave" height={22} width="75%" sx={{ bgcolor: "var(--bg-hover)", transform: "scale(1)" }} />
              </div>
              
              {/* Paragraph 2 - short */}
              <div style={{ marginBottom: 28 }}>
                <Skeleton animation="wave" height={22} width="45%" sx={{ bgcolor: "var(--bg-hover)", transform: "scale(1)" }} />
              </div>

              {/* Paragraph 3 */}
              <div style={{ marginBottom: 28 }}>
                <Skeleton animation="wave" height={22} width="100%" sx={{ bgcolor: "var(--bg-hover)", transform: "scale(1)", mb: 1.2 }} />
                <Skeleton animation="wave" height={22} width="88%" sx={{ bgcolor: "var(--bg-hover)", transform: "scale(1)", mb: 1.2 }} />
                <Skeleton animation="wave" height={22} width="92%" sx={{ bgcolor: "var(--bg-hover)", transform: "scale(1)", mb: 1.2 }} />
                <Skeleton animation="wave" height={22} width="60%" sx={{ bgcolor: "var(--bg-hover)", transform: "scale(1)" }} />
              </div>

              {/* Paragraph 4 - single line */}
              <div style={{ marginBottom: 28 }}>
                <Skeleton animation="wave" height={22} width="80%" sx={{ bgcolor: "var(--bg-hover)", transform: "scale(1)" }} />
              </div>
              
              {/* Paragraph 5 */}
              <div style={{ marginBottom: 28 }}>
                <Skeleton animation="wave" height={22} width="94%" sx={{ bgcolor: "var(--bg-hover)", transform: "scale(1)", mb: 1.2 }} />
                <Skeleton animation="wave" height={22} width="85%" sx={{ bgcolor: "var(--bg-hover)", transform: "scale(1)", mb: 1.2 }} />
                <Skeleton animation="wave" height={22} width="30%" sx={{ bgcolor: "var(--bg-hover)", transform: "scale(1)" }} />
              </div>
            </div>
          </div>
        ) : (
          <RichEditor
            control={control}
            name="body"
            placeholder="Begin writing the chapter here. The story lives in this space…"
            characters={characters}
            events={events}
            pinnedEvents={pinnedEventObjs}
            pinnedCharIds={pinnedChars}
            isDirty={formState.isDirty}
            onSave={() => saveRef.current()}
            bookId={bookId}
          />
        )}
      </div>

      {/* ── Reference panel ── */}
      <>
        <div
          className={`seshat-chapter-panel-overlay ${showPanel ? "open" : ""}`}
          onClick={() => setShowPanel(false)}
        />
        <ReferencePanel
          isOpen={showPanel}
          panelTab={panelTab}
            onTabChange={setPanelTab}
            characters={characters}
            sortedEvents={sortedEvents}
            pinnedCharIds={pinnedChars}
            pinnedEventIds={pinnedEventIds}
            onTogglePinChar={(charId) => {
              const current = getValues("pinnedChars") || [];
              const next = current.includes(charId)
                ? current.filter((x) => x !== charId)
                : [...current, charId];
              setValue("pinnedChars", next, { shouldDirty: true });
            }}
            onTogglePinEvent={(eventId) => {
              const current = getValues("pinnedEventIds") || [];
              const next = current.includes(eventId)
                ? current.filter((x) => x !== eventId)
                : [...current, eventId];
              setValue("pinnedEventIds", next, { shouldDirty: true });
            }}
            worldData={worldData}
            events={events}
            notesNode={
              <textarea
                {...register("notes")}
                placeholder="Write your notes here..."
                style={{
                  width: "100%",
                  flex: 1,
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  lineHeight: 1.7,
                  padding: "4px 0",
                }}
              />
            }
            draftsNode={
              <DraftsPanel
                drafts={chapter?.drafts || []}
                currentBody={body}
                activeDraftId={activeDraftId}
                onSaveAsDraft={handleSaveAsDraft}
                onRestoreDraft={handleRestoreDraft}
              />
            }
            foreshadowsNode={
              <ForeshadowPanel
                foreshadows={foreshadows || []}
                chapters={allChapters}
                currentChapterId={id || ""}
                onAddForeshadow={(f) => {
                  if (bookIdx >= 0 && bookId) {
                    appStore.books[bookIdx].foreshadows.push(f);
                    const token =
                      localStorage.getItem("seshat-auth-token") ||
                      sessionStorage.getItem("seshat-auth-token");
                    if (token) {
                      updateFileOnGitHub(
                        token,
                        bookId,
                        "foreshadows.json",
                        JSON.stringify(
                          appStore.books[bookIdx].foreshadows.get(),
                          null,
                          2,
                        ),
                      ).catch(console.error);
                    }
                  }
                }}
                onUpdateForeshadow={(f) => {
                  if (bookIdx >= 0 && bookId) {
                    const idx = appStore.books[bookIdx].foreshadows
                      .get()
                      .findIndex((x) => x.id === f.id);
                    if (idx >= 0) {
                      appStore.books[bookIdx].foreshadows[idx].set(f);
                      const token =
                        localStorage.getItem("seshat-auth-token") ||
                        sessionStorage.getItem("seshat-auth-token");
                      if (token) {
                        updateFileOnGitHub(
                          token,
                          bookId,
                          "foreshadows.json",
                          JSON.stringify(
                            appStore.books[bookIdx].foreshadows.get(),
                            null,
                            2,
                          ),
                        ).catch(console.error);
                      }
                    }
                  }
                }}
                onDeleteForeshadow={(fid) => {
                  if (bookIdx >= 0 && bookId) {
                    appStore.books[bookIdx].foreshadows.set(
                      (prev: Foreshadow[]) => prev.filter((x) => x.id !== fid),
                    );
                    const token =
                      localStorage.getItem("seshat-auth-token") ||
                      sessionStorage.getItem("seshat-auth-token");
                    if (token) {
                      updateFileOnGitHub(
                        token,
                        bookId,
                        "foreshadows.json",
                        JSON.stringify(
                          appStore.books[bookIdx].foreshadows.get(),
                          null,
                          2,
                        ),
                      ).catch(console.error);
                    }
                  }
                }}
              />
            }
            continuityNode={
              <ContinuityTracker
                text={body || ""}
                characters={characters}
                pinnedCharIds={pinnedChars}
              />
            }
          />
      </>
    </div>
  );
}
