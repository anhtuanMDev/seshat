import { worldStore } from "../store/worldStore";
import { useChapters } from "../hooks/useWorldStore";
import { S } from "../lib/utils";
import { Field, Section, EntryBlock } from "../components/ui";
import { AutoStoriesIcon, AddIcon } from "../components/ui/icons";
import { useAnimateIn } from "../hooks/useAnimateIn";
import type { Chapter } from "../store/worldStore";
import { useCallback } from "react";

type ObservableOf<T> = { [K in keyof T]: { set(v: T[K]): void } };

export default function ChapterListPage() {
  const chapters = useChapters();
  const ref = useAnimateIn();

  const addChapter = useCallback(() => {
    const order = (chapters?.length || 0) + 1;
    const ch = {
      id: Math.random().toString(36).slice(2, 8),
      number: `Ch. ${order}`,
      title: "",
      timeRef: "",
      synopsis: "",
      body: "",
      notes: "",
      order,
    };
    worldStore.chapters.push(ch);
  }, [chapters?.length]);

  const del = useCallback((id: string) => {
    worldStore.chapters.set((prev: Chapter[]) =>
      prev.filter((x) => x.id !== id),
    );
  }, []);

  const update = useCallback(<K extends keyof Chapter>(id: string, key: K, v: Chapter[K]) => {
    const idx = worldStore.chapters.get().findIndex((x) => x.id === id);
    if (idx >= 0) (worldStore.chapters[idx] as ObservableOf<Chapter>)[key].set(v);
  }, []);

  const sortedChapters = [...(chapters || [])].sort(
    (a: Chapter, b: Chapter) => a.order - b.order,
  );

  return (
    <div ref={ref}>
      <Section
        title={<><AutoStoriesIcon sx={{ fontSize: 12, marginRight: 4 }} />Chapters ({chapters?.length || 0})</>}
        action={
          <button onClick={addChapter} style={{ ...S.ghost, display: "flex", alignItems: "center", gap: 2 }}>
            <AddIcon sx={{ fontSize: 14 }} />add
          </button>
        }
        defaultOpen={true}
      >
        <p style={{ ...S.dim, marginBottom: 14 }}>
          Your story's chapters and their synopsis notes.
        </p>
        {sortedChapters.map((c: Chapter) => {
          return (
            <EntryBlock
              key={c.id}
              color="var(--color-purple)"
              onDelete={() => del(c.id)}
            >
              <div style={S.grid3}>
                <Field
                  label="Number"
                  value={c.number || ""}
                  onChange={(v) => update(c.id, "number", v)}
                  placeholder="Ch. 1"
                />
                <Field
                  label="Time ref"
                  value={c.timeRef || ""}
                  onChange={(v) => update(c.id, "timeRef", v)}
                  placeholder="T3–T4"
                />
              </div>
              <Field
                label="Title"
                value={c.title || ""}
                onChange={(v) => update(c.id, "title", v)}
                placeholder="Chapter title…"
              />
              <Field
                label="Synopsis / scene notes"
                value={c.synopsis || ""}
                onChange={(v) => update(c.id, "synopsis", v)}
                multi
                rows={3}
                placeholder="Scene note or synopsis for this chapter (not part of the prose)…"
              />
              <Field
                label="Notes"
                value={c.notes || ""}
                onChange={(v) => update(c.id, "notes", v)}
                multi
                rows={4}
                placeholder="Private notes, research, threads to pull later…"
              />
            </EntryBlock>
          );
        })}
        {!chapters?.length && <p style={S.dim}>No chapters yet.</p>}
      </Section>
    </div>
  );
}