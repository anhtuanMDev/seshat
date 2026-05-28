import { worldStore } from "../store/worldStore";
import { useEvents } from "../hooks/useWorldStore";
import { S, mkEvent } from "../lib/utils";
import { Field, Sel, Section, EntryBlock } from "../components/ui";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { EVENT_TYPES } from "../lib/constants";
import type { Event } from "../lib/types";
import { useCallback } from "react";

export default function TimelinePage() {
  const events = useEvents();
  const ref = useAnimateIn();

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const add = useCallback(() => {
    const maxT = events.reduce((m: number, e: Event) => Math.max(m, e.time), 0);
    const e = { ...mkEvent(), time: maxT + 1 };
    (worldStore as any).events.push(e);
  }, [events]);

  const del = useCallback((id: string) => {
    (worldStore as any).events.set((prev: Event[]) =>
      prev.filter((x) => x.id !== id),
    );
  }, []);

  const update = useCallback((id: string, key: string, v: any) => {
    const idx = (worldStore.events.get() as Event[]).findIndex((x) => x.id === id);
    if (idx >= 0) (worldStore as any).events[idx][key].set(v);
  }, []);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const sortedEvents = [...events].sort((a, b) => a.time - b.time);

  return (
    <div ref={ref}>
      <Section
        title={`Timeline (${events.length})`}
        action={
          <button onClick={add} style={S.ghost}>
            + add
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
                  onChange={(v) => update(e.id, "type", v)}
                  opts={EVENT_TYPES}
                />
                <Field
                  label="Chapter"
                  value={e.chapter || ""}
                  onChange={(v) => update(e.id, "chapter", v)}
                  placeholder="3 or Prologue"
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