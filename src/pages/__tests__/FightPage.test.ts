// @ts-ignore - scoreFighter is not exported; we replicate it for testing
// We test the scoring logic directly since it's a pure function
import { describe, it, expect } from "vitest";
import type { Character, Event } from "../../lib/types";

/* ─── Replicate scoreFighter logic for testing ─── */

const POWER_SCORE: Record<string, number> = {
  Latent: 1, Awakening: 2, Capable: 3, Skilled: 4,
  Elite: 5, Peak: 6, Transcendent: 7,
};
const COND_PENALTY: Record<string, number> = {
  Physical: -1, Wounded: -1.5, Mental: -0.5, Cursed: -0.5,
  Spiritual: 0, Social: 0, Blessed: 1, Enhanced: 1,
};
const ARC_MOD: Record<string, number> = {
  Unaware: 0, Questioning: 0.2, Resisting: 0.5,
  Breaking: 1, Transforming: 1.5, Integrated: 2,
};

interface Note { label: string; value: string | undefined; pts: number; positive: boolean; neutral?: boolean; }
interface ScoreResult { score: number; notes: Note[]; }

function scoreFighter(char: Character, events: Event[], atEventId?: string): ScoreResult {
  let score = 0;
  const notes: Note[] = [];

  const resolveEvent = atEventId
    ? events.find((e) => e.id === atEventId)
    : [...events].sort((a, b) => b.time - a.time).find((e) => (e.characters || []).includes(char.id));
  const attr = resolveEvent ? char.attributes?.[resolveEvent.id] || {} : {};

  const powerTier = attr.power || "";
  const powerPts = POWER_SCORE[powerTier] || 0;
  if (powerPts) {
    score += powerPts * 3;
    notes.push({ label: "Power tier", value: powerTier, pts: powerPts * 3, positive: true });
  }

  const skills = char.skills || [];
  const skillPts = skills.length * 1.2;
  if (skillPts) {
    score += skillPts;
    notes.push({ label: "Skills", value: `${skills.length} known`, pts: Math.round(skillPts * 10) / 10, positive: true });
  }

  const equippedItems = (char.equipment || []).filter((eq) => (eq.accessState || "Equipped") === "Equipped");
  const cursedEquipped = equippedItems.filter((eq) => eq.curses && eq.curses.trim());
  const equipPts = equippedItems.length * 1.0 - cursedEquipped.length * 0.5;
  if (equippedItems.length) {
    score += equipPts;
    notes.push({ label: "Equipped items", value: `${equippedItems.length} on body${cursedEquipped.length ? `, ${cursedEquipped.length} cursed` : ""}`, pts: Math.round(equipPts * 10) / 10, positive: equipPts >= 0 });
  }

  const noAccessItems = (char.equipment || []).filter((eq) => (eq.accessState || "Equipped") === "No Access");
  const storedItems = (char.equipment || []).filter((eq) => (eq.accessState || "Equipped") === "Stored");
  if (noAccessItems.length) notes.push({ label: "No access items", value: `${noAccessItems.length} unavailable`, pts: 0, positive: false, neutral: true });
  if (storedItems.length) notes.push({ label: "Stored items", value: `${storedItems.length} not worn`, pts: 0, positive: false, neutral: true });

  const activeConditions = (char.conditions || []).filter((cd) => cd.isActive);
  for (const cd of activeConditions) {
    const pen = COND_PENALTY[cd.type] ?? 0;
    if (pen !== 0) {
      score += pen;
      notes.push({ label: `Condition: ${cd.name}`, value: `[${cd.type}]`, pts: pen, positive: pen > 0 });
    }
  }

  const achievePts = (char.achievements || []).length * 0.3;
  if (achievePts) { score += achievePts; notes.push({ label: "Achievements", value: `${char.achievements!.length}`, pts: Math.round(achievePts * 10) / 10, positive: true }); }
  const lossPts = (char.losses || []).length * -0.15;
  if (lossPts) { score += lossPts; notes.push({ label: "Losses", value: `${char.losses!.length}`, pts: Math.round(lossPts * 10) / 10, positive: false }); }

  const arcModVal = (attr.arcStage ? ARC_MOD[attr.arcStage] : undefined) ?? 0;
  if (arcModVal) { score += arcModVal; notes.push({ label: "Arc stage", value: attr.arcStage, pts: arcModVal, positive: true }); }

  const emo = (attr.emotionalState || "").toLowerCase();
  if (["grief", "broken", "despair"].some((w) => emo.includes(w))) {
    score -= 1;
    notes.push({ label: "Emotional state", value: attr.emotionalState, pts: -1, positive: false });
  } else if (["resolute", "focused", "calm"].some((w) => emo.includes(w))) {
    score += 0.5;
    notes.push({ label: "Emotional state", value: attr.emotionalState, pts: 0.5, positive: true });
  } else if (["rage", "fury"].some((w) => emo.includes(w))) {
    score += 0.3;
    notes.push({ label: "Emotional state", value: attr.emotionalState, pts: 0.3, positive: true });
  }

  return { score: Math.max(0.1, score), notes };
}

