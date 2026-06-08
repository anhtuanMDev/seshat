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
import { Field, Section } from "../components/ui";
import { CharacterAttrsBlock } from "../components/event/CharacterAttrsBlock";
import {
  SaveIcon,
  ScheduleIcon,
  CalendarTodayIcon,
  LocationOnIcon,
  AutoStoriesIcon,
  AddIcon,
  CloseIcon,
  InfoIcon,
} from "../components/ui/icons";
import { Modal } from "../components/ui/Modal";
import { ContextTag } from "../components/chapter/ContextTag";
import { useState, useEffect, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { EventAttributes, EventType } from "../lib/types";
import { EVENT_TYPES } from "../lib/constants";
import { useAnimateIn } from "../hooks/useAnimateIn";

interface EventForm {
  title: string;
  time: number;
  type: string;
  chapters: string[];
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
      chapters: [],
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
      // Derive valid linked chapters from both Event.chapters and Chapter.pinnedEventIds
      // To ensure backward compatibility, we'll favor whatever is currently linked.
      const validLinkedIds = allChapters
        .filter((c) => c.pinnedEventIds?.includes(event.id) || event.chapters?.includes(c.id) || c.timeRef === event.id)
        .map((c) => c.id);

      reset({
        title: event.title || "",
        time: event.time,
        type: event.type,
        chapters: validLinkedIds,
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
  }, [event, event?.id, reset, bookIdx, allChapters]);

  const ref = useAnimateIn();

  const toggleChar = useCallback(
    (cid: string) => {
      const current = getValues("characters");
      const updated = current.includes(cid)
        ? current.filter((x: string) => x !== cid)
        : [...current, cid];
      setValue("characters", updated, { shouldDirty: true });
    },
    [getValues, setValue],
  );

  const toggleChapter = useCallback(
    (chId: string) => {
      const currentChapters = getValues("chapters") || [];
      const currentChars = getValues("characters") || [];
      const isRemoving = currentChapters.includes(chId);

      let nextChapters: string[];
      let nextChars = [...currentChars];

      if (isRemoving) {
        nextChapters = currentChapters.filter((x: string) => x !== chId);

        // Auto-remove logic
        const removedChapter = allChapters.find((c) => c.id === chId);
        if (removedChapter && removedChapter.pinnedChars) {
          const removedCharIds = removedChapter.pinnedChars;
          
          const remainingCharsFromChapters = new Set<string>();
          nextChapters.forEach((id) => {
            const c = allChapters.find((x) => x.id === id);
            if (c && c.pinnedChars) {
              c.pinnedChars.forEach((charId: string) => remainingCharsFromChapters.add(charId));
            }
          });

          removedCharIds.forEach((charId: string) => {
            if (!remainingCharsFromChapters.has(charId)) {
              // Clever Rule: Only remove if they haven't explicitly set attributes for this character in this event!
              const attrs = charAttrs[charId];
              const hasMeaningfulAttrs = attrs && Object.values(attrs).some(v => v !== "" && v !== undefined && v !== null);
              
              if (!hasMeaningfulAttrs) {
                nextChars = nextChars.filter((id) => id !== charId);
              }
            }
          });
        }
      } else {
        nextChapters = [...currentChapters, chId];

        // Auto-add logic
        const addedChapter = allChapters.find((c) => c.id === chId);
        if (addedChapter && addedChapter.pinnedChars) {
          addedChapter.pinnedChars.forEach((charId: string) => {
            if (!nextChars.includes(charId)) {
              nextChars.push(charId);
            }
          });
        }
      }

      setValue("chapters", nextChapters, { shouldDirty: true });
      if (nextChars.length !== currentChars.length) {
        setValue("characters", nextChars, { shouldDirty: true });
      }
    },
    [getValues, setValue, allChapters, charAttrs],
  );

  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [chapterInput, setChapterInput] = useState("");

  const patchAttr = useCallback((cid: string, f: string, v: string) => {
    setCharAttrs((prev) => ({
      ...prev,
      [cid]: { ...prev[cid], [f]: v },
    }));
    setIsAttrsDirty(true);
  }, []);

  const formChars = useWatch({ control, name: "characters" }) || [];
  const formChapters = useWatch({ control, name: "chapters" }) || [];

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
    ev.chapters.set(data.chapters);
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

    const updatedChapterIds = new Set<string>();
    appStore.books[bookIdx].chapters.get().forEach((ch, cIdx) => {
      const isLinked = data.chapters.includes(ch.id);
      const currentlyPinned = ch.pinnedEventIds?.includes(event.id);
      const currentlyTakesPlaceAt = ch.timeRef === event.id;
      
      if (isLinked && !currentlyPinned && !currentlyTakesPlaceAt) {
        appStore.books[bookIdx].chapters[cIdx].pinnedEventIds.set((prev) => [...(prev || []), event.id]);
        updatedChapterIds.add(ch.id);
      } else if (!isLinked) {
        if (currentlyPinned) {
          appStore.books[bookIdx].chapters[cIdx].pinnedEventIds.set((prev) => (prev || []).filter(eId => eId !== event.id));
          updatedChapterIds.add(ch.id);
        }
        if (currentlyTakesPlaceAt) {
          appStore.books[bookIdx].chapters[cIdx].timeRef.set("");
          updatedChapterIds.add(ch.id);
        }
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
          chapters: data.chapters,
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

        for (const chId of updatedChapterIds) {
          const chIdx = appStore.books[bookIdx].chapters.get().findIndex(c => c.id === chId);
          if (chIdx >= 0) {
            await updateFileOnGitHub(
              token,
              bookId,
              `chapters/chapter_${chId}.json`,
              JSON.stringify(appStore.books[bookIdx].chapters[chIdx].get(), null, 2)
            );
          }
        }

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

      <Section 
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <AutoStoriesIcon sx={{ fontSize: 12, marginRight: 4 }} />
            Chapters
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); setShowInfoModal(true); }}
              style={{ ...S.ghost, padding: "0 4px", marginLeft: 8, height: 20 }}
              title="How does Chapter Sync work?"
            >
              <InfoIcon sx={{ fontSize: 14, color: "var(--color-blue)" }} />
            </button>
          </div>
        } 
        defaultOpen={true}
      >
        <div
          style={{
            ...S.input,
            minHeight: 48,
            fontSize: 12,
            padding: "12px",
            background: "transparent",
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {formChapters.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {allChapters.filter(c => formChapters.includes(c.id)).map((c) => (
                <div
                  key={c.id}
                  style={{
                    ...S.pill,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                    color: "var(--color-blue)",
                    borderColor: "var(--color-blue)",
                    background: "rgba(0, 153, 255, 0.05)",
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: "bold" }}>
                    {c.number}
                  </span>
                  {c.title && (
                    <span
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 120,
                        fontSize: 11,
                      }}
                    >
                      {c.title}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); toggleChapter(c.id); }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "0",
                      marginLeft: 4,
                      display: "flex",
                      alignItems: "center",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-red)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
                    title="Unpin chapter"
                  >
                    <CloseIcon sx={{ fontSize: 12 }} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <span style={{ color: "var(--text-muted)", marginBottom: 8 }}>
              Not pinned to any chapters
            </span>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto" }}>
            <input
              list="unpinned-chapters"
              value={chapterInput}
              onChange={(e) => {
                setChapterInput(e.target.value);
                const match = allChapters.find(c => c.title?.toLowerCase() === e.target.value.toLowerCase() || c.number?.toLowerCase() === e.target.value.toLowerCase());
                if (match && !formChapters.includes(match.id)) {
                  toggleChapter(match.id);
                  setChapterInput("");
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && chapterInput.trim() !== "") {
                  e.preventDefault();
                  const partial = allChapters.find(c => c.title?.toLowerCase().includes(chapterInput.toLowerCase()) || c.number?.toLowerCase().includes(chapterInput.toLowerCase()));
                  if (partial && !formChapters.includes(partial.id)) {
                    toggleChapter(partial.id);
                    setChapterInput("");
                  }
                }
              }}
              placeholder="Quick pin chapter..."
              style={{ ...S.input, flex: 1, padding: "4px 6px", fontSize: 11, background: "transparent", border: "none" }}
            />
            <datalist id="unpinned-chapters">
              {allChapters.filter(c => !formChapters.includes(c.id)).map(c => <option key={c.id} value={c.title || c.number} />)}
            </datalist>
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); setShowChapterModal(true); }}
              style={{ ...S.ghost, padding: "4px" }}
              title="Pin multiple chapters"
            >
              <AddIcon sx={{ fontSize: 14 }} />
            </button>
          </div>
          
          {showChapterModal && (
            <Modal title="Pin Chapters" onClose={() => setShowChapterModal(false)}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {allChapters.map((c) => (
                  <ContextTag
                    key={c.id}
                    label={c.title || c.number}
                    color="var(--color-blue)"
                    active={formChapters.includes(c.id)}
                    onClick={() => toggleChapter(c.id)}
                  />
                ))}
                {!allChapters.length && <p style={S.dim}>No chapters available.</p>}
              </div>
              <div style={{ marginTop: 24, textAlign: "right" }}>
                <button type="button" style={{ ...S.button, padding: "6px 16px" }} onClick={() => setShowChapterModal(false)}>
                  Done
                </button>
              </div>
            </Modal>
          )}

          {showInfoModal && (
            <Modal title="Smart Character Sync" onClose={() => setShowInfoModal(false)}>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)" }}>
                <p style={{ marginBottom: 12 }}>
                  <strong>Auto-Add:</strong> When you pin a chapter to this event, all characters currently present in that chapter are automatically added to the event.
                </p>
                <p style={{ marginBottom: 12 }}>
                  <strong>Clever Auto-Remove:</strong> If you unpin a chapter, the system will look for characters that belonged <em>exclusively</em> to that chapter. 
                </p>
                <p style={{ marginBottom: 12 }}>
                  Before removing an exclusive character, the system checks if you have actively planned for them in this event (e.g., set their "Motive", "Emotional State", or "Power Tier"). 
                </p>
                <div style={{ ...S.pill, background: "rgba(0, 153, 255, 0.05)", borderColor: "var(--color-blue)", color: "var(--text-primary)", display: "inline-block", marginTop: 8 }}>
                  <strong>TL;DR:</strong> If a character's attributes are entirely blank, they will be safely auto-cleaned. If you've modified their event attributes, they are protected from auto-removal, preserving your manual planning!
                </div>
              </div>
              <div style={{ marginTop: 24, textAlign: "right" }}>
                <button type="button" style={{ ...S.button, padding: "6px 16px" }} onClick={() => setShowInfoModal(false)}>
                  Got it
                </button>
              </div>
            </Modal>
          )}
        </div>
      </Section>

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
