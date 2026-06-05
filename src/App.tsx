import { Outlet, useNavigate, useLocation, useParams } from "react-router-dom";
import { useSelector } from "@legendapp/state/react";
import { appStore } from "./store/appStore";
import { showToast } from "./store/toastStore";
import {
  useEvents,
  useCharacters,
  useChapters,
  useWorldTitle,
  useActiveBookIdx,
} from "./hooks/useWorldStore";
import { S, mkChar, mkEvent, uid } from "./lib/utils";
import { SideItem } from "./components/ui";
import {
  PublicIcon, AutoStoriesIcon, TimelineIcon, PeopleIcon,
  SportsKabaddiIcon, FileDownloadIcon, LightModeIcon,
  DarkModeIcon, AddIcon, CloudSyncIcon, MenuIcon
} from "./components/ui/icons";
import { buildExport } from "./lib/export";
import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { useTheme } from "./hooks/useThemeHook";
import { syncToGitHub, loadBookFromGitHub } from "./lib/githubSync";
import type { Character, Event } from "./lib/types";
import type { Chapter } from "./store/appStore";

export default function App() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    appStore.activeBookId.set(bookId || null);
  }, [bookId]);

  const bookIdx = useActiveBookIdx();
  const isInsideBook = bookIdx >= 0;
  
  const fetchingRef = useRef<string | null>(null);

  // Lazy-load the specific book data if it's only a lightweight reference from the cloud list,
  // OR if the user navigates directly to a book URL and memory is empty.
  useEffect(() => {
    const loadSpecificBook = async () => {
      if (bookId) {
        // Find index freshly so we don't rely on stale closure if activeId hasn't updated yet
        const currentBooks = appStore.books.get() || [];
        const freshIdx = currentBooks.findIndex(b => b && b.id === bookId);
        const currentBook = freshIdx >= 0 ? currentBooks[freshIdx] : null;

        if ((!currentBook || !currentBook.isFullyLoaded) && fetchingRef.current !== bookId) {
          const token = localStorage.getItem("seshat-auth-token") || sessionStorage.getItem("seshat-auth-token");
          if (token) {
            fetchingRef.current = bookId;
            try {
              const fullBook = await loadBookFromGitHub(token, bookId);
              if (fullBook && fullBook.id) {
                // Find index AGAIN in case it changed during the await
                const latestBooks = appStore.books.get() || [];
                const finalIdx = latestBooks.findIndex(b => b && b.id === bookId);
                
                if (finalIdx >= 0) {
                  appStore.books[finalIdx].set(fullBook);
                } else {
                  appStore.books.push(fullBook);
                }
                showToast(`Loaded ${fullBook.title}`, "success");
              } else {
                throw new Error("Invalid book data received from cloud");
              }
            } catch (err) {
              console.error("Failed to load specific book", err);
              showToast("Failed to fetch full book data from cloud", "error");
            } finally {
              fetchingRef.current = null;
            }
          }
        }
      }
    };
    loadSpecificBook();
  }, [bookId, bookIdx]);

  const title = useWorldTitle();
  const events = useEvents();
  const characters = useCharacters();
  const chapters = useChapters();

  const addChar = () => {
    if (bookIdx < 0) return;
    const c = mkChar(`Character ${characters.length + 1}`, "#c0392b");
    appStore.books[bookIdx].characters.push(c);
    navigate(`/book/${bookId}/characters/${c.id}`);
  };
  const delChar = (id: string) => {
    if (bookIdx < 0) return;
    appStore.books[bookIdx].characters.set((prev: Character[]) =>
      prev.filter((c) => c.id !== id),
    );
    appStore.books[bookIdx].events.set((prev: Event[]) =>
      prev.map((e) => ({
        ...e,
        characters: (e.characters || []).filter((x: string) => x !== id),
      })),
    );
  };
  const addEvent = () => {
    if (bookIdx < 0) return;
    const maxT = events.reduce((m: number, e: Event) => Math.max(m, e.time), 0);
    const e = { ...mkEvent(), time: maxT + 1 };
    appStore.books[bookIdx].events.push(e);
    navigate(`/book/${bookId}/events/${e.id}`);
  };
  const delEvent = (id: string) => {
    if (bookIdx < 0) return;
    appStore.books[bookIdx].events.set((prev: Event[]) => prev.filter((e) => e.id !== id));
  };

  const addChapter = () => {
    if (bookIdx < 0) return;
    const order = (chapters?.length || 0) + 1;
    const ch: Chapter = {
      id: uid(),
      number: `Ch. ${order}`,
      title: "",
      timeRef: "",
      synopsis: "",
      body: "",
      notes: "",
      order,
    };
    appStore.books[bookIdx].chapters.push(ch);
    navigate(`/book/${bookId}/chapters/${ch.id}`);
  };
  const delChapter = (id: string) => {
    if (bookIdx < 0) return;
    appStore.books[bookIdx].chapters.set((prev: Chapter[]) =>
      prev.filter((c) => c.id !== id),
    );
  };

  const selEvent =
    (location.pathname.startsWith(`/book/${bookId}/events/`) &&
      location.pathname.split("/")[4]) ||
    null;
  const selChar =
    (location.pathname.startsWith(`/book/${bookId}/characters/`) &&
      location.pathname.split("/")[4]) ||
    null;
  const selChapter =
    (location.pathname.startsWith(`/book/${bookId}/chapters/`) &&
      location.pathname.split("/")[4]) ||
    null;

  const sortedEvt = [...(events || [])].sort((a, b) => a.time - b.time);
  const sortedChapters = [...(chapters || [])].sort(
    (a, b) => a.order - b.order,
  );

  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [prevPath, setPrevPath] = useState(location.pathname);

  // Auto-close sidebar on navigation (React recommended pattern)
  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname);
    if (showSidebar) setShowSidebar(false);
  }

  const triggerSync = async (token: string) => {
    try {
      setIsSyncing(true);
      await syncToGitHub(token);
      showToast("Synced successfully to your secure branch!", "success");
    } catch (err) {
      showToast("Sync failed: " + (err as Error).message, "error");
      if ((err as Error).message.includes("Unauthorized") || (err as Error).message.includes("expired")) {
        localStorage.removeItem("seshat-auth-token");
        sessionStorage.removeItem("seshat-auth-token");
        navigate("/auth");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSync = () => {
    const savedToken = localStorage.getItem("seshat-auth-token") || sessionStorage.getItem("seshat-auth-token");
    
    if (!savedToken) {
      navigate("/auth");
    } else {
      triggerSync(savedToken);
    }
  };

  const worldNations = bookIdx >= 0 ? appStore.books[bookIdx].nations.get() : [];
  const worldTechniques = bookIdx >= 0 ? appStore.books[bookIdx].techniques.get() : [];
  const worldIngredients = bookIdx >= 0 ? appStore.books[bookIdx].ingredients.get() : [];
  const worldMonsters = bookIdx >= 0 ? appStore.books[bookIdx].monsters.get() : [];
  const worldTreasures = bookIdx >= 0 ? appStore.books[bookIdx].treasures.get() : [];
  const worldCount =
    (worldNations?.length || 0) +
    (worldTechniques?.length || 0) +
    (worldIngredients?.length || 0) +
    (worldMonsters?.length || 0) +
    (worldTreasures?.length || 0);

  const text = buildExport({
    title: bookIdx >= 0 ? appStore.books[bookIdx].title.get() : "",
    synopsis: bookIdx >= 0 ? appStore.books[bookIdx].synopsis.get() : "",
    setting: bookIdx >= 0 ? appStore.books[bookIdx].setting.get() : "",
    themes: bookIdx >= 0 ? appStore.books[bookIdx].themes.get() : "",
    rules: bookIdx >= 0 ? appStore.books[bookIdx].rules.get() : "",
    nations: worldNations || [],
    techniques: worldTechniques || [],
    ingredients: worldIngredients || [],
    monsters: worldMonsters || [],
    treasures: worldTreasures || [],
    events: events || [],
    characters: characters || [],
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
    fontSize: 14,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    color: active ? "var(--text-primary)" : "var(--text-secondary)",
    fontFamily: "'Georgia', serif",
  });



  const isFullyLoaded = useSelector(() => bookIdx >= 0 ? !!appStore.books[bookIdx].isFullyLoaded.get() : false);

  // If there's no bookId in the URL, we're likely on the root path (BookListPage)
  if (!bookId) {
    return <Outlet />;
  }

  // If we have a bookId but it's not fully loaded yet (or not even in memory), show loading
  if (!isFullyLoaded || !isInsideBook) {
    return (
      <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", letterSpacing: 2, fontSize: 13, textTransform: "uppercase" }}>
        Loading universe...
      </div>
    );
  }

  return (
    <div style={S.app} className="seshat-app">
      {/* ── Top bar ── */}
      <div style={S.top} className="seshat-top">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button 
            className="seshat-mobile-only" 
            onClick={() => setShowSidebar(!showSidebar)}
            style={{ ...S.ghost, padding: 0 }}
          >
            <MenuIcon />
          </button>
          <span style={{ ...S.logo, cursor: "pointer" }} className="seshat-desktop-only" onClick={() => navigate("/")}>Seshat</span>
        </div>
        <input
          value={title}
          onChange={(e) => bookIdx >= 0 && appStore.books[bookIdx].title.set(e.target.value)}
          className="seshat-top-title-input"
          style={{
            ...S.input,
            width: 240,
            textAlign: "center",
            border: "none",
            fontSize: 15,
            color: "var(--text-secondary)",
            letterSpacing: 1,
          }}
        />
        <div className="seshat-top-actions" style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            style={{
              ...S.ghost,
              letterSpacing: 2,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              gap: 4,
              opacity: isSyncing ? 0.5 : 1,
            }}
          >
            <CloudSyncIcon sx={{ fontSize: 14 }} />
            <span className="seshat-desktop-only">{isSyncing ? "Syncing..." : "Sync"}</span>
          </button>
          <button
            onClick={() => setShowExport(true)}
            style={{ ...S.ghost, letterSpacing: 2, fontSize: 15, display: "flex", alignItems: "center", gap: 4 }}
          >
            <FileDownloadIcon sx={{ fontSize: 14 }} />
            <span className="seshat-desktop-only">Export for AI</span>
          </button>
          <button
            onClick={() => navigate(`/book/${bookId}/fight`)}
            style={{
              ...S.ghost,
              letterSpacing: 2,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              gap: 4,
              color:
                location.pathname === `/book/${bookId}/fight`
                  ? "var(--color-red)"
                  : "var(--text-secondary)",
              borderBottom:
                location.pathname === `/book/${bookId}/fight`
                  ? "1px solid var(--color-red)"
                  : "none",
            }}
          >
            <SportsKabaddiIcon sx={{ fontSize: 14 }} />
            <span className="seshat-desktop-only">Fight</span>
          </button>
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
              display: "flex",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
          >
            {theme === "light" ? <LightModeIcon sx={{ fontSize: 16 }} /> : <DarkModeIcon sx={{ fontSize: 16 }} />}
          </button>
        </div>
      </div>

      <div style={S.row} className="seshat-row">
        {/* ── Sidebar Overlay (Mobile) ── */}
        <div 
          className={`seshat-sidebar-overlay ${showSidebar ? "open" : ""}`}
          onClick={() => setShowSidebar(false)}
        />
        
        {/* ── Sidebar ── */}
        <div style={S.side} className={`seshat-side ${showSidebar ? "open" : ""}`}>
          <div className="seshat-mobile-only" style={{ padding: "10px 24px 14px" }}>
            <button
              onClick={() => navigate("/")}
              style={{ ...navBtnStyle(false), color: "var(--color-purple)", display: "flex", alignItems: "center", gap: 6 }}
            >
              ← Back to Books
            </button>
          </div>

          <div style={{ padding: "0 24px 10px" }}>
            <button
              onClick={() => navigate(`/book/${bookId}/world`)}
              style={{ ...navBtnStyle(
                location.pathname === `/book/${bookId}/world` ||
                (location.pathname === `/book/${bookId}` &&
                  !selChar && !selEvent && !selChapter),
              ), display: "flex", alignItems: "center", gap: 6 }}
            >
              <PublicIcon sx={{ fontSize: 14 }} />
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
              onClick={() => navigate(`/book/${bookId}/chapters`)}
              style={{ ...navBtnStyle(location.pathname.startsWith(`/book/${bookId}/chapters`)), display: "flex", alignItems: "center", gap: 6 }}
            >
              <AutoStoriesIcon sx={{ fontSize: 14 }} />
              Chapters ({sortedChapters.length})
            </button>
            <button onClick={addChapter} style={{ ...S.ghost, fontSize: 16, display: "flex" }}>
              <AddIcon sx={{ fontSize: 16 }} />
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
              onClick={() => navigate(`/book/${bookId}/chapters/${ch.id}`)}
              onDelete={() => delChapter(ch.id)}
            />
          ))}

          {sortedChapters.length === 0 && (
            <p
              style={{
                ...S.dim,
    fontSize: 14,
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
              onClick={() => navigate(`/book/${bookId}/events`)}
              style={{ ...navBtnStyle(location.pathname.startsWith(`/book/${bookId}/events`)), display: "flex", alignItems: "center", gap: 6 }}
            >
              <TimelineIcon sx={{ fontSize: 14 }} />
              Timeline
            </button>
            <button onClick={addEvent} style={{ ...S.ghost, fontSize: 16, display: "flex" }}>
              <AddIcon sx={{ fontSize: 16 }} />
            </button>
          </div>

          {sortedEvt.map((e: Event) => {
            const dateTag = [e.startDate && e.startDate.replace("T", " "), e.endDate && `→ ${e.endDate.replace("T", " ")}`]
              .filter(Boolean)
              .join(" ");
            const chTag = (e.chapters || []).length ? `Ch. ${e.chapters.join(", ")}` : "";
            const tag = [chTag, dateTag]
              .filter(Boolean)
              .join(" · ");
            return (
              <SideItem
                key={e.id}
                label={e.title}
                sub={`T${e.time}${tag ? ` · ${tag}` : ""}${e.type ? ` · ${e.type}` : ""}`}
                active={selEvent === e.id}
                onClick={() => navigate(`/book/${bookId}/events/${e.id}`)}
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
              onClick={() => navigate(`/book/${bookId}/characters`)}
              style={{ ...navBtnStyle(location.pathname.startsWith(`/book/${bookId}/characters`)), display: "flex", alignItems: "center", gap: 6 }}
            >
              <PeopleIcon sx={{ fontSize: 14 }} />
              Characters
            </button>
            <button onClick={addChar} style={{ ...S.ghost, fontSize: 16, display: "flex" }}>
              <AddIcon sx={{ fontSize: 16 }} />
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
              onClick={() => navigate(`/book/${bookId}/characters/${c.id}`)}
              onDelete={() => delChar(c.id)}
            />
          ))}
        </div>

        {/* ── Main content ── */}
        <div style={S.main} className="seshat-main" ref={mainRef}>
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
fontSize: 15,
                lineHeight: 1.7,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
