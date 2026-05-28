import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { worldStore } from "./store/worldStore";
import {
  useWorldTitle,
  useEvents,
  useCharacters,
  useChapters,
} from "./hooks/useWorldStore";
import { S, mkChar, mkEvent } from "./lib/utils";
import { mkChapter } from "./lib/mkChapter";
import { SideItem } from "./components/ui";
import { buildExport } from "./lib/export";
import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { useTheme } from "./hooks/useThemeHook";
import type { Character, Event } from "./lib/types";
import type { Chapter } from "./store/worldStore";

export default function App() {
  const title = useWorldTitle();
  const events = useEvents();
  const characters = useCharacters();
  const chapters = useChapters();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useTheme();

  const addChar = () => {
    const c = mkChar(`Character ${characters.length + 1}`, "#c0392b");
    worldStore.characters.push(c);
    navigate(`/characters/${c.id}`);
  };
  const delChar = (id: string) => {
    worldStore.characters.set((prev: Character[]) =>
      prev.filter((c) => c.id !== id),
    );
    worldStore.events.set((prev: Event[]) =>
      prev.map((e) => ({
        ...e,
        characters: (e.characters || []).filter((x: string) => x !== id),
      })),
    );
  };
  const addEvent = () => {
    const maxT = events.reduce((m: number, e: Event) => Math.max(m, e.time), 0);
    const e = { ...mkEvent(), time: maxT + 1 };
    worldStore.events.push(e);
    navigate(`/events/${e.id}`);
  };
  const delEvent = (id: string) => {
    worldStore.events.set((prev: Event[]) => prev.filter((e) => e.id !== id));
  };

  const addChapter = () => {
    const order = (chapters?.length || 0) + 1;
    const ch = mkChapter(order);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (worldStore.chapters as any).push(ch);
    navigate(`/chapters/${ch.id}`);
  };
  const delChapter = (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (worldStore.chapters as any).set((prev: Chapter[]) =>
      prev.filter((c) => c.id !== id),
    );
  };

  const selEvent =
    (location.pathname.startsWith("/events/") &&
      location.pathname.split("/")[2]) ||
    null;
  const selChar =
    (location.pathname.startsWith("/characters/") &&
      location.pathname.split("/")[2]) ||
    null;
  const selChapter =
    (location.pathname.startsWith("/chapters/") &&
      location.pathname.split("/")[2]) ||
    null;

  const sortedEvt = [...events].sort((a, b) => a.time - b.time);
  const sortedChapters = [...(chapters || [])].sort(
    (a, b) => a.order - b.order,
  );

  const worldCount =
    (worldStore.nations.get()?.length || 0) +
    (worldStore.techniques.get()?.length || 0) +
    (worldStore.ingredients.get()?.length || 0) +
    (worldStore.monsters.get()?.length || 0) +
    (worldStore.treasures.get()?.length || 0);

  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);

  const text = buildExport({
    title,
    synopsis: worldStore.synopsis.get(),
    setting: worldStore.setting.get(),
    themes: worldStore.themes.get(),
    rules: worldStore.rules.get(),
    nations: worldStore.nations.get(),
    techniques: worldStore.techniques.get(),
    ingredients: worldStore.ingredients.get(),
    monsters: worldStore.monsters.get(),
    treasures: worldStore.treasures.get(),
    events,
    characters,
  });

  const mainRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mainRef.current) {
      animate(mainRef.current, {
        opacity: [0, 1],
        translateY: [6, 0],
        duration: 220,
        easing: "easeOutQuad",
      });
    }
  }, [location.pathname]);

  const navBtnStyle = (active: boolean) => ({
    ...S.ghost,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    color: active ? "var(--text-primary)" : "var(--text-secondary)",
    fontFamily: "'Georgia', serif",
  });

  // total word count across all chapters
  const totalWords = (chapters || []).reduce((sum: number, ch: Chapter) => {
    const body = ch.body || "";
    return sum + (body.trim() === "" ? 0 : body.trim().split(/\s+/).length);
  }, 0);

  return (
    <div style={S.app}>
      {/* ── Top bar ── */}
      <div style={S.top}>
        <span style={S.logo}>Seshat</span>
        <input
          value={title}
          onChange={(e) => worldStore.title.set(e.target.value)}
          style={{
            ...S.input,
            width: 240,
            textAlign: "center",
            border: "none",
            fontSize: 13,
            color: "var(--text-secondary)",
            letterSpacing: 1,
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <button
            onClick={() => setShowExport(true)}
            style={{ ...S.ghost, letterSpacing: 2, fontSize: 12 }}
          >
            Export for AI
          </button>
          <button
            onClick={() => navigate("/fight")}
            style={{
              ...S.ghost,
              letterSpacing: 2,
              fontSize: 12,
              color:
                location.pathname === "/fight"
                  ? "var(--color-red)"
                  : "var(--text-secondary)",
              borderBottom:
                location.pathname === "/fight"
                  ? "1px solid var(--color-red)"
                  : "none",
            }}
          >
            ⚔ Fight
          </button>
          {/* ── Theme toggle ── */}
          <button
            onClick={toggle}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            style={{
              ...S.ghost,
              fontSize: 15,
              lineHeight: 1,
              padding: "2px 4px",
              opacity: 0.7,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
          >
            {theme === "light" ? "◐" : "◑"}
          </button>
        </div>
      </div>

      <div style={S.row}>
        {/* ── Sidebar ── */}
        <div style={S.side}>
          <div style={{ padding: "0 24px 10px" }}>
            <button
              onClick={() => navigate("/")}
              style={navBtnStyle(
                location.pathname === "/" &&
                  !selChar &&
                  !selEvent &&
                  !selChapter,
              )}
            >
              {worldCount > 0 ? `World (${worldCount})` : "World"}
            </button>
          </div>

          <div
            style={{
              height: 1,
              background: "var(--border)",
              margin: "4px 0 10px",
            }}
          />

          {/* ── Chapters section ── */}
          <div
            style={{
              padding: "0 24px 8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => navigate("/chapters")}
              style={navBtnStyle(location.pathname.startsWith("/chapters"))}
            >
              {totalWords > 0
                ? `Chapters (${sortedChapters.length}) · ${totalWords >= 1000 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords}w`
                : `Chapters (${sortedChapters.length})`}
            </button>
            <button onClick={addChapter} style={{ ...S.ghost, fontSize: 16 }}>
              +
            </button>
          </div>

          {sortedChapters.map((ch: Chapter) => (
            <SideItem
              key={ch.id}
              label={ch.title || "Untitled chapter"}
              sub={
                [ch.number, ch.timeRef].filter(Boolean).join(" · ") || undefined
              }
              active={selChapter === ch.id}
              onClick={() => navigate(`/chapters/${ch.id}`)}
              onDelete={() => delChapter(ch.id)}
            />
          ))}

          {sortedChapters.length === 0 && (
            <p
              style={{
                ...S.dim,
                fontSize: 11,
                padding: "2px 24px 10px",
                fontStyle: "italic",
              }}
            >
              No chapters yet.
            </p>
          )}

          <div
            style={{
              height: 1,
              background: "var(--border)",
              margin: "4px 0 10px",
            }}
          />

          {/* ── Timeline section ── */}
          <div
            style={{
              padding: "0 24px 8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => navigate("/events")}
              style={navBtnStyle(location.pathname.startsWith("/events"))}
            >
              Timeline
            </button>
            <button onClick={addEvent} style={{ ...S.ghost, fontSize: 16 }}>
              +
            </button>
          </div>

          {sortedEvt.map((e: Event) => {
            const dateTag = [e.startDate && e.startDate.replace("T", " "), e.endDate && `→ ${e.endDate.replace("T", " ")}`]
              .filter(Boolean)
              .join(" ");
            const tag = [e.chapter && `Ch.${e.chapter}`, dateTag]
              .filter(Boolean)
              .join(" · ");
            return (
              <SideItem
                key={e.id}
                label={e.title}
                sub={`T${e.time}${tag ? ` · ${tag}` : ""}${e.type ? ` · ${e.type}` : ""}`}
                active={selEvent === e.id}
                onClick={() => navigate(`/events/${e.id}`)}
                onDelete={() => delEvent(e.id)}
              />
            );
          })}

          <div
            style={{
              height: 1,
              background: "var(--border)",
              margin: "12px 0 10px",
            }}
          />

          {/* ── Characters section ── */}
          <div
            style={{
              padding: "0 24px 8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => navigate("/characters")}
              style={navBtnStyle(location.pathname.startsWith("/characters"))}
            >
              Characters
            </button>
            <button onClick={addChar} style={{ ...S.ghost, fontSize: 16 }}>
              +
            </button>
          </div>

          {characters.map((c: Character) => (
            <SideItem
              key={c.id}
              label={c.name}
              sub={
                [c.role, c.archetype].filter(Boolean).join(" · ") || undefined
              }
              color={c.color}
              active={selChar === c.id}
              onClick={() => navigate(`/characters/${c.id}`)}
              onDelete={() => delChar(c.id)}
            />
          ))}
        </div>

        {/* ── Main content ── */}
        <div style={S.main} ref={mainRef}>
          <Outlet />
        </div>
      </div>

      {/* ── Export modal ── */}
      {showExport && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--bg-export)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            style={{
              width: "min(700px,92vw)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={S.h2}>Export for AI</span>
              <div style={{ display: "flex", gap: 20 }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{
                    ...S.ghost,
                    color: copied
                      ? "var(--color-green)"
                      : "var(--text-secondary)",
                  }}
                >
                  {copied ? "Copied!" : "Copy all"}
                </button>
                <button onClick={() => setShowExport(false)} style={S.ghost}>
                  Close
                </button>
              </div>
            </div>
            <p style={S.dim}>
              Paste into your AI's system prompt. Full psychology, conditions,
              skills, equipment, achievements, losses, relationships, world
              entities, and behavioral guidance.
            </p>
            <textarea
              readOnly
              value={text}
              style={{
                ...S.textarea,
                border: "none",
                background: "var(--bg-export-ta)",
                padding: 20,
                borderRadius: 4,
                height: 460,
                resize: "none",
                fontFamily: "monospace",
                fontSize: 12,
                lineHeight: 1.7,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
