import { observable } from "@legendapp/state";
import { configureObservablePersistence, persistObservable } from "@legendapp/state/persist";
import { ObservablePersistIndexedDB } from "@legendapp/state/persist-plugins/indexeddb";
import type { Character, Event, Chapter } from "../lib/types";

export type { Character, Event, Chapter } from "../lib/types";

// Switch to IndexedDB to completely bypass the 5MB/10MB localStorage quota
configureObservablePersistence({
  pluginLocal: ObservablePersistIndexedDB
});

export interface Nation {
  id: string;
  name: string;
  type: string;
  capital: string;
  ruler: string;
  population: string;
  geography: string;
  culture: string;
  military: string;
  economy: string;
  periodActive: string;
  connections: { id: string; withNation: string; relation: string; since: string; until: string; notes: string }[];
  allianceLogic: string;
  secrets: string;
  lore: string;
}

export interface Technique {
  id: string;
  name: string;
  type: string;
  origin: string;
  creator: string;
  era: string;
  description: string;
  effect: string;
  requirement: string;
  cost: string;
  secret: string;
  lore: string;
}

export interface Ingredient {
  id: string;
  name: string;
  rarity: string;
  location: string;
  appearance: string;
  properties: string;
  uses: string;
  danger: string;
  lore: string;
}

export interface Monster {
  id: string;
  name: string;
  tier: string;
  habitat: string;
  appearance: string;
  abilities: string;
  weaknesses: string;
  drops: string;
  lore: string;
  behavior: string;
  firstSeen: string;
}

export interface Treasure {
  id: string;
  name: string;
  rarity: string;
  location: string;
  description: string;
  stats: string;
  curses: string;
  unbindCondition: string;
  creator: string;
  history: string;
  ingredients: string;
}



export interface BookData {
  id: string;
  title: string;
  synopsis: string;
  setting: string;
  themes: string;
  rules: string;
  nations: Nation[];
  techniques: Technique[];
  ingredients: Ingredient[];
  monsters: Monster[];
  treasures: Treasure[];
  events: Event[];
  characters: Character[];
  chapters: Chapter[];
  foreshadows: import("../lib/types").Foreshadow[];
  isFullyLoaded?: boolean;
}

const uid = () => Math.random().toString(36).slice(2, 8);

export const mkBook = (title: string): BookData => ({
  id: uid(),
  title,
  isFullyLoaded: true,
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
      id: uid(),
      time: 1,
      title: "The story begins",
      type: "Story",
      chapters: [],
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
  foreshadows: [],
});

export const appStore = observable({
  activeBookId: null as string | null,
  lastSyncSha: null as string | null,
  books: [] as BookData[],
  isLoadingBooks: false,
  isBookListLoaded: false,
});

export const clearAppStore = () => {
  appStore.set({
    activeBookId: null,
    lastSyncSha: null,
    books: [],
    isLoadingBooks: false,
    isBookListLoaded: false,
  });
};

// Auto-migrate old localStorage data into IndexedDB
try {
  const oldLocalData = localStorage.getItem("seshat-app");
  if (oldLocalData) {
    const parsed = JSON.parse(oldLocalData);
    if (parsed) {
      appStore.set(parsed);
      localStorage.removeItem("seshat-app");
      console.log("Successfully migrated appStore from LocalStorage to IndexedDB.");
    }
  }
} catch (e) {
  console.error("Migration from LocalStorage failed:", e);
}

persistObservable(appStore, { local: "seshat-app" });
