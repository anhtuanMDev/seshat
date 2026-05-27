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

---

## 1. Stack Overview

| Concern   | Library           | Why                                                           |
| --------- | ----------------- | ------------------------------------------------------------- |
| Framework | React 18 + Vite   | Fast HMR, modern JSX transform, ES2023 target                 |
| Routing   | React Router v6   | Nested routes with layout persistence                         |
| State     | Legend State      | Fine-grained reactivity, built-in persistence, no boilerplate |
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
│   │
│   ├── pages/
│   │   ├── WorldPage.tsx     # World sheet (nations, techniques, etc.)
│   │   ├── CharacterPage.tsx # Full character sheet
│   │   ├── EventPage.tsx     # Event sheet + character attributes
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
      { path: "characters/:id", element: <CharacterPage /> },
      { path: "events/:id", element: <EventPage /> },
      { path: "fight", element: <FightPage /> },
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
      date: "",
      setting: "",
      description: "",
      consequence: "",
      characters: [],
    },
  ],
  characters: [],
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

All pages read from Legend State via typed hooks, render forms inline, write back on change.

### WorldPage (`/`)

Renders world metadata and world entity sections (Nations, Techniques, Ingredients, Monsters, Treasures).

### CharacterPage (`/characters/:id`)

Full character sheet with Identity, Psychology, Conditions, Achievements & Losses sections.

### EventPage (`/events/:id`)

Event editor with per-character attributes (power tier, arc stage, emotional state, etc.).

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
| Events           | `EventPage`     | `worldStore.events[]`                                            |
| Event attributes | `EventPage`     | `worldStore.characters[i].attributes[eventId]`                   |
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
