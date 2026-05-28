import { useParams } from "react-router-dom";
import { useSelector } from "@legendapp/state/react";
import { worldStore } from "../store/worldStore";
import { useCharacters } from "../hooks/useWorldStore";
import { S } from "../lib/utils";
import { Field, Sel, Section } from "../components/ui";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import type { Character, EventAttributes, EventType } from "../lib/types";

interface EventForm {
  title: string;
  time: number;
  type: string;
  chapter: string;
  startDate: string;
  endDate: string;
  setting: string;
  description: string;
  consequence: string;
  characters: string[];
}
import {
  EVENT_TYPES,
  POWER_TIERS,
  DIFFICULTY,
  ARC_STAGES,
} from "../lib/constants";
import { useAnimateIn } from "../hooks/useAnimateIn";

export default function EventPage() {
  const { id } = useParams();
  const characters = useCharacters();

  const event = useSelector(() =>
    worldStore.events.get().find((e) => e.id === id),
  );
  const eventIdx = useSelector(() =>
    worldStore.events.get().findIndex((e) => e.id === id),
  );

  const [charAttrs, setCharAttrs] = useState<Record<string, EventAttributes>>(
    {},
  );

  const { register, handleSubmit, watch, reset, setValue, getValues } = useForm<EventForm>({
    defaultValues: {
      title: "",
      time: 1,
      type: "Story",
      chapter: "",
      startDate: "",
      endDate: "",
      setting: "",
      description: "",
      consequence: "",
      characters: [],
    },
  });

  useEffect(() => {
    if (event) {
      reset({
        title: event.title || "",
        time: event.time,
        type: event.type,
        chapter: event.chapter || "",
        startDate: event.startDate || "",
        endDate: event.endDate || "",
        setting: event.setting || "",
        description: event.description || "",
        consequence: event.consequence || "",
        characters: event.characters || [],
      });
      const attrs: Record<string, EventAttributes> = {};
      worldStore.characters.get().forEach((c) => {
        if (c.attributes?.[event.id]) {
          attrs[c.id] = { ...c.attributes[event.id] };
        }
      });
      setCharAttrs(attrs);
    }
  }, [event?.id, reset]);

  const ref = useAnimateIn();

  if (!event)
    return (
      <div style={{ padding: "40px", color: "var(--text-secondary)" }}>
        Event not found.
      </div>
    );

  const toggleChar = useCallback((cid: string) => {
    const current = getValues("characters");
    const updated = current.includes(cid)
      ? current.filter((x: string) => x !== cid)
      : [...current, cid];
    setValue("characters", updated);
  }, [getValues, setValue]);

  const patchAttr = useCallback((cid: string, f: string, v: string) => {
    setCharAttrs((prev) => ({
      ...prev,
      [cid]: { ...prev[cid], [f]: v },
    }));
  }, []);

  const getAttr = (cid: string) => charAttrs[cid] || {};

  const onSubmit = (data: EventForm) => {
    const ev = worldStore.events[eventIdx];
    ev.title.set(data.title);
    ev.time.set(data.time);
    ev.type.set(data.type as EventType);
    ev.chapter.set(data.chapter);
    ev.startDate.set(data.startDate);
    ev.endDate.set(data.endDate);
    ev.setting.set(data.setting);
    ev.description.set(data.description);
    ev.consequence.set(data.consequence);
    ev.characters.set(data.characters);
    Object.entries(charAttrs).forEach(([cid, attrs]) => {
      const cIdx = worldStore.characters.get().findIndex(
        (c) => c.id === cid,
      );
      if (cIdx >= 0) {
        const current = worldStore.characters[cIdx].attributes.get();
        worldStore.characters[cIdx].attributes.set({
          ...current,
          [event.id]: attrs,
        });
      }
    });
  };

  const formChars = watch("characters");

  return (
    <div ref={ref}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 16,
        }}
      >
        <input
          {...register("title")}
          style={{
            ...S.input,
            fontSize: 22,
            border: "none",
            padding: 0,
            flex: 1,
            color: "var(--text-primary)",
          }}
        />
        <button
          onClick={handleSubmit(onSubmit)}
          title="Save changes"
          style={{
            ...S.ghost,
            fontSize: 11,
            letterSpacing: 1,
            color: "var(--color-green)",
            flexShrink: 0,
          }}
        >
          save
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "56px auto 1fr 1fr 1fr",
          gap: "0 24px",
          marginBottom: 16,
          alignItems: "end",
        }}
      >
        <div>
          <label style={S.label}>Time</label>
          <input
            type="number"
            {...register("time", { valueAsNumber: true })}
            style={{ ...S.input, width: 52 }}
          />
        </div>
        <div>
          <label style={S.label}>Type</label>
          <select
            {...register("type")}
            style={S.select}
          >
            {EVENT_TYPES.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
        <Field
          label="Chapter"
          value={watch("chapter")}
          onChange={(v) => setValue("chapter", v)}
          placeholder="3 or Prologue"
        />
        <div>
          <label style={S.label}>Start</label>
          <input
            type="datetime-local"
            {...register("startDate")}
            style={{ ...S.input, width: "100%", fontSize: 12 }}
          />
        </div>
        <div>
          <label style={S.label}>End</label>
          <input
            type="datetime-local"
            {...register("endDate")}
            style={{ ...S.input, width: "100%", fontSize: 12 }}
          />
        </div>
      </div>

      <Field
        label="Setting / location"
        value={watch("setting")}
        onChange={(v) => setValue("setting", v)}
        placeholder="Where and what it feels like here…"
      />
      <Field
        label="What happens"
        value={watch("description")}
        onChange={(v) => setValue("description", v)}
        multi
        rows={3}
      />
      <Field
        label="Consequence / after-effects"
        value={watch("consequence")}
        onChange={(v) => setValue("consequence", v)}
        multi
        rows={2}
      />

      <Section title="Characters present">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 20,
          }}
        >
          {characters.map((c: Character) => {
            const active = formChars.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggleChar(c.id)}
                style={{
                  ...S.pill,
                  color: active ? c.color : "var(--text-muted)",
                  borderColor: active ? c.color : "var(--border)",
                  fontFamily: "'Georgia', serif",
                }}
              >
                {c.name}
              </button>
            );
          })}
          {!characters.length && (
            <span style={S.dim}>Add characters first.</span>
          )}
        </div>

        {formChars.map((cid: string) => {
          const c = characters.find((x: Character) => x.id === cid);
          if (!c) return null;
          const a = getAttr(cid);
          return (
            <div
              key={cid}
              style={{
                marginBottom: 28,
                paddingLeft: 14,
                borderLeft: `2px solid ${c.color}60`,
              }}
            >
              <p
                style={{
                  ...S.dim,
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: c.color,
                    display: "inline-block",
                  }}
                />
                {c.name}
              </p>
              <div style={S.grid3}>
                <Sel
                  label="Power tier"
                  value={a.power || ""}
                  onChange={(v) => patchAttr(cid, "power", v)}
                  opts={POWER_TIERS}
                />
                <Sel
                  label="Difficulty faced"
                  value={a.difficulty || ""}
                  onChange={(v) => patchAttr(cid, "difficulty", v)}
                  opts={DIFFICULTY}
                />
                <Sel
                  label="Arc stage"
                  value={a.arcStage || ""}
                  onChange={(v) => patchAttr(cid, "arcStage", v)}
                  opts={ARC_STAGES}
                />
                <Field
                  label="Emotional state"
                  value={a.emotionalState || ""}
                  onChange={(v) => patchAttr(cid, "emotionalState", v)}
                  placeholder="Grief, resolute…"
                />
                <Field
                  label="Physical state"
                  value={a.physicalState || ""}
                  onChange={(v) => patchAttr(cid, "physicalState", v)}
                  placeholder="Injured, peak…"
                />
                <Field
                  label="Scene motive"
                  value={a.sceneMotive || ""}
                  onChange={(v) => patchAttr(cid, "sceneMotive", v)}
                  placeholder="What they want right now"
                />
              </div>
              <div style={S.grid2}>
                <Field
                  label="Knowledge held"
                  value={a.knowledge || ""}
                  onChange={(v) => patchAttr(cid, "knowledge", v)}
                  placeholder="What they know here…"
                />
                <Field
                  label="Active beliefs"
                  value={a.beliefs || ""}
                  onChange={(v) => patchAttr(cid, "beliefs", v)}
                  placeholder="Truths they hold now…"
                />
                <Field
                  label="Secret in this scene"
                  value={a.secret || ""}
                  onChange={(v) => patchAttr(cid, "secret", v)}
                  placeholder="What they're hiding here…"
                />
                <Field
                  label="Trauma surfacing"
                  value={a.traumaActive || ""}
                  onChange={(v) => patchAttr(cid, "traumaActive", v)}
                  placeholder="Which wound is active?"
                />
              </div>
              <div style={S.grid2}>
                <Field
                  label="Before this event"
                  value={a.arcBefore || ""}
                  onChange={(v) => patchAttr(cid, "arcBefore", v)}
                  placeholder="Who they are walking in…"
                />
                <Field
                  label="After this event"
                  value={a.arcAfter || ""}
                  onChange={(v) => patchAttr(cid, "arcAfter", v)}
                  placeholder="How this changes them…"
                />
              </div>
              <Field
                label="AI narrator note"
                value={a.notes || ""}
                onChange={(v) => patchAttr(cid, "notes", v)}
                multi
                rows={2}
                placeholder="Private instruction. Subtext, what they can't say, how to betray the wound without naming it."
              />
            </div>
          );
        })}
      </Section>
    </div>
  );
}
