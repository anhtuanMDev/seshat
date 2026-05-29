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

---

## 1. Stack Overview

| Concern     | Library                      | Why                                                           |
| ----------- | ---------------------------- | ------------------------------------------------------------- |
| Framework   | React 19 + Vite 8            | Fast HMR, modern JSX transform, ES2023 target                 |
| Routing     | React Router v7              | Nested routes with layout persistence                         |
| State       | Legend State                 | Fine-grained reactivity, built-in persistence, no boilerplate |
| Forms       | react-hook-form              | Performant local form state, minimal re-renders               |
| UI/Icons    | MUI (Material UI) v9 + @mui/icons-material | Consistent, accessible components; centralized icon exports via `src/components/ui/icons.tsx` |
| Animation   | Anime.js v4                  | Timeline-based, works on DOM refs                             |
| Testing     | Vitest + testing-library     | Unit/integration tests with jsdom environment                 |

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
│   │   └── __tests__/          # Unit tests for lib utilities
│   │       ├── utils.test.ts   #   10 tests
│   │       ├── export.test.ts  #   12 tests
│   │       └── export.bench.ts
│   │
│   ├── store/
│   │   ├── appStore.ts         # Multi-book Legend State observable + localStorage persistence
│   │   └── worldStore.ts       # (removed — merged into appStore.ts)
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
│   │   │   └── RichEditor.tsx # Rich text editor (focus mode)
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
│   │   │   └── LossBlock.tsx
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
│   │   ├── ChapterPage.tsx      # 335 lines — chapter prose editor with reference panel
│   │   ├── ChapterListPage.tsx  # 237 lines — chapter list (card-based with word count)
│   │   ├── TimelinePage.tsx     # 326 lines — timeline (visual vertical-line layout with event cards)
│   │   ├── FightPage.tsx        # 162 lines — fight simulator
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

**Total: 73 tests across 8 test files. 9 pages totaling ~2080 lines (incl. icons).**

---

## 3. Routing

```tsx
// src/router/index.tsx
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
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
        ],
      },
    ],
  },
]);

// Root `/` shows BookListPage (multi-book manager).
// All world/character/event/chapter/fight routes are nested under `/book/:bookId`.

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

export const useActiveBookIdx = () => useSelector(() => {
  const activeId = appStore.activeBookId.get();
  return appStore.books.get().findIndex(b => b.id === activeId);
});

export const useWorldTitle = () => {
  const idx = useActiveBookIdx();
  return useSelector(() => idx >= 0 ? appStore.books[idx].title.get() : "");
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
const entity = useSelector(() => bookIdx >= 0
  ? appStore.books[bookIdx].collection.get().find((x: { id: string }) => x.id === entityId)
  : undefined
);
const entityIdx = useSelector(() => bookIdx >= 0
  ? appStore.books[bookIdx].collection.get().findIndex((x: { id: string }) => x.id === entityId)
  : -1
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
  return <Field value={value} onChange={(v) => setValue(`items.${index}.field`, v)} />;
}

// In JSX:
//   Native inputs → register()
//   MUI Field/Sel → useWatch({ control, name }) for value, setValue(name, v) for change
//   Arrays        → top-level useWatch + sub-component per item index
//   Save button   → handleSubmit(onSubmit)
```

### Page Size Summary

| Page                | Lines | Extracted sub-components                        | Icons added |
| ------------------- | ----- | ----------------------------------------------- | ----------- |
| WorldPage           | 112   | 5 world blocks (Nation, Technique, Ingredient, Monster, Treasure) | Section icons: Flag, Build, Science, BugReport, Diamond; SaveIcon |
| CharacterPage       | 220   | 4 character blocks (Trauma, Condition, Achievement, Loss) + CharStatusPanel + ArrayItemCard + Modal | Section icons: Timeline, Badge, Psychology, Route, MedicalInfo, EmojiEvents; SaveIcon |
| CharacterListPage   | 288   | CharacterCard, StatPill                          | PeopleIcon, AddIcon |
| EventPage           | 252   | CharacterAttrsBlock                             | SaveIcon, ScheduleIcon, CalendarTodayIcon, LocationOnIcon; PeopleAltIcon in block |
| TimelinePage        | 326   | EventCard                                       | TimelineIcon, AddIcon |
| ChapterPage         | 335   | ReferencePanel, PinnedContextStrip, ChapterToolbar, ContextTag, CharCard, EventRef, WorldTabContent | SaveIcon, CenterFocusStrongIcon, ArticleIcon in toolbar; People/EventNote/Public on tabs; NotesIcon |
| ChapterListPage     | 237   | ChapterCard                                     | AutoStoriesIcon, AddIcon |
| FightPage           | 162   | FighterPicker, WinBar, SnapshotCard, ScoreBreakdown, NoteRow | SportsKabaddiIcon (title), CameraAltIcon (Snapshot) |

