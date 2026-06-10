/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { scoreFighter } from "../../lib/scoreFighter";
import type { Character, Event } from "../../lib/types";

const makeChar = (overrides: Partial<Character> = {}): Character => ({
  id: "c1", name: "Hero", color: "#c0392b", role: "",
  archetype: "", coreWound: "", coreFear: "", coreDesire: "",
  philosophy: "", secrets: "", arcs: [],
  statusTimeline: [], traumas: [], relationships: [], branch: [],
  attributes: {}, conditions: [], skills: [], equipment: [],
  achievements: [], losses: [],
  ...overrides,
});

const makeEvent = (overrides: Partial<Event> = {}): Event => ({
  id: "e1", time: 1, title: "Event", type: "Story",
  chapters: [], startDate: "", endDate: "", setting: "",
  description: "", consequence: "", characters: [],
  ...overrides,
});

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
    expect(r.score).toBeGreaterThanOrEqual(15);
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
    expect(r.score).toBeGreaterThanOrEqual(1.4);
  });

  it("excludes non-equipped items from combat score", () => {
    const equipment = [
      { id: "eq1", slot: "Weapon" as const, name: "Sword", atTime: "", atEventId: "", stats: "5 atk", curses: "", unbindCondition: "", uses: "∞", creator: "", createdWhy: "", ingredients: "", lore: "", accessState: "Stored" as const, accessNote: "" },
    ];
    const r = scoreFighter(makeChar({ equipment }), []);
    expect(r.score).toBe(0.1);
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
    expect(r.score).toBeGreaterThanOrEqual(1.9);
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
    const losses = [{ id: "l1", title: "Lost Arm", atTime: "", atEventId: "", description: "" }];
    const r = scoreFighter(makeChar({ achievements, losses }), []);
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
        skills: [{ id: "s1", name: "Sword", atTime: "", atEventId: "", howGained: "", source: "", appearance: "", attitude: "", stats: "", cost: "", costDescription: "", uses: "∞", cooldown: "", upside: "", downside: "", requirement: "", notes: "" }],
      });
      const events = [makeEvent()];
      const r1 = scoreFighter(char, events, "e1");
      const r2 = scoreFighter({ ...char, id: "c2" }, events, "e1");
      expect(r1.score).toBe(r2.score);
    });

    it("win percentage edge: both characters at minimum score", () => {
      const r1 = scoreFighter(makeChar(), []);
      const r2 = scoreFighter(makeChar({ id: "c2" }), []);
      const total = r1.score + r2.score;
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
      expect(pctA).toBeLessThan(30);
    });
  });
});
