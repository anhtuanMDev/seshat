/* eslint-disable @typescript-eslint/no-explicit-any */
import { bench, describe } from "vitest";
import { buildExport } from "../export";
import type { Character, Event } from "../types";

// large dataset: 50 characters, 100 events
const big = (() => {
  const chars: Character[] = Array.from({ length: 50 }, (_, i) => ({
    id: `c${i}`, name: `Character ${i}`, color: "#000",
    role: i % 3 === 0 ? "Protagonist" : "", archetype: "",
    coreWound: "wound", coreFear: "fear", coreDesire: "desire",
    philosophy: "philosophy", secrets: "secrets",
    arcs: [],
    statusTimeline: Array.from({ length: 5 }, (_, si) => ({
      id: `s${i}_${si}`, eventId: `e${(i + si) % 100}`,
      startDate: `2024-01-${(si % 28) + 1}T10:00`, endDate: "",
      power: ["Latent", "Capable", "Elite", "Peak"][si % 4],
      arcStage: "", emotionalState: "Calm", physicalState: "", note: "",
    })),
    traumas: Array.from({ length: 3 }, (_, ti) => ({
      id: `t${i}_${ti}`, title: `Trauma ${ti}`, when: "childhood",
      description: "desc", trigger: "trigger", manifestation: "manifest",
    })),
    relationships: Array.from({ length: 4 }, (_, ri) => ({
      id: `r${i}_${ri}`, withId: `c${(i + ri + 1) % 50}`,
      dynamic: "ally", feel: "trust", history: "long", timeline: [],
    })),
    branch: [],
    attributes: {},
    conditions: Array.from({ length: 2 }, (_, ci) => ({
      id: `cd${i}_${ci}`, type: (ci === 0 ? "Physical" : "Blessed") as any,
      name: `Condition ${ci}`, atTime: "", atEventId: "",
      why: "", description: "", effects: "", isActive: true,
    })),
    skills: Array.from({ length: 6 }, (_, si) => ({
      id: `sk${i}_${si}`, name: `Skill ${si}`, atTime: "", atEventId: "",
      howGained: "", source: "", appearance: "", attitude: "",
      stats: "str+2", cost: "10", costDescription: "", uses: "∞",
      cooldown: "", upside: "good", downside: "bad", requirement: "", notes: "",
    })),
    equipment: Array.from({ length: 3 }, (_, ei) => ({
      id: `eq${i}_${ei}`, slot: ["Weapon", "Armor", "Accessory"][ei] as any,
      name: `Item ${ei}`, atTime: "", atEventId: "",
      stats: "def+5", curses: ei === 2 ? "curse" : "", unbindCondition: "",
      uses: "∞", creator: "", createdWhy: "", ingredients: "", lore: "",
      accessState: "Equipped" as const, accessNote: "",
    })),
    achievements: Array.from({ length: 2 }, (_, ai) => ({
      id: `a${i}_${ai}`, title: `Achieve ${ai}`, atTime: "",
      atEventId: `e${(i + ai) % 100}`, description: "", gained: "",
    })),
    losses: Array.from({ length: 1 }, (_, li) => ({
      id: `l${i}_${li}`, title: `Loss ${li}`, atTime: "",
      atEventId: `e${(i + li) % 100}`, description: "",
    })),
  }));

  const events: Event[] = Array.from({ length: 100 }, (_, i) => ({
    id: `e${i}`, time: i + 1, title: `Event ${i}`, type: "Story" as const,
    chapters: [`${(i % 10) + 1}`], startDate: `2024-01-${(i % 28) + 1}`,
    endDate: "", setting: "forest", description: "desc", consequence: "consequence",
    characters: Array.from({ length: 3 }, (_, ci) => `c${(i + ci) % 50}`),
  }));

  return { chars, events };
})();

describe("buildExport performance", () => {
  bench("empty world", () => {
    buildExport({
      title: "T", synopsis: "", setting: "", themes: "", rules: "",
      nations: [], techniques: [], ingredients: [], monsters: [], treasures: [],
      events: [], characters: [],
    });
  });

  bench("small world (2 chars, 5 events)", () => {
    buildExport({
      title: "Small", synopsis: "s", setting: "s", themes: "t", rules: "r",
      nations: [], techniques: [], ingredients: [], monsters: [], treasures: [],
      events: big.events.slice(0, 5),
      characters: big.chars.slice(0, 2),
    });
  });

  bench("large world (50 chars, 100 events)", () => {
    buildExport({
      title: "Large", synopsis: "s", setting: "s", themes: "t", rules: "r",
      nations: [], techniques: [], ingredients: [], monsters: [], treasures: [],
      events: big.events,
      characters: big.chars,
    });
  });
});
