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
import { NotesIcon } from "../components/ui/icons";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { Character, Event } from "../lib/types";
import RichEditor from "../components/editor/RichEditor";
import { ReferencePanel } from "../components/chapter/ReferencePanel";
import { PinnedContextStrip } from "../components/chapter/PinnedContextStrip";
import { ChapterToolbar } from "../components/chapter/ChapterToolbar";

interface ChapterForm {
  number: string;
  title: string;
  timeRef: string;
  synopsis: string;
  body: string;
  notes: string;
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

  const { register, control, reset, formState, getValues } =
    useForm<ChapterForm>({
      defaultValues: {
        number: "",
        title: "",
        timeRef: "",
        synopsis: "",
        body: "",
        notes: "",
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

              // Immediately inject into the form so the Rich Editor picks it up without waiting for a re-render cycle
              reset({
                number: chapter.number || "",
                title: chapter.title || "",
                timeRef: chapter.timeRef || "",
                synopsis: chapter.synopsis || "",
                body: fetchedBody,
                notes: fullChapter.notes ? fetchedNotes : (chapter.notes || ""),
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

  const [showPanel, setShowPanel] = useState(true);
  const [panelTab, setPanelTab] = useState<"chars" | "events" | "world">(
    "chars",
  );

  const [pinnedChars, setPinnedChars] = useState<string[]>([]);
  const [pinnedEventIds, setPinnedEventIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const body = useWatch({ control, name: "body" });

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
        };
        await updateFileOnGitHub(token, bookId, `chapters/chapter_${id}.json`, JSON.stringify(payload, null, 2));
        showToast("Chapter synced to cloud", "success");
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
      style={{
        display: "flex",
        gap: 0,
        minHeight: "100%",
        position: "relative",
      }}
    >
      {/* ── Prose column ── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          paddingRight: showPanel ? 24 : 0,
          transition: "padding 0.2s",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 20,
            gap: 16,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
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
              <input
                {...register("timeRef")}
                placeholder="Timeline ref (e.g. T3–T4)"
                style={{
                  ...S.input,
                  width: 160,
                  fontSize: 11,
                  letterSpacing: 1,
                  color: "var(--text-muted)",
                  border: "none",
                  borderBottom: "1px solid var(--border)",
                  padding: "2px 0",
                }}
              />
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
          />
        )}

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

        <hr style={S.rule} />
        <p
          style={{
            ...S.h2,
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <NotesIcon sx={{ fontSize: 12 }} />
          Chapter notes
        </p>
        <textarea
          {...register("notes")}
          placeholder="Private notes, research, threads to pull later, things you want to remember…"
          rows={4}
          style={{
            width: "100%",
            fontFamily: "Georgia, serif",
            fontSize: 13,
            color: "var(--text-secondary)",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid var(--border)",
            outline: "none",
            resize: "vertical",
            lineHeight: 1.7,
            padding: "4px 0",
          }}
        />
      </div>

      {/* ── Reference panel ── */}
      {showPanel && (
        <ReferencePanel
          panelTab={panelTab}
          onTabChange={setPanelTab}
          characters={characters}
          sortedEvents={sortedEvents}
          pinnedCharIds={pinnedChars}
          pinnedEventIds={pinnedEventIds}
          onTogglePinChar={(charId) =>
            setPinnedChars((prev) =>
              prev.includes(charId)
                ? prev.filter((x) => x !== charId)
                : [...prev, charId],
            )
          }
          onTogglePinEvent={(eventId) =>
            setPinnedEventIds((prev) =>
              prev.includes(eventId)
                ? prev.filter((x) => x !== eventId)
                : [...prev, eventId],
            )
          }
          worldData={worldData}
          events={events}
        />
      )}
    </div>
  );
}
