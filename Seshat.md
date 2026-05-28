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
9. [Environment & Config](#9-environment--config)
10. [Migration to TypeScript](#10-migration-to-typescript)
11. [Legend State Patterns & Gotchas](#11-legend-state-patterns--gotchas)

---

## 1. Stack Overview

| Concern   | Library           | Why                                                           |
| --------- | ----------------- | ------------------------------------------------------------- |
| Framework | React 18 + Vite   | Fast HMR, modern JSX transform, ES2023 target                 |
| Routing   | React Router v6   | Nested routes with layout persistence                         |
| State     | Legend State      | Fine-grained reactivity, built-in persistence, no boilerplate |
| Forms     | react-hook-form   | Performant local form state, minimal re-renders               |
| UI        | MUI (Material UI) | Consistent, accessible components                             |
| Animation | Anime.js v3       | Timeline-based, works on DOM refs                             |

---

## 2. Project Structure

```
seshat/
├── public/
├── src/
│   ├── lib/
│   │   ├── constants.ts    # CHAR_COLORS, EVENT_TYPES, POWER_TIERS, etc.
│   │   ├── utils.ts        # uid(), mkChar(), mkEvent(), S styles object
│   │   ├── export.ts       # buildExport() — world → plaintext
│   │   └── types.ts        # Shared TypeScript interfaces for entities
│   │
│   ├── store/
│   │   └── worldStore.ts   # Legend State observable + localStorage persistence
│   │
│   ├── hooks/
│   │   ├── useWorldStore.ts    # Typed selectors from legend-state
│   │   ├── useAnimateIn.ts     # Reusable anime.js mount animation
│   │   ├── useTheme.tsx        # Theme context provider (light/dark toggle)
│   │   └── useThemeHook.ts     # useTheme hook for consuming components
│   │
│   ├── components/
│   │   ├── ui/               # Primitive, reusable MUI components
│   │   │   ├── Field.tsx     # MUI TextField wrapper
│   │   │   ├── Sel.tsx       # MUI Select wrapper
│   │   │   ├── Toggle.tsx    # MUI Button toggle
│   │   │   ├── Section.tsx   # Collapsible section wrapper
│   │   │   ├── EntryBlock.tsx # Left-border content card
│   │   │   ├── SideItem.tsx  # Sidebar nav item
│   │   │   ├── EventPicker.tsx # Dropdown for timeline events
│   │   │   └── CharStatusPanel.tsx # Character status badges
│   │   └── editor/
│   │       └── RichEditor.tsx # Rich text editor (focus mode)
│   │
│   ├── pages/
│   │   ├── WorldPage.tsx     # World sheet (nations, techniques, etc.)
│   │   ├── CharacterPage.tsx # Full character sheet
│   │   ├── EventPage.tsx     # Event sheet + character attributes
│   │   ├── ChapterPage.tsx   # Chapter prose editor with reference panel
│   │   └── FightPage.tsx     # Fight simulator
│   │
│   ├── router/
│   │   └── index.tsx       # createBrowserRouter definition
│   │
│   ├── App.tsx             # Root layout (topbar + sidebar)
│   └── main.tsx            # App entry — providers wrapper
│
├── .nvmrc                  # Node.js v24 requirement
├── kilo.json
└── package.json
```

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
      { index: true, element: <WorldPage /> },
      { path: "characters", element: <CharacterListPage /> },
      { path: "characters/:id", element: <CharacterPage /> },
      { path: "events", element: <TimelinePage /> },
      { path: "events/:id", element: <EventPage /> },
      { path: "fight", element: <FightPage /> },
      { path: "chapters", element: <ChapterListPage /> },
      { path: "chapters/:id", element: <ChapterPage /> },
    ],
  },
]);
```

---

## 4. State Management — Legend State

### Store definition (`src/store/worldStore.ts`)

```ts
import { observable } from "@legendapp/state";
import {
  configureObservablePersistence,
  persistObservable,
} from "@legendapp/state/persist";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";

configureObservablePersistence({ pluginLocal: ObservablePersistLocalStorage });

export const worldStore = observable({
  title: "Untitled world",
  synopsis: "",
  setting: "",
  themes: "",
  rules: "",
  nations: [],
  techniques: [],
  ingredients: [],
  monsters: [],
  treasures: [],
  events: [
    {
      id: Math.random().toString(36).slice(2, 8),
      time: 1,
      title: "The story begins",
      type: "Story",
      chapter: "",
      startDate: "",
      endDate: "",
      setting: "",
      description: "",
      consequence: "",
      characters: [],
    },
  ],
  characters: [],
  chapters: [],
});