### BookListPage (`/`)

Multi-book manager. Lists all books with create/delete actions. Clicking a book navigates to `/book/:id/world`. Each book is an independent world — no data shared between books. New books start with a single "The story begins" event.

### WorldPage (`/book/:bookId/world`)

Renders world metadata and five world entity sections (Nations, Techniques, Ingredients, Monsters, Treasures). Uses react-hook-form with `useWatch`/`setValue` for all fields; array add/remove via generic typed `addItem`/`delItem` that uses `WorldForm[F][number]` to infer the element type from the field name, eliminating `any` casts. Five extracted block components in `src/components/world/`.

Nation blocks include `periodActive` (time range the nation existed), structured `connections[]` (diplomatic relations with other nations — alliance, war, trade, vassal, etc.), and `allianceLogic` (free-text diplomatic landscape description). Connections are edited via `NationConnectionBlock` sub-component. Add/remove logic for connections lives in `WorldPage` alongside the existing nation add/remove handlers.

### CharacterPage (`/book/:bookId/characters/:id`)

Full character sheet with Identity, Psychology, Status Timeline, Character arc, Conditions, Achievements & Losses sections. Uses react-hook-form with **`useWatch`** instead of `watch()` (required for React Compiler compatibility). Each array type (traumas, conditions, achievements, losses) has its own sub-component in `src/components/character/`. Status Timeline uses a custom `CharStatusPanel`. `onSubmit` uses explicit per-field `.set()` calls.

### EventPage (`/book/:bookId/events/:id`)

Event editor with per-character attributes (power tier, arc stage, emotional state, etc.). Uses react-hook-form for event fields; character attribute overrides for this event are held in a separate `useState<Record<string, EventAttributes>>`. Character attribute editor extracted to `CharacterAttrsBlock` in `src/components/event/`.

### ChapterPage (`/book/:bookId/chapters/:id`)

Chapter prose editor with a reference panel (characters, events, world info). Uses react-hook-form for all chapter fields. Body field supports both plain textarea and a RichEditor (toggled by focus mode). Reference panel and toolbar extracted to `src/components/chapter/`.

### FightPage (`/book/:bookId/fight`)

Combat simulation comparing two characters with a weighted score breakdown. Uses `scoreFighter()` from `src/lib/scoreFighter.ts`. Display components (WinBar, SnapshotCard, ScoreBreakdown, NoteRow, FighterPicker) extracted to `src/components/fight/`.

### TimelinePage / ChapterListPage / CharacterListPage

CRUD-style list pages using `EntryBlock` + `Section` with inline Field/Sel components. Lean at 108–132 lines each.

---

## 7. Component Patterns

### UI primitives (`src/components/ui/`)

All accept `value` + `onChange` (uncontrolled) or `control` + `name` (controlled via react-hook-form):

| Component         | Props                                                          |
| ----------------- | -------------------------------------------------------------- |
| `Field`           | `{ label: ReactNode, value?, onChange?, control?, name?, multi?, rows? }` |
| `Sel`             | `{ label, value?, onChange?, control?, name?, opts }`          |
| `Toggle`          | `{ label, value, onChange }`                                   |
| `Section`         | `{ title: ReactNode, children, action?, defaultOpen? }`        |
| `EntryBlock`      | `{ color, onDelete, children }` (CloseIcon delete button)      |
| `SideItem`        | `{ label, sub?, active, color?, onClick, onDelete? }` (CloseIcon delete) |
| `GhostButton`     | MUI `styled(Button)` — shared ghost button across pages        |
| `EventPicker`     | `{ label, value, onChange, events[] }`                         |
| `Modal`           | `{ title, onClose, children, footer? }` — portal-based modal, Escape to close, overlay click to close, body scroll lock |
| `CharStatusPanel` | `{ statusTimeline, color, events, onChange }`                  |
| `icons.tsx`       | 37 named re-exports from `@mui/icons-material`; import via `../ui/icons` or barrel |

### React.memo usage

