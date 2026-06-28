import { useSelector } from "@legendapp/state/react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { ConflictModal } from "./components/ConflictModal";
import { GlobalSearchModal } from "./components/GlobalSearchModal";
import { SideItem } from "./components/ui";
import {
  AddIcon,
  AutoStoriesIcon,
  BugReportIcon,
  CloudSyncIcon,
  DarkModeIcon,
  FolderOpenIcon,
  LightModeIcon,
  LogoutIcon,
  MenuIcon,
  PeopleIcon,
  PublicIcon,
  SearchIcon,
  SmartToyIcon,
  SportsKabaddiIcon,
  TimelineIcon,
} from "./components/ui/icons";
import {
  useActiveBookIdx,
  useChapters,
  useCharacters,
  useEvents,
  useWorldTitle,
} from "./hooks/useWorldStore";
import { autoMergeOtherChapters, getConflicts } from "./lib/conflictUtils";
import { EMPTY_ARR } from "./lib/constants";
import { S, getLatestEventDates, mkChar, mkEvent, uid } from "./lib/utils";
import { appStore, clearAppStore, mkBook } from "./store/appStore";
import { showToast } from "./store/toastStore";

import { animate } from "animejs";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "./hooks/useTheme";
import {
  loadBookFromGitHub,
  loadFromGitHub,
  syncToGitHub,
} from "./lib/githubSync";
import type { Character, Event } from "./lib/types";
import type { BookData, Chapter } from "./store/appStore";

