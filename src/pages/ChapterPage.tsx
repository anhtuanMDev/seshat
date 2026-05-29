import { useParams } from "react-router-dom";
import { useSelector } from "@legendapp/state/react";
import { appStore } from "../store/appStore";
import {
  useEvents,
  useCharacters,
  useActiveBookIdx,
} from "../hooks/useWorldStore";
import { S } from "../lib/utils";
import { NotesIcon } from "../components/ui/icons";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { useState, useEffect } from "react";
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

function countWords(text: string) {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

export default function ChapterPage() {
  const { id } = useParams();
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

  const { register, handleSubmit, control, reset } = useForm<ChapterForm>({
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
    if (chapter) {
      reset({
        number: chapter.number || "",
        title: chapter.title || "",
        timeRef: chapter.timeRef || "",
        synopsis: chapter.synopsis || "",
        body: chapter.body || "",
        notes: chapter.notes || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter?.id, reset]);

  const ref = useAnimateIn();

  const [showPanel, setShowPanel] = useState(true);
  const [panelTab, setPanelTab] = useState<"chars" | "events" | "world">(
    "chars",
  );

  const [pinnedChars, setPinnedChars] = useState<string[]>([]);
  const [pinnedEvents, setPinnedEvents] = useState<string[]>([]);

  if (!chapter) {
    return (
      <div style={{ padding: "40px", color: "var(--text-secondary)" }}>
        Chapter not found.
      </div>
    );
  }

  const onSubmit = (data: ChapterForm) => {
    if (bookIdx < 0) return;
    const ch = appStore.books[bookIdx].chapters[chapterIdx];
    ch.number.set(data.number);
    ch.title.set(data.title);
    ch.timeRef.set(data.timeRef);
    ch.synopsis.set(data.synopsis);
    ch.body.set(data.body);
    ch.notes.set(data.notes);
  };

  const body = useWatch({ control, name: "body" });
  const words = countWords(body || "");
  const pinnedCharObjs = characters.filter((c: Character) =>
    pinnedChars.includes(c.id),
  );
  const pinnedEventObjs = events
    .filter((e: Event) => pinnedEvents.includes(e.id))
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
            words={words}
            showPanel={showPanel}
            onTogglePanel={() => setShowPanel((s) => !s)}
            onSave={handleSubmit(onSubmit)}
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

        <RichEditor control={control} name="body" placeholder="Begin writing the chapter here. The story lives in this space…" />

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

      {showPanel && (
        <ReferencePanel
          panelTab={panelTab}
          onTabChange={setPanelTab}
          characters={characters}
          sortedEvents={sortedEvents}
          pinnedCharIds={pinnedChars}
          pinnedEventIds={pinnedEvents}
          onTogglePinChar={(id) =>
            setPinnedChars((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
            )
          }
          onTogglePinEvent={(id) =>
            setPinnedEvents((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
            )
          }
          worldData={worldData}
          events={events}
        />
      )}
    </div>
  );
}