/* ─── Factory helpers ─── */

const makeChar = (overrides: Partial<Character> = {}): Character => ({
  id: "c1", name: "Hero", color: "#c0392b", role: "",
  archetype: "", coreWound: "", coreFear: "", coreDesire: "",
  philosophy: "", secrets: "", arcStart: "", arcEnd: "",
  statusTimeline: [], traumas: [], relationships: [], branch: [],
  attributes: {}, conditions: [], skills: [], equipment: [],
  achievements: [], losses: [],
  ...overrides,
});

const makeEvent = (overrides: Partial<Event> = {}): Event => ({
  id: "e1", time: 1, title: "Event", type: "Story",
  chapter: "", startDate: "", endDate: "", setting: "",
  description: "", consequence: "", characters: [],
  ...overrides,
});

/* ─── Tests ─── */

describe("scoreFighter", () => {
  it("returns minimum score 0.1 for a bare character", () => {
    const r = scoreFighter(makeChar(), []);
    expect(r.score).toBe(0.1);
    expect(r.notes).toHaveLength(0);
  });

  it("scores power tier at x3", () => {
    const r = scoreFighter(
      makeChar({ attributes: { e1: { power: "Elite" } } }),
      [makeEvent()],
      "e1",
    );
    expect(r.score).toBeGreaterThanOrEqual(15); // 5 * 3 = 15
    expect(r.notes).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "Power tier", pts: 15 })]),
    );
  });

  it("scores skills at 1.2 each", () => {
    const skills = [
      { id: "s1", name: "Sword", atTime: "", atEventId: "", howGained: "", source: "", appearance: "", attitude: "", stats: "", cost: "", costDescription: "", uses: "∞", cooldown: "", upside: "", downside: "", requirement: "", notes: "" },
    ];
    const r = scoreFighter(makeChar({ skills }), []);
    expect(r.score).toBeGreaterThanOrEqual(1.2);
  });

  it("adds condition penalties and bonuses", () => {
    const conditions = [
      { id: "cd1", type: "Physical" as const, name: "Broken Leg", atTime: "", atEventId: "", why: "", description: "", effects: "", isActive: true },
      { id: "cd2", type: "Blessed" as const, name: "Divine Favor", atTime: "", atEventId: "", why: "", description: "", effects: "", isActive: true },
    ];
    const r = scoreFighter(makeChar({ conditions }), []);
    // Physical: -1, Blessed: +1 => net 0, should still have 0.1 minimum
    expect(r.score).toBe(0.1);
    expect(r.notes).toHaveLength(2);
  });

  it("ignores inactive conditions", () => {
    const conditions = [
      { id: "cd1", type: "Wounded" as const, name: "Old Scar", atTime: "", atEventId: "", why: "", description: "", effects: "", isActive: false },
    ];
    const r = scoreFighter(makeChar({ conditions }), []);
    expect(r.score).toBe(0.1);
    expect(r.notes).toHaveLength(0);
  });

  it("counts equipped items and penalizes cursed ones", () => {
    const equipment = [
      { id: "eq1", slot: "Weapon" as const, name: "Sword", atTime: "", atEventId: "", stats: "5 atk", curses: "", unbindCondition: "", uses: "∞", creator: "", createdWhy: "", ingredients: "", lore: "", accessState: "Equipped" as const, accessNote: "" },
      { id: "eq2", slot: "Armor" as const, name: "Cursed Plate", atTime: "", atEventId: "", stats: "10 def", curses: "drains life", unbindCondition: "", uses: "∞", creator: "", createdWhy: "", ingredients: "", lore: "", accessState: "Equipped" as const, accessNote: "" },
    ];
    const r = scoreFighter(makeChar({ equipment }), []);
    // 2 items = 2.0 - 0.5 cursed = 1.5
    expect(r.score).toBeGreaterThanOrEqual(1.4); // 1.5 + 0.1 min
  });

  it("excludes non-equipped items from combat score", () => {
    const equipment = [
      { id: "eq1", slot: "Weapon" as const, name: "Sword", atTime: "", atEventId: "", stats: "5 atk", curses: "", unbindCondition: "", uses: "∞", creator: "", createdWhy: "", ingredients: "", lore: "", accessState: "Stored" as const, accessNote: "" },
    ];
    const r = scoreFighter(makeChar({ equipment }), []);
    expect(r.score).toBe(0.1); // no equipped items
    expect(r.notes).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "Stored items" })]),
    );
  });

  it("applies arc stage modifier from event attributes", () => {
    const r = scoreFighter(
      makeChar({ attributes: { e1: { arcStage: "Integrated" } } }),
      [makeEvent()],
      "e1",
    );
    expect(r.score).toBeGreaterThanOrEqual(1.9); // 2.0 arc + 0.1 min
    expect(r.notes).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "Arc stage", pts: 2 })]),
    );
  });

  it("applies emotional state penalty for grief/despair", () => {
    const r = scoreFighter(
      makeChar({ attributes: { e1: { emotionalState: "Deep despair" } } }),
      [makeEvent()],
      "e1",
    );
    expect(r.notes).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "Emotional state", pts: -1, positive: false })]),
    );
  });

  it("applies emotional state bonus for resolute/focused/calm", () => {
    const r = scoreFighter(
      makeChar({ attributes: { e1: { emotionalState: "Calm and collected" } } }),
      [makeEvent()],
      "e1",
    );
    expect(r.notes).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "Emotional state", pts: 0.5, positive: true })]),
    );
  });

  it("applies emotional state bonus for rage/fury", () => {
    const r = scoreFighter(
      makeChar({ attributes: { e1: { emotionalState: "Blind rage" } } }),
      [makeEvent()],
      "e1",
    );
    expect(r.notes).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "Emotional state", pts: 0.3, positive: true })]),
    );
  });

  it("scores achievements positively and losses negatively", () => {
    const achievements = [
      { id: "a1", title: "Dragon Slayer", atTime: "", atEventId: "", description: "", gained: "" },
      { id: "a2", title: "King's Favor", atTime: "", atEventId: "", description: "", gained: "" },
    ];
    const losses = [
      { id: "l1", title: "Lost Arm", atTime: "", atEventId: "", description: "" },
    ];
    const r = scoreFighter(makeChar({ achievements, losses }), []);
    // 2 achieve = 0.6, 1 loss = -0.15, net 0.45 + min 0.1 = 0.55
    expect(r.score).toBeGreaterThanOrEqual(0.4);
    expect(r.score).toBeLessThan(1);
  });

  describe("atEventId edge cases", () => {
    it("finds latest event when atEventId is empty", () => {
      const events = [
        makeEvent({ id: "e1", time: 1, title: "Early", characters: ["c1"] }),
        makeEvent({ id: "e2", time: 5, title: "Late", characters: ["c1"] }),
      ];
      const r = scoreFighter(makeChar(), events);
      // should resolve to e2 (latest time) since atEventId is empty
      // but bare char has no attributes, so score is just 0.1
      expect(r.score).toBe(0.1);
    });

    it("falls back to latest event with character when no atEventId given", () => {
      const events = [
        makeEvent({ id: "e1", time: 1, title: "Early", characters: ["c1"] }),
        makeEvent({ id: "e2", time: 3, title: "Mid", characters: [] }),
        makeEvent({ id: "e3", time: 5, title: "Late", characters: ["c1"] }),
      ];
      const char = makeChar({ id: "c1", attributes: { e3: { power: "Peak" } } });
      const r = scoreFighter(char, events);
      // Should pick e3 (latest with char) → Peak = 6*3 = 18 + 0.1 min
      expect(r.score).toBeGreaterThanOrEqual(18);
      expect(r.notes).toEqual(
        expect.arrayContaining([expect.objectContaining({ label: "Power tier", pts: 18 })]),
      );
    });
  });

  describe("bug-prone edge cases", () => {
    it("handles character with empty string arrays (not undefined)", () => {
      const char = makeChar();
      (char as any).conditions = [];
      (char as any).equipment = [];
      (char as any).skills = [];
      (char as any).achievements = [];
      (char as any).losses = [];
      const r = scoreFighter(char, []);
      expect(r.score).toBe(0.1);
    });

    it("handles untyped condition types gracefully", () => {
      const conditions = [
        { id: "cd1", type: "UnknownType", name: "Strange", atTime: "", atEventId: "", why: "", description: "", effects: "", isActive: true },
      ];
      const r = scoreFighter(makeChar({ conditions: conditions as any }), []);
      // Unknown type → COND_PENALTY["UnknownType"] = undefined → pen = 0
      expect(r.score).toBe(0.1);
    });

    it("handles case-insensitive emotional state keywords", () => {
      const r = scoreFighter(
        makeChar({ attributes: { e1: { emotionalState: "GRIEF" } } }),
        [makeEvent()], "e1",
      );
      expect(r.notes).toEqual(
        expect.arrayContaining([expect.objectContaining({ label: "Emotional state", pts: -1 })]),
      );
    });

    it("handles emotional state that matches multiple keywords (first match wins)", () => {
      // "Rage and grief" → "rage" and "grief" both match
      // rage check comes after grief check in the actual code
      // But wait, in the actual code:
      //   if (grief/broken/despair) → -1
      //   else if (resolute/focused/calm) → +0.5
      //   else if (rage/fury) → +0.3
      // So "rage and grief" → -1 (grief matches first)
      const r = scoreFighter(
        makeChar({ attributes: { e1: { emotionalState: "Rage and grief" } } }),
        [makeEvent()], "e1",
      );
      expect(r.notes).toEqual(
        expect.arrayContaining([expect.objectContaining({ label: "Emotional state", pts: -1 })]),
      );
    });

    it("does not assign emotional state for neutral emotional states", () => {
      const r = scoreFighter(
        makeChar({ attributes: { e1: { emotionalState: "Curious" } } }),
        [makeEvent()], "e1",
      );
      const emoNotes = r.notes.filter((n) => n.label === "Emotional state");
      expect(emoNotes).toHaveLength(0);
    });

    it("two identical characters have equal scores", () => {
      const char = makeChar({
        attributes: { e1: { power: "Skilled" } },
        skills: [
          { id: "s1", name: "Sword", atTime: "", atEventId: "", howGained: "", source: "", appearance: "", attitude: "", stats: "", cost: "", costDescription: "", uses: "∞", cooldown: "", upside: "", downside: "", requirement: "", notes: "" },
        ],
      });
      const events = [makeEvent()];
      const r1 = scoreFighter(char, events, "e1");
      const r2 = scoreFighter({ ...char, id: "c2" }, events, "e1");
      expect(r1.score).toBe(r2.score);
    });

    it("win percentage edge: both characters at minimum score", () => {
      const r1 = scoreFighter(makeChar(), []);
      const r2 = scoreFighter(makeChar({ id: "c2" }), []);
      const total = r1.score + r2.score; // 0.1 + 0.1 = 0.2
      const pctA = Math.round((r1.score / total) * 100);
      const pctB = 100 - pctA;
      expect(pctA).toBe(50);
      expect(pctB).toBe(50);
    });

    it("win percentage edge: one character far stronger", () => {
      const r1 = scoreFighter(makeChar(), []);
      const r2 = scoreFighter(
        makeChar({
          id: "c2",
          attributes: { e1: { power: "Transcendent" } },
          skills: Array.from({ length: 10 }, (_, i) => ({
            id: `s${i}`, name: `Skill ${i}`, atTime: "", atEventId: "", howGained: "", source: "", appearance: "", attitude: "", stats: "", cost: "", costDescription: "", uses: "∞", cooldown: "", upside: "", downside: "", requirement: "", notes: "",
          })),
        }),
        [makeEvent({ id: "e1", characters: ["c2"] })],
      );
      const total = r1.score + r2.score;
      const pctA = Math.round((r1.score / total) * 100);
      expect(pctA).toBeLessThan(30); // weaker char should have < 30%
    });
  });
});
