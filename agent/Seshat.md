# Seshat — Project Summary

> A world-building tool for writers and game designers. Built with React + Vite, Legend State, MUI, Anime.js, and React Router.

---

## Table of Contents

1. [Stack Overview](#1-stack-overview)
2. [Project Structure](#2-project-structure)
3. [Routing](#3-routing)
4. [State Management — Legend State](#4-state-management--legend-state)
5. [Animation — Anime.js](#5-animation--animejs)
6. [Page Patterns](#6-page-patterns)
7. [Component Patterns](#7-component-patterns)
8. [Features Map](#8-features-map)
9. [Theme & Style Architecture](#9-theme--style-architecture)
10. [Environment & Config](#10-environment--config)
11. [Migration to TypeScript](#11-migration-to-typescript)
12. [Legend State Patterns & Gotchas](#12-legend-state-patterns--gotchas)
13. [Testing](#13-testing)
14. [Authentication & Cloud Sync](#14-authentication--cloud-sync)
15. [Local Development & Hosting Architecture](#15-local-development--hosting-architecture)
16. [Cloud Database Architecture](#16-cloud-database-architecture)

---

## 1. Stack Overview

| Concern    | Library                                                                                 | Why                                                                                           |
| ---------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Framework  | React 19 + Vite 8                                                                       | Fast HMR, modern JSX transform, ES2023 target                                                 |
| Routing    | React Router v7                                                                         | Nested routes with layout persistence                                                         |
| State      | Legend State                                                                            | Fine-grained reactivity, built-in persistence, no boilerplate                                 |
| Data Fetch | React Query + Axios                                                                     | Async state, caching (configured via queryClient.ts)                                          |
| Validation | Zod                                                                                     | Runtime schema validation                                                                     |
| Forms      | react-hook-form                                                                         | Performant local form state, minimal re-renders                                               |
| UI/Icons   | MUI (Material UI) v9 + @mui/icons-material                                              | Consistent, accessible components; centralized icon exports via `src/components/ui/icons.tsx` |
| Animation  | Anime.js v4                                                                             | Timeline-based, works on DOM refs                                                             |
| Rich text  | Tiptap v3 (StarterKit + Underline, Link, Highlight, TextAlign, Typography, Placeholder) | ProseMirror-based editor with formatting toolbar                                              |
| Node Graph | @xyflow/react + dagre                                                                   | Interactive visual relationship graphs with auto-layout                                       |
| Exporting  | docx + file-saver                                                                       | Generating chapter files as `.docx` directly in the browser                                   |
| Testing    | Vitest + testing-library                                                                | Unit/integration tests with jsdom environment                                                 |

---

## 2. Project Structure

```
seshat/
├── public/
├── src/
│   ├── lib/
│   │   ├── constants.ts        # CHAR_COLORS, EVENT_TYPES, POWER_TIERS, etc.
│   │   ├── utils.ts            # uid(), mkChar(), mkEvent(), S styles object
│   │   ├── export.ts           # buildExport() — world → plaintext
│   │   ├── scoreFighter.ts     # scoreFighter() — combat scoring logic + Note/ScoreResult types
│   │   ├── types.ts            # Shared TypeScript interfaces for entities
│   │   ├── queryClient.ts      # React Query client configuration
│   │   ├── mkChapter.ts        # Factory for generating new chapters
│   │   ├── githubSync.ts       # GitHub API integration functions
│   │   ├── eventSync.ts        # computeEventSync() — synchronizing characters to events
│   │   ├── resolveStatus.ts    # resolveStatusAt() — resolving character status entries by time context
│   │   └── __tests__/          # Unit tests for lib utilities
│   │       ├── utils.test.ts   #   10 tests
│   │       ├── export.test.ts  #   12 tests
│   │       └── export.bench.ts
│   │
│   ├── store/
│   │   ├── appStore.ts         # Multi-book Legend State observable + localStorage persistence
│   │   └── toastStore.ts       # Global toast notification state
│   │
│   ├── hooks/
│   │   ├── useWorldStore.ts    # Typed selectors from legend-state
│   │   ├── useAnimateIn.ts     # Reusable anime.js mount animation
│   │   ├── useTheme.tsx        # Theme context provider (light/dark toggle)
│   │   └── useThemeHook.ts     # useTheme hook for consuming components
│   │
│   ├── components/
│   │   ├── ui/               # Primitive, reusable MUI components
│   │   │   ├── Field.tsx      # MUI TextField wrapper (generic <T extends FieldValues>)
│   │   │   ├── Sel.tsx        # MUI Select wrapper (generic <T extends FieldValues>)
│   │   │   ├── Toggle.tsx     # MUI Button toggle (generic <T extends FieldValues>)
│   │   │   ├── Section.tsx    # Collapsible section wrapper (title accepts ReactNode for icons)
│   │   │   ├── EntryBlock.tsx # Left-border content card (CloseIcon delete button)
│   │   │   ├── SideItem.tsx   # Sidebar nav item (CloseIcon delete button)
│   │   │   ├── GhostButton.tsx # Shared styled ghost button (MUI Button)
│   │   │   ├── EventPicker.tsx # Dropdown for timeline events (generic <T extends FieldValues>)
│   │   │   ├── CharStatusPanel.tsx # Character status badges
│   │   │   ├── Modal.tsx      # Portal-based modal dialog (Escape to close, overlay click to close)
│   │   │   ├── icons.tsx      # Centralized MUI icon re-exports (35 named exports)
│   │   │   ├── index.ts       # Barrel export (includes icons via `export *`)
│   │   │   └── __tests__/     # Component smoke tests
│   │   │       ├── Field.test.tsx
│   │   │       ├── Sel.test.tsx
│   │   │       ├── Toggle.test.tsx
│   │   │       └── EventPicker.test.tsx
│   │   │
│   │   ├── editor/
│   │   │   ├── RichEditor.tsx         # Tiptap-based rich text editor with formatting toolbar
│   │   │   ├── MentionExtension.ts    # Tiptap @mention character linking extension
│   │   │   ├── PinPointExtension.ts   # Tiptap pinpoint comment extension
│   │   │   ├── CharMentionTooltip.tsx # Tooltip for hovering mentioned characters
│   │   │   ├── MentionHelpButton.tsx  # Help popover for mention syntax
│   │   │   └── UnsavedGuard.tsx       # Route transition guard for unsaved editor changes
│   │   │
│   │   ├── fight/             # FightPage sub-components
│   │   │   ├── FighterPicker.tsx  # Character + event dropdown
│   │   │   ├── WinBar.tsx        # Win percentage bar (memo)
│   │   │   ├── SnapshotCard.tsx  # Event snapshot card (memo)
│   │   │   ├── ScoreBreakdown.tsx # Score breakdown with NoteRow list
│   │   │   └── NoteRow.tsx       # Score breakdown row (memo)
│   │   │
│   │   ├── character/         # CharacterPage sub-components
│   │   │   ├── types.ts       # CharacterForm interface
│   │   │   ├── TraumaBlock.tsx
│   │   │   ├── ConditionBlock.tsx
│   │   │   ├── AchievementBlock.tsx
│   │   │   ├── LossBlock.tsx
│   │   │   ├── ArcBlock.tsx
│   │   │   └── StatusBlock.tsx
│   │   │
│   │   ├── world/             # WorldPage sub-components
│   │   │   ├── types.ts       # WorldForm interface
│   │   │   ├── NationBlock.tsx # Nations with periodActive, connections (diplomacy), allianceLogic
│   │   │   ├── NationConnectionBlock.tsx # Individual diplomatic relation entry
│   │   │   ├── TechniqueBlock.tsx
│   │   │   ├── IngredientBlock.tsx
│   │   │   ├── MonsterBlock.tsx
│   │   │   └── TreasureBlock.tsx
│   │   │
│   │   ├── event/
│   │   │   └── CharacterAttrsBlock.tsx  # EventPage per-character attribute editor
│   │   │
│   │   ├── chapter/           # ChapterPage sub-components (344 lines total)
│   │   │   ├── ChapterToolbar.tsx    # Save/focus/refs buttons (memo)
│   │   │   ├── PinnedContextStrip.tsx # Pinned char/event badges
│   │   │   ├── ReferencePanel.tsx    # 3-tab sidebar panel
│   │   │   ├── ContextTag.tsx        # Toggleable context pill button (memo)
│   │   │   ├── CharCard.tsx          # Character quick-ref card
│   │   │   ├── EventRef.tsx          # Event quick-ref card
│   │   │   └── WorldTabContent.tsx    # World info display (memo)
│   │   │
│   │   └── __tests__/         # Render performance tests
│   │       └── renderPerformance.test.tsx  # 18 tests
│   │
│   ├── pages/
│   │   ├── BookListPage.tsx     # 143 lines — book manager (list, create, rename, delete books)
│   │   ├── WorldPage.tsx        # 112 lines — world sheet (nations, techniques, etc.)
│   │   ├── CharacterPage.tsx    # 220 lines — full character sheet (with modal-based array item editing via Modal.tsx)
│   │   ├── CharacterListPage.tsx # 288 lines — character list (card-based with hover effects, stat pills)
│   │   ├── EventPage.tsx        # 252 lines — event sheet + character attributes
│   │   ├── ChapterPage.tsx      # ~300 lines — chapter prose editor with always-on RichEditor + reference panel
│   │   ├── ChapterListPage.tsx  # 237 lines — chapter list (card-based with word count)
│   │   ├── TimelinePage.tsx     # 326 lines — timeline (visual vertical-line layout with event cards)
│   │   ├── FightPage.tsx        # 162 lines — fight simulator
│   │   ├── AuthPage.tsx         # 179 lines — authentication page (login/register)
│   │   ├── LoreWebPage.tsx      # 326 lines — interactive node graph of world lore
│   │   └── __tests__/           # Page logic tests
│   │       ├── FightPage.test.ts  # 22 tests
│   │       └── FightPage.bench.ts
│   │
│   ├── test/
│   │   └── setup.ts             # Vitest setup (localStorage stub, jest-dom matchers)
│   │
│   ├── router/
│   │   └── index.tsx            # createBrowserRouter definition
│   │
│   ├── App.tsx                  # Root layout (topbar + sidebar)
│   └── main.tsx                 # App entry — providers wrapper
│
├── .nvmrc                     # Node.js v24 requirement
├── kilo.json
└── package.json
```

**Total: 182 tests across 27 test files. 11 pages totaling ~2300 lines (incl. icons). Note: API sync logic (including race condition and data-loss edge cases) is explicitly tested. Core pages like ChapterPage, CharacterPage, and WorldPage now have comprehensive edge-to-edge testing.**

---

## 3. Routing

```tsx
// src/router/index.tsx
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "/",
    element: (
      <AuthGuard>
        <App />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <BookListPage /> },
      {
        path: "book/:bookId",
        children: [
          { index: true, element: <WorldPage /> },
          { path: "world", element: <WorldPage /> },
          { path: "characters", element: <CharacterListPage /> },
          { path: "characters/:id", element: <CharacterPage /> },
          { path: "events", element: <TimelinePage /> },
          { path: "events/:id", element: <EventPage /> },
          { path: "fight", element: <FightPage /> },
          { path: "chapters", element: <ChapterListPage /> },
          { path: "chapters/:id", element: <ChapterPage /> },
          { path: "lore-web", element: <LoreWebPage /> },
        ],
      },
    ],
  },
]);

// `/auth` handles login and registration.
// Root `/` shows BookListPage (multi-book manager), protected by AuthGuard.
// All world/character/event/chapter/fight/lore-web routes are nested under `/book/:bookId`.
```

---

## 4. State Management — Legend State

### Store definition (`src/store/appStore.ts`)

The store supports **multiple books**, each containing a complete independent world state. All books and the active book ID are persisted under a single localStorage key (`seshat-app`).

```ts
import { observable } from "@legendapp/state";
import {
  configureObservablePersistence,
  persistObservable,
} from "@legendapp/state/persist";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";

configureObservablePersistence({ pluginLocal: ObservablePersistLocalStorage });

export const appStore = observable({
  activeBookId: null as string | null,
  books: [] as BookData[],
});

persistObservable(appStore, { local: "seshat-app" });
```

Each `BookData` contains: `id`, `title`, `synopsis`, `setting`, `themes`, `rules`, `nations[]`, `techniques[]`, `ingredients[]`, `monsters[]`, `treasures[]`, `events[]`, `characters[]`, `chapters[]`.

### Typed selectors (`src/hooks/useWorldStore.ts`)

Hooks are scoped to the active book (identified by `appStore.activeBookId`):

```ts
import { useSelector } from "@legendapp/state/react";
import { appStore } from "../store/appStore";

export const useActiveBookIdx = () =>
  useSelector(() => {
    const activeId = appStore.activeBookId.get();
    return appStore.books.get().findIndex((b) => b.id === activeId);
  });

export const useWorldTitle = () => {
  const idx = useActiveBookIdx();
  return useSelector(() => (idx >= 0 ? appStore.books[idx].title.get() : ""));
};
// ... same pattern for synopsis, setting, themes, rules,
//     events, characters, nations, techniques, ingredients,
//     monsters, treasures, chapters
```

---

## 5. Animation — Anime.js

### Hook (`src/hooks/useAnimateIn.ts`)

```ts
import { useEffect, useRef } from "react";
import { animate } from "animejs";

export function useAnimateIn(options: Partial<AnimationParams> = {}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    animate(ref.current, {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 260,
      easing: "easeOutQuad",
      ...options,
    });
  }, []);

  return ref;
}
```

---

## 6. Page Patterns

Pages use **react-hook-form** for local form state. Edits are held in local state and only persisted to the Legend State store when the user presses a **Save** button. This avoids writing to the observable on every keystroke.

### Common Pattern

```tsx
import { useForm, useWatch } from "react-hook-form";
import type { Control } from "react-hook-form";
import { useActiveBookIdx, appStore } from "../store/appStore";
import { useSelector } from "@legendapp/state/react";

// Inside component:
const bookIdx = useActiveBookIdx();
const entity = useSelector(() =>
  bookIdx >= 0
    ? appStore.books[bookIdx].collection
        .get()
        .find((x: { id: string }) => x.id === entityId)
    : undefined,
);
const entityIdx = useSelector(() =>
  bookIdx >= 0
    ? appStore.books[bookIdx].collection
        .get()
        .findIndex((x: { id: string }) => x.id === entityId)
    : -1,
);

interface MyForm {
  field1: string;
  field2: string;
}

// Inside component:
const { register, handleSubmit, control, reset, setValue } = useForm<MyForm>({
  defaultValues: { field1: "", field2: "" },
});

// Initialize from store when entity loads
useEffect(() => {
  if (entity) reset({ field1: entity.field1, field2: entity.field2 });
}, [entity?.id, reset]);

// Top-level useWatch for reactive reads (safer than watch() for React Compiler)
const field1 = useWatch({ control, name: "field1" });

// Save writes to Legend State (per-field .set() — verbose but fully type-safe)
const onSubmit = (data: MyForm) => {
  if (bookIdx < 0) return;
  const c = appStore.books[bookIdx].collection.get()[entityIdx];
  c.field1.set(data.field1);
  c.field2.set(data.field2);
};

// Sub-components for array items (required — useWatch cannot be called inside loops)
interface ItemBlockProps {
  control: Control<MyForm>;
  index: number;
  onDelete: () => void;
}

function ItemBlock({ control, index, onDelete }: ItemBlockProps) {
  const value = useWatch({ control, name: `items.${index}.field` as const });
  return (
    <Field
      value={value}
      onChange={(v) => setValue(`items.${index}.field`, v)}
    />
  );
}

// In JSX:
//   Native inputs → register()
//   MUI Field/Sel → useWatch({ control, name }) for value, setValue(name, v) for change
//   Arrays        → top-level useWatch + sub-component per item index
//   Save button   → handleSubmit(onSubmit)
```

### Page Size Summary

| Page              | Lines | Extracted sub-components                                                                                                                       | Icons added                                                                           |
| ----------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| WorldPage         | 112   | 5 world blocks (Nation, Technique, Ingredient, Monster, Treasure)                                                                              | Section icons: Flag, Build, Science, BugReport, Diamond; SaveIcon                     |
| CharacterPage     | 220   | 6 character blocks (Arc, Status, Trauma, Condition, Achievement, Loss) + CharStatusPanel + ArrayItemCard + Modal                               | Section icons: Timeline, Badge, Psychology, Route, MedicalInfo, EmojiEvents; SaveIcon |
| CharacterListPage | 288   | CharacterCard, StatPill (Features multi-select export mode)                                                                                    | PeopleIcon, AddIcon, ArticleIcon                                                      |
| EventPage         | 252   | CharacterAttrsBlock                                                                                                                            | SaveIcon, ScheduleIcon, CalendarTodayIcon, LocationOnIcon; PeopleAltIcon in block     |
| TimelinePage      | 326   | EventCard                                                                                                                                      | TimelineIcon, AddIcon                                                                 |
| ChapterPage       | ~300  | ReferencePanel, PinnedContextStrip, ChapterToolbar (floating on scroll, always-on RichEditor), ContextTag, CharCard, EventRef, WorldTabContent | SaveIcon, ArticleIcon in toolbar; People/EventNote/Public on tabs; NotesIcon          |
| ChapterListPage   | 237   | ChapterCard                                                                                                                                    | AutoStoriesIcon, AddIcon                                                              |
| FightPage         | 162   | FighterPicker, WinBar, SnapshotCard, ScoreBreakdown, NoteRow                                                                                   | SportsKabaddiIcon (title), CameraAltIcon (Snapshot)                                   |
| AuthPage          | 179   | None                                                                                                                                           | VisibilityIcon, VisibilityOffIcon                                                     |
| LoreWebPage       | 326   | None                                                                                                                                           | None                                                                                  |

### BookListPage (`/`)

Multi-book manager. Lists all books with create/delete actions. Clicking a book navigates to `/book/:id/world`. Each book is an independent world — no data shared between books. New books start with a single "The story begins" event.

### WorldPage (`/book/:bookId/world`)

Renders world metadata and five world entity sections (Nations, Techniques, Ingredients, Monsters, Treasures). Uses react-hook-form with `useWatch`/`setValue` for all fields; array add/remove via generic typed `addItem`/`delItem` that uses `WorldForm[F][number]` to infer the element type from the field name, eliminating `any` casts. Five extracted block components in `src/components/world/`.

Nation blocks include `periodActive` (time range the nation existed), structured `connections[]` (diplomatic relations with other nations — alliance, war, trade, vassal, etc.), and `allianceLogic` (free-text diplomatic landscape description). Connections are edited via `NationConnectionBlock` sub-component. Add/remove logic for connections lives in `WorldPage` alongside the existing nation add/remove handlers.

### CharacterPage (`/book/:bookId/characters/:id`)

Full character sheet with Identity, Psychology, Status Timeline, Character arc, Conditions, Equipment, Achievements & Losses sections. Uses react-hook-form with **`useWatch`** instead of `watch()` (required for React Compiler compatibility). Each array type (arcs, status, traumas, conditions, equipment, achievements, losses) has its own sub-component in `src/components/character/` (e.g. `ArcBlock`, `StatusBlock`, `EquipmentBlock`). The Status Timeline and Arcs sections both use modal-based array editing. `onSubmit` uses explicit per-field `.set()` calls.

### EventPage (`/book/:bookId/events/:id`)

Event editor with per-character attributes (power tier, arc stage, emotional state, etc.). Uses react-hook-form for event fields; character attribute overrides for this event are held in a separate `useState<Record<string, EventAttributes>>`. Character attribute editor extracted to `CharacterAttrsBlock` in `src/components/event/`.

### ChapterPage (`/book/:bookId/chapters/:id`)

Chapter prose editor with a reference panel (characters, events, world info). Uses react-hook-form for all chapter fields. Body field uses a Tiptap-based RichEditor (always visible) with a formatting toolbar (bold, italic, underline, headings, lists, blockquote, code, link, highlight). Reference panel, toolbar, pinned-context strip extracted to `src/components/chapter/`.

### FightPage (`/book/:bookId/fight`)

Combat simulation comparing two characters with a weighted score breakdown. Uses `scoreFighter()` from `src/lib/scoreFighter.ts`. Display components (WinBar, SnapshotCard, ScoreBreakdown, NoteRow, FighterPicker) extracted to `src/components/fight/`.

### AuthPage (`/auth`)

Login and registration page. Handles generating JWT tokens via Cloudflare worker and persisting them to `localStorage` or `sessionStorage`.

### LoreWebPage (`/book/:bookId/lore-web`)

Interactive directed node graph visualizing connections between characters, nations, events, and treasures. Includes a temporal timeline slider to visualize relationships at specific points in time. Uses `@xyflow/react` and `dagre` for layout.

### TimelinePage / ChapterListPage / CharacterListPage

CRUD-style list pages using `EntryBlock` + `Section` with inline Field/Sel components. Lean at 108–132 lines each.

---

## 7. Component Patterns

### UI primitives (`src/components/ui/`)

All accept `value` + `onChange` (uncontrolled) or `control` + `name` (controlled via react-hook-form):

| Component         | Props                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `Field`           | `{ label: ReactNode, value?, onChange?, control?, name?, multi?, rows? }`                                               |
| `Sel`             | `{ label, value?, onChange?, control?, name?, opts }`                                                                   |
| `Toggle`          | `{ label, value, onChange }`                                                                                            |
| `Section`         | `{ title: ReactNode, children, action?, defaultOpen? }`                                                                 |
| `EntryBlock`      | `{ color, onDelete, children }` (CloseIcon delete button)                                                               |
| `SideItem`        | `{ label, sub?, active, color?, onClick, onDelete? }` (CloseIcon delete)                                                |
| `GhostButton`     | MUI `styled(Button)` — shared ghost button across pages                                                                 |
| `EventPicker`     | `{ label, value, onChange, events[] }`                                                                                  |
| `Modal`           | `{ title, onClose, children, footer? }` — portal-based modal, Escape to close, overlay click to close, body scroll lock |
| `CharStatusPanel` | `{ statusTimeline, color, events, onChange }`                                                                           |
| `icons.tsx`       | 37 named re-exports from `@mui/icons-material`; import via `../ui/icons` or barrel                                      |

### React.memo usage

Leaf display components wrapped in `React.memo` to prevent unnecessary re-renders when parent state changes but props are stable:

| Component         | File                      | Props type                  |
| ----------------- | ------------------------- | --------------------------- |
| `WinBar`          | `src/components/fight/`   | All primitives              |
| `NoteRow`         | `src/components/fight/`   | `Note` object               |
| `SnapshotCard`    | `src/components/fight/`   | Primitives + optional Event |
| `ContextTag`      | `src/components/chapter/` | Primitives + callback       |
| `WorldField`      | `src/components/chapter/` | Primitives                  |
| `WorldTabContent` | `src/components/chapter/` | All strings                 |

Components receiving object/array props (e.g. `PinnedContextStrip`, `ScoreBreakdown`) are not memoized — they would need a custom comparator.

### Icon Usage

Icons are imported from `@mui/icons-material` via `src/components/ui/icons.tsx` (centralized re-exports for tree-shaking and easy swapping). Key conventions:

- Pass icon + text as `ReactNode` to `Section.title` and `Field.label` (both accept `ReactNode`)
- Use `sx={{ fontSize: N }}` for sizing (no hardcoded `width`/`height`)
- Use CSS variable colors via `sx={{ color: "var(--var-name)" }}` — icons inherit theme automatically
- `transition: none` is set on SVG paths in `index.css` (line 154-157) to prevent flicker on theme toggle
- Icons are grouped with their label text (never standalone without a textual label)

| Icon                                | Context                                                       |
| ----------------------------------- | ------------------------------------------------------------- |
| `PublicIcon`                        | World nav, World tab in reference panel                       |
| `AutoStoriesIcon`                   | Chapters nav, Chapters list page                              |
| `TimelineIcon`                      | Timeline nav, Status Timeline section                         |
| `PeopleIcon`/`PeopleAltIcon`        | Characters nav, Characters present                            |
| `SportsKabaddiIcon`                 | Fight nav, Fight page title                                   |
| `FileDownloadIcon`                  | Export button                                                 |
| `LightModeIcon`/`DarkModeIcon`      | Theme toggle                                                  |
| `AddIcon`                           | Add button (sidebar headers, list pages)                      |
| `CloseIcon`/`DeleteIcon`            | Remove/delete buttons (EntryBlock, SideItem, CharStatusPanel) |
| `SaveIcon`                          | Save button (all pages)                                       |
| `ExpandMoreIcon`/`ChevronRightIcon` | Section collapse/expand                                       |
| `FlagIcon`                          | Nations section                                               |
| `BuildIcon`                         | Techniques section                                            |
| `ScienceIcon`                       | Ingredients section                                           |
| `BugReportIcon`                     | Monsters section                                              |
| `DiamondIcon`                       | Treasures section                                             |
| `BadgeIcon`                         | Identity section (Character page)                             |
| `PsychologyIcon`                    | Psychological core, Scene motive                              |
| `RouteIcon`                         | Character arc section                                         |
| `CrisisAlertIcon`                   | Traumas sub-header                                            |
| `MedicalInformationIcon`            | Conditions section                                            |
| `EmojiEventsIcon`                   | Achievements sub-header                                       |
| `HeartBrokenIcon`                   | Losses sub-header                                             |
| `ScheduleIcon`                      | Time field (Event page)                                       |
| `CalendarTodayIcon`                 | Start/End date fields, Status From/To                         |
| `LocationOnIcon`                    | Setting/location field                                        |
| `CameraAltIcon`                     | Snapshot card (Fight page)                                    |
| `CenterFocusStrongIcon`             | Focus mode button (Chapter toolbar)                           |
| `ArticleIcon`                       | Refs panel button (Chapter toolbar)                           |
| `EventNoteIcon`                     | Events tab (reference panel)                                  |
| `NotesIcon`                         | Chapter notes, AI narrator note                               |

### RichEditor (`src/components/editor/RichEditor.tsx`)

Tiptap-based rich text editor with inline `MenuBar` toolbar. Always shown for the chapter body field. Supports both controlled (via `react-hook-form` `Control` + `name`) and uncontrolled (`content` + `onChange`) usage. Tiptap extensions enabled: `StarterKit` (bold, italic, strike, heading, lists, blockquote, code), `Underline`, `Link` (prompt-based URL), `Highlight`, `TextAlign`, `Typography`, `Placeholder`, custom **`MentionExtension`** (allows `@CharacterName` linking), and custom **`PinPointExtension`** (allows dropping 📍 pinpoint comments that display on the side). ProseMirror styling in `index.css` for headings, lists, blockquote, code, links, mentions, pinpoints, and placeholder. Includes `UnsavedGuard` logic to prevent accidental navigation away from dirty forms.

### Domain-specific components

Each domain directory mirrors a page and contains components that are only used by that page:

- `src/components/fight/` — 5 components for FightPage
- `src/components/character/` — 6 blocks + types for CharacterPage
- `src/components/world/` — 5 blocks + types + NationConnectionBlock for WorldPage
- `src/components/event/` — 1 block for EventPage
- `src/components/chapter/` — 7 components for ChapterPage

---

## 8. Features Map

| Feature            | Location                        | Store path                                                                                                                                                                                                                                       |
| ------------------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Books              | `BookListPage`                  | `appStore.books[]`, `.activeBookId`                                                                                                                                                                                                              |
| World meta         | `WorldPage`                     | `appStore.books[i].title`, `.synopsis`, `.setting`, `.themes`, `.rules`                                                                                                                                                                          |
| Nations            | `WorldPage`                     | `appStore.books[i].nations[]` (periodActive, connections[], allianceLogic)                                                                                                                                                                       |
| Techniques         | `WorldPage`                     | `appStore.books[i].techniques[]`                                                                                                                                                                                                                 |
| Ingredients        | `WorldPage`                     | `appStore.books[i].ingredients[]`                                                                                                                                                                                                                |
| Monsters           | `WorldPage`                     | `appStore.books[i].monsters[]`                                                                                                                                                                                                                   |
| Treasures          | `WorldPage`                     | `appStore.books[i].treasures[]`                                                                                                                                                                                                                  |
| Characters         | `CharacterPage`                 | `appStore.books[i].characters[]`                                                                                                                                                                                                                 |
| Arcs               | `CharacterPage`                 | `.arcs[]`                                                                                                                                                                                                                                        |
| Status Timeline    | `CharacterPage`                 | `.statusTimeline[]` (includes role, archetype, power, states)                                                                                                                                                                                    |
| Traumas            | `CharacterPage`                 | `.traumas[]`                                                                                                                                                                                                                                     |
| Conditions         | `CharacterPage`                 | `.conditions[]`                                                                                                                                                                                                                                  |
| Achievements       | `CharacterPage`                 | `.achievements[]`                                                                                                                                                                                                                                |
| Losses             | `CharacterPage`                 | `.losses[]`                                                                                                                                                                                                                                      |
| Events             | `EventPage`                     | `appStore.books[i].events[]` (chapters[], startDate, endDate)                                                                                                                                                                                    |
| Event attributes   | `EventPage`                     | `appStore.books[i].characters[j].attributes[eventId]`                                                                                                                                                                                            |
| Chapters           | `ChapterPage`                   | `appStore.books[i].chapters[]`                                                                                                                                                                                                                   |
| Fight sim          | `FightPage`                     | Read-only computed via `src/lib/scoreFighter.ts`                                                                                                                                                                                                 |
| Export             | `App.tsx` / `CharacterListPage` | `buildExport()` modal in App.tsx, batch export in list page                                                                                                                                                                                      |
| Theme toggle       | `App.tsx`                       | `localStorage('seshat-theme')`                                                                                                                                                                                                                   |
| @mentions          | `RichEditor`                    | Multi-trigger Tiptap Mention extension (@, #, %, ~, ^, $)                                                                                                                                                                                        |
| Unsaved Guard      | `RichEditor`                    | Warns users before navigating away with unsaved changes                                                                                                                                                                                          |
| Global Search      | `App.tsx` topbar                | `GlobalSearchModal` component with safe recursive deep regex replacement                                                                                                                                                                         |
| Lore Web           | `LoreWebPage`                   | Interactive directed node graph with Temporal Timeline slider mapping connections                                                                                                                                                                |
| Status Resolution  | `resolveStatus`                 | Computes active character status entry based on chapter timeline context                                                                                                                                                                         |
| Toast System       | `toastStore.ts`                 | Global temporary notifications system for user actions                                                                                                                                                                                           |
| Continuity Tracker | `ChapterPage`                   | Offline, mention-based dynamic checklist extracting Traumas and Core Wounds from pinned characters                                                                                                                                               |
| Temporal Rels      | `CharacterPage`                 | `RelationshipBlock` mapping relationship evolution timelines                                                                                                                                                                                     |
| Scene Outlining    | `ChapterPage`                   | `SceneOutlinePanel` for Beat Sheet generation (Goal, POV, Conflict, Outcome)                                                                                                                                                                     |
| Cloud Sync         | `lib/githubSync`                | Push (Sync) & Pull mechanisms syncing `appStore` to GitHub branch                                                                                                                                                                                |
| Lazy Loading       | `lib/loadBook`                  | Strips massive chapter bodies AND historical drafts payloads from RAM; dynamically fetches them into ChapterPage                                                                                                                                 |
| Mobile Overlay     | `ChapterPage`                   | Drawer-style overlay backdrop for ReferencePanel on small screens                                                                                                                                                                                |
| Dynamic Mentions   | `MentionExtension`              | Tiptap custom nodes dynamically resolve entity names from store state during render/export                                                                                                                                                       |
| Bi-Di Linking      | `EventPage`                     | Inverse timeline querying mapping pinned events back to Chapters                                                                                                                                                                                 |
| Draft Versioning   | `ChapterPage`                   | `DraftsPanel` allowing authors to snapshot, name, and restore historical body text drafts. The `sync.ts` pipeline includes draft recovery logic to prevent orphaned historical drafts from being deleted if a sync arrives without body context. |
| Foreshadow Tracker | `ChapterPage`                   | `ForeshadowPanel` tracking planted ideas to payoff chapters (`appStore.books[i].foreshadows[]`)                                                                                                                                                  |
| Subplot Tracking   | `TimelinePage`                  | `Event` filtering and tagging by `subplot` property                                                                                                                                                                                              |
| Global Glossary    | `App.tsx`                       | `GlobalSearchModal` extended to instantly search nations, techniques, ingredients, monsters, treasures                                                                                                                                           |
| Issue Tracker      | `IssuesPage`                    | Direct integration with GitHub Issues API to submit bugs and feedback (`lib/githubIssues`)                                                                                                                                                       |
| Equipment Config   | `CharacterPage`                 | `EquipmentBlock` managing loadouts, dynamically resolved via `resolveEquipment.ts`                                                                                                                                                               |
| AI Chat Interface  | `AIChatModal`                   | Unified BYOK OpenAI-compatible chat interface natively parsing the world context `buildExport()`                                                                                                                                                 |
| Batch Export       | `lib/export`                    | `/api/github/exportChapters` GraphQL endpoint fetches bulk chapter bodies for DOCX generation                                                                                                                                                    |

---

### Continuity Tracker Rules

The Continuity Tracker is an offline, non-AI rule engine embedded in the Chapter Editor's Reference Panel (`ContinuityTracker.tsx`). It dynamically checks prose context without making external API calls.
**How it tracks active constraints:**

1. **Explicit Pinning:** Any character manually pinned to the chapter via the sidebar is tracked.
2. **Implicit @Mentions:** Any character explicitly tagged in the Tiptap editor using `@` (stored as `data-mention-id`) is tracked.
3. **Implicit Name Match:** Any string match of a character's exact `name` in the plain text body will automatically track them.
   Once a character is marked active in the current chapter, the Tracker extracts their **Core Wound** and all **unresolved Traumas**, compiling them into a visual checklist for the author. This ensures story consistency regarding physical and psychological limitations during scene writing.

### Dynamic Mentions (`MentionExtension`)

The Tiptap text editor uses a multi-trigger custom node extension to bind plain text to specific world entities.
**Triggers & Resolution:**

- `@` -> Characters (`appStore.books[i].characters`)
- `#` -> Nations (`appStore.books[i].nations`)
- `%` -> Monsters (`appStore.books[i].monsters`)
- `~` -> Ingredients (`appStore.books[i].ingredients`)
- `^` -> Techniques (`appStore.books[i].techniques`)
- `$` -> Treasures (`appStore.books[i].treasures`)
  **Rules:** Mentions store only the unique `id` and the `trigger` character in the HTML (`<span data-mention-id="123" data-trigger="@">`). They do **not** store the name. During rendering or DOCX export, the name is dynamically resolved from the `appStore`. If an entity is renamed in the sidebar, every mention of them across the entire book updates instantly.

### Foreshadow Tracker

A structural tracking system to ensure setups are properly paid off.
**Rules:** A Foreshadow requires two chapters: a `plantChapterId` (where the idea is introduced) and a `payoffChapterId` (where it resolves).

- It exists in three states: `Planted`, `Payoffed`, and `Abandoned`.
- When viewing a Chapter, the `ForeshadowPanel` filters the global `appStore.books[i].foreshadows` array to only show items where the current chapter is either the Plant or the Payoff, allowing the author to immediately see what promises they need to keep in the current scene.

### Bi-Directional (Bi-Di) Linking

Seshat uses implicit inverse querying rather than explicit back-pointers.
**Rules:** When you pin a Character or an Event to a Chapter, you are modifying the Chapter's `pinnedChars` and `pinnedEventIds` arrays. You are NOT modifying the Character or Event objects.

- When you view an Event in the `EventPage`, it runs a computed selector to map through all Chapters, find which ones contain its `id` in their `pinnedEventIds`, and generates a "Mentioned In" list dynamically.

### Smart Character Sync (Events)

A quality-of-life feature to automatically sync characters to an Event based on chapter linkages. A Chapter distinguishes between the primary event it **Takes Place At** (`timeRef`) and events it merely **Mentions** (`pinnedEventIds`).
**Rules:** The system strictly aggregates characters _only_ to the primary event.

- **Takes Place At (Auto-Add):** When a Chapter sets its `timeRef` event (via the Chapter header "When did this chapter take place?"), all characters pinned to that Chapter are immediately aggregated and pushed into that specific Event's `characters` list upon saving.
- **Mentions (Ignored):** Events listed in a chapter's `pinnedEventIds` (Mentions) do _not_ automatically inherit the chapter's characters.
- **Event Page (Auto-Remove):** When viewing an Event Page, if you unpin a Chapter, the system identifies characters unique to that Chapter. It then checks the Event's `charAttrs` state. If the character has _any_ non-blank attributes set (meaning the user actively planned them for this event), they are protected. If their attributes are blank, they are safely auto-removed.
- **Event Page (Clearing Links):** Unpinning a chapter from the Event Page safely clears the chapter from both the Event's `chapters` array and deletes the Chapter's `timeRef` and `pinnedEventIds` references to that event.

### Cloud Sync Architecture (Local-First)

Seshat uses a **Local-First** architecture. The browser's `localStorage` (via Legend State) is the absolute source of truth to guarantee zero-latency navigation and offline capabilities.
**Rules:**

- **`isFullyLoaded` Bypass:** When navigating to a book, if the local memory already flags it as `isFullyLoaded: true`, the app _will not_ automatically fetch from GitHub. This protects offline, unsaved edits from being overwritten by stale cloud data.
- **Push (Sync):** Pushes the current local state to the cloud.
- **Pull:** Forces a fetch from GitHub, aggressively overwriting local memory with the cloud state. This is required when switching devices or environments (e.g., from `localhost` to `production`) because `localStorage` is domain-isolated, meaning the production site won't know about changes made on localhost unless explicitly told to Pull.

### Fight Simulation (`scoreFighter.ts`)

`scoreFighter` compares two characters' power levels, skills, and equipment against modifiers (curses, statuses, event arcs) to generate a numeric value representing their theoretical combat effectiveness at a specific point in time. All balancing coefficients (e.g., equipment multipliers, status penalties) are abstracted into an external `SCORING_WEIGHTS` constant to simplify game-balance tuning without altering core algorithms.

- It assigns arbitrary mathematical weights to `tier`, `rarity`, and `stats` text.
- It is purely read-only; it does not mutate character state. It is used in `FightPage` as a sandbox for authors to check if a planned encounter makes logical sense based on the established world rules.

### Lazy Loading Architecture (`loadBook.ts`)

A strict memory-management rule to prevent browser tab crashes on massive novels.
**Rules:** When a book is loaded from the cloud or local storage, the `body` and `drafts` properties of every Chapter are explicitly `delete`d from the memory payload before being pushed to the Legend State store.

- The `ChapterPage` detects if `chapter.body === undefined`. If so, it initiates an asynchronous fetch (`loadFileFromGitHub`) for that specific `chapter_{id}.json` file, loads the massive text string into memory, injects it into the React Hook Form, and unloads it when the user navigates away.

## 9. Theme & Style Architecture

### CSS Variables (`src/styles/theme.css`)

Light/dark theming via `[data-theme="light"]` and `[data-theme="dark"]` attribute selectors. All colors, backgrounds, borders, and MUI overrides use CSS custom properties to enable instant theme switching without re-renders.

| Variable group  | Examples                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| Backgrounds     | `--bg-app`, `--bg-side`, `--bg-main`, `--bg-hover`, `--bg-entry`                                                   |
| Text            | `--text-primary`, `--text-secondary`, `--text-muted`, `--text-logo`                                                |
| Borders         | `--border`, `--border-field`                                                                                       |
| Semantic colors | `--color-red`, `--color-blue`, `--color-green`, `--color-purple`, `--color-orange`, `--color-teal`, `--color-dark` |
| MUI overrides   | `--mui-input-before`, `--mui-label-color`, `--mui-text-color`                                                      |

Dark theme semantic colors are slightly lighter for readability on dark backgrounds.

### Theme Transition (`src/index.css`)

```css
*,
*::before,
*::after {
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;
}
```

Inputs, textareas, selects, and SVG paths exclude transitions to prevent flicker while typing or toggling theme.

### MUI Override Strategy

MUI components are themed via CSS class overrides rather than `createTheme()`. Global selectors target `.MuiInputBase-root`, `.MuiSelect-select`, `.MuiPaper-root`, `.MuiMenuItem-root`, etc. with `!important` to override MUI's inline styles. This approach avoids re-renders from theme context changes and keeps the theme toggle instant.

### Modal Component (`src/components/ui/Modal.tsx`)

Portal-based modal using `createPortal(document.body)`. Features:

- Escape key and overlay click to close
- Body scroll lock while open
- Optional footer slot with auto-save pattern
- CSS classes `seshat-modal-overlay`, `seshat-modal`, `seshat-modal-header`, `seshat-modal-title`

### List Page Patterns

Three distinct visual patterns for list pages:

- **CharacterListPage**: Card-based (`CharacterCard` + `StatPill`), left border colored by character, inline stat pills for skills/conditions/traumas
- **ChapterListPage**: Card-based (`ChapterCard`), left purple border, chapter number, word count, synopsis excerpt
- **TimelinePage**: Timeline layout (`EventCard`), vertical connecting line, colored time bubbles by event type, present character tags

All list pages use extracted card components to isolate hover/click logic and avoid re-rendering the entire list.

---

## 10. Environment & Config

### `.nvmrc`

```
v24
```

### Required Node.js

Node.js v24 (for ES2023 target support in tsconfig). Run `nvm use 24` before dev/testing.

---

## 11. Legend State Patterns & Gotchas

### Common Bug: `.get()` on Array Elements

When accessing array elements in Legend State, calling `.get()` on the array returns raw JavaScript values (not observables). Calling `.get()` again on those raw values causes:

```
TypeError: appStore.books[idx].events.get(...).find(...)?.get is not a function
```

**Incorrect:**

```ts
const event = useSelector(
  () =>
    appStore.books[idx].events
      .get()
      .find((e) => e.id === id)
      ?.get(), // BUG
);
```

**Correct (for read-only access):**

```ts
const event = useSelector(() =>
  appStore.books[idx].events.get().find((e) => e.id === id),
);
```

**Correct (for updates via save, get index too):**

```ts
const event = useSelector(() =>
  appStore.books[idx].events.get().find((e) => e.id === id),
);
const eventIdx = useSelector(() =>
  appStore.books[idx].events.get().findIndex((e) => e.id === id),
);
```

### Multi-Book Store Access

The `appStore` is a single observable containing `activeBookId` and `books[]`. All page data lives inside the active book:

```ts
// Get active book index reactively
const bookIdx = useActiveBookIdx();

// Read data from the active book (inside useSelector)
useSelector(() => appStore.books[bookIdx].characters.get());

// Write to the active book
appStore.books[bookIdx].characters.push(newChar);
appStore.books[bookIdx].title.set("New title");
```

### Form State Pattern (react-hook-form)

Pages that edit store entities use **react-hook-form** for local state and only write to the store on explicit save:

```tsx
import { useForm, useWatch } from "react-hook-form";
import type { Control } from "react-hook-form";

const { register, handleSubmit, control, reset, setValue } = useForm<FormType>({
  defaultValues: { ... },
});

useEffect(() => {
  if (entity) reset({ field: entity.field });
}, [entity?.id, reset]);

// useWatch for reactive reads (React Compiler safe; watch() is not)
const field = useWatch({ control, name: "field" });

// Per-field .set() — verbose but fully type-safe (no any casts)
const onSubmit = (data: FormType) => {
  if (bookIdx < 0) return;
  const c = appStore.books[bookIdx].collection.get()[entityIdx];
  c.field1.set(data.field1);
  c.field2.set(data.field2);
};

// Sub-component for array items (useWatch cannot be called inside loops)
function ItemBlock({ control, index, setValue, onDelete }: ItemBlockProps) {
  const val = useWatch({ control, name: `items.${index}.field` as const });
  return <Field value={val} onChange={(v) => setValue(`items.${index}.field`, v)} />;
}

// JSX:
//   <input {...register("field")} />
//   <Field value={field} onChange={(v) => setValue("field", v)} />
//   <button onClick={handleSubmit(onSubmit)}>save</button>
```

### Pattern Summary

| Purpose                  | Pattern                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------- |
| Read primitive           | `useSelector(() => appStore.books[idx].title.get())`                                |
| Read array (full)        | `useSelector(() => appStore.books[idx].events.get())`                               |
| Read array (find)        | `appStore.books[idx].events.get().find(e => e.id === id)` (raw object, no `.get()`) |
| Get active book index    | `useActiveBookIdx()` — reactive hook returns index of current book                  |
| Local form state         | `useForm<FormType>()` + `reset()` from store on entity change                       |
| Persist to store on save | `handleSubmit(onSubmit)` => per-field `.set()` calls on active book                 |
| MUI Field/Sel in form    | `useWatch({ control, name })` for value, `setValue(name, v)` for change             |
| React Compiler safety    | Prefer `useWatch` over `watch()`; extract sub-components for array items            |
| Native input in form     | `{...register("field")}`                                                            |
| Array item sub-component | Define `ItemBlockProps` with `Control`; pass `control`, `index`                     |
| EventPage char attrs     | Separate `useState<Record<string, EventAttributes>>`, write on save                 |
| Component memoization    | Wrap pure display components in `React.memo` (primitive-only props)                 |

---

## 12. Testing

### Stack

| Concern     | Library                     | Why                                        |
| ----------- | --------------------------- | ------------------------------------------ |
| Runner      | Vitest v4                   | Vite-native, fast, supports bench mode     |
| DOM env     | jsdom                       | Component rendering in Node                |
| Component   | @testing-library/react      | Renders React components for smoke tests   |
| Matchers    | @testing-library/jest-dom   | DOM assertions (`toBeInTheDocument`, etc.) |
| User events | @testing-library/user-event | Realistic click/type simulation            |

### Scripts

| Command              | Action                                     |
| -------------------- | ------------------------------------------ |
| `npm test`           | `vitest run` — run all `.test.ts(x)` files |
| `npm run test:watch` | `vitest` — watch mode                      |
| `npm run test:bench` | `vitest bench --run` — run `.bench.ts(x)`  |

Benchmark files (`.bench.ts`) are excluded from the normal `vitest run` and must be run via the bench command.

### Test File Layout

```
src/lib/__tests__/          # Pure-logic unit tests (utils, export)
src/pages/__tests__/        # Page-level logic tests (scoreFighter)
src/components/ui/__tests__/ # Component smoke/rendering tests
src/components/__tests__/    # Cross-component render-performance tests
```

### Test Suite Summary (73 total)

| File                                          | Tests | What it covers                                                                       |
| --------------------------------------------- | ----- | ------------------------------------------------------------------------------------ |
| `src/lib/__tests__/utils.test.ts`             | 10    | uid(), mk helpers, style object S                                                    |
| `src/lib/__tests__/export.test.ts`            | 12    | buildExport() plaintext generation                                                   |
| `src/pages/__tests__/FightPage.test.ts`       | 29    | scoreFighter scoring logic                                                           |
| `src/pages/__tests__/*Page.test.tsx`          | ~30   | Edge-to-edge component tests for Chapter, Character, World, BookList, Auth, NotFound |
| `src/lib/__tests__/conflictUtils.test.ts`     | 8     | Deep diffing and conflict resolution validation                                      |
| `functions/api/github/__tests__/sync.test.ts` | 1     | Draft recovery and sync integrity tests                                              |
| `src/components/ui/__tests__/*`               | 11    | Field, Sel, Toggle, EventPicker                                                      |
| `src/components/__tests__/*`                  | 23    | ConflictModal, renderPerformance tests                                               |

### Benchmarks

| File                                     | What it measures                     |
| ---------------------------------------- | ------------------------------------ |
| `src/lib/__tests__/export.bench.ts`      | buildExport() throughput             |
| `src/pages/__tests__/FightPage.bench.ts` | scoreFighter() throughput (3 scales) |

### Conventions

- `scoreFighter` lives in `src/lib/scoreFighter.ts` (single source of truth — tests and benchmarks import from there)
- Use `describe` + `it` blocks; prefer `expect().toBe*` matchers from jest-dom
- Mock `localStorage` in setup (no persistence during tests)
- MUI Select components render `MenuItem` children in a portal — do not query them via `getByRole("option")` until the dropdown is opened; use `getByRole("combobox")` instead
- Benchmarks use `bench()` from vitest; iterate over large datasets for meaningful measurements
- Render-performance tests verify DOM stability — re-rendering a memoized component with identical props must produce identical `innerHTML`

---

### Code Generation Reminder

When generating Legend State code:

- Never call `.get()` on array elements returned by `.find()`, `.map()`, or `.filter()`
- Always get the array index if you need to update an item later (for save, not per-keystroke)
- Use `useSelector()` for reactive reads, direct `.get()` only inside selectors
- Use per-field `.set()` in `onSubmit` (no dynamic property access, no `any` casts)
- Prefer react-hook-form for form state; per-field `.set()` to store on save
- For React Compiler safety: use `useWatch({ control, name })` instead of `watch()`
- **Rules of Hooks**: Always call hooks (`useWatch`, `useState`, etc.) unconditionally before any early returns (e.g. `if (!entity) return;`).
- **Ref Assignments**: Never mutate a `useRef`'s `.current` value directly during the component render phase. Always assign refs inside a `useEffect` or `useLayoutEffect` to prevent React Compiler errors (`Cannot update ref during render`).
- Extract sub-components for array items (each calls `useWatch` with a static index)
- For character attributes in EventPage, keep a separate `useState<Record<string, EventAttributes>>` and write on save alongside form data. Use `// eslint-disable-next-line react-hooks/set-state-in-effect` if you must derive state in an effect here.
- `any` is banned — no `as any`, no `: any`, no eslint-disable for `no-explicit-any`
- **Error Handling**: When catching an error (e.g. from an API call), you MUST `console.error` it to aid in debugging AND show a user-friendly toast via `showToast("...", "error")` to inform the client.
- When extracting generic properties like `control` or `name` to pass the rest of the props down, use `void control; void name;` to safely bypass `@typescript-eslint/no-unused-vars` warnings without disabling the rule.
- Pure display leaf components (primitives-only props) should be wrapped in `React.memo`
- `scoreFighter` is in `src/lib/scoreFighter.ts` — import it directly; do not replicate the logic in tests
- Use MUI icons via `src/components/ui/icons.tsx` (named imports, tree-shakeable)
- Pass icon + text as `ReactNode` to `Section.title` and `Field.label`
- Size icons with `sx={{ fontSize: N }}`; theme colors via CSS variables; no transition on SVG paths to prevent theme-toggle flicker
- **Multi-book**: All world state lives inside `appStore.books[]`. Use `useActiveBookIdx()` hook to get the active book's index, then access `appStore.books[idx].fieldName` for reads/writes. The `appStore.activeBookId` is synced from the URL param `:bookId` in `App.tsx`.
- **Book-manager page** at `/` (`BookListPage`) handles creating, listing, and deleting books. Each book is a completely independent world with no shared references.

---

## 13. Authentication & Cloud Sync

Seshat uses a completely serverless authentication and cloud synchronization model backed by **Cloudflare Workers** and the **GitHub API**.

### JWT Authentication

- **Cloudflare Worker Backend:** Endpoints (`/api/github/login`, `/api/github/register`, `/api/github/sync`) run on Cloudflare Workers.
- **Token Generation:** The user registers/logs in with a `username` (branch name) and `accessCode` (secret password). The backend verifies this against `users.json` on the main GitHub branch, and generates a **JWT-like token** signed via the Web Crypto API using an `AUTH_SECRET` environment variable (HMAC-SHA256).
- **Client Storage:** The frontend _never_ stores the raw `accessCode`. It saves the signed token to `localStorage`/`sessionStorage` as `seshat-auth-token`.
- **AuthGuard (`src/components/AuthGuard.tsx`):** A wrapper component that intercepts rendering for protected routes. It synchronously decodes the token's payload in the browser to check the `exp` (expiration timestamp). If the token is missing or expired, it redirects to the `/auth` route natively without needing to make network requests.
- **Performant Syncing:** Since the JWT contains the cryptographically signed `username`, the `sync.ts` backend worker bypasses fetching and parsing `users.json` for every sync request, resulting in significantly faster syncing and drastically reduced GitHub API rate-limit usage.

### Cloud Syncing Architecture

- Uses `src/lib/githubSync.ts` to trigger REST API requests to the Cloudflare Worker.
- Converts the entire `appStore.get()` (all books, characters, chapters, events) into a flattened filesystem tree (JSON blobs) and directly hits the **GitHub Git Database API** (Trees, Commits, Refs) to safely persist the user's data to a unique branch per user (`user-username`).

### Git-Style Conflict Resolution (Smart Merge UI)

When the user executes a `Pull` operation, Seshat compares the local state with the server state using a deep, granular JSON diff via `getConflicts` (ignoring lazy-loaded body/draft properties).

1. **Active Page Filtering**: The conflict list is filtered by the active context (e.g. the currently active chapter, metadata, characters, events). Non-active chapter conflicts are automatically designated to auto-resolve to the server version (preserving their local bodies and drafts).
2. **Silent Auto-Merge**: If there are no conflicts on the active page (visible conflicts length is 0), the other chapters are auto-merged silently in the background using `autoMergeOtherChapters`. The local store and `lastSyncSha` are updated, and a success toast is shown without interrupting the user.
3. **Interactive Conflict Resolution**: If there are active page conflicts, the `ConflictModal` is displayed. The user resolves active conflicts using the interface (`[Keep Local]` or `[Keep Cloud]`).
4. Upon confirming the merge, the final resolved state (combining interactive resolutions and non-active chapter auto-resolutions) is saved to the store and pushed back to the cloud.

> [!CAUTION]
> **CRITICAL: GitHub Tree Syncing & Memory Constraints**
>
> 1. **Memory Preservation (Stubs):** `loadBook.ts` intentionally deletes the massive `body` field of chapters before sending them to the frontend to prevent RAM exhaustion. These chapters sit in local state as "stubs" (`body === undefined`) until a user explicitly visits the chapter page (which lazy-loads the body).
> 2. **Data Loss via Stubs:** Because `JSON.stringify` drops `undefined` properties, a full sync (`sync.ts`) would blindly overwrite chapters in GitHub with bodiless files. To prevent this, `sync.ts` MUST fetch the existing recursive Git tree and use the old blob `sha` instead of `content` for any chapter where `body === undefined`.
> 3. **The `base_tree` Bug:** When updating files via the GitHub API (`updateFile.ts`, `updateFiles.ts`), you **MUST** extract the **Tree SHA** from the latest commit and pass it as `base_tree`. If you mistakenly pass a **Commit SHA**, GitHub will silently ignore the `base_tree` entirely and create a new root tree containing ONLY the files you updated, completely deleting the rest of the repository!
> 4. **Unsecure Context UUID Bug:** `crypto.randomUUID()` is disabled by modern mobile/tablet browsers in unsecure (HTTP) contexts (e.g. debugging the production build over a local IP address `http://192.168.x.x`). Accessing it will crash the save handler silently. Always use the safe `uid()` utility helper from `src/lib/utils.ts` instead.
> 5. **Aggressive Browser Caching (GET Requests):** iOS Safari and other mobile browsers aggressively cache GET requests, completely ignoring standard `Cache-Control` headers and cache-busting fetch policies under certain conditions. This causes pull operations to retrieve stale data and trigger false merge conflicts. To guarantee fresh data, all API GET calls must append a dynamic timestamp parameter (e.g., `&t=${Date.now()}`).
> 6. **Accidental Deletion of Other Books (Partial Load Sync Guard):** If a user deep-links directly to a specific book, the client only loads that single book into `appStore.books` (the list starts empty). To prevent a subsequent sync from deleting all other books on GitHub, the backend uses the `appStore.isBookListLoaded` flag to selectively preserve other books' paths when merging into the `base_tree`.

---

## 14. Local Development & Hosting Architecture

Seshat uses a hybrid local development environment to provide a seamless full-stack developer experience.

### Architecture Overview

- **Frontend Host**: React powered by **Vite**. The frontend dev server provides ultra-fast Hot Module Replacement (HMR) and typically runs on `http://localhost:5173`.
- **Backend Host**: Serverless API powered by **Cloudflare Pages / Wrangler**. The backend worker runs locally via Wrangler to simulate the production Cloudflare edge environment, executing the endpoints found in the `functions/api/` directory.

### How to Connect & Run (The Proxy Strategy)

To run both the frontend and backend simultaneously while retaining HMR, you must use Wrangler's built-in proxy feature.

**Command:**

```bash
npx wrangler pages dev -- npm run dev
```

_(Alternatively, if configured in `package.json`, use `npm run wrangler`)_

**What this command does:**

1. Wrangler spins up the backend worker environment on a local port (usually `http://localhost:8788`).
2. It simultaneously executes `npm run dev` to start the Vite frontend.
3. Wrangler acts as a reverse proxy:
   - **Frontend Traffic:** Any standard page request is forwarded directly to Vite, maintaining instant HMR for UI changes.
   - **API Traffic:** Any request matching `/api/*` is intercepted by Wrangler and routed directly to the `functions/api/` handlers.

### Accessing the App Locally

**CRITICAL:** When developing locally, you **MUST** open the browser to the Wrangler proxy port (`http://localhost:8788`), **NOT** the Vite port (`5173`).
If you visit the Vite port directly, your API calls will fail with 404s because Vite does not know how to execute Cloudflare Worker functions.

### Secret Management

For local testing, backend secrets (like `GITHUB_TOKEN`, `AUTH_SECRET`) must be placed in a `.dev.vars` file in the project root. Cloudflare Workers do _not_ read standard `.env` files for backend execution.

## 15. Cloud Database Architecture

The application uses Cloudflare Pages Functions to proxy communication with a GitHub repository, enabling a multi-user database architecture.

### User Isolation (Branching)

Instead of storing all data in a single repository `main` branch, every user gets their own dedicated Git branch (e.g., `user-{username}`).

- Login generates a secure JWT token containing the username (expires in 7 days).
- All `/api/github/*` routes require this token.
- The Cloudflare Worker verifies the token and dynamically reads/writes to `user-{username}`, strictly isolating each user's data.

### Granular File Structure

Data inside the Git repository is broken down into modular JSON files rather than a single monolithic JSON file.

- `books/book_{id}/book.json` (metadata)
- `books/book_{id}/index.json` (manifest mapping IDs to titles)
- `books/book_{id}/characters/char_{id}.json`
- `books/book_{id}/events/event_{id}.json`
- `books/book_{id}/chapters/chapter_{id}/metadata.json` (chapter metadata and draft index)
- `books/book_{id}/chapters/chapter_{id}/{draft_id}.json` (individual draft bodies)
- `books/book_{id}/world/world.json` (and subdirectories for nations, monsters, etc.)

### Delta Syncing

The save logic strictly adheres to delta syncing to preserve API rate limits and minimize network payloads:

- **`updateFile`**: Targets a single granular JSON file (e.g. `chapters/chapter_{id}.json`) and creates a commit. Used by Chapter, Character, and Event pages.
- **`updateFiles`**: Bundles multiple files together into a single atomic commit. Used by the World page (which updates `world.json` and associated entities simultaneously).
- Saves bypass `react-hook-form`'s built-in `handleSubmit` to prevent blocking; they use `getValues()` directly to retrieve the form data and POST to the Cloudflare Functions.

### Loading Book (`loadBook`)

Fetches all blobs recursively via the GitHub Tree API for the specified `books/book_{id}/` directory and stitches them together into a complete LegendState object before rendering.

### Async Workflow UI Requirements

Any component that triggers an asynchronous workflow (API calls for load, sync, create, read, update, delete) MUST explicitly handle and display two visual states:

1. **Normal State**: The default interactive state.
2. **Pending State**: Displayed while the promise is resolving. The element should provide visual feedback (e.g., text changes to "Saving...", "Syncing...", opacity reduces) and be `disabled` to prevent duplicate submissions.

### UX Conventions

- **No Native Dialogs:** The use of `window.prompt()`, `window.confirm()`, and `window.alert()` is strictly prohibited as they block the main thread and break the visual aesthetic. Always use the internal state-driven `Modal` component (`src/components/ui/Modal.tsx`) for user confirmation or text inputs.

### The `S` Utility Object

Global style presets (like grids, input fields, layout wrappers) are centralized in the `S` object within `src/lib/utils.ts`.
**Rule:** The object must be typed using `satisfies Record<string, React.CSSProperties>` rather than cast loosely. This ensures strict type safety and enables accurate IDE autocomplete for consumers (preventing silent fallbacks of undefined styles).

---

## 16. Core Domain Model — Full Type Reference

Every piece of author data is organized under a **BookData** tree. `isFullyLoaded` is a runtime flag — never persisted to GitHub — that tells the app whether the full book has been fetched from the cloud.

```
BookData
├── id, title, synopsis, setting, themes, rules
├── isFullyLoaded?: boolean     ← runtime only; not saved to GitHub
├── events: Event[]
├── characters: Character[]
├── chapters: Chapter[]
├── nations: Nation[]
├── techniques: Technique[]
├── ingredients: Ingredient[]
├── monsters: Monster[]
├── treasures: Treasure[]
└── foreshadows: Foreshadow[]
```

### Character (most complex entity)

```
Character
├── Core psychology: role, archetype, coreWound, coreFear, coreDesire, philosophy, secrets
├── color: string                               # hex color for sidebar / card accent
├── arcs: CharacterArc[]                        # Narrative arc with lie/truth/breaking-point
│     └── { arcType, arcLie, arcTruth, arcBreakingPoint,
│             arcFromEventId, arcToEventId, arcFromTime, arcToTime,
│             arcStart, arcEnd }
├── statusTimeline: StatusEntry[]               # Power level + emotional/physical state over time
│     └── { eventId, startDate, endDate, power, arcStage,
│             role, archetype, emotionalState, physicalState, note }
├── traumas: Trauma[]
│     └── { title, when, description, trigger, manifestation }
├── relationships: Relationship[]               # (with RelTimelineEntry[])
│     └── { withId, feel, timeline: [{ time, dynamic }] }
├── branch: Branch[]                            # Pre-story / backstory events
│     └── { time, title, type, description, impact, crossings: [{ withId, note }] }
├── attributes: Record<eventId, EventAttributes>  # Per-event snapshot (read by EventPage + export)
│     └── { power, difficulty, arcStage, emotionalState, physicalState,
│             sceneMotive, knowledge, beliefs, secret,
│             traumaActive, notes, arcBefore, arcAfter }
├── conditions: Condition[]
│     └── { type: CondType, name, atTime, atEventId, why, description, effects, isActive }
├── skills: Skill[]
│     └── { name, atTime, atEventId, howGained, source, appearance, attitude,
│             stats, cost, costDescription, uses, cooldown, upside, downside,
│             requirement, notes }
├── equipment: Equipment[]
│     └── { slot: EquipSlot, name, atTime, atEventId, stats, curses, unbindCondition,
│             uses, creator, createdWhy, ingredients, lore,
│             accessState: EquipAccess, accessNote }
├── achievements: Achievement[]
│     └── { title, atTime, atEventId, description, gained }
└── losses: Loss[]
      └── { title, atTime, atEventId, description }
```

### Event

```
Event
├── id, time (T-value integer), title
├── type: EventType
├── startDate, endDate (ISO strings)
├── setting, description, consequence
├── characters: string[]    # character IDs — auto-managed by computeEventSync()
├── chapters: string[]      # chapter IDs — auto-managed by computeEventSync()
└── subplot?: string        # optional subplot tag (used by TimelinePage filtering)
```

### Chapter

```
Chapter
├── id, number, title, timeRef (→ Event.id as string), synopsis, notes, order
├── pinnedChars: string[]         # character IDs pinned for the reference panel
├── pinnedEventIds: string[]      # event IDs pinned for the pinned-context strip
├── scenes: SceneCard[]           # scene outline cards
│     └── { id, title, pov, goal, conflict, outcome }
├── drafts: Draft[]               # versioned prose drafts
│     └── { id, name, body, createdAt, isDeleted? }
└── activeDraftId: string
```

### Foreshadow

```
Foreshadow
├── id
├── plantChapterId: string
├── payoffChapterId: string
├── description: string
└── status: "Planted" | "Payoffed" | "Abandoned"
```

---

## 17. All Enum Types

```
PowerTier:    Latent | Awakening | Capable | Skilled | Elite | Peak | Transcendent
EventType:    Story | Trauma | Revelation | Conflict | Bond | Loss | Growth | Mystery
ArcStage:     Unaware | Questioning | Resisting | Breaking | Transforming | Integrated
CondType:     Physical | Mental | Social | Spiritual | Cursed | Blessed | Wounded | Enhanced
EquipSlot:    Weapon | Offhand | Armor | Helmet | Boots | Gloves | Accessory | Relic | Mount | Other
EquipAccess:  Equipped | Stored | No Access
TechType:     Blacksmithing | Martial Art | Technology | Biology | Alchemy | Runic | Forbidden | Other
MonsterTier:  Minion | Common | Elite | Champion | Boss | Legendary | World-Threat
NationType:   Kingdom | Empire | Tribe | Republic | Theocracy | Nomadic | Hidden | Ruin
Rarity:       Common | Uncommon | Rare | Epic | Legendary | Unique | Mythic
Difficulty:   Trivial | Minor | Moderate | Significant | Severe | Catastrophic
```

Constants arrays for all the above are exported from `src/lib/constants.ts` (e.g. `POWER_TIERS`, `EVENT_TYPES`, `ARC_STAGES`, `COND_TYPES`, `EQUIP_SLOTS`, `EQUIP_ACCESS`, `TECH_TYPES`, `MON_TIERS`, `NAT_TYPES`, `RARITY`, `DIFFICULTY`, `NATION_CONNECTION_TYPES`, `CHAR_COLORS`).

---

## 18. GitHub-as-Storage: File Layout & Conflict Detection

### Conflict Detection (`lastSyncSha`)

- `appStore.lastSyncSha: string | null` stores the last known commit SHA of the user's branch.
- Every `sync`, `updateFile`, and `updateFiles` call passes `lastKnownSha` to the backend.
- If the branch HEAD has advanced beyond `lastKnownSha`, the API returns `409 { conflict: true }`.
- A successful response updates `appStore.lastSyncSha` with the new commit SHA.
- **localStorage isolation**: `lastSyncSha` from `localhost` ≠ `lastSyncSha` from production. Users must Pull when switching environments.

### Complete GitHub File Layout

```
users.json                                  # flat user registry on main branch
                                            # { username: { accessCode, email } }
books/
└── book_<bookId>/
    ├── book.json                           # title, synopsis, setting, themes, rules
    ├── index.json                          # { characters: [{id,name}], events: [{id,title}], chapters: [{id,title}] }
    ├── world/
    │   ├── world.json                      # { id, title }
    │   ├── nations/nation_<id>.json
    │   ├── techniques/technique_<id>.json
    │   ├── ingredients/ingredient_<id>.json
    │   ├── monsters/monster_<id>.json
    │   └── treasures/treasure_<id>.json
    ├── characters/char_<id>.json           # full character object
    ├── events/event_<id>.json             # full event object
    └── chapters/chapter_<id>/
        ├── metadata.json                  # everything EXCEPT draft body content
        └── <draftId>.json                 # each draft as its own file (includes body)
```

### GitHub API Usage (Two Distinct APIs)

#### REST API — writes, tree ops, branch management

- `GET /repos/{owner}/{repo}` — get repo metadata / default branch
- `GET /repos/{owner}/{repo}/git/ref/heads/{branch}` — get branch HEAD SHA
- `POST /repos/{owner}/{repo}/git/refs` — create branch from another
- `PATCH /repos/{owner}/{repo}/git/refs/heads/{branch}` — update branch ref (force push)
- `GET /repos/{owner}/{repo}/git/commits/{sha}` — get commit (to extract tree SHA)
- `GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1` — list all blobs in tree
- `POST /repos/{owner}/{repo}/git/trees` — create new tree
- `POST /repos/{owner}/{repo}/git/commits` — create commit
- `GET/PUT /repos/{owner}/{repo}/contents/users.json` — read/write users registry

#### GitHub GraphQL API — batch blob reads (load.ts, loadBook.ts)

Used to fetch up to 100 file contents in a single request:

```graphql
query {
  repository(owner: "...", name: "...") {
    blob0: object(oid: "<sha>") {
      ... on Blob {
        text
      }
    }
    blob1: object(oid: "<sha>") {
      ... on Blob {
        text
      }
    }
    # up to 100 per query
  }
}
```

- Endpoint: `POST https://api.github.com/graphql`
- Auth: `Authorization: Bearer <GITHUB_TOKEN>`

---

## 19. Key Library Functions Reference

| Function                                                                              | File                   | Purpose                                                                                                                                                |
| ------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `buildExport(state)`                                                                  | `lib/export.ts`        | Generates a plain-text AI context dump with all world/character/event data                                                                             |
| `resolveStatusAt(char, events, contextDate?, contextEventTime?, contextWindowStart?)` | `lib/resolveStatus.ts` | Finds the correct `StatusEntry` for a character at a chapter's time context (3-path algorithm: window → date fallback → T-value fallback → last entry) |
| `chapterContext(pinnedEvents)`                                                        | `lib/resolveStatus.ts` | Extracts `{ contextDate, contextWindowStart, contextEventTime }` from pinned events                                                                    |
| `scoreFighter(char, events, atEventId?)`                                              | `lib/scoreFighter.ts`  | Computes a numeric combat score (power tier × 3 + skills × 1.2 + equipment − curses − conditions + arc mod + emotional mod)                            |
| `computeEventSync(bookIdx, eventId, chapterId, newTimeRef, newPinnedChars)`           | `lib/eventSync.ts`     | Keeps `event.characters` and `event.chapters` consistent with chapter pinning (called on chapter save)                                                 |
| `syncToGitHub(token)`                                                                 | `lib/githubSync.ts`    | Full push of all books (replaces entire branch tree)                                                                                                   |
| `loadFromGitHub(token)`                                                               | `lib/githubSync.ts`    | Loads lightweight book list (only `book.json` per book)                                                                                                |
| `loadBookFromGitHub(token, bookId)`                                                   | `lib/githubSync.ts`    | Loads a single full book (all entities except draft bodies)                                                                                            |
| `updateFileOnGitHub(token, bookId, path, content)`                                    | `lib/githubSync.ts`    | Patches a single file in one Git commit                                                                                                                |
| `updateFilesOnGitHub(token, bookId, files[])`                                         | `lib/githubSync.ts`    | Patches multiple files atomically in one commit                                                                                                        |
| `loadFileFromGitHub(token, bookId, path)`                                             | `lib/githubSync.ts`    | Lazy-loads a single raw file (e.g., draft body)                                                                                                        |
| `mkChar / mkEvent / mkBranch / mkTrauma / mkCond / mkSkill / mkEquip / ...`           | `lib/utils.ts`         | Factory functions creating blank entities with `uid()` IDs                                                                                             |
| `uid()`                                                                               | `lib/utils.ts`         | `Math.random().toString(36).slice(2, 8)` — 6-char alphanumeric ID                                                                                      |
| `S` (style object)                                                                    | `lib/utils.ts`         | Shared `React.CSSProperties` presets using CSS variables                                                                                               |
