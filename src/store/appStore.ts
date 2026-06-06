import { observable } from "@legendapp/state";
import type { Character, Event } from "../lib/types";

export type { Character, Event } from "../lib/types";

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

export interface Chapter {
  id: string;
  number: string;
  title: string;
  timeRef: string;
  synopsis: string;
  body: string;
  notes: string;
  order: number;
  pinnedChars?: string[];
  pinnedEventIds?: string[];
  scenes?: import("../lib/types").SceneCard[];
  drafts?: import("../lib/types").Draft[];
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
});

export const appStore = observable({
  activeBookId: null as string | null,
  books: [] as BookData[],
});