persistObservable(worldStore, { local: "loreweaver" });
```

### Typed selectors (`src/hooks/useWorldStore.ts`)

```ts
import { useSelector } from "@legendapp/state/react";
import { worldStore } from "../store/worldStore";

export const useWorldTitle = () => useSelector(worldStore.title);
export const useSynopsis = () => useSelector(worldStore.synopsis);
export const useSetting = () => useSelector(worldStore.setting);
export const useThemes = () => useSelector(worldStore.themes);
export const useRules = () => useSelector(worldStore.rules);
export const useNations = () => useSelector(worldStore.nations);
export const useTechniques = () => useSelector(worldStore.techniques);
export const useIngredients = () => useSelector(worldStore.ingredients);
export const useMonsters = () => useSelector(worldStore.monsters);
export const useTreasures = () => useSelector(worldStore.treasures);
export const useEvents = () => useSelector(worldStore.events);
export const useCharacters = () => useSelector(worldStore.characters);
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
import { useForm } from "react-hook-form";
import { worldStore } from "../store/worldStore";

interface MyForm {
  field1: string;
  field2: string;
}

// Inside component:
const { register, handleSubmit, watch, reset, setValue } = useForm<MyForm>({
  defaultValues: { field1: "", field2: "" },
});

// Initialize from store when entity loads
useEffect(() => {
  if (entity) reset({ field1: entity.field1, field2: entity.field2 });
}, [entity?.id, reset]);

// Save writes to Legend State
const onSubmit = (data: MyForm) => {
  Object.entries(data).forEach(([key, value]) => {
    (worldStore.collection[idx] as any)[key].set(value);
  });
};

