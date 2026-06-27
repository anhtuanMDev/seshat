import { observable } from "@legendapp/state";
import { configureObservablePersistence, persistObservable } from "@legendapp/state/persist";
import { ObservablePersistIndexedDB } from "@legendapp/state/persist-plugins/indexeddb";
import type { Character, Event, Chapter, Nation, Technique, Ingredient, Monster, Treasure, Foreshadow } from "../lib/types";

export type { Character, Event, Chapter, Nation, Technique, Ingredient, Monster, Treasure, Foreshadow } from "../lib/types";

// Switch to IndexedDB to completely bypass the 5MB/10MB localStorage quota
configureObservablePersistence({
  pluginLocal: ObservablePersistIndexedDB,
  localOptions: {
    indexedDB: {
      databaseName: "seshat-db",
      version: 1,
      tableNames: ["seshat-app"],
    },
  },
});




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
  foreshadows: Foreshadow[];
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
  lastModifiedLocal: null as number | null,
  lastSyncedCloud: null as number | null,
  isSyncingRemote: false,
  books: [] as BookData[],
  isLoadingBooks: false,
  isBookListLoaded: false,
});

export const clearAppStore = () => {
  appStore.set({
    activeBookId: null,
    lastSyncSha: null,
    lastModifiedLocal: null,
    lastSyncedCloud: null,
    isSyncingRemote: false,
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
  const oldLocalData = localStorage.getItem("seshat-app");
  if (oldLocalData) {
    localStorage.setItem("seshat-app-corrupted-backup", oldLocalData);
    localStorage.removeItem("seshat-app");
    alert("Warning: Failed to migrate old local data. A backup was saved in localStorage as 'seshat-app-corrupted-backup'.");
  }
}

persistObservable(appStore, { local: "seshat-app" });

appStore.books.onChange(() => {
  if (!appStore.isSyncingRemote.get()) {
    appStore.lastModifiedLocal.set(Date.now());
  }
});
