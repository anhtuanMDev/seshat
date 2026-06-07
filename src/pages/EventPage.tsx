import { useParams } from "react-router-dom";
import { useSelector } from "@legendapp/state/react";
import { appStore } from "../store/appStore";
import { showToast } from "../store/toastStore";
import { updateFileOnGitHub } from "../lib/githubSync";
import {
  useCharacters,
  useActiveBookIdx,
  useChapters,
} from "../hooks/useWorldStore";
import { S } from "../lib/utils";
import { Field } from "../components/ui";
import { CharacterAttrsBlock } from "../components/event/CharacterAttrsBlock";
import {
  SaveIcon,
  ScheduleIcon,
  CalendarTodayIcon,
  LocationOnIcon,
  AutoStoriesIcon,
} from "../components/ui/icons";
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
  subplot: string;
}

export default function EventPage() {
  const { id } = useParams();
  const characters = useCharacters();
  const bookIdx = useActiveBookIdx();
  const allChapters = useChapters();

  const linkedChapters = allChapters.filter((c) =>
    c.pinnedEventIds?.includes(id!),
  );

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
  const [isAttrsDirty, setIsAttrsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    control,
    reset,
    setValue,
    getValues,
    formState: { isDirty },
  } = useForm<EventForm>({
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
      subplot: "",
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
        subplot: event.subplot || "",
      });
      const attrs: Record<string, EventAttributes> = {};
      if (bookIdx >= 0) {
        appStore.books[bookIdx].characters.get().forEach((c) => {
          if (c.attributes?.[event.id]) {
            attrs[c.id] = { ...c.attributes[event.id] };
          }
        });
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCharAttrs(attrs);
      setIsAttrsDirty(false);
    }
  }, [event, event?.id, reset, bookIdx]);

  const ref = useAnimateIn();

  const toggleChar = useCallback(
    (cid: string) => {
      const current = getValues("characters");
      const updated = current.includes(cid)
        ? current.filter((x: string) => x !== cid)
        : [...current, cid];
      setValue("characters", updated);
    },
    [getValues, setValue],
  );

  const patchAttr = useCallback((cid: string, f: string, v: string) => {
    setCharAttrs((prev) => ({
      ...prev,
      [cid]: { ...prev[cid], [f]: v },
    }));
    setIsAttrsDirty(true);
  }, []);

  const formChars = useWatch({ control, name: "characters" }) || [];

  if (!event)
    return (
      <div style={{ padding: "40px", color: "var(--text-secondary)" }}>
        Event not found.
      </div>
    );

  const onSubmit = async () => {
    const data = getValues();
    if (bookIdx < 0 || eventIdx < 0) return;
    const ev = appStore.books[bookIdx].events[eventIdx];
    ev.title.set(data.title);
    ev.time.set(data.time);
    ev.type.set(data.type as EventType);
    ev.chapters.set(
      data.chapters
        .split("\n")
        .map((s: string) => s.trim())
        .filter(Boolean),
    );
    ev.startDate.set(data.startDate);
    ev.endDate.set(data.endDate);
    ev.setting.set(data.setting);
    ev.description.set(data.description);
    ev.consequence.set(data.consequence);
    ev.characters.set(data.characters);
    ev.subplot.set(data.subplot);
    Object.entries(charAttrs).forEach(([cid, attrs]) => {
      const cIdx = appStore.books[bookIdx].characters
        .get()
        .findIndex((c) => c.id === cid);
      if (cIdx >= 0) {
        const current =
          appStore.books[bookIdx].characters[cIdx].attributes.get();
        appStore.books[bookIdx].characters[cIdx].attributes.set({
          ...current,
          [event.id]: attrs,
        });
      }
    });

    // API delta sync
    const token =
      localStorage.getItem("seshat-auth-token") ||
      sessionStorage.getItem("seshat-auth-token");
    const bookId = appStore.activeBookId.get();
    if (token && id && bookId) {
      try {
        setIsSaving(true);
        const payload = {
          id: id,
          title: data.title,
          time: data.time,
          type: data.type,
          chapters: data.chapters
            .split("\n")
            .map((s: string) => s.trim())
            .filter(Boolean),
          startDate: data.startDate,
          endDate: data.endDate,
          setting: data.setting,
          description: data.description,
          consequence: data.consequence,
          characters: data.characters,
          subplot: data.subplot,
        };
        await updateFileOnGitHub(
          token,
          bookId,
          `events/event_${id}.json`,
          JSON.stringify(payload, null, 2),
        );
        showToast("Event synced to cloud", "success");
        reset(data);
        setIsAttrsDirty(false);
      } catch {
        showToast("Failed to sync event to cloud", "error");
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div ref={ref} className="seshat-page-container">
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
          onClick={onSubmit}
          title="Save changes"
          disabled={(!isDirty && !isAttrsDirty) || isSaving}
          style={{
            ...S.ghost,
            fontSize: 11,
            letterSpacing: 1,
            color: "var(--color-green)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 3,
            opacity: (!isDirty && !isAttrsDirty) || isSaving ? 0.5 : 1,
            cursor:
              (!isDirty && !isAttrsDirty) || isSaving ? "default" : "pointer",
          }}
        >
          <SaveIcon sx={{ fontSize: 12 }} />
          {isSaving ? "saving..." : "save"}
        </button>
      </div>

      <div className="seshat-event-meta-grid">
        <div>
          <label style={S.label}>
            <ScheduleIcon
              sx={{ fontSize: 10, marginRight: 3, verticalAlign: "middle" }}
            />
            Time
          </label>
          <input
            type="number"
            {...register("time", { valueAsNumber: true })}
            style={{ ...S.input, width: 52 }}
          />
        </div>
        <div>
          <label style={S.label}>Type</label>
          <select {...register("type")} style={S.select}>
            {EVENT_TYPES.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={S.label}>
            <AutoStoriesIcon
              sx={{ fontSize: 10, marginRight: 3, verticalAlign: "middle" }}
            />
            Chapters
          </label>
          <div
            style={{
              ...S.input,
              minHeight: 68,
              fontSize: 12,
              padding: "8px 12px",
              background: "transparent",
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {linkedChapters.length > 0 ? (
              linkedChapters.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--color-blue)",
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: "bold" }}>
                    {c.number}
                  </span>
                  <span
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.title}
                  </span>
                </div>
              ))
            ) : (
              <span style={{ color: "var(--text-muted)" }}>
                Not pinned to any chapters
              </span>
            )}

            <input
              {...register("chapters")}
              placeholder="Or type manually..."
              style={{
                ...S.input,
                border: "none",
                padding: "4px 0",
                marginTop: "auto",
                fontSize: 11,
                background: "transparent",
              }}
            />
          </div>
        </div>
        <div>
          <label style={S.label}>
            <CalendarTodayIcon
              sx={{ fontSize: 10, marginRight: 3, verticalAlign: "middle" }}
            />
            Start
          </label>
          <input
            type="datetime-local"
            {...register("startDate")}
            style={{ ...S.input, width: "100%", fontSize: 12 }}
          />
        </div>
        <div>
          <label style={S.label}>
            <CalendarTodayIcon
              sx={{ fontSize: 10, marginRight: 3, verticalAlign: "middle" }}
            />
            End
          </label>
          <input
            type="datetime-local"
            {...register("endDate")}
            style={{ ...S.input, width: "100%", fontSize: 12 }}
          />
        </div>
        <div>
          <label style={S.label}>Subplot</label>
          <input
            {...register("subplot")}
            placeholder="e.g. A-Plot, B-Plot"
            style={{ ...S.input, width: "100%", fontSize: 12 }}
          />
        </div>
      </div>

      <Field
        label={
          <>
            <LocationOnIcon
              sx={{ fontSize: 10, marginRight: 3, verticalAlign: "middle" }}
            />
            Setting / location
          </>
        }
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
