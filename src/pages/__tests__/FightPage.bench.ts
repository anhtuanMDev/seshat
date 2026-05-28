import { bench, describe } from "vitest";
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
  id, time, title: `Event ${time}`, type: "Story", chapter: "",
  startDate: "", endDate: "", setting: "", description: "",
  consequence: "", characters: [id],
});

// Inlined scoring logic (same as FightPage.test.ts)
const POWER_SCORE: Record<string, number> = { Latent: 1, Awakening: 2, Capable: 3, Skilled: 4, Elite: 5, Peak: 6, Transcendent: 7 };
const COND_PENALTY: Record<string, number> = { Physical: -1, Wounded: -1.5, Mental: -0.5, Cursed: -0.5, Spiritual: 0, Social: 0, Blessed: 1, Enhanced: 1 };

function scoreFighter(char: Character, events: Event[], atEventId?: string) {
  let score = 0;
  const resolveEvent = atEventId
    ? events.find((e) => e.id === atEventId)
    : [...events].sort((a, b) => b.time - a.time).find((e) => (e.characters || []).includes(char.id));
  const attr = resolveEvent ? char.attributes?.[resolveEvent.id] || {} : {};
  const powerPts = POWER_SCORE[attr.power || ""] || 0;
  if (powerPts) score += powerPts * 3;
  const skills = char.skills || [];
  score += skills.length * 1.2;
  const equipped = (char.equipment || []).filter((eq: any) => (eq.accessState || "Equipped") === "Equipped");
  const cursed = equipped.filter((eq: any) => eq.curses && eq.curses.trim());
  score += equipped.length * 1.0 - cursed.length * 0.5;
  const activeCond = (char.conditions || []).filter((cd: any) => cd.isActive);
  for (const cd of activeCond) score += COND_PENALTY[cd.type] ?? 0;
  const achievePts = (char.achievements || []).length * 0.3;
  const lossPts = (char.losses || []).length * -0.15;
  score += achievePts + lossPts;
  return Math.max(0.1, score);
}

// Build data sets
const events50 = Array.from({ length: 50 }, (_, i) => makeEvent(`c${i}`, i + 1));
const chars50 = Array.from({ length: 50 }, (_, i) => makeChar(`c${i}`));

describe("scoreFighter performance", () => {
  bench("bare character, no events", () => {
    scoreFighter(makeChar("test"), []);
  });

  bench("character with 50 events", () => {
    // atEventId lookup is O(n) — measure with many events
    scoreFighter(makeChar("test"), events50, "e30");
  });

  bench("50 characters scored once each", () => {
    for (const c of chars50) {
      scoreFighter(c, events50, c.id);
    }
  });
});
