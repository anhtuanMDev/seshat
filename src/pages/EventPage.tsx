import { useParams } from "react-router-dom";
import { MenuItem } from "@mui/material";
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
  LocationOnIcon,
  AutoStoriesIcon,
  InfoIcon,
} from "../components/ui/icons";
import { Modal } from "../components/ui/Modal";
import { useState, useEffect, useCallback, useRef } from "react";
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

const formatDatetimeLocal = (val?: string) => {
  if (!val) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val)) return val;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  } catch {
    return "";
  }
};

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

  const lastEventIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (event) {
      const isDifferentEvent = lastEventIdRef.current !== event.id;
      lastEventIdRef.current = event.id;

      if (isDifferentEvent || (!isDirty && !isAttrsDirty)) {
        // Derive linked chapters STRICTLY from Chapter.timeRef (Takes Place At)
        const validLinkedIds = allChapters
          .filter((c) => c.timeRef === event.id)
          .map((c) => c.id);

        reset({
          title: event.title || "",
          time: event.time,
          type: event.type,
          chapters: validLinkedIds,
          startDate: formatDatetimeLocal(event.startDate),
          endDate: formatDatetimeLocal(event.endDate),
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
        setCharAttrs(attrs);
        setIsAttrsDirty(false);
      }
    }
  }, [event, event?.id, reset, bookIdx, allChapters, isDirty, isAttrsDirty]);

  const ref = useAnimateIn();
  const [isFloating, setIsFloating] = useState(false);

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

  const [showInfoModal, setShowInfoModal] = useState(false);

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
      <div style={styles.notFoundWrapper}>
        Event not found.
      </div>
    );

  const onSubmit = async () => {
    const data = getValues();
    if (bookIdx < 0 || eventIdx < 0) return;
    const ev = appStore.books[bookIdx].events[eventIdx];
    ev.title.set(data.title);
    ev.time.set(Number(data.time) || 0);
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
          time: Number(data.time) || 0,
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

  const setStartToNow = () => {
    setValue("startDate", formatDatetimeLocal(new Date().toISOString()), {
      shouldDirty: true,
    });
  };

  const copyEndToStart = () => {
    const val = getValues("endDate");
    if (val) setValue("startDate", val, { shouldDirty: true });
  };

  const addHourToEnd = () => {
    const base = getValues("startDate") || getValues("endDate") || new Date().toISOString();
    const d = new Date(base);
    d.setHours(d.getHours() + 1);
    setValue("endDate", formatDatetimeLocal(d.toISOString()), { shouldDirty: true });
  };

  const addThreeHoursToEnd = () => {
    const base = getValues("startDate") || getValues("endDate") || new Date().toISOString();
    const d = new Date(base);
    d.setHours(d.getHours() + 3);
    setValue("endDate", formatDatetimeLocal(d.toISOString()), { shouldDirty: true });
  };

  const addDayToEnd = () => {
    const base = getValues("startDate") || getValues("endDate") || new Date().toISOString();
    const d = new Date(base);
    d.setDate(d.getDate() + 1);
    setValue("endDate", formatDatetimeLocal(d.toISOString()), { shouldDirty: true });
  };

  const copyStartToEnd = () => {
    const val = getValues("startDate");
    if (val) setValue("endDate", val, { shouldDirty: true });
  };

  const getSaveBtnStyle = (active: boolean) => {
    if (active) {
      return {
        background: "var(--color-green)",
        color: "var(--bg-app)",
        border: "none",
        borderRadius: 4,
        padding: "6px 14px",
        fontSize: 12,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 6,
        cursor: isSaving ? "default" : "pointer" as const,
        opacity: isSaving ? 0.7 : 1,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      };
    }
    return {
      ...S.ghost,
      fontSize: 12,
      letterSpacing: 1,
      color: "var(--color-green)",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      gap: 4,
      opacity: 0.5,
      cursor: "default" as const,
    };
  };

  return (
    <>
      <div
        ref={ref}
        className="seshat-page-container"
        onScroll={(e) => setIsFloating(e.currentTarget.scrollTop > 80)}
      >
        <div className="seshat-flex-between" style={styles.headerRow}>
          <input
            {...register("title")}
            style={styles.titleInput}
          />
          <button
            onClick={onSubmit}
            title="Save changes"
            disabled={(!isDirty && !isAttrsDirty) || isSaving}
            style={getSaveBtnStyle(isDirty || isAttrsDirty)}
          >
            <SaveIcon sx={{ fontSize: 14 }} />
            {isSaving ? "saving..." : "save"}
          </button>
        </div>

        <div className="seshat-event-meta-grid">
          <Field
            label="Time"
            name="time"
            control={control}
            type="number"
          />

          <Field
            select
            label="Type"
            name="type"
            control={control}
          >
            {EVENT_TYPES.map((o) => (
              <MenuItem key={o} value={o}>
                {o}
              </MenuItem>
            ))}
          </Field>

          <div>
            <Field
              label="Start Date"
              name="startDate"
              control={control}
              type="datetime-local"
            />
            <div className="seshat-date-shortcuts">
              <button
                type="button"
                className="seshat-date-shortcut-btn"
                onClick={setStartToNow}
              >
                Now
              </button>
              <button
                type="button"
                className="seshat-date-shortcut-btn"
                onClick={copyEndToStart}
              >
                Copy End
              </button>
            </div>
          </div>

          <div>
            <Field
              label="End Date"
              name="endDate"
              control={control}
              type="datetime-local"
            />
            <div className="seshat-date-shortcuts">
              <button
                type="button"
                className="seshat-date-shortcut-btn"
                onClick={addHourToEnd}
              >
                +1h
              </button>
              <button
                type="button"
                className="seshat-date-shortcut-btn"
                onClick={addThreeHoursToEnd}
              >
                +3h
              </button>
              <button
                type="button"
                className="seshat-date-shortcut-btn"
                onClick={addDayToEnd}
              >
                +1d
              </button>
              <button
                type="button"
                className="seshat-date-shortcut-btn"
                onClick={copyStartToEnd}
              >
                Copy Start
              </button>
            </div>
          </div>

          <Field
            label="Subplot"
            name="subplot"
            control={control}
            placeholder="e.g. A-Plot, B-Plot"
          />
        </div>

        <Section
          title={
            <div className="seshat-flex-align">
              <AutoStoriesIcon sx={{ fontSize: 12, marginRight: 4 }} />
              Chapters
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInfoModal(true);
                }}
                style={styles.infoIconBtn}
                title="How does Chapter Sync work?"
              >
                <InfoIcon sx={{ fontSize: 14, color: "var(--color-blue)" }} />
              </button>
            </div>
          }
          defaultOpen={true}
        >
          <div style={styles.chaptersCard}>
            <span style={styles.chaptersCardSubText}>
              Chapters that take place during this event. To change this, edit
              the chapter's "Takes Place At" field.
            </span>
            {formChapters.length > 0 ? (
              <div style={styles.chaptersList}>
                {allChapters
                  .filter((c) => formChapters.includes(c.id))
                  .map((c) => (
                    <div key={c.id} style={styles.chapterPill}>
                      <span style={styles.chapterNumber}>{c.number}</span>
                      {c.title && (
                        <span style={styles.chapterTitle}>{c.title}</span>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <span style={styles.noChaptersText}>
                No chapters take place here yet.
              </span>
            )}
          </div>

          {showInfoModal && (
            <Modal
              title="Smart Character Sync"
              onClose={() => setShowInfoModal(false)}
            >
              <div style={styles.modalBody}>
                <p style={styles.modalParagraph}>
                  <strong>Auto-Add:</strong> When you pin a chapter to this
                  event, all characters currently present in that chapter are
                  automatically added to the event.
                </p>
                <p style={styles.modalParagraph}>
                  <strong>Clever Auto-Remove:</strong> If you unpin a chapter,
                  the system will look for characters that belonged{" "}
                  <em>exclusively</em> to that chapter.
                </p>
                <p style={styles.modalParagraph}>
                  Before removing an exclusive character, the system checks if
                  you have actively planned for them in this event (e.g., set
                  their "Motive", "Emotional State", or "Power Tier").
                </p>
                <div style={styles.modalTldr}>
                  <strong>TL;DR:</strong> If a character's attributes are
                  entirely blank, they will be safely auto-cleaned. If you've
                  modified their event attributes, they are protected from
                  auto-removal, preserving your manual planning!
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button
                  type="button"
                  style={styles.modalGotItBtn}
                  onClick={() => setShowInfoModal(false)}
                >
                  Got it
                </button>
              </div>
            </Modal>
          )}
        </Section>

        <Field
          label={
            <>
              <LocationOnIcon sx={styles.metaIcon} />
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

      {isFloating && (
        <div className="seshat-chapter-toolbar floating">
          <button
            disabled={(!isDirty && !isAttrsDirty) || isSaving}
            onClick={onSubmit}
            title="Save changes"
            style={getSaveBtnStyle(isDirty || isAttrsDirty)}
          >
            <SaveIcon sx={{ fontSize: 14 }} />
            {isSaving ? "saving..." : "save"}
          </button>
        </div>
      )}
    </>
  );
}

const styles = {
  notFoundWrapper: {
    padding: "40px",
    color: "var(--text-secondary)",
  },
  headerRow: {
    marginBottom: "var(--space-4)",
    gap: "var(--space-4)",
  },
  titleInput: {
    ...S.input,
    fontSize: 28,
    fontFamily: "var(--font-serif)",
    border: "none",
    padding: 0,
    flex: 1,
    color: "var(--text-primary)",
  },
  metaIcon: {
    fontSize: 10,
    marginRight: 3,
    verticalAlign: "middle",
  },
  infoIconBtn: {
    ...S.ghost,
    padding: "0 4px",
    marginLeft: 8,
    height: 20,
  },
  chaptersCard: {
    ...S.input,
    minHeight: 48,
    fontSize: 12,
    padding: "12px",
    background: "transparent",
    border: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
  },
  chaptersCardSubText: {
    fontSize: 10,
    color: "var(--text-muted)",
    marginBottom: 8,
    fontStyle: "italic",
  },
  chaptersList: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 6,
  },
  chapterPill: {
    ...S.pill,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 8px",
    color: "var(--color-blue)",
    borderColor: "var(--color-blue)",
    background: "rgba(0, 153, 255, 0.05)",
  },
  chapterNumber: {
    fontSize: 11,
    fontWeight: "bold",
  },
  chapterTitle: {
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 150,
    fontSize: 11,
  },
  modalBody: {
    fontSize: 13,
    lineHeight: 1.6,
    color: "var(--text-secondary)",
  },
  modalParagraph: {
    marginBottom: 12,
  },
  modalTldr: {
    ...S.pill,
    background: "rgba(0, 153, 255, 0.05)",
    borderColor: "var(--color-blue)",
    color: "var(--text-primary)",
    display: "inline-block",
    marginTop: 8,
  },
  modalFooter: {
    marginTop: 24,
    textAlign: "right" as const,
  },
  noChaptersText: {
    color: "var(--text-muted)",
  },
  modalGotItBtn: {
    ...S.button,
    padding: "6px 16px",
  },
} satisfies Record<string, React.CSSProperties>;
