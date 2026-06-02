/* eslint-disable @typescript-eslint/no-explicit-any */
import { bench, describe } from "vitest";
import { scoreFighter } from "../../lib/scoreFighter";
import type { Character, Event } from "../../lib/types";

const makeChar = (id: string): Character => ({
  id, name: `Hero ${id}`, color: "#c0392b", role: "Protagonist",
  archetype: "", coreWound: "", coreFear: "", coreDesire: "",
  philosophy: "", secrets: "", arcStart: "", arcEnd: "",
  statusTimeline: [], traumas: [], relationships: [], branch: [],
  attributes: {},
  conditions: [
    { id: `${id}_cd1`, type: "Physical", name: "Scar", atTime: "", atEventId: "", why: "", description: "", effects: "", isActive: true },
    { id: `${id}_cd2`, type: "Blessed", name: "Boon", atTime: "", atEventId: "", why: "", description: "", effects: "", isActive: true },
  ],
  skills: Array.from({ length: 8 }, (_, i) => ({
    id: `${id}_sk${i}`, name: `Skill ${i}`, atTime: "", atEventId: "", howGained: "", source: "", appearance: "", attitude: "", stats: "", cost: "", costDescription: "", uses: "∞", cooldown: "", upside: "", downside: "", requirement: "", notes: "",
  })),
  equipment: Array.from({ length: 4 }, (_, i) => ({
    id: `${id}_eq${i}`, slot: ["Weapon", "Armor", "Helmet", "Accessory"][i] as any,
    name: `Item ${i}`, atTime: "", atEventId: "", stats: "", curses: i === 3 ? "curse" : "", unbindCondition: "", uses: "∞", creator: "", createdWhy: "", ingredients: "", lore: "", accessState: "Equipped" as const, accessNote: "",
  })),
  achievements: [], losses: [],
});

const makeEvent = (id: string, time: number): Event => ({
    id, time, title: `Event ${time}`, type: "Story", chapters: [],
  startDate: "", endDate: "", setting: "", description: "",
  consequence: "", characters: [id],
});

const events50 = Array.from({ length: 50 }, (_, i) => makeEvent(`c${i}`, i + 1));
const chars50 = Array.from({ length: 50 }, (_, i) => makeChar(`c${i}`));

describe("scoreFighter performance", () => {
  bench("bare character, no events", () => {
    scoreFighter(makeChar("test"), []);
  });

  bench("character with 50 events", () => {
    scoreFighter(makeChar("test"), events50, "e30");
  });

  bench("50 characters scored once each", () => {
    for (const c of chars50) {
      scoreFighter(c, events50, c.id);
    }
  });
});