Leaf display components wrapped in `React.memo` to prevent unnecessary re-renders when parent state changes but props are stable:

| Component            | File                          | Props type                |
| -------------------- | ----------------------------- | ------------------------- |
| `WinBar`             | `src/components/fight/`       | All primitives            |
| `NoteRow`            | `src/components/fight/`       | `Note` object             |
| `SnapshotCard`       | `src/components/fight/`       | Primitives + optional Event |
| `ContextTag`         | `src/components/chapter/`     | Primitives + callback     |
| `WorldField`         | `src/components/chapter/`     | Primitives                |
| `WorldTabContent`    | `src/components/chapter/`     | All strings               |

Components receiving object/array props (e.g. `PinnedContextStrip`, `ScoreBreakdown`) are not memoized — they would need a custom comparator.

### Icon Usage

Icons are imported from `@mui/icons-material` via `src/components/ui/icons.tsx` (centralized re-exports for tree-shaking and easy swapping). Key conventions:

- Pass icon + text as `ReactNode` to `Section.title` and `Field.label` (both accept `ReactNode`)
- Use `sx={{ fontSize: N }}` for sizing (no hardcoded `width`/`height`)
- Use CSS variable colors via `sx={{ color: "var(--var-name)" }}` — icons inherit theme automatically
- `transition: none` is set on SVG paths in `index.css` (line 154-157) to prevent flicker on theme toggle
- Icons are grouped with their label text (never standalone without a textual label)

| Icon                     | Context                                    |
| ------------------------ | ------------------------------------------ |
| `PublicIcon`             | World nav, World tab in reference panel    |
| `AutoStoriesIcon`        | Chapters nav, Chapters list page           |
| `TimelineIcon`           | Timeline nav, Status Timeline section      |
| `PeopleIcon`/`PeopleAltIcon` | Characters nav, Characters present     |
| `SportsKabaddiIcon`      | Fight nav, Fight page title                |
| `FileDownloadIcon`       | Export button                              |
| `LightModeIcon`/`DarkModeIcon` | Theme toggle                         |
| `AddIcon`                | Add button (sidebar headers, list pages)   |
| `CloseIcon`/`DeleteIcon` | Remove/delete buttons (EntryBlock, SideItem, CharStatusPanel) |
| `SaveIcon`               | Save button (all pages)                    |
| `ExpandMoreIcon`/`ChevronRightIcon` | Section collapse/expand        |
| `FlagIcon`               | Nations section                            |
| `BuildIcon`              | Techniques section                         |
| `ScienceIcon`            | Ingredients section                        |
| `BugReportIcon`          | Monsters section                           |
| `DiamondIcon`            | Treasures section                          |
| `BadgeIcon`              | Identity section (Character page)          |
| `PsychologyIcon`         | Psychological core, Scene motive           |
| `RouteIcon`              | Character arc section                      |
| `CrisisAlertIcon`        | Traumas sub-header                         |
| `MedicalInformationIcon` | Conditions section                         |
| `EmojiEventsIcon`        | Achievements sub-header                    |
| `HeartBrokenIcon`        | Losses sub-header                          |
| `ScheduleIcon`           | Time field (Event page)                    |
| `CalendarTodayIcon`      | Start/End date fields, Status From/To      |
| `LocationOnIcon`         | Setting/location field                     |
| `CameraAltIcon`          | Snapshot card (Fight page)                 |
| `CenterFocusStrongIcon`  | Focus mode button (Chapter toolbar)        |
| `ArticleIcon`            | Refs panel button (Chapter toolbar)        |
| `EventNoteIcon`          | Events tab (reference panel)               |
| `NotesIcon`              | Chapter notes, AI narrator note            |

### Domain-specific components

Each domain directory mirrors a page and contains components that are only used by that page:

- `src/components/fight/` — 5 components for FightPage
- `src/components/character/` — 4 blocks + types for CharacterPage
- `src/components/world/` — 5 blocks + types + NationConnectionBlock for WorldPage
- `src/components/event/` — 1 block for EventPage
- `src/components/chapter/` — 7 components for ChapterPage

---

## 8. Features Map

