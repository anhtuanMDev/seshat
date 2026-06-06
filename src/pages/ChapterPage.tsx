import { useParams } from "react-router-dom";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { useSelector } from "@legendapp/state/react";
import { appStore } from "../store/appStore";
import { showToast } from "../store/toastStore";
import { updateFileOnGitHub } from "../lib/githubSync";
import {
  useEvents,
  useCharacters,
  useActiveBookIdx,
} from "../hooks/useWorldStore";
import { S } from "../lib/utils";

import { useAnimateIn } from "../hooks/useAnimateIn";
import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { Character, Event } from "../lib/types";
import RichEditor from "../components/editor/RichEditor";
import { ReferencePanel } from "../components/chapter/ReferencePanel";
import { PinnedContextStrip } from "../components/chapter/PinnedContextStrip";
import { ChapterToolbar } from "../components/chapter/ChapterToolbar";
import { SceneOutlinePanel } from "../components/chapter/SceneOutlinePanel";
import { DraftsPanel } from "../components/chapter/DraftsPanel";
import { EventPicker } from "../components/ui/EventPicker";
import type { Draft } from "../lib/types";

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
  const [panelTab, setPanelTab] = useState<"chars" | "events" | "world" | "notes" | "drafts">("chars");
  const [isSaving, setIsSaving] = useState(false);

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
        } else {
          // Body is missing (stripped by loadBook.ts to save RAM), fetch it lazily
          const token = localStorage.getItem("seshat-auth-token") || sessionStorage.getItem("seshat-auth-token");
          if (token && bookId) {
            try {
              const { loadFileFromGitHub } = await import("../lib/githubSync");
              const fullChapter = await loadFileFromGitHub(token, bookId, `chapters/chapter_${chapter.id}.json`);
              const fetchedBody = (fullChapter.body as string) || "";
              const fetchedNotes = (fullChapter.notes as string) || "";

              // Update appStore with the missing massive text fields
              appStore.books[bookIdx].chapters[chapterIdx].body.set(fetchedBody);
              // Also sync notes if they were somehow stripped
              if (fullChapter.notes) appStore.books[bookIdx].chapters[chapterIdx].notes.set(fetchedNotes);
              if (fullChapter.drafts) appStore.books[bookIdx].chapters[chapterIdx].drafts.set(fullChapter.drafts as import("../lib/types").Draft[]);

              // Immediately inject into the form so the Rich Editor picks it up without waiting for a re-render cycle
              reset({
                number: chapter.number || "",
                title: chapter.title || "",
                timeRef: chapter.timeRef || "",
                synopsis: chapter.synopsis || "",
                body: fetchedBody,
                notes: fullChapter.notes ? fetchedNotes : (chapter.notes || ""),
                pinnedChars: chapter.pinnedChars || [],
                pinnedEventIds: chapter.pinnedEventIds || [],
                scenes: (fullChapter.scenes as import("../lib/types").SceneCard[]) || chapter.scenes || [],
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
    ch.timeRef.set(data.timeRef);
    ch.synopsis.set(data.synopsis);
    ch.body.set(data.body);
    ch.notes.set(data.notes);
    ch.pinnedChars.set(data.pinnedChars);
    ch.pinnedEventIds.set(data.pinnedEventIds);
    ch.scenes.set(data.scenes);
    
    // Background delta sync
    const token = localStorage.getItem("seshat-auth-token") || sessionStorage.getItem("seshat-auth-token");
    if (token) {
      try {
        setIsSaving(true);
        const payload = {
          id: id,
          order: ch.order.get(),
          number: data.number,
          title: data.title,
          timeRef: data.timeRef,
          synopsis: data.synopsis,
          body: data.body,
          notes: data.notes,
          pinnedChars: data.pinnedChars,
          pinnedEventIds: data.pinnedEventIds,
          scenes: data.scenes,
          drafts: ch.drafts.get() || [],
        };
        await updateFileOnGitHub(token, bookId, `chapters/chapter_${id}.json`, JSON.stringify(payload, null, 2));
        showToast("Chapter synced to cloud", "success");
        // Reset the form with the saved data to clear the dirty state
        reset(data);
      } catch (err) {
        console.error(err);
        showToast("Failed to sync chapter to cloud", "error");
      } finally {
        setIsSaving(false);
      }
    }
  }, [bookIdx, bookId, id, chapterIdx, getValues, reset]);

  // Keep a stable ref for save so RichEditor's onSave doesn't go stale
  const saveRef = useRef<() => void>(() => {});
  useLayoutEffect(() => {
    saveRef.current = onSubmit;
  }, [onSubmit]);

  const handleSaveAsDraft = useCallback((name: string) => {
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
    saveRef.current();
  }, [bookIdx, chapterIdx, getValues]);

  const handleRestoreDraft = useCallback((draft: Draft) => {
    setValue("body", draft.body, { shouldDirty: true });
  }, [setValue]);

  if (!chapter) {
    return (
      <div style={{ padding: "40px", color: "var(--text-secondary)" }}>
        Chapter not found.
      </div>
    );
  }



  const handleExport = () => {
    if (!chapter) return;
    
    // Convert HTML to plain text paragraphs
    const temp = document.createElement("div");
    temp.innerHTML = body || "";
    
    // Refresh mention names before export
    const mentionSpans = temp.querySelectorAll("span[data-mention-id]");
    if (mentionSpans.length > 0 && bookIdx >= 0) {
      const book = appStore.books[bookIdx].get();
      mentionSpans.forEach(span => {
        const id = span.getAttribute("data-mention-id");
        const trigger = span.getAttribute("data-trigger");
        let entity = null;
        switch (trigger) {
          case "@": entity = book.characters?.find(c => c.id === id); break;
          case "#": entity = book.nations?.find(c => c.id === id); break;
          case "%": entity = book.monsters?.find(c => c.id === id); break;
          case "~": entity = book.ingredients?.find(c => c.id === id); break;
          case "^": entity = book.techniques?.find(c => c.id === id); break;
          case "$": entity = book.treasures?.find(c => c.id === id); break;
        }
        if (entity) {
          span.textContent = `${trigger}${entity.name}`;
        }
      });
    }

    // Get text and split by newlines (block elements like <p> will have newlines if we use innerText, or we can just split by \n)
    // Actually, Tiptap uses <p> tags. We can select all paragraphs.
    const paragraphs = Array.from(temp.querySelectorAll("p")).map(p => p.textContent || "");
    // If no <p> tags were found, fallback to innerText split
    const lines = paragraphs.length > 0 ? paragraphs : temp.innerText.split("\n");

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
              .filter(line => line.trim().length > 0)
              .map(line => new Paragraph({ 
                text: line,
                spacing: { after: 200 }
              })),
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
    <div
      ref={ref}
      className="seshat-chapter-layout"
    >
      {/* ── Prose column ── */}
      <div className={`seshat-chapter-prose ${showPanel ? 'panel-open' : ''}`}>
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
                fontSize: 26,
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
          />
        </div>

        <textarea
          {...register("synopsis")}
          placeholder="Scene note or synopsis for this chapter (not part of the prose)…"
          rows={2}
          style={{
            width: "100%",
            fontFamily: "Georgia, serif",
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
            padding: "4px 0",
          }}
        />

        {pinnedCharObjs.length + pinnedEventObjs.length > 0 && (
          <PinnedContextStrip
            pinnedCharObjs={pinnedCharObjs}
            pinnedEventObjs={pinnedEventObjs}
            onRemoveChar={(charId) => {
              const current = getValues("pinnedChars") || [];
              setValue("pinnedChars", current.filter((x) => x !== charId), { shouldDirty: true });
            }}
            onRemoveEvent={(eventId) => {
              const current = getValues("pinnedEventIds") || [];
              setValue("pinnedEventIds", current.filter((x) => x !== eventId), { shouldDirty: true });
            }}
          />
        )}

        {/* ── Scene Outline (Beat Sheet) ── */}
        <SceneOutlinePanel control={control} />

        {/* ── Rich editor — all context props wired ── */}
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
      </div>

      {/* ── Reference panel ── */}
      {showPanel && (
        <>
          <div className="seshat-chapter-panel-overlay" onClick={() => setShowPanel(false)} />
          <ReferencePanel
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
                  fontFamily: "Georgia, serif",
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
                onSaveAsDraft={handleSaveAsDraft}
                onRestoreDraft={handleRestoreDraft}
              />
            }
          />
        </>
      )}
    </div>
  );
}
