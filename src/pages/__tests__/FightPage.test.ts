import { describe, it, expect } from "vitest";
import { scoreFighter } from "../../lib/scoreFighter";
import type { Character, CondType, Event } from "../../lib/types";

const makeChar = (overrides: Partial<Character> = {}): Character => ({
  id: "c1",
  name: "Hero",
  color: "#c0392b",
  role: "",
  archetype: "",
  coreWound: "",
  coreFear: "",
  coreDesire: "",
  philosophy: "",
  secrets: "",
  arcs: [],
  statusTimeline: [],
  traumas: [],
  relationships: [],
  branch: [],
  attributes: {},
  conditions: [],
  skills: [],
  equipment: [],
  achievements: [],
  losses: [],
  ...overrides,
});

const makeEvent = (overrides: Partial<Event> = {}): Event => ({
  id: "e1",
  time: 1,
  title: "Event",
  type: "Story",
  chapters: [],
  startDate: "",
  endDate: "",
  setting: "",
  description: "",
  consequence: "",
  characters: [],
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
      expect.arrayContaining([
        expect.objectContaining({ label: "Power tier", pts: 15 }),
      ]),
    );
  });

  it("scores skills at 1.2 each", () => {
    const skills = [
      {
        id: "s1",
        name: "Sword",
        atTime: "",
        atEventId: "",
        howGained: "",
        source: "",
        appearance: "",
        attitude: "",
        stats: "",
        cost: "",
        costDescription: "",
        uses: "∞",
        cooldown: "",
        upside: "",
        downside: "",
        requirement: "",
        notes: "",
      },
    ];
    const r = scoreFighter(makeChar({ skills }), []);
    expect(r.score).toBeGreaterThanOrEqual(1.2);
  });

  it("adds condition penalties and bonuses", () => {
    const conditions = [
      {
        id: "cd1",
        type: "Physical" as const,
        name: "Broken Leg",
        atTime: "",
        atEventId: "",
        why: "",
        description: "",
        effects: "",
        isActive: true,
      },
      {
        id: "cd2",
        type: "Blessed" as const,
        name: "Divine Favor",
        atTime: "",
        atEventId: "",
        why: "",
        description: "",
        effects: "",
        isActive: true,
      },
    ];
    const r = scoreFighter(makeChar({ conditions }), []);
    expect(r.score).toBe(0.1);
    expect(r.notes).toHaveLength(2);
  });

  it("ignores inactive conditions", () => {
    const conditions = [
      {
        id: "cd1",
        type: "Wounded" as const,
        name: "Old Scar",
        atTime: "",
        atEventId: "",
        why: "",
        description: "",
        effects: "",
        isActive: false,
      },
    ];
    const r = scoreFighter(makeChar({ conditions }), []);
    expect(r.score).toBe(0.1);
    expect(r.notes).toHaveLength(0);
  });

  it("counts equipped items and penalizes cursed ones", () => {
    const equipment = [
      {
        id: "eq1",
        slot: "Weapon" as const,
        name: "Sword",
        atTime: "",
        atEventId: "",
        stats: "5 atk",
        curses: "",
        unbindCondition: "",
        uses: "∞",
        creator: "",
        createdWhy: "",
        ingredients: "",
        lore: "",
        accessState: "Equipped" as const,
        accessNote: "",
      },
      {
        id: "eq2",
        slot: "Armor" as const,
        name: "Cursed Plate",
        atTime: "",
        atEventId: "",
        stats: "10 def",
        curses: "drains life",
        unbindCondition: "",
        uses: "∞",
        creator: "",
        createdWhy: "",
        ingredients: "",
        lore: "",
        accessState: "Equipped" as const,
        accessNote: "",
      },
    ];
    const r = scoreFighter(makeChar({ equipment }), []);
    expect(r.score).toBeGreaterThanOrEqual(1.4);
  });

  it("excludes non-equipped items from combat score", () => {
    const equipment = [
      {
        id: "eq1",
        slot: "Weapon" as const,
        name: "Sword",
        atTime: "",
        atEventId: "",
        stats: "5 atk",
        curses: "",
        unbindCondition: "",
        uses: "∞",
        creator: "",
        createdWhy: "",
        ingredients: "",
        lore: "",
        accessState: "Stored" as const,
        accessNote: "",
      },
    ];
    const r = scoreFighter(makeChar({ equipment }), []);
    expect(r.score).toBe(0.1);
    expect(r.notes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Stored items" }),
      ]),
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
      expect.arrayContaining([
        expect.objectContaining({ label: "Arc stage", pts: 2 }),
      ]),
    );
  });

  it("applies emotional state penalty for grief/despair", () => {
    const r = scoreFighter(
      makeChar({ attributes: { e1: { emotionalState: "Deep despair" } } }),
      [makeEvent()],
      "e1",
    );
    expect(r.notes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Emotional state",
          pts: -1,
          positive: false,
        }),
      ]),
    );
  });

  it("applies emotional state bonus for resolute/focused/calm", () => {
    const r = scoreFighter(
      makeChar({
        attributes: { e1: { emotionalState: "Calm and collected" } },
      }),
      [makeEvent()],
      "e1",
    );
    expect(r.notes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Emotional state",
          pts: 0.5,
          positive: true,
        }),
      ]),
    );
  });

  it("applies emotional state bonus for rage/fury", () => {
    const r = scoreFighter(
      makeChar({ attributes: { e1: { emotionalState: "Blind rage" } } }),
      [makeEvent()],
      "e1",
    );
    expect(r.notes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Emotional state",
          pts: 0.3,
          positive: true,
        }),
      ]),
    );
  });

  it("scores achievements positively and losses negatively", () => {
    const achievements = [
      {
        id: "a1",
        title: "Dragon Slayer",
        atTime: "",
        atEventId: "",
        description: "",
        gained: "",
      },
      {
        id: "a2",
        title: "King's Favor",
        atTime: "",
        atEventId: "",
        description: "",
        gained: "",
      },
    ];
    const losses = [
      {
        id: "l1",
        title: "Lost Arm",
        atTime: "",
        atEventId: "",
        description: "",
      },
    ];
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
      const char = makeChar({
        id: "c1",
        attributes: { e3: { power: "Peak" } },
      });
      const r = scoreFighter(char, events);
      expect(r.score).toBeGreaterThanOrEqual(18);
      expect(r.notes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "Power tier", pts: 18 }),
        ]),
      );
    });
  });

  describe("bug-prone edge cases", () => {
    it("handles character and event with missing properties (undefined) strictly without crashing", () => {
      // The real issue: APIs or old saves might return missing arrays instead of empty arrays.
      const char = {
        id: "c1",
        name: "Missing Data",
        color: "#000",
        role: "",
        archetype: "",
        coreWound: "",
        coreFear: "",
        coreDesire: "",
        philosophy: "",
        secrets: "",
        arcs: [],
        statusTimeline: [],
        traumas: [],
        relationships: [],
        branch: [],
        attributes: { e1: {} }, // Empty attributes for event
        // Strictly omitting conditions, equipment, skills, achievements, losses to test `|| []` fallbacks
      } as unknown as Character;

      // Event omitting characters array to test `|| []` fallback
      const event = {
        id: "e1",
        time: 1,
        title: "Event",
        type: "Story",
        chapters: [],
        startDate: "",
        endDate: "",
        setting: "",
        description: "",
        consequence: "",
      } as unknown as Event;

      const r = scoreFighter(char, [event], "e1");
      expect(r.score).toBe(0.1);
      expect(r.attr).toEqual({});
    });

    it("handles untyped condition types gracefully", () => {
      const conditions = [
        {
          id: "cd1",
          type: "UnknownType" as CondType,
          name: "Strange",
          atTime: "",
          atEventId: "",
          why: "",
          description: "",
          effects: "",
          isActive: true,
        },
      ];
      const r = scoreFighter(makeChar({ conditions }), []);
      expect(r.score).toBe(0.1);
    });

    it("handles case-insensitive emotional state keywords", () => {
      const r = scoreFighter(
        makeChar({ attributes: { e1: { emotionalState: "GRIEF" } } }),
        [makeEvent()],
        "e1",
      );
      expect(r.notes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "Emotional state", pts: -1 }),
        ]),
      );
    });

    it("handles the 'broken' emotional state", () => {
      const r = scoreFighter(
        makeChar({ attributes: { e1: { emotionalState: "Mentally broken" } } }),
        [makeEvent()],
        "e1",
      );
      expect(r.notes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "Emotional state", pts: -1 }),
        ]),
      );
    });

    it("handles emotional state that matches multiple keywords (first match wins)", () => {
      const r = scoreFighter(
        makeChar({ attributes: { e1: { emotionalState: "Rage and grief" } } }),
        [makeEvent()],
        "e1",
      );
      expect(r.notes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "Emotional state", pts: -1 }),
        ]),
      );
    });

    it("does not assign emotional state for neutral emotional states", () => {
      const r = scoreFighter(
        makeChar({ attributes: { e1: { emotionalState: "Curious" } } }),
        [makeEvent()],
        "e1",
      );
      const emoNotes = r.notes.filter((n) => n.label === "Emotional state");
      expect(emoNotes).toHaveLength(0);
    });

    it("two identical characters have equal scores", () => {
      const char = makeChar({
        attributes: { e1: { power: "Skilled" } },
        skills: [
          {
            id: "s1",
            name: "Sword",
            atTime: "",
            atEventId: "",
            howGained: "",
            source: "",
            appearance: "",
            attitude: "",
            stats: "",
            cost: "",
            costDescription: "",
            uses: "∞",
            cooldown: "",
            upside: "",
            downside: "",
            requirement: "",
            notes: "",
          },
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
            id: `s${i}`,
            name: `Skill ${i}`,
            atTime: "",
            atEventId: "",
            howGained: "",
            source: "",
            appearance: "",
            attitude: "",
            stats: "",
            cost: "",
            costDescription: "",
            uses: "∞",
            cooldown: "",
            upside: "",
            downside: "",
            requirement: "",
            notes: "",
          })),
        }),
        [makeEvent({ id: "e1", characters: ["c2"] })],
      );
      const total = r1.score + r2.score;
      const pctA = Math.round((r1.score / total) * 100);
      expect(pctA).toBeLessThan(30);
    });
  });

  describe("strictly covering all edges for equipment", () => {
    it("handles equipment with whitespace-only curses as normal items", () => {
      const equipment = [
        {
          id: "eq1",
          slot: "Weapon" as const,
          name: "Sword",
          atTime: "",
          atEventId: "",
          stats: "5 atk",
          curses: "   ",
          unbindCondition: "",
          uses: "∞",
          creator: "",
          createdWhy: "",
          ingredients: "",
          lore: "",
          accessState: "Equipped" as const,
          accessNote: "",
        },
      ];
      const r = scoreFighter(makeChar({ equipment }), []);
      expect(r.score).toBeGreaterThanOrEqual(1.0);
      expect(r.notes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            label: "Equipped items",
            value: "1 on body",
          }),
        ]),
      );
    });

    it("handles equipment with No Access state", () => {
      const equipment = [
        {
          id: "eq1",
          slot: "Weapon" as const,
          name: "Sword",
          atTime: "",
          atEventId: "",
          stats: "5 atk",
          curses: "",
          unbindCondition: "",
          uses: "∞",
          creator: "",
          createdWhy: "",
          ingredients: "",
          lore: "",
          accessState: "No Access" as const,
          accessNote: "",
        },
      ];
      const r = scoreFighter(makeChar({ equipment }), []);
      expect(r.score).toBe(0.1);
      expect(r.notes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            label: "No access items",
            value: "1 unavailable",
            pts: 0,
            positive: false,
            neutral: true,
          }),
        ]),
      );
    });

    it("handles character with ONLY 1 cursed item", () => {
      const equipment = [
        {
          id: "eq1",
          slot: "Armor" as const,
          name: "Cursed Plate",
          atTime: "",
          atEventId: "",
          stats: "10 def",
          curses: "drains life",
          unbindCondition: "",
          uses: "∞",
          creator: "",
          createdWhy: "",
          ingredients: "",
          lore: "",
          accessState: "Equipped" as const,
          accessNote: "",
        },
      ];
      const r = scoreFighter(makeChar({ equipment }), []);
      // 1 * 1.0 - 1 * 0.6 = 0.4
      expect(r.score).toBeGreaterThanOrEqual(0.4);
      expect(r.notes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            label: "Equipped items",
            value: "1 on body, 1 cursed",
            pts: 0.4,
          }),
        ]),
      );
    });
  });

  describe("strictly covering all edges for emotional states", () => {
    it("matches second block (resolute/focused/calm) over third block (rage/fury)", () => {
      const r = scoreFighter(
        makeChar({ attributes: { e1: { emotionalState: "Focused fury" } } }),
        [makeEvent()],
        "e1",
      );
      // 'focused' (+0.5) should win over 'fury' (+0.3)
      expect(r.notes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "Emotional state", pts: 0.5 }),
        ]),
      );
    });
  });

  describe("strictly covering all edges for power tier", () => {
    it("ignores unknown power tiers", () => {
      const r = scoreFighter(
        makeChar({ attributes: { e1: { power: "GodMode" } } }),
        [makeEvent()],
        "e1",
      );
      expect(r.score).toBe(0.1); // No bonus
      const powerNotes = r.notes.filter((n) => n.label === "Power tier");
      expect(powerNotes).toHaveLength(0);
    });
  });

  describe("strictly covering all edges for atEventId", () => {
    it("handles atEventId provided but event not found in array", () => {
      const r = scoreFighter(
        makeChar({ attributes: { e1: { power: "Peak" } } }), // Character has attributes for e1
        [makeEvent({ id: "e2" })], // But only e2 is passed
        "e1", // Querying e1
      );
      // resolveEvent will be undefined, attr will be {}
      expect(r.score).toBe(0.1);
      expect(r.attr).toEqual({});
      expect(r.resolveEvent).toBeUndefined();
    });
  });
});