| Feature          | Location        | Store path                                                       |
| ---------------- | --------------- | ---------------------------------------------------------------- |
| Books            | `BookListPage`  | `appStore.books[]`, `.activeBookId`                              |
| World meta       | `WorldPage`     | `appStore.books[i].title`, `.synopsis`, `.setting`, `.themes`, `.rules` |
| Nations          | `WorldPage`     | `appStore.books[i].nations[]` (periodActive, connections[], allianceLogic) |
| Techniques       | `WorldPage`     | `appStore.books[i].techniques[]`                                 |
| Ingredients      | `WorldPage`     | `appStore.books[i].ingredients[]`                                |
| Monsters         | `WorldPage`     | `appStore.books[i].monsters[]`                                   |
| Treasures        | `WorldPage`     | `appStore.books[i].treasures[]`                                  |
| Characters       | `CharacterPage` | `appStore.books[i].characters[]`                                 |
| Traumas          | `CharacterPage` | `.traumas[]`                                                     |
| Conditions       | `CharacterPage` | `.conditions[]`                                                  |
| Achievements     | `CharacterPage` | `.achievements[]`                                                |
| Losses           | `CharacterPage` | `.losses[]`                                                      |
| Events           | `EventPage`     | `appStore.books[i].events[]` (chapters[], startDate, endDate)    |
| Event attributes | `EventPage`     | `appStore.books[i].characters[j].attributes[eventId]`            |
| Chapters         | `ChapterPage`   | `appStore.books[i].chapters[]`                                   |
| Fight sim        | `FightPage`     | Read-only computed via `src/lib/scoreFighter.ts`                 |
| Export           | `App.tsx` modal | `buildExport()`                                                  |
| Theme toggle     | `App.tsx`       | `localStorage('seshat-theme')`                                   |

---

## 9. Theme & Style Architecture

### CSS Variables (`src/styles/theme.css`)

Light/dark theming via `[data-theme="light"]` and `[data-theme="dark"]` attribute selectors. All colors, backgrounds, borders, and MUI overrides use CSS custom properties to enable instant theme switching without re-renders.

| Variable group     | Examples                                   |
| ------------------ | ------------------------------------------ |
| Backgrounds        | `--bg-app`, `--bg-side`, `--bg-main`, `--bg-hover`, `--bg-entry` |
| Text               | `--text-primary`, `--text-secondary`, `--text-muted`, `--text-logo` |
| Borders            | `--border`, `--border-field`               |
| Semantic colors    | `--color-red`, `--color-blue`, `--color-green`, `--color-purple`, `--color-orange`, `--color-teal`, `--color-dark` |
| MUI overrides      | `--mui-input-before`, `--mui-label-color`, `--mui-text-color` |

Dark theme semantic colors are slightly lighter for readability on dark backgrounds.

### Theme Transition (`src/index.css`)