// In JSX:
//   Native inputs → register()
//   MUI Field/Sel → watch() + setValue()
//   Save button   → handleSubmit(onSubmit)
```

### WorldPage (`/`)

Renders world metadata and world entity sections (Nations, Techniques, Ingredients, Monsters, Treasures). Currently uses direct store writes (not yet migrated to react-hook-form).

### CharacterPage (`/characters/:id`)

Full character sheet with Identity, Psychology, Conditions, Achievements & Losses sections. Currently uses direct store writes (not yet migrated to react-hook-form).

### EventPage (`/events/:id`)

Event editor with per-character attributes (power tier, arc stage, emotional state, etc.). Uses react-hook-form for event fields; character attribute overrides for this event are held in a separate `useState<Record<string, EventAttributes>>`. Start/end date-time pickers use native `<input type="datetime-local">`.

### ChapterPage (`/chapters/:id`)

Chapter prose editor with a reference panel (characters, events, world info). Uses react-hook-form for all chapter fields (number, title, timeRef, synopsis, body, notes). Body field supports both plain textarea and a RichEditor (toggled by focus mode). Auto-grow effect watches `watch("body")`.

### FightPage (`/fight`)

Combat simulation comparing two characters with a weighted score breakdown.

---

## 7. Component Patterns

All UI components in `src/components/ui/` use MUI and accept `value` + `onChange`:

| Component         | Props                                                             |
| ----------------- | ----------------------------------------------------------------- |
| `Field`           | `{ label, value, onChange, multi?, rows?, placeholder?, width? }` |
| `Sel`             | `{ label, value, onChange, opts: string[] }`                      |
| `Toggle`          | `{ label, value, onChange }`                                      |
| `Section`         | `{ title, children, action?, defaultOpen? }`                      |
| `EntryBlock`      | `{ color, onDelete, children }`                                   |
| `SideItem`        | `{ label, sub?, active, color?, onClick, onDelete? }`             |
| `EventPicker`     | `{ label, value, onChange, events[] }`                            |
| `CharStatusPanel` | `{ char, events[] }`                                              |

---

## 8. Features Map

| Feature          | Location        | Store path                                                       |
| ---------------- | --------------- | ---------------------------------------------------------------- |
| World meta       | `WorldPage`     | `worldStore.title`, `.synopsis`, `.setting`, `.themes`, `.rules` |
| Nations          | `WorldPage`     | `worldStore.nations[]`                                           |
| Techniques       | `WorldPage`     | `worldStore.techniques[]`                                        |
| Ingredients      | `WorldPage`     | `worldStore.ingredients[]`                                       |
| Monsters         | `WorldPage`     | `worldStore.monsters[]`                                          |
| Treasures        | `WorldPage`     | `worldStore.treasures[]`                                         |
| Characters       | `CharacterPage` | `worldStore.characters[]`                                        |
| Traumas          | `CharacterPage` | `.traumas[]`                                                     |
| Conditions       | `CharacterPage` | `.conditions[]`                                                  |
| Achievements     | `CharacterPage` | `.achievements[]`                                                |
| Losses           | `CharacterPage` | `.losses[]`                                                      |
| Events           | `EventPage`     | `worldStore.events[]` (fields: startDate, endDate)               |
| Event attributes | `EventPage`     | `worldStore.characters[i].attributes[eventId]`                   |
| Chapters         | `ChapterPage`   | `worldStore.chapters[]`                                          |
| Fight sim        | `FightPage`     | Read-only computed                                               |
| Export           | `App.tsx` modal | `buildExport()`                                                  |
| Theme toggle     | `App.tsx`       | `localStorage('seshat-theme')`                                   |

---

## 9. Environment & Config

### `.nvmrc`

```
v24
```

### Required Node.js

Node.js v24 (for ES2023 target support in tsconfig).

---

## 10. Migration to TypeScript

The original `Seshat.jsx` was converted to a modular TypeScript project:

| Was in `Seshat.jsx`                  | Moves to                  |
| ------------------------------------ | ------------------------- |
| All constants                        | `src/lib/constants.ts`    |
| Maker functions, `uid()`, `S` styles | `src/lib/utils.ts`        |
| `buildExport()`                      | `src/lib/export.ts`       |
| All UI components                    | `src/components/ui/*.tsx` |
| Pages                                | `src/pages/*.tsx`         |
| State logic                          | `src/store/worldStore.ts` |
| Routing                              | `src/router/index.tsx`    |
| App shell                            | `src/App.tsx`             |

TypeScript strict mode with `verbatimModuleSyntax` enforced. All style properties typed as `Record<string, any>` to avoid CSS property type conflicts.

### Type Strategy

- Entity types (`Character`, `Event`, `Nation`, etc.) defined in `src/lib/types.ts` for reuse
- Legend State observable patterns require `any` casts for dynamic property access; these are documented with eslint-disable comments
- `useTheme.tsx` exports types separately to satisfy react-refresh's component-only file restriction

---

## 11. Legend State Patterns & Gotchas

### Common Bug: `.get()` on Array Elements

When accessing array elements in Legend State, calling `.get()` on the array returns raw JavaScript values (not observables). Calling `.get()` again on those raw values causes:

```
TypeError: worldStore.events.get(...).find(...)?.get is not a function
```

**Incorrect:**
```ts
const event = useSelector(() =>
  (worldStore.events.get() as any[]).find((e) => e.id === id)?.get(), // BUG
);
```

**Correct (for read-only access):**
```ts
const event = useSelector(() =>
  (worldStore.events.get() as any[]).find((e) => e.id === id),
);
```

**Correct (for updates via save, get index too):**
```ts
const event = useSelector(() =>
  (worldStore.events.get() as any[]).find((e) => e.id === id),
);
const eventIdx = useSelector(() =>
  worldStore.events.get().findIndex((e) => e.id === id),
);
```

### Form State Pattern (react-hook-form)

Pages that edit store entities use **react-hook-form** for local state and only write to the store on explicit save:

```tsx
const { register, handleSubmit, watch, reset, setValue } = useForm<FormType>({
  defaultValues: { ... },
});

useEffect(() => {
  if (entity) reset({ field: entity.field });
}, [entity?.id, reset]);

const onSubmit = (data: FormType) => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  (Object.keys(data) as (keyof FormType)[]).forEach((key) => {
    (worldStore.collection[entityIdx] as any)[key].set(data[key]);
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */
};

// JSX:
//   <input {...register("field")} />
//   <Field value={watch("field")} onChange={(v) => setValue("field", v)} />
//   <button onClick={handleSubmit(onSubmit)}>save</button>
```

### Pattern Summary

| Purpose                  | Pattern                                                                 |
| ----------------------   | --------------------------------------------------------------------- |
| Read primitive           | `useSelector(worldStore.title)`                                        |
| Read array (full)        | `useSelector(() => worldStore.events.get())`                           |
| Read array (find)        | `worldStore.events.get().find(e => e.id === id)` (raw object, no `.get()`) |
| Local form state         | `useForm<FormType>()` + `reset()` from store on entity change             |
| Persist to store on save | `handleSubmit(onSubmit)` => iterate data keys, `.set()` each on store     |
| MUI Field/Sel in form    | `watch(field)` for value, `setValue(field, v)` for change               |
| Native input in form     | `{...register("field")}`                                                |

### Code Generation Reminder

When generating Legend State code:
- Never call `.get()` on array elements returned by `.find()`, `.map()`, or `.filter()`
- Always get the array index if you need to update an item later (for save, not per-keystroke)
- Use `useSelector()` for reactive reads, direct `.get()` only inside selectors
- Cast to `any` for dynamic property access: `(obj as any).prop.set(value)`
- Prefer react-hook-form for form state; batch-write to store on save
- For character attributes in EventPage, keep a separate `useState<Record<string, EventAttributes>>` and write on save alongside form data