export default function App() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useTheme();

  const [showSearch, setShowSearch] = useState(false);
  const [conflictData, setConflictData] = useState<{
    serverBook: BookData;
    serverSha: string;
  } | null>(null);

  // Sidebar Drag and Drop for Chapters
  const chapters = useChapters();
  const bookIdx = useActiveBookIdx();
  const [draggedChapterIdx, setDraggedChapterIdx] = useState<number | null>(null);
  const [dragOverChapterIdx, setDragOverChapterIdx] = useState<number | null>(null);

  const handleSidebarDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedChapterIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleSidebarDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedChapterIdx !== null && draggedChapterIdx !== idx) {
      setDragOverChapterIdx(idx);
    }
  };

  const handleSidebarDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    const fromIdx = draggedChapterIdx;
    if (fromIdx !== null && fromIdx !== targetIdx && bookIdx >= 0) {
      const sorted = [...(chapters || [])].sort((a, b) => a.order - b.order);
      const [movedChapter] = sorted.splice(fromIdx, 1);
      sorted.splice(targetIdx, 0, movedChapter);

      sorted.forEach((ch, idx) => {
        const storeIdx = appStore.books[bookIdx].chapters.get().findIndex(c => c.id === ch.id);
        if (storeIdx >= 0) {
          appStore.books[bookIdx].chapters[storeIdx].order.set(idx + 1);
        }
      });
      const token = localStorage.getItem("seshat-auth-token") || sessionStorage.getItem("seshat-auth-token");
      if (token) syncToGitHub(token).catch(console.error);
    }
    setDraggedChapterIdx(null);
    setDragOverChapterIdx(null);
  };

  const handleSidebarDragEnd = () => {
    setDraggedChapterIdx(null);
    setDragOverChapterIdx(null);
  };

  useEffect(() => {
    appStore.activeBookId.set(bookId || null);
  }, [bookId]);

  // Background JWT Refresh
  useEffect(() => {
    const checkRefresh = async () => {
      const token = localStorage.getItem("seshat-auth-token") || sessionStorage.getItem("seshat-auth-token");
      if (!token) return;

      try {
        const payloadStr = atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"));
        const payload = JSON.parse(payloadStr);
        const timeRemaining = payload.exp - Date.now();
        
        // If less than 3 days left, refresh
        if (timeRemaining < 3 * 24 * 60 * 60 * 1000) {
          const res = await fetch("/api/github/refresh", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (localStorage.getItem("seshat-auth-token")) {
              localStorage.setItem("seshat-auth-token", data.token);
            } else {
              sessionStorage.setItem("seshat-auth-token", data.token);
            }
          }
        }
      } catch (e) {
        // Silently fail if token format is invalid or network fails
      }
    };

    checkRefresh();
    const interval = setInterval(checkRefresh, 60 * 60 * 1000); // Check every hour
    return () => clearInterval(interval);
  }, []);

  // Load the complete list of books on startup.
  // This prevents losing/wiping out other books in the remote repository during a sync
  // if the user navigates directly to a book-specific route first.
  useEffect(() => {
    let cancelled = false;
    const token =
      localStorage.getItem("seshat-auth-token") ||
      sessionStorage.getItem("seshat-auth-token");

    if (!token) return;

    const loadGlobalBooksList = async () => {
      appStore.isLoadingBooks.set(true);
      try {
        const cloudBooks = await loadFromGitHub(token);
        if (cancelled) return;
        if (cloudBooks && cloudBooks.length > 0) {
          appStore.books.set((prevBooks) => {
            const newBooks = [...(prevBooks || [])].filter(Boolean);
            for (const cb of cloudBooks) {
              const existingIdx = newBooks.findIndex(
                (b) => b && b.id === cb.id,
              );
              if (existingIdx >= 0) {
                // Update basic metadata, preserving deep entities if already loaded/modified locally
                newBooks[existingIdx] = {
                  ...newBooks[existingIdx],
                  title: cb.title,
                };
              } else {
                // Initialize as placeholder book metadata, to be lazy-loaded if opened
                newBooks.push({
                  ...mkBook(cb.title),
                  id: cb.id,
                  isFullyLoaded: false,
                });
              }
            }
            return newBooks;
          });
        }
      } catch (err) {
        console.error("Failed to load global books list:", err);
      } finally {
        if (!cancelled) {
          appStore.isLoadingBooks.set(false);
        }
      }
    };

    loadGlobalBooksList();

    return () => {
      cancelled = true;
    };
  }, []);

  const isInsideBook = bookIdx >= 0;

  const fetchingRef = useRef<string | null>(null);

  // Lazy-load the specific book data if it's only a lightweight reference from the cloud list,
  // OR if the user navigates directly to a book URL and memory is empty.
  useEffect(() => {
    let cancelled = false;
    const loadSpecificBook = async () => {
      if (bookId) {
        // Find index freshly so we don't rely on stale closure if activeId hasn't updated yet
        const currentBooks = appStore.books.get() || [];
        const freshIdx = currentBooks.findIndex((b) => b && b.id === bookId);
        const currentBook = freshIdx >= 0 ? currentBooks[freshIdx] : null;

        if (
          (!currentBook || !currentBook.isFullyLoaded) &&
          fetchingRef.current !== bookId
        ) {
          const token =
            localStorage.getItem("seshat-auth-token") ||
            sessionStorage.getItem("seshat-auth-token");
          if (token) {
            fetchingRef.current = bookId;
            try {
              const fullBook = await loadBookFromGitHub(token, bookId);
              if (fullBook && fullBook.id) {
                // Find index AGAIN in case it changed during the await
                const latestBooks = appStore.books.get() || [];
                const finalIdx = latestBooks.findIndex(
                  (b) => b && b.id === bookId,
                );

                if (finalIdx >= 0) {
                  appStore.books[finalIdx].set(fullBook);
                } else {
                  appStore.books.push(fullBook);
                }
                if (!cancelled)
                  showToast(`Loaded ${fullBook.title}`, "success");
              } else {
                throw new Error("Invalid book data received from cloud");
              }
            } catch (err) {
              console.error("Failed to load specific book", err);
              if (!cancelled)
                showToast("Failed to fetch full book data from cloud", "error");
            } finally {
              if (fetchingRef.current === bookId) {
                fetchingRef.current = null;
              }
            }
          }
        }
      }
    };
    loadSpecificBook();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  const title = useWorldTitle();
  const events = useEvents();
  const characters = useCharacters();

  // Clean up stale timeRef values pointing to deleted events
  useEffect(() => {
    if (bookIdx < 0 || !chapters || !events) return;
    const eventIds = new Set((events || []).map((e: Event) => e.id));
    chapters.forEach((ch, i) => {
      if (ch.timeRef && !eventIds.has(ch.timeRef)) {
        appStore.books[bookIdx].chapters[i].timeRef.set("");
      }
    });
  }, [bookIdx, chapters, events]);

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
    const defaultDates = getLatestEventDates(events);
    const e = { ...mkEvent(), ...defaultDates, time: maxT + 1 };
    appStore.books[bookIdx].events.push(e);
    navigate(`/book/${bookId}/events/${e.id}`);
  };
  const delEvent = (id: string) => {
    if (bookIdx < 0) return;
    appStore.books[bookIdx].events.set((prev: Event[]) =>
      prev.filter((e) => e.id !== id),
    );
  };

  const addChapter = () => {
    if (bookIdx < 0) return;
    const order = Math.max(0, ...(chapters || []).map((c) => c.order)) + 1;
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

  const isWorldPage =
    location.pathname === `/book/${bookId}/world` ||
    (location.pathname === `/book/${bookId}` &&
      !selChar &&
      !selEvent &&
      !selChapter);

  const sortedEvt = [...(events || [])].sort((a, b) => a.time - b.time);
  const sortedChapters = [...(chapters || [])].sort(
    (a, b) => a.order - b.order,
  );

  const [isSyncing, setIsSyncing] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [prevPath, setPrevPath] = useState(location.pathname);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [openSections, setOpenSections] = useState({
    chapters: true,
    timeline: true,
    characters: true,
  });

  // Auto-close mobile menus when window is resized to desktop width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setShowMoreMenu(false);
        setShowSidebar(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      if (
        (err as Error).message.includes("Unauthorized") ||
        (err as Error).message.includes("expired")
      ) {
        localStorage.removeItem("seshat-auth-token");
        sessionStorage.removeItem("seshat-auth-token");
        navigate("/auth");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("seshat-auth-token");
    sessionStorage.removeItem("seshat-auth-token");
    clearAppStore();
    navigate("/auth");
  };

  const handlePull = async () => {
    const savedToken =
      localStorage.getItem("seshat-auth-token") ||
      sessionStorage.getItem("seshat-auth-token");
    if (!savedToken) {
      navigate("/auth");
      return;
    }
    if (!bookId || bookIdx < 0) return;
    try {
      setIsSyncing(true);
      showToast("Pulling latest data from cloud...", "info");
      const response = (await loadBookFromGitHub(
        savedToken,
        bookId,
      )) as BookData;
      if (response && response.id) {
        const localBook = appStore.books[bookIdx].get();
        const conflictsList = getConflicts(localBook, response);
        const visibleConflicts = conflictsList.filter((c) => {
          if (c.type === "chapter") {
            const originalId = c.id.replace("chapter_", "");
            if (selChapter && originalId !== selChapter) {
              return false;
            }
          }
          return true;
        });

        if (visibleConflicts.length === 0) {
          const mergedBook = autoMergeOtherChapters(
            localBook,
            conflictsList,
            selChapter,
          );
          appStore.books[bookIdx].set(mergedBook);
          showToast(
            "Local data is already up to date. No conflicts found!",
            "success",
          );
        } else {
          setConflictData({ serverBook: response, serverSha: "merged" });
        }
      }
    } catch (err) {
      showToast(
        "Failed to pull from cloud: " + (err as Error).message,
        "error",
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResolveConflicts = async (mergedBook: BookData) => {
    setConflictData(null);
    if (bookIdx >= 0) {
      appStore.books[bookIdx].set(mergedBook);
      showToast("Conflicts resolved and merged!", "success");

      // Auto-trigger sync to push the resolved state to the server
      const token =
        localStorage.getItem("seshat-auth-token") ||
        sessionStorage.getItem("seshat-auth-token");
      if (token) {
        try {
          setIsSyncing(true);
          showToast("Pushing resolved state to cloud...", "info");
          await syncToGitHub(token);
          showToast("Successfully pushed resolved state!", "success");
        } catch (error) {
          console.error(error);
          showToast("Failed to push resolved state", "error");
        } finally {
          setIsSyncing(false);
        }
      }
    }
  };

  const handleSync = () => {
    const savedToken =
      localStorage.getItem("seshat-auth-token") ||
      sessionStorage.getItem("seshat-auth-token");

    if (!savedToken) {
      navigate("/auth");
    } else {
      triggerSync(savedToken);
    }
  };

  // Background auto-sync every 3 minutes to prevent commit history pollution
  // while ensuring data is backed up to the cloud.
  useEffect(() => {
    const autoSyncInterval = setInterval(() => {
      const savedToken =
        localStorage.getItem("seshat-auth-token") ||
        sessionStorage.getItem("seshat-auth-token");
      if (!savedToken) return;

      const loc = appStore.lastModifiedLocal.get() || 0;
      const clo = appStore.lastSyncedCloud.get() || 0;

      if (loc > clo && !appStore.isSyncingRemote.get()) {
        console.log("Auto-syncing to cloud to prevent data loss...");
        syncToGitHub(savedToken).catch(console.error);
      }
    }, 3 * 60 * 1000); // 3 minutes

    return () => clearInterval(autoSyncInterval);
  }, []);

  const worldNations =
    bookIdx >= 0
      ? appStore.books[bookIdx].nations.get() || EMPTY_ARR
      : EMPTY_ARR;
  const worldTechniques =
    bookIdx >= 0
      ? appStore.books[bookIdx].techniques.get() || EMPTY_ARR
      : EMPTY_ARR;
  const worldIngredients =
    bookIdx >= 0
      ? appStore.books[bookIdx].ingredients.get() || EMPTY_ARR
      : EMPTY_ARR;
  const worldMonsters =
    bookIdx >= 0
      ? appStore.books[bookIdx].monsters.get() || EMPTY_ARR
      : EMPTY_ARR;
  const worldTreasures =
    bookIdx >= 0
      ? appStore.books[bookIdx].treasures.get() || EMPTY_ARR
      : EMPTY_ARR;
  const worldCount = useMemo(
    () =>
      (worldNations?.length || 0) +
      (worldTechniques?.length || 0) +
      (worldIngredients?.length || 0) +
      (worldMonsters?.length || 0) +
      (worldTreasures?.length || 0),
    [
      worldNations?.length,
      worldTechniques?.length,
      worldIngredients?.length,
      worldMonsters?.length,
      worldTreasures?.length,
    ],
  );

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

  const isFullyLoaded = useSelector(() => {
    const activeId = appStore.activeBookId.get();
    if (!activeId) return false;
    const books = appStore.books.get() || [];
    const book = books.find((b) => b && b.id === activeId);
    return !!book?.isFullyLoaded;
  });

  const hasUnsyncedChanges = useSelector(() => {
    const loc = appStore.lastModifiedLocal.get() || 0;
    const clo = appStore.lastSyncedCloud.get() || 0;
    return loc > clo;
  });

  // If there's no bookId in the URL, we're likely on the root path (BookListPage)
  if (!bookId) {
    return (
      <Suspense
        fallback={<div style={styles.loaderWrapper}>Loading list...</div>}
      >
        <Outlet />
      </Suspense>
    );
  }

  // If we have a bookId but it's not fully loaded yet (or not even in memory), show loading
  if (!isFullyLoaded || !isInsideBook) {
    return <div style={styles.loaderUniverse}>Loading universe...</div>;
  }

  return (
    <div style={S.app} className="seshat-app">
      {/* ── Top bar ── */}
      <div style={S.top} className="seshat-top">
        <div style={styles.topHeaderLeft}>
          <div style={styles.logoContainer}>
            <button
              className="seshat-mobile-only"
              onClick={() => setShowSidebar(!showSidebar)}
              style={styles.mobileMenuBtn}
            >
              <MenuIcon />
            </button>
            <span
              style={styles.desktopLogo}
              className="seshat-desktop-only"
              onClick={() => navigate("/")}
            >
              Seshat
            </span>
          </div>
          <div style={styles.titleContainer(isWorldPage)}>
            {title || "Untitled World"}
          </div>
        </div>
        <div className="seshat-top-actions" style={styles.topActions}>
          <button
            onClick={() => setShowSearch(true)}
            style={styles.searchBtn}
            title="Global Search & Replace"
          >
            <SearchIcon sx={{ fontSize: 20 }} />
          </button>

          <div className="seshat-desktop-only" style={styles.desktopActions}>
            <button
              onClick={handlePull}
              disabled={isSyncing}
              style={styles.pullBtn(isSyncing)}
              title="Pull latest data from Cloud (overwrite local changes)"
            >
              <CloudSyncIcon
                sx={{ fontSize: 16, transform: "rotate(180deg)" }}
              />
              <span style={{ fontSize: 13, letterSpacing: 1 }}>Pull</span>
            </button>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              style={{ ...styles.syncBtn(isSyncing), position: "relative" }}
              title="Push local data to Cloud"
            >
              {hasUnsyncedChanges && (
                <div
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#eab308",
                    border: "2px solid var(--bg-top)",
                    boxShadow: "0 0 8px rgba(234,179,8,0.5)",
                  }}
                />
              )}
              <CloudSyncIcon sx={{ fontSize: 16 }} />
              <span style={{ fontSize: 13, letterSpacing: 1 }}>
                {isSyncing ? "Syncing..." : "Sync"}
              </span>
            </button>
            <button onClick={() => navigate("/ai")} style={styles.exportBtn}>
              <SmartToyIcon sx={{ fontSize: 16 }} />
              <span style={{ fontSize: 13, letterSpacing: 1 }}>Ask AI</span>
            </button>
            <button
              onClick={() => navigate(`/book/${bookId}/fight`)}
              style={styles.fightBtn(
                location.pathname === `/book/${bookId}/fight`,
              )}
            >
              <SportsKabaddiIcon sx={{ fontSize: 16 }} />
              <span style={{ fontSize: 13, letterSpacing: 1 }}>Fight</span>
            </button>
            <button
              onClick={toggle}
              style={styles.themeBtn}
              title={theme === "light" ? "Dark Mode" : "Light Mode"}
            >
              {theme === "light" ? (
                <DarkModeIcon sx={{ fontSize: 16 }} />
              ) : (
                <LightModeIcon sx={{ fontSize: 16 }} />
              )}
            </button>
            <button
              onClick={handleLogout}
              style={{ ...styles.themeBtn, color: "#ef4444" }}
              title="Secure Logout"
            >
              <LogoutIcon sx={{ fontSize: 16 }} />
              <span style={{ fontSize: 13, letterSpacing: 1 }}>Logout</span>
            </button>
          </div>

          {/* More Menu Toggle (Mobile/Tablet) */}
          <div
            className="seshat-mobile-only"
            style={styles.mobileMoreBtnContainer}
          >
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              style={styles.mobileMoreBtn}
            >
              More ▾
            </button>
          </div>
        </div>
      </div>

      <div style={S.row} className="seshat-row">
        {/* ── Bottom Sheet (Mobile) ── */}
        {showMoreMenu && (
          <>
            <div
              style={styles.moreMenuOverlay}
              onClick={() => setShowMoreMenu(false)}
            />
            <div style={styles.moreMenuDropdown}>
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  navigate("/ai");
                }}
                style={styles.moreMenuBtn(false)}
              >
                <SmartToyIcon sx={{ fontSize: 20 }} />
                Ask AI
              </button>
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  navigate(`/book/${bookId}/fight`);
                }}
                style={styles.moreMenuBtn(
                  location.pathname === `/book/${bookId}/fight`,
                )}
              >
                <SportsKabaddiIcon sx={{ fontSize: 20 }} />
                Fight Mode
              </button>
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  handlePull();
                }}
                disabled={isSyncing}
                style={styles.moreMenuBtn(false)}
              >
                <CloudSyncIcon
                  sx={{ fontSize: 20, transform: "rotate(180deg)" }}
                />
                Pull
              </button>
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  handleSync();
                }}
                disabled={isSyncing}
                style={{
                  ...styles.moreMenuBtn(false),
                  position: "relative" as React.CSSProperties["position"],
                }}
              >
                {hasUnsyncedChanges && (
                  <div
                    style={{
                      position: "absolute",
                      top: 14,
                      left: 32,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#eab308",
                      border: "2px solid var(--bg-card)",
                      boxShadow: "0 0 8px rgba(234,179,8,0.5)",
                    }}
                  />
                )}
                <CloudSyncIcon sx={{ fontSize: 20 }} />
                {isSyncing ? "Syncing..." : "Sync"}
              </button>
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  toggle();
                }}
                style={styles.moreMenuBtn(false)}
              >
                {theme === "light" ? (
                  <LightModeIcon sx={{ fontSize: 20 }} />
                ) : (
                  <DarkModeIcon sx={{ fontSize: 20 }} />
                )}
                {theme === "light" ? "Dark Mode" : "Light Mode"}
              </button>
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  handleLogout();
                }}
                style={{ ...styles.moreMenuBtn(false), color: "#ef4444" }}
              >
                <LogoutIcon sx={{ fontSize: 20 }} />
                Logout
              </button>
            </div>
          </>
        )}
        {/* ── Sidebar Overlay (Mobile) ── */}
        <div
          className={`seshat-sidebar-overlay ${showSidebar ? "open" : ""}`}
          onClick={() => setShowSidebar(false)}
        />

        {/* ── Sidebar ── */}
        <div
          style={S.side}
          className={`seshat-side ${showSidebar ? "open" : ""}`}
        >
          <div
            className="seshat-mobile-only"
            style={styles.mobileBackToBooksContainer}
          >
            <button
              onClick={() => navigate("/")}
              style={styles.mobileBackToBooksBtn}
            >
              ← Back to Books
            </button>
          </div>

          <div style={styles.navContainer}>
            <button
              onClick={() => navigate(`/book/${bookId}/world`)}
              style={navBtnStyle(
                location.pathname === `/book/${bookId}/world` ||
                  (location.pathname === `/book/${bookId}` &&
                    !selChar &&
                    !selEvent &&
                    !selChapter),
              )}
            >
              <PublicIcon sx={{ fontSize: 14 }} />
              {worldCount > 0 ? `World (${worldCount})` : "World"}
            </button>
            <button
              onClick={() => navigate(`/book/${bookId}/lore-web`)}
              style={navBtnStyle(
                location.pathname === `/book/${bookId}/lore-web`,
              )}
            >
              <TimelineIcon sx={{ fontSize: 14 }} />
              Lore Web
            </button>
            <button
              onClick={() => navigate(`/book/${bookId}/assets`)}
              style={navBtnStyle(
                location.pathname.startsWith(`/book/${bookId}/assets`),
              )}
            >
              <FolderOpenIcon sx={{ fontSize: 14 }} />
              Assets
            </button>
            <button
              onClick={() => navigate("/issues")}
              style={navBtnStyle(location.pathname.startsWith("/issues"))}
            >
              <BugReportIcon sx={{ fontSize: 14 }} />
              Issues & Forum
            </button>
          </div>

          <div style={styles.dividerLine} />

          {/* ── Chapters section ── */}
          <div style={styles.navSectionHeader}>
            <div style={styles.navSectionTitleContainer}>
              <button
                onClick={() =>
                  setOpenSections((s) => ({ ...s, chapters: !s.chapters }))
                }
                style={styles.sectionToggleBtn}
              >
                {openSections.chapters ? "▼" : "▶"}
              </button>
              <button
                onClick={() => navigate(`/book/${bookId}/chapters`)}
                style={navBtnStyle(
                  location.pathname.startsWith(`/book/${bookId}/chapters`),
                )}
              >
                <AutoStoriesIcon sx={{ fontSize: 14 }} />
                Chapters ({sortedChapters.length})
              </button>
            </div>
            <button onClick={addChapter} style={styles.sectionAddBtn}>
              <AddIcon sx={{ fontSize: 16 }} />
            </button>
          </div>

          {openSections.chapters && (
            <div>
              {sortedChapters.map((ch: Chapter, idx: number) => (
                <div
                  key={ch.id}
                  draggable
                  onDragStart={(e) => handleSidebarDragStart(e, idx)}
                  onDragOver={(e) => handleSidebarDragOver(e, idx)}
                  onDrop={(e) => handleSidebarDrop(e, idx)}
                  onDragEnd={handleSidebarDragEnd}
                  style={{
                    paddingTop: dragOverChapterIdx === idx ? 8 : 0,
                    boxShadow: dragOverChapterIdx === idx ? "inset 0 2px 0 var(--color-purple)" : "none",
                    transition: "padding-top 0.1s ease, box-shadow 0.1s ease",
                    cursor: "grab"
                  }}
                >
                  <SideItem
                    label={ch.title || "Untitled chapter"}
                    sub={
                      [ch.number, ch.timeRef].filter(Boolean).join(" · ") ||
                      undefined
                    }
                    active={selChapter === ch.id}
                    onClick={() => navigate(`/book/${bookId}/chapters/${ch.id}`)}
                    onDelete={() => delChapter(ch.id)}
                  />
                </div>
              ))}

              {sortedChapters.length === 0 && (
                <div style={styles.emptySectionContainer}>
                  <p style={styles.emptySectionText}>No chapters yet.</p>
                  <button onClick={addChapter} style={styles.createSectionBtn}>
                    + Create Chapter
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Timeline section ── */}
          <div style={styles.navSectionHeaderTimeline}>
            <div style={styles.navSectionTitleContainer}>
              <button
                onClick={() =>
                  setOpenSections((s) => ({ ...s, timeline: !s.timeline }))
                }
                style={styles.sectionToggleBtn}
              >
                {openSections.timeline ? "▼" : "▶"}
              </button>
              <button
                onClick={() => navigate(`/book/${bookId}/events`)}
                style={navBtnStyle(
                  location.pathname.startsWith(`/book/${bookId}/events`),
                )}
              >
                <TimelineIcon sx={{ fontSize: 14 }} />
                Timeline
              </button>
            </div>
            <button onClick={addEvent} style={styles.sectionAddBtn}>
              <AddIcon sx={{ fontSize: 16 }} />
            </button>
          </div>

          {openSections.timeline && (
            <div>
              {sortedEvt.map((e: Event) => {
                const dateTag = [
                  e.startDate && e.startDate.replace("T", " "),
                  e.endDate && `→ ${e.endDate.replace("T", " ")}`,
                ]
                  .filter(Boolean)
                  .join(" ");
                const chTag = (e.chapters || []).length
                  ? `Ch. ${e.chapters.join(", ")}`
                  : "";
                const tag = [chTag, dateTag].filter(Boolean).join(" · ");
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

              {sortedEvt.length === 0 && (
                <div style={styles.emptySectionContainer}>
                  <p style={styles.emptySectionText}>No events mapped.</p>
                  <button onClick={addEvent} style={styles.createSectionBtn}>
                    + Create Event
                  </button>
                </div>
              )}
            </div>
          )}

          <div style={styles.dividerLineSecondary} />

          {/* ── Characters section ── */}
          <div style={styles.navSectionHeader}>
            <div style={styles.navSectionTitleContainer}>
              <button
                onClick={() =>
                  setOpenSections((s) => ({ ...s, characters: !s.characters }))
                }
                style={styles.sectionToggleBtn}
              >
                {openSections.characters ? "▼" : "▶"}
              </button>
              <button
                onClick={() => navigate(`/book/${bookId}/characters`)}
                style={navBtnStyle(
                  location.pathname.startsWith(`/book/${bookId}/characters`),
                )}
              >
                <PeopleIcon sx={{ fontSize: 14 }} />
                Characters
              </button>
            </div>
            <button onClick={addChar} style={styles.sectionAddBtn}>
              <AddIcon sx={{ fontSize: 16 }} />
            </button>
          </div>

          {openSections.characters && (
            <div>
              {characters.map((c: Character) => (
                <SideItem
                  key={c.id}
                  label={c.name}
                  sub={
                    [c.role, c.archetype].filter(Boolean).join(" · ") ||
                    undefined
                  }
                  color={c.color}
                  active={selChar === c.id}
                  onClick={() => navigate(`/book/${bookId}/characters/${c.id}`)}
                  onDelete={() => delChar(c.id)}
                />
              ))}

              {characters.length === 0 && (
                <div style={styles.emptySectionContainer}>
                  <p style={styles.emptySectionText}>No characters created.</p>
                  <button onClick={addChar} style={styles.createSectionBtn}>
                    + Create Character
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Main content ── */}
        <div style={S.main} className="seshat-main" ref={mainRef}>
          <Suspense
            fallback={
              <div style={styles.mainLoaderContainer}>Loading page...</div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </div>

      <GlobalSearchModal
        open={showSearch}
        onClose={() => setShowSearch(false)}
        bookId={bookId || ""}
      />

      {conflictData && bookIdx >= 0 && (
        <ConflictModal
          localBook={appStore.books[bookIdx].get()}
          serverBook={conflictData.serverBook}
          activeChapterId={selChapter}
          onResolve={handleResolveConflicts}
          onCancel={() => setConflictData(null)}
        />
      )}
    </div>
  );
}

const navBtnStyle = (active: boolean): React.CSSProperties => ({
  ...S.ghost,
  padding: "6px 0",
  fontSize: 12,
  letterSpacing: 2,
  justifyContent: "center",
  gap: 8,
  display: "flex",
  flexDirection: "row",
  textTransform: "uppercase",
  color: active ? "var(--text-primary)" : "var(--text-muted)",
});

const styles = {
  loaderWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100dvh",
    width: "100dvw",
    background: "var(--bg-app)",
    color: "var(--text-secondary)",
    fontSize: 13,
    letterSpacing: 2,
    textTransform: "uppercase",
  } as React.CSSProperties,
  loaderUniverse: {
    ...S.app,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-secondary)",
    letterSpacing: 2,
    fontSize: 13,
    textTransform: "uppercase",
  } as React.CSSProperties,
  topHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: 32,
    flex: 1,
  } as React.CSSProperties,
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  } as React.CSSProperties,
  mobileMenuBtn: {
    ...S.ghost,
    padding: 0,
    display: "flex",
    alignItems: "center",
  } as React.CSSProperties,
  desktopLogo: {
    ...S.logo,
    cursor: "pointer",
  } as React.CSSProperties,
  titleContainer: (isWorldPage: boolean) =>
    ({
      flex: 1,
      maxWidth: 500,
      opacity: isWorldPage ? 0 : 1,
      pointerEvents: isWorldPage ? "none" : "auto",
      transform: isWorldPage ? "translateY(8px)" : "translateY(0)",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      fontSize: 15,
      fontWeight: 500,
      color: "var(--text-secondary)",
      padding: "4px 0",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      userSelect: "none",
    }) as React.CSSProperties,
  topActions: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    position: "relative",
    height: "100%",
  } as React.CSSProperties,
  searchBtn: {
    ...S.ghost,
    padding: 8,
    color: "var(--text-secondary)",
    display: "flex",
    alignItems: "center",
  } as React.CSSProperties,
  desktopActions: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  } as React.CSSProperties,
  pullBtn: (isSyncing: boolean) =>
    ({
      ...S.ghost,
      padding: 8,
      display: "flex",
      alignItems: "center",
      gap: 6,
      color: "var(--text-secondary)",
      opacity: isSyncing ? 0.5 : 1,
    }) as React.CSSProperties,
  syncBtn: (isSyncing: boolean) =>
    ({
      ...S.ghost,
      padding: 8,
      display: "flex",
      alignItems: "center",
      gap: 6,
      color: "var(--text-secondary)",
      opacity: isSyncing ? 0.5 : 1,
    }) as React.CSSProperties,
  exportBtn: {
    ...S.ghost,
    padding: 8,
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "var(--text-secondary)",
  } as React.CSSProperties,
  fightBtn: (isActive: boolean) =>
    ({
      ...S.ghost,
      padding: 8,
      display: "flex",
      alignItems: "center",
      gap: 6,
      color: isActive ? "var(--color-red)" : "var(--text-secondary)",
    }) as React.CSSProperties,
  themeBtn: {
    ...S.ghost,
    padding: 8,
    display: "flex",
    alignItems: "center",
    color: "var(--text-secondary)",
  } as React.CSSProperties,
  mobileMoreBtnContainer: {
    position: "relative",
    height: "100%",
    alignItems: "center",
    display: "flex",
  } as React.CSSProperties,
  mobileMoreBtn: {
    ...S.ghost,
    letterSpacing: 2,
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    color: "var(--text-secondary)",
  } as React.CSSProperties,
  moreMenuOverlay: {
    position: "fixed",
    top: 48,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
    backdropFilter: "blur(2px)",
    background: "rgba(0,0,0,0.2)",
  } as React.CSSProperties,
  moreMenuDropdown: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    top: "auto",
    background: "var(--bg-card)",
    borderTop: "1px solid var(--border)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: "32px 16px 48px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    boxShadow: "0 -8px 48px rgba(0,0,0,0.5)",
    zIndex: 100,
  } as React.CSSProperties,
  moreMenuBtn: (isActive: boolean) =>
    ({
      ...S.ghost,
      width: "100%",
      justifyContent: "flex-start",
      padding: "16px 20px",
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      gap: 16,
      fontSize: 16,
      fontWeight: isActive ? 600 : 500,
      color: isActive ? "var(--color-primary)" : "var(--text-primary)",
      background: isActive ? "rgba(255,255,255,0.05)" : "transparent",
    }) as React.CSSProperties,
  mobileBackToBooksContainer: {
    padding: "20px 24px 16px",
  } as React.CSSProperties,
  mobileBackToBooksBtn: {
    ...S.ghost,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    color: "var(--color-primary)",
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 0",
  } as React.CSSProperties,
  navContainer: {
    padding: "24px 24px 12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "start",
    justifyContent: "center",
    gap: 8,
  } as React.CSSProperties,
  navSectionHeader: {
    padding: "0 24px 8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  } as React.CSSProperties,
  navSectionTitleContainer: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  } as React.CSSProperties,
  sectionToggleBtn: {
    ...S.ghost,
    padding: 0,
    fontSize: 10,
    color: "var(--text-muted)",
  } as React.CSSProperties,
  sectionAddBtn: {
    ...S.ghost,
    fontSize: 16,
    display: "flex",
  } as React.CSSProperties,
  emptySectionContainer: {
    padding: "8px 24px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  } as React.CSSProperties,
  emptySectionText: {
    ...S.dim,
    fontSize: 13,
    fontStyle: "italic",
    margin: 0,
  } as React.CSSProperties,
  createSectionBtn: {
    ...S.ghost,
    fontSize: 12,
    padding: "4px 8px",
    background: "var(--bg-card)",
    border: "1px dashed var(--border)",
    borderRadius: 4,
    width: "100%",
  } as React.CSSProperties,
  navSectionHeaderTimeline: {
    padding: "16px 24px 8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  } as React.CSSProperties,
  dividerLine: {
    height: 1,
    background: "var(--border)",
    margin: "8px 0 20px",
  } as React.CSSProperties,
  dividerLineSecondary: {
    height: 1,
    background: "var(--border)",
    margin: "16px 0 20px",
  } as React.CSSProperties,
  mainLoaderContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
    color: "var(--text-secondary)",
    fontSize: 13,
    letterSpacing: 1,
  } as React.CSSProperties,
  exportOverlay: {
    position: "fixed",
    inset: 0,
    background: "var(--bg-export)",
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(2px)",
  } as React.CSSProperties,
  exportContent: {
    width: "min(700px,92vw)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  } as React.CSSProperties,
  exportHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  } as React.CSSProperties,
  exportActions: {
    display: "flex",
    gap: 20,
  } as React.CSSProperties,
  exportCopyBtn: (copied: boolean) =>
    ({
      ...S.ghost,
      color: copied ? "var(--color-green)" : "var(--text-secondary)",
    }) as React.CSSProperties,
  exportTextarea: {
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
  } as React.CSSProperties,
};
