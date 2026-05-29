import { useParams } from "react-router-dom";
import { useSelector } from "@legendapp/state/react";
import { appStore } from "../store/appStore";
import { useCharacters, useActiveBookIdx } from "../hooks/useWorldStore";
import { S } from "../lib/utils";
import { Field } from "../components/ui";
import { CharacterAttrsBlock } from "../components/event/CharacterAttrsBlock";
import { SaveIcon, ScheduleIcon, CalendarTodayIcon, LocationOnIcon } from "../components/ui/icons";
import { useState, useEffect, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { EventAttributes, EventType } from "../lib/types";
import { EVENT_TYPES } from "../lib/constants";
import { useAnimateIn } from "../hooks/useAnimateIn";

interface EventForm {
  title: string;
  time: number;
  type: string;
  chapters: string;
  startDate: string;
  endDate: string;
  setting: string;
  description: string;
  consequence: string;
  characters: string[];
}

export default function EventPage() {
  const { id } = useParams();
  const characters = useCharacters();
  const bookIdx = useActiveBookIdx();

  const event = useSelector(() => {
    if (bookIdx < 0) return undefined;
    return appStore.books[bookIdx].events.get().find((e) => e.id === id);
  });
  const eventIdx = useSelector(() => {
    if (bookIdx < 0) return -1;
    return appStore.books[bookIdx].events.get().findIndex((e) => e.id === id);
  });

  const [charAttrs, setCharAttrs] = useState<Record<string, EventAttributes>>(
    {},
  );

  const { register, handleSubmit, control, reset, setValue, getValues } = useForm<EventForm>({
    defaultValues: {
      title: "",
      time: 1,
      type: "Story",
      chapters: "",
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
        chapters: (event.chapters || []).join("\n"),
        startDate: event.startDate || "",
        endDate: event.endDate || "",
        setting: event.setting || "",
        description: event.description || "",
        consequence: event.consequence || "",
        characters: event.characters || [],
      });
      const attrs: Record<string, EventAttributes> = {};
      if (bookIdx >= 0) {
        appStore.books[bookIdx].characters.get().forEach((c) => {
          if (c.attributes?.[event.id]) {
            attrs[c.id] = { ...c.attributes[event.id] };
          }
        });
      }
      setCharAttrs(attrs);
    }
  }, [event?.id, reset, bookIdx]);

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

  const onSubmit = (data: EventForm) => {
    if (bookIdx < 0) return;
    const ev = appStore.books[bookIdx].events[eventIdx];
    ev.title.set(data.title);
    ev.time.set(data.time);
    ev.type.set(data.type as EventType);
    ev.chapters.set(data.chapters.split("\n").map((s: string) => s.trim()).filter(Boolean));
    ev.startDate.set(data.startDate);
    ev.endDate.set(data.endDate);
    ev.setting.set(data.setting);
    ev.description.set(data.description);
    ev.consequence.set(data.consequence);
    ev.characters.set(data.characters);
    Object.entries(charAttrs).forEach(([cid, attrs]) => {
      const cIdx = appStore.books[bookIdx].characters.get().findIndex(
        (c) => c.id === cid,
      );
      if (cIdx >= 0) {
        const current = appStore.books[bookIdx].characters[cIdx].attributes.get();
        appStore.books[bookIdx].characters[cIdx].attributes.set({
          ...current,
          [event.id]: attrs,
        });
      }
    });
  };

  const formChars = useWatch({ control, name: "characters" }) || [];

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
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <SaveIcon sx={{ fontSize: 12 }} />save
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
          <label style={S.label}><ScheduleIcon sx={{ fontSize: 10, marginRight: 3, verticalAlign: "middle" }} />Time</label>
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
          label="Chapters (one per line)"
          name="chapters"
          control={control}
          multi
          rows={3}
          placeholder="3&#10;Prologue&#10;7"
        />
        <div>
          <label style={S.label}><CalendarTodayIcon sx={{ fontSize: 10, marginRight: 3, verticalAlign: "middle" }} />Start</label>
          <input
            type="datetime-local"
            {...register("startDate")}
            style={{ ...S.input, width: "100%", fontSize: 12 }}
          />
        </div>
        <div>
          <label style={S.label}><CalendarTodayIcon sx={{ fontSize: 10, marginRight: 3, verticalAlign: "middle" }} />End</label>
          <input
            type="datetime-local"
            {...register("endDate")}
            style={{ ...S.input, width: "100%", fontSize: 12 }}
          />
        </div>
      </div>

      <Field
        label={<><LocationOnIcon sx={{ fontSize: 10, marginRight: 3, verticalAlign: "middle" }} />Setting / location</>}
        name="setting"
        control={control}
        placeholder="Where and what it feels like here…"
      />
      <Field
        label="What happens"
        name="description"
        control={control}
        multi
        rows={3}
      />
      <Field
        label="Consequence / after-effects"
        name="consequence"
        control={control}
        multi
        rows={2}
      />

      <CharacterAttrsBlock
        characters={characters}
        selectedIds={formChars}
        charAttrs={charAttrs}
        onToggle={toggleChar}
        onPatchAttr={patchAttr}
      />
    </div>
  );
}
