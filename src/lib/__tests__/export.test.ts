import { describe, it, expect } from "vitest";
import { buildExport } from "../export";
import type { Character, Event } from "../types";

const baseChar = (overrides: Partial<Character> = {}): Character => ({
  id: "c1",
  name: "Hero",
  color: "#c0392b",
  role: "Protagonist",
  archetype: "",
  coreWound: "",
  coreFear: "",
  coreDesire: "",
  philosophy: "",
  secrets: "",
  arcStart: "",
  arcEnd: "",
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

const baseEvent = (overrides: Partial<Event> = {}): Event => ({
  id: "e1",
  time: 1,
  title: "Battle",
  type: "Conflict",
  chapters: [],
  startDate: "",
  endDate: "",
  setting: "",
  description: "",
  consequence: "",
  characters: [],
  ...overrides,
});

describe("buildExport", () => {
  it("includes world title", () => {
    const out = buildExport({
      title: "My World",
      synopsis: "",
      setting: "",
      themes: "",
      rules: "",
      nations: [],
      techniques: [],
      ingredients: [],
      monsters: [],
      treasures: [],
      events: [],
      characters: [],
    });
    expect(out).toContain("My World");
  });

  it("includes synopsis when provided", () => {
    const out = buildExport({
      title: "T",
      synopsis: "A grand tale",
      setting: "",
      themes: "",
      rules: "",
      nations: [],
      techniques: [],
      ingredients: [],
      monsters: [],
      treasures: [],
      events: [],
      characters: [],
    });
    expect(out).toContain("A grand tale");
  });

  it("handles empty characters and events without crashing", () => {
    const out = buildExport({
      title: "Empty",
      synopsis: "",
      setting: "",
      themes: "",
      rules: "",
      nations: [],
      techniques: [],
      ingredients: [],
      monsters: [],
      treasures: [],
      events: [],
      characters: [],
    });
    expect(out).toContain("Empty");
    expect(out).toContain("CHARACTERS");
    expect(out).toContain("MAIN TIMELINE");
  });

  it("renders character details", () => {
    const out = buildExport({
      title: "T",
      synopsis: "",
      setting: "",
      themes: "",
      rules: "",
      nations: [],
      techniques: [],
      ingredients: [],
      monsters: [],
      treasures: [],
      events: [],
      characters: [baseChar({ coreWound: "abandonment", coreDesire: "peace" })],
    });
    expect(out).toContain("HERO");
    expect(out).toContain("Protagonist");
    expect(out).toContain("abandonment");
    expect(out).toContain("peace");
  });

  it("renders event timeline in order", () => {
    const out = buildExport({
      title: "T",
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
        baseEvent({ id: "e2", time: 2, title: "Later" }),
        baseEvent({ id: "e1", time: 1, title: "Earlier" }),
      ],
      characters: [],
    });
    const earlierIdx = out.indexOf("Earlier");
    const laterIdx = out.indexOf("Later");
    expect(earlierIdx).toBeLessThan(laterIdx);
  });

  it("renders character status timeline sorted by event time", () => {
    const out = buildExport({
      title: "T",
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
        baseEvent({ id: "e1", time: 1, title: "Start" }),
        baseEvent({ id: "e2", time: 3, title: "End" }),
      ],
      characters: [
        baseChar({
          statusTimeline: [
            { id: "s2", eventId: "e2", startDate: "", endDate: "", power: "Peak", arcStage: "", emotionalState: "", physicalState: "", note: "" },
            { id: "s1", eventId: "e1", startDate: "", endDate: "", power: "Latent", arcStage: "", emotionalState: "", physicalState: "", note: "" },
          ],
        }),
      ],
    });
    // Latent should appear before Peak (sorted by event time)
    const latentIdx = out.indexOf("Latent");
    const peakIdx = out.indexOf("Peak");
    expect(latentIdx).toBeLessThan(peakIdx);
  });

  it("handles character with undefined arrays gracefully", () => {
    const c = baseChar();
    c.conditions = undefined as unknown as typeof c.conditions;
    c.achievements = undefined as unknown as typeof c.achievements;
    c.losses = undefined as unknown as typeof c.losses;
    c.skills = undefined as unknown as typeof c.skills;
    c.equipment = undefined as unknown as typeof c.equipment;
    c.traumas = undefined as unknown as typeof c.traumas;
    c.relationships = undefined as unknown as typeof c.relationships;
    c.branch = undefined as unknown as typeof c.branch;
    const out = buildExport({
      title: "T", synopsis: "", setting: "", themes: "", rules: "",
      nations: [], techniques: [], ingredients: [], monsters: [], treasures: [],
      events: [],
      characters: [c],
    });
    expect(out).toContain("HERO");
  });

  it("character with status timeline entry referencing missing event does not crash", () => {
    const out = buildExport({
      title: "T", synopsis: "", setting: "", themes: "", rules: "",
      nations: [], techniques: [], ingredients: [], monsters: [], treasures: [],
      events: [],
      characters: [
        baseChar({
          statusTimeline: [
            { id: "s1", eventId: "nonexistent", startDate: "", endDate: "", power: "Peak", arcStage: "", emotionalState: "", physicalState: "", note: "" },
          ],
        }),
      ],
    });
    expect(out).toContain("(no event)");
  });

  it("nations section included when nations present", () => {
    const out = buildExport({
      title: "T", synopsis: "", setting: "", themes: "", rules: "",
      nations: [{ id: "n1", name: "Avalon", type: "Kingdom", capital: "Camelot", ruler: "Arthur", population: "", geography: "", culture: "", military: "", economy: "", periodActive: "", connections: [], allianceLogic: "", secrets: "", lore: "" }],
      techniques: [], ingredients: [], monsters: [], treasures: [],
      events: [],
      characters: [],
    });
    expect(out).toContain("AVALON");
    expect(out).toContain("Camelot");
  });

  it("event with empty startDate does not crash", () => {
    const out = buildExport({
      title: "T", synopsis: "", setting: "", themes: "", rules: "",
      nations: [], techniques: [], ingredients: [], monsters: [], treasures: [],
      events: [baseEvent({ startDate: "" })],
      characters: [],
    });
    expect(out).toContain("[T1]");
  });

  it("character attribute overrides per event are included", () => {
    const out = buildExport({
      title: "T", synopsis: "", setting: "", themes: "", rules: "",
      nations: [], techniques: [], ingredients: [], monsters: [], treasures: [],
      events: [baseEvent({ id: "e1", characters: ["c1"] })],
      characters: [
        baseChar({
          attributes: {
            e1: { power: "Elite", emotionalState: "Focused" },
          },
        }),
      ],
    });
    expect(out).toContain("Elite");
    expect(out).toContain("Focused");
  });

  it("handles date format replacement (T → space)", () => {
    const out = buildExport({
      title: "T", synopsis: "", setting: "", themes: "", rules: "",
      nations: [], techniques: [], ingredients: [], monsters: [], treasures: [],
      events: [baseEvent({ startDate: "2024-01-15T14:30", endDate: "2024-01-16T10:00" })],
      characters: [],
    });
    expect(out).toContain("2024-01-15 14:30");
    expect(out).toContain("2024-01-16 10:00");
  });
});
