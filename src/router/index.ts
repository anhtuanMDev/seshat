import { lazy, createElement, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import AuthGuard from "../components/AuthGuard";

// Dynamic page imports
const AuthPage = lazy(() => import("../pages/AuthPage"));
const BookListPage = lazy(() => import("../pages/BookListPage"));
const WorldPage = lazy(() => import("../pages/WorldPage"));
const CharacterPage = lazy(() => import("../pages/CharacterPage"));
const CharacterListPage = lazy(() => import("../pages/CharacterListPage"));
const EventPage = lazy(() => import("../pages/EventPage"));
const TimelinePage = lazy(() => import("../pages/TimelinePage"));
const FightPage = lazy(() => import("../pages/FightPage"));
const ChapterPage = lazy(() => import("../pages/ChapterPage"));
const ChapterListPage = lazy(() => import("../pages/ChapterListPage"));
const LoreWebPage = lazy(() => import("../pages/LoreWebPage"));
const IssuesPage = lazy(() => import("../pages/IssuesPage"));
const IssueDetailPage = lazy(() => import("../pages/IssueDetailPage"));

// Fallback spinner element (React Element constant)
const PageLoading = createElement(
  "div",
  {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      width: "100vw",
      background: "var(--bg-app)",
      color: "var(--text-secondary)",
      fontSize: 13,
      letterSpacing: 2,
      textTransform: "uppercase",
    },
  },
  "Loading page..."
);

// Prefetch all dynamic modules when the browser is idle to ensure instant navigation
export const preloadPages = () => {
  const preloads = [
    () => import("../pages/WorldPage"),
    () => import("../pages/CharacterListPage"),
    () => import("../pages/CharacterPage"),
    () => import("../pages/TimelinePage"),
    () => import("../pages/EventPage"),
    () => import("../pages/ChapterListPage"),
    () => import("../pages/ChapterPage"),
    () => import("../pages/LoreWebPage"),
    () => import("../pages/FightPage"),
    () => import("../pages/IssuesPage"),
    () => import("../pages/IssueDetailPage"),
  ];

  const runPreloads = () => {
    preloads.forEach((p) => {
      try {
        p();
      } catch {
        // ignore prefetch errors gracefully
      }
    });
  };

  if (typeof window !== "undefined") {
    const initPreloads = () => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(() => runPreloads());
      } else {
        setTimeout(runPreloads, 1500);
      }
    };

    if (document.readyState === "complete") {
      initPreloads();
    } else {
      window.addEventListener("load", initPreloads);
    }
  }
};

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: createElement(
      Suspense,
      { fallback: PageLoading },
      createElement(AuthPage)
    ),
  },
  {
    path: "/",
    element: createElement(
      AuthGuard,
      null,
      createElement(App)
    ),
    children: [
      {
        index: true,
        element: createElement(
          Suspense,
          { fallback: PageLoading },
          createElement(BookListPage)
        ),
      },
      {
        path: "issues",
        element: createElement(
          Suspense,
          { fallback: PageLoading },
          createElement(IssuesPage)
        ),
      },
      {
        path: "issues/:number",
        element: createElement(
          Suspense,
          { fallback: PageLoading },
          createElement(IssueDetailPage)
        ),
      },
      {
        path: "book/:bookId",
        children: [
          {
            index: true,
            element: createElement(
              Suspense,
              { fallback: PageLoading },
              createElement(WorldPage)
            ),
          },
          {
            path: "world",
            element: createElement(
              Suspense,
              { fallback: PageLoading },
              createElement(WorldPage)
            ),
          },
          {
            path: "characters",
            element: createElement(
              Suspense,
              { fallback: PageLoading },
              createElement(CharacterListPage)
            ),
          },
          {
            path: "characters/:id",
            element: createElement(
              Suspense,
              { fallback: PageLoading },
              createElement(CharacterPage)
            ),
          },
          {
            path: "events",
            element: createElement(
              Suspense,
              { fallback: PageLoading },
              createElement(TimelinePage)
            ),
          },
          {
            path: "events/:id",
            element: createElement(
              Suspense,
              { fallback: PageLoading },
              createElement(EventPage)
            ),
          },
          {
            path: "fight",
            element: createElement(
              Suspense,
              { fallback: PageLoading },
              createElement(FightPage)
            ),
          },
          {
            path: "chapters",
            element: createElement(
              Suspense,
              { fallback: PageLoading },
              createElement(ChapterListPage)
            ),
          },
          {
            path: "chapters/:id",
            element: createElement(
              Suspense,
              { fallback: PageLoading },
              createElement(ChapterPage)
            ),
          },
          {
            path: "lore-web",
            element: createElement(
              Suspense,
              { fallback: PageLoading },
              createElement(LoreWebPage)
            ),
          },
        ],
      },
    ],
  },
]);