```css
*, *::before, *::after {
  transition: background-color 0.15s ease, border-color 0.15s ease;
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

## 11. Migration to TypeScript

The original `Seshat.jsx` was converted to a modular TypeScript project:

| Was in `Seshat.jsx`                  | Moves to                  |
| ------------------------------------ | ------------------------- |
| All constants                        | `src/lib/constants.ts`    |
| Maker functions, `uid()`, `S` styles | `src/lib/utils.ts`        |
| `buildExport()`                      | `src/lib/export.ts`       |
| `scoreFighter()`                     | `src/lib/scoreFighter.ts` |
| All UI components                    | `src/components/ui/*.tsx` |
| Pages                                | `src/pages/*.tsx`         |
| State logic                          | `src/store/appStore.ts` |
| Routing                              | `src/router/index.tsx`    |
| App shell                            | `src/App.tsx`             |

TypeScript strict mode with `verbatimModuleSyntax` enforced. All style properties typed as `Record<string, React.CSSProperties | Record<string, React.CSSProperties>>`.

### Type Strategy

- Entity types (`Character`, `Event`, `Nation`, etc.) defined in `src/lib/types.ts` for reuse
- Legend State observable patterns use per-field `.set()` calls in `onSubmit` to avoid dynamic property access
- `useTheme.tsx` exports types separately to satisfy react-refresh's component-only file restriction
- `any` keyword is banned — no `as any`, no `: any`, no `eslint-disable @typescript-eslint/no-explicit-any` anywhere in the codebase

---

## 12. Legend State Patterns & Gotchas

### Common Bug: `.get()` on Array Elements

When accessing array elements in Legend State, calling `.get()` on the array returns raw JavaScript values (not observables). Calling `.get()` again on those raw values causes:

```
TypeError: appStore.books[idx].events.get(...).find(...)?.get is not a function
```

**Incorrect:**
```ts
const event = useSelector(() =>
  (appStore.books[idx].events.get() as any[]).find((e) => e.id === id)?.get(), // BUG
);
```

**Correct (for read-only access):**
```ts
const event = useSelector(() =>
  (appStore.books[idx].events.get() as any[]).find((e) => e.id === id),
);
```

**Correct (for updates via save, get index too):**
```ts
const event = useSelector(() =>
  (appStore.books[idx].events.get() as any[]).find((e) => e.id === id),
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
useSelector(() => appStore.books[bookIdx].characters.get())

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

| Purpose                  | Pattern                                                                 |
| ----------------------   | --------------------------------------------------------------------- |
| Read primitive           | `useSelector(() => appStore.books[idx].title.get())`                   |
| Read array (full)        | `useSelector(() => appStore.books[idx].events.get())`                  |
| Read array (find)        | `appStore.books[idx].events.get().find(e => e.id === id)` (raw object, no `.get()`) |
| Get active book index    | `useActiveBookIdx()` — reactive hook returns index of current book     |
| Local form state         | `useForm<FormType>()` + `reset()` from store on entity change             |
| Persist to store on save | `handleSubmit(onSubmit)` => per-field `.set()` calls on active book      |
| MUI Field/Sel in form    | `useWatch({ control, name })` for value, `setValue(name, v)` for change   |
| React Compiler safety    | Prefer `useWatch` over `watch()`; extract sub-components for array items  |
| Native input in form     | `{...register("field")}`                                                |
| Array item sub-component | Define `ItemBlockProps` with `Control`; pass `control`, `index`          |
| EventPage char attrs     | Separate `useState<Record<string, EventAttributes>>`, write on save      |
| Component memoization    | Wrap pure display components in `React.memo` (primitive-only props)      |

---

## 13. Testing

### Stack

| Concern       | Library                  | Why                                       |
| ------------- | ------------------------ | ----------------------------------------- |
| Runner        | Vitest v4                | Vite-native, fast, supports bench mode    |
| DOM env       | jsdom                    | Component rendering in Node               |
| Component     | @testing-library/react   | Renders React components for smoke tests  |
| Matchers      | @testing-library/jest-dom | DOM assertions (`toBeInTheDocument`, etc.) |
| User events   | @testing-library/user-event | Realistic click/type simulation        |

### Scripts

| Command              | Action                                    |
| -------------------- | ----------------------------------------- |
| `npm test`           | `vitest run` — run all `.test.ts(x)` files |
| `npm run test:watch` | `vitest` — watch mode                     |
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

| File                                  | Tests | What it covers                     |
| ------------------------------------- | ----- | ---------------------------------- |
| `src/lib/__tests__/utils.test.ts`     | 10    | uid(), mk helpers, style object S  |
| `src/lib/__tests__/export.test.ts`    | 12    | buildExport() plaintext generation |
| `src/pages/__tests__/FightPage.test.ts` | 22  | scoreFighter scoring logic         |
| `src/components/ui/__tests__/*`       | 11    | Field, Sel, Toggle, EventPicker    |
| `src/components/__tests__/renderPerformance.test.tsx` | 18 | Memoized component DOM stability   |

### Benchmarks

| File                                    | What it measures      |
| --------------------------------------- | --------------------- |
| `src/lib/__tests__/export.bench.ts`     | buildExport() throughput |
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
- Extract sub-components for array items (each calls `useWatch` with a static index)
- For character attributes in EventPage, keep a separate `useState<Record<string, EventAttributes>>` and write on save alongside form data
- `any` is banned — no `as any`, no `: any`, no eslint-disable for `no-explicit-any`
- Pure display leaf components (primitives-only props) should be wrapped in `React.memo`
- `scoreFighter` is in `src/lib/scoreFighter.ts` — import it directly; do not replicate the logic in tests
- Use MUI icons via `src/components/ui/icons.tsx` (named imports, tree-shakeable)
- Pass icon + text as `ReactNode` to `Section.title` and `Field.label`
- Size icons with `sx={{ fontSize: N }}`; theme colors via CSS variables; no transition on SVG paths to prevent theme-toggle flicker
- **Multi-book**: All world state lives inside `appStore.books[]`. Use `useActiveBookIdx()` hook to get the active book's index, then access `appStore.books[idx].fieldName` for reads/writes. The `appStore.activeBookId` is synced from the URL param `:bookId` in `App.tsx`.
- **Book-manager page** at `/` (`BookListPage`) handles creating, listing, and deleting books. Each book is a completely independent world with no shared references.
