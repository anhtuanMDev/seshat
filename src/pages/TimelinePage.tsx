import { appStore } from "../store/appStore";
import { useEvents, useActiveBookIdx } from "../hooks/useWorldStore";
import { S, mkEvent } from "../lib/utils";
import { Field, Sel, Section, EntryBlock } from "../components/ui";
import { TimelineIcon, AddIcon } from "../components/ui/icons";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { EVENT_TYPES } from "../lib/constants";
import type { Event, EventType } from "../lib/types";
import { useCallback } from "react";

type ObservableOf<T> = { [K in keyof T]: { set(v: T[K]): void } };

export default function TimelinePage() {
  const events = useEvents();
  const bookIdx = useActiveBookIdx();
  const ref = useAnimateIn();

  const add = useCallback(() => {
    if (bookIdx < 0) return;
    const maxT = events.reduce((m: number, e: Event) => Math.max(m, e.time), 0);
    const e = { ...mkEvent(), time: maxT + 1 };
    appStore.books[bookIdx].events.push(e);
  }, [events, bookIdx]);

  const del = useCallback((id: string) => {
    if (bookIdx < 0) return;
    appStore.books[bookIdx].events.set((prev: Event[]) =>
      prev.filter((x) => x.id !== id),
    );
  }, [bookIdx]);

  const update = useCallback(<K extends keyof Event>(id: string, key: K, v: Event[K]) => {
    if (bookIdx < 0) return;
    const idx = appStore.books[bookIdx].events.get().findIndex((x) => x.id === id);
    if (idx >= 0) (appStore.books[bookIdx].events[idx] as ObservableOf<Event>)[key].set(v);
  }, [bookIdx]);

  const sortedEvents = [...events].sort((a, b) => a.time - b.time);

  return (
    <div ref={ref}>
      <Section
        title={<><TimelineIcon sx={{ fontSize: 12, marginRight: 4 }} />Timeline ({events.length})</>}
        action={
          <button onClick={add} style={{ ...S.ghost, display: "flex", alignItems: "center", gap: 2 }}>
            <AddIcon sx={{ fontSize: 14 }} />add
          </button>
        }
        defaultOpen={true}
      >
        <p style={{ ...S.dim, marginBottom: 14 }}>
          Your story's events in chronological order.
        </p>
        {sortedEvents.map((e: Event) => {
          return (
            <EntryBlock
              key={e.id}
              color="var(--color-blue)"
              onDelete={() => del(e.id)}
            >
              <div style={S.grid3}>
                <div>
                  <label style={S.label}>Time</label>
                  <input
                    type="number"
                    value={e.time}
                    onChange={(v) => update(e.id, "time", +v.target.value)}
                    style={{ ...S.input, width: 52 }}
                  />
                </div>
                <Sel
                  label="Type"
                  value={e.type || ""}
                  onChange={(v) => update(e.id, "type", v as EventType)}
                  opts={EVENT_TYPES}
                />
                <Field
                  label="Chapters (one per line)"
                  value={(e.chapters || []).join("\n")}
                  onChange={(v) => update(e.id, "chapters", v.split("\n").map((s: string) => s.trim()).filter(Boolean))}
                  multi
                  rows={2}
                  placeholder="3&#10;Prologue"
                />
                <div>
                  <label style={S.label}>Start</label>
                  <input
                    type="datetime-local"
                    value={e.startDate || ""}
                    onChange={(v) => update(e.id, "startDate", v.target.value)}
                    style={{ ...S.input, width: "100%", fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={S.label}>End</label>
                  <input
                    type="datetime-local"
                    value={e.endDate || ""}
                    onChange={(v) => update(e.id, "endDate", v.target.value)}
                    style={{ ...S.input, width: "100%", fontSize: 12 }}
                  />
                </div>
              </div>
              <Field
                label="Title"
                value={e.title || ""}
                onChange={(v) => update(e.id, "title", v)}
                placeholder="What happens here…"
              />
              <Field
                label="Setting / location"
                value={e.setting || ""}
                onChange={(v) => update(e.id, "setting", v)}
                placeholder="Where and what it feels like here…"
              />
              <Field
                label="What happens"
                value={e.description || ""}
                onChange={(v) => update(e.id, "description", v)}
                multi
                rows={3}
              />
              <Field
                label="Consequence / after-effects"
                value={e.consequence || ""}
                onChange={(v) => update(e.id, "consequence", v)}
                multi
                rows={2}
              />
            </EntryBlock>
          );
        })}
        {!events.length && <p style={S.dim}>No events yet.</p>}
      </Section>
    </div>
  );
}
