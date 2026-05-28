import { useParams } from "react-router-dom";
import { useSelector } from "@legendapp/state/react";
import { worldStore } from "../store/worldStore";
import { useEvents, useCharacters } from "../hooks/useWorldStore";
import { S } from "../lib/utils";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { useState, useRef, useEffect, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { Character, Event } from "../lib/types";
import RichEditor from "../components/editor/RichEditor";

interface ChapterForm {
  number: string;
  title: string;
  timeRef: string;
  synopsis: string;
  body: string;
  notes: string;
}

/* ── word / char count ───────────────────────────────────────────────────── */
function countWords(text: string) {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

/* ── tiny inline toolbar ─────────────────────────────────────────────────── */
function ContextTag({
  label,
  color,
  onClick,
  active,
}: {
  label: string;
  color?: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11,
        padding: "3px 10px",
        borderRadius: 3,
        border: `1px solid ${active ? color || "var(--color-purple)" : "var(--border)"}`,
        background: active
          ? `${color || "var(--color-purple)"}18`
          : "transparent",
        color: active ? color || "var(--color-purple)" : "var(--text-muted)",
        cursor: "pointer",
        fontFamily: "Georgia, serif",
        letterSpacing: 0.5,
        transition: "all 0.12s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

/* ── character quick-ref card ────────────────────────────────────────────── */
function CharCard({ char, events }: { char: Character; events: Event[] }) {
  const [open, setOpen] = useState(false);
  const latestEvent = [...events]
    .sort((a, b) => b.time - a.time)
    .find((e) => (e.characters || []).includes(char.id));
  const attr = latestEvent ? char.attributes?.[latestEvent.id] || {} : {};

  return (
    <div
      style={{
        marginBottom: 10,
        borderLeft: `2px solid ${char.color}`,
        paddingLeft: 10,
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "Georgia, serif",
          fontSize: 12,
          color: char.color,
          padding: 0,
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 9, color: "var(--text-muted)" }}>
          {open ? "▾" : "▸"}
        </span>
        {char.name}
        {char.role && (
          <span
            style={{
              color: "var(--text-muted)",
              fontStyle: "italic",
              fontSize: 11,
            }}
          >
            — {char.role}
          </span>
        )}
      </button>
      {open && (
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          {char.coreWound && (
            <p style={{ margin: "2px 0" }}>
              <span style={{ color: "var(--text-muted)" }}>wound:</span>{" "}
              {char.coreWound}
            </p>
          )}
          {char.coreFear && (
            <p style={{ margin: "2px 0" }}>
              <span style={{ color: "var(--text-muted)" }}>fear:</span>{" "}
              {char.coreFear}
            </p>
          )}
          {char.coreDesire && (
            <p style={{ margin: "2px 0" }}>
              <span style={{ color: "var(--text-muted)" }}>desire:</span>{" "}
              {char.coreDesire}
            </p>
          )}
          {char.secrets && (
            <p style={{ margin: "2px 0" }}>
              <span style={{ color: "var(--text-muted)" }}>secret:</span>{" "}
              {char.secrets}
            </p>
          )}
          {attr.power && (
            <p style={{ margin: "4px 0 2px" }}>
              <span style={{ color: "var(--text-muted)" }}>now:</span>{" "}
              {attr.power}
              {attr.arcStage ? ` · ${attr.arcStage}` : ""}
            </p>
          )}
          {attr.emotionalState && (
            <p style={{ margin: "2px 0" }}>
              <span style={{ color: "var(--text-muted)" }}>feeling:</span>{" "}
              {attr.emotionalState}
            </p>
          )}
          {(char.traumas || []).length > 0 && (
            <p style={{ margin: "2px 0" }}>
              <span style={{ color: "var(--text-muted)" }}>traumas:</span>{" "}
              {char.traumas
                .map((t) => t.title)
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── event quick-ref ─────────────────────────────────────────────────────── */
function EventRef({ event }: { event: Event }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        marginBottom: 8,
        paddingLeft: 10,
        borderLeft: "2px solid var(--border)",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "Georgia, serif",
          fontSize: 12,
          color: "var(--text-primary)",
          padding: 0,
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 9, color: "var(--text-muted)" }}>
          {open ? "▾" : "▸"}
        </span>
        <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
          T{event.time}
        </span>
        {event.title}
      </button>
      {open && (
        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          {event.setting && (
            <p style={{ margin: "2px 0" }}>
              <span style={{ color: "var(--text-muted)" }}>where:</span>{" "}
              {event.setting}
            </p>
          )}
          {event.description && (
            <p style={{ margin: "2px 0" }}>{event.description}</p>
          )}
          {event.consequence && (
            <p style={{ margin: "2px 0" }}>
              <span style={{ color: "var(--text-muted)" }}>→</span>{" "}
              {event.consequence}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── main page ───────────────────────────────────────────────────────────── */
export default function ChapterPage() {
  const { id } = useParams();
  const events = useEvents();
  const characters = useCharacters();

  const chapter = useSelector(() =>
    worldStore.chapters?.get()?.find(
      (c) => c.id === id,
    ),
  );
  const chapterIdx = useSelector(
    () =>
      worldStore.chapters?.get()?.findIndex(
        (c) => c.id === id,
      ) ?? -1,
  );

  const { register, handleSubmit, control, reset, setValue } = useForm<ChapterForm>({
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
  }, [chapter?.id, reset]);

  const ref = useAnimateIn();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // panel state
  const [showPanel, setShowPanel] = useState(true);
  const [panelTab, setPanelTab] = useState<"chars" | "events" | "world">(
    "chars",
  );
  const [focusMode, setFocusMode] = useState(false);

  // pinned chars/events for this chapter
  const [pinnedChars, setPinnedChars] = useState<string[]>([]);
  const [pinnedEvents, setPinnedEvents] = useState<string[]>([]);

  // auto-grow textarea
  const autoGrow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, []);

  const body = useWatch({ control, name: "body" });
  const bodyRegister = register("body");

  useEffect(() => {
    autoGrow();
  }, [body, autoGrow]);

  if (!chapter) {
    return (
      <div style={{ padding: "40px", color: "var(--text-secondary)" }}>
        Chapter not found.
      </div>
    );
  }

  const onSubmit = (data: ChapterForm) => {
    const ch = worldStore.chapters[chapterIdx];
    ch.number.set(data.number);
    ch.title.set(data.title);
    ch.timeRef.set(data.timeRef);
    ch.synopsis.set(data.synopsis);
    ch.body.set(data.body);
    ch.notes.set(data.notes);
  };

  const words = countWords(body || "");
  const pinnedCharObjs = characters.filter((c: Character) =>
    pinnedChars.includes(c.id),
  );
  const pinnedEventObjs = events
    .filter((e: Event) => pinnedEvents.includes(e.id))
    .sort((a: Event, b: Event) => a.time - b.time);

  const sortedEvents = [...events].sort((a, b) => a.time - b.time);

  const worldData = {
    synopsis: worldStore.synopsis.get(),
    setting: worldStore.setting.get(),
    themes: worldStore.themes.get(),
    rules: worldStore.rules.get(),
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
      {/* ── Writing area ── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          paddingRight: showPanel && !focusMode ? 24 : 0,
          transition: "padding 0.2s",
        }}
      >
        {/* Header row */}
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
            {/* Chapter label */}
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
            {/* Title */}
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

          {/* Toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
              paddingTop: 28,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                letterSpacing: 1,
              }}
            >
              {words.toLocaleString()} w
            </span>
            <button
              onClick={handleSubmit(onSubmit)}
              title="Save changes"
              style={{
                ...S.ghost,
                fontSize: 11,
                letterSpacing: 1,
                color: "var(--color-green)",
              }}
            >
              save
            </button>
            <button
              onClick={() => setFocusMode((f) => !f)}
              title="Focus mode"
              style={{
                ...S.ghost,
                fontSize: 11,
                letterSpacing: 1,
                color: focusMode ? "var(--color-purple)" : "var(--text-muted)",
                borderBottom: focusMode
                  ? "1px solid var(--color-purple)"
                  : "none",
              }}
            >
              focus
            </button>
            {!focusMode && (
              <button
                onClick={() => setShowPanel((s) => !s)}
                style={{
                  ...S.ghost,
                  fontSize: 11,
                  letterSpacing: 1,
                  color: showPanel
                    ? "var(--color-purple)"
                    : "var(--text-muted)",
                  borderBottom: showPanel
                    ? "1px solid var(--color-purple)"
                    : "none",
                }}
              >
                refs
              </button>
            )}
          </div>
        </div>

        {/* Scene note / synopsis */}
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

        {/* Pinned context strip */}
        {(pinnedCharObjs.length > 0 || pinnedEventObjs.length > 0) &&
          !focusMode && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 20,
                paddingBottom: 16,
                borderBottom: "1px solid var(--border)",
              }}
            >
              {pinnedCharObjs.map((c: Character) => (
                <span
                  key={c.id}
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    border: `1px solid ${c.color}`,
                    color: c.color,
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: c.color,
                      display: "inline-block",
                    }}
                  />
                  {c.name}
                </span>
              ))}
              {pinnedEventObjs.map((e: Event) => (
                <span
                  key={e.id}
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    border: "1px solid var(--border-field)",
                    color: "var(--text-secondary)",
                    borderRadius: 3,
                  }}
                >
                  T{e.time} · {e.title}
                </span>
              ))}
            </div>
          )}

        {/* Main prose - textarea or rich editor */}
        {!focusMode && (
          <textarea
            {...bodyRegister}
            ref={(e) => {
              bodyRegister.ref(e);
              textareaRef.current = e;
            }}
            onInput={autoGrow}
            placeholder="Begin writing the chapter here. The story lives in this space…"
            style={{
              width: "100%",
              fontFamily: "Georgia, serif",
              fontSize: 15,
              lineHeight: 1.9,
              color: "var(--text-primary)",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              overflow: "hidden",
              minHeight: 400,
              padding: 0,
            }}
          />
        )}
        {focusMode && (
          <RichEditor
            control={control}
            name="body"
          />
        )}

        {/* Notes / scratchpad */}
        {!focusMode && (
          <>
            <hr style={S.rule} />
            <p style={{ ...S.h2, marginBottom: 8 }}>Chapter notes</p>
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
          </>
        )}
      </div>

      {/* ── Reference panel ── */}
      {showPanel && !focusMode && (
        <div
          style={{
            width: 256,
            flexShrink: 0,
            borderLeft: "1px solid var(--border)",
            paddingLeft: 20,
            fontSize: 12,
          }}
        >
          {/* Panel tabs */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 16,
              borderBottom: "1px solid var(--border)",
              paddingBottom: 8,
            }}
          >
            {(["chars", "events", "world"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setPanelTab(tab)}
                style={{
                  ...S.ghost,
                  fontSize: 11,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color:
                    panelTab === tab
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  borderBottom:
                    panelTab === tab ? "1px solid var(--text-primary)" : "none",
                  paddingBottom: 2,
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Characters tab */}
          {panelTab === "chars" && (
            <div>
              <p style={{ ...S.dim, marginBottom: 10 }}>
                Pin characters present in this chapter.
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 5,
                  marginBottom: 16,
                }}
              >
                {characters.map((c: Character) => (
                  <ContextTag
                    key={c.id}
                    label={c.name}
                    color={c.color}
                    active={pinnedChars.includes(c.id)}
                    onClick={() =>
                      setPinnedChars((prev) =>
                        prev.includes(c.id)
                          ? prev.filter((x) => x !== c.id)
                          : [...prev, c.id],
                      )
                    }
                  />
                ))}
                {!characters.length && <p style={S.dim}>No characters yet.</p>}
              </div>
              {pinnedCharObjs.map((c: Character) => (
                <CharCard key={c.id} char={c} events={events} />
              ))}
            </div>
          )}

          {/* Events tab */}
          {panelTab === "events" && (
            <div>
              <p style={{ ...S.dim, marginBottom: 10 }}>
                Pin timeline events this chapter covers.
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 5,
                  marginBottom: 16,
                }}
              >
                {sortedEvents.map((e: Event) => (
                  <ContextTag
                    key={e.id}
                    label={`T${e.time} ${e.title}`}
                    active={pinnedEvents.includes(e.id)}
                    onClick={() =>
                      setPinnedEvents((prev) =>
                        prev.includes(e.id)
                          ? prev.filter((x) => x !== e.id)
                          : [...prev, e.id],
                      )
                    }
                  />
                ))}
                {!sortedEvents.length && <p style={S.dim}>No events yet.</p>}
              </div>
              {pinnedEventObjs.map((e: Event) => (
                <EventRef key={e.id} event={e} />
              ))}
            </div>
          )}

          {/* World tab */}
          {panelTab === "world" && (
            <div style={{ lineHeight: 1.65 }}>
              {worldData.synopsis && (
                <div style={{ marginBottom: 14 }}>
                  <p
                    style={{
                      ...S.dim,
                      marginBottom: 4,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      fontSize: 10,
                    }}
                  >
                    Premise
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {worldData.synopsis}
                  </p>
                </div>
              )}
              {worldData.themes && (
                <div style={{ marginBottom: 14 }}>
                  <p
                    style={{
                      ...S.dim,
                      marginBottom: 4,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      fontSize: 10,
                    }}
                  >
                    Themes
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {worldData.themes}
                  </p>
                </div>
              )}
              {worldData.setting && (
                <div style={{ marginBottom: 14 }}>
                  <p
                    style={{
                      ...S.dim,
                      marginBottom: 4,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      fontSize: 10,
                    }}
                  >
                    Setting
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {worldData.setting}
                  </p>
                </div>
              )}
              {worldData.rules && (
                <div style={{ marginBottom: 14 }}>
                  <p
                    style={{
                      ...S.dim,
                      marginBottom: 4,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      fontSize: 10,
                    }}
                  >
                    World rules
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {worldData.rules}
                  </p>
                </div>
              )}
              {!worldData.synopsis &&
                !worldData.themes &&
                !worldData.setting &&
                !worldData.rules && (
                  <p style={S.dim}>
                    Fill in world details on the World page to see them here.
                  </p>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
