import { describe, it, expect } from "vitest";
import { uid, mkChar, mkEvent, mkCond, mkEquip, mkSkill, S } from "../utils";

describe("uid", () => {
  it("generates a 6-char string", () => {
    const id = uid();
    expect(id).toBeTypeOf("string");
    expect(id.length).toBeGreaterThanOrEqual(1);
  });

  it("generates unique values", () => {
    const ids = Array.from({ length: 1000 }, () => uid());
    const unique = new Set(ids);
    expect(unique.size).toBe(1000);
  });

  it("uses only base-36 chars", () => {
    for (let i = 0; i < 500; i++) {
      expect(uid()).toMatch(/^[0-9a-z]+$/);
    }
  });
});

describe("mkChar", () => {
  it("creates a character with defaults", () => {
    const c = mkChar("Test", "#fff");
    expect(c.name).toBe("Test");
    expect(c.color).toBe("#fff");
    expect(c.id).toBeTypeOf("string");
    expect(c.statusTimeline).toEqual([]);
    expect(c.role).toBe("");
    expect(c.archetype).toBe("");
    expect(c.coreWound).toBe("");
    expect(c.coreFear).toBe("");
    expect(c.coreDesire).toBe("");
    expect(c.philosophy).toBe("");
    expect(c.secrets).toBe("");
    expect(c.arcStart).toBe("");
    expect(c.arcEnd).toBe("");
    expect(c.traumas).toEqual([]);
    expect(c.relationships).toEqual([]);
    expect(c.branch).toEqual([]);
    expect(c.attributes).toEqual({});
    expect(c.conditions).toEqual([]);
    expect(c.skills).toEqual([]);
    expect(c.equipment).toEqual([]);
    expect(c.achievements).toEqual([]);
    expect(c.losses).toEqual([]);
  });

  it("each call creates unique id", () => {
    const a = mkChar("A", "#000");
    const b = mkChar("B", "#fff");
    expect(a.id).not.toBe(b.id);
  });
});

describe("mkEvent", () => {
  it("creates an event with defaults", () => {
    const e = mkEvent();
    expect(e.title).toBe("Untitled event");
    expect(e.type).toBe("Story");
    expect(e.time).toBe(1);
    expect(e.characters).toEqual([]);
    expect(e.setting).toBe("");
    expect(e.description).toBe("");
    expect(e.consequence).toBe("");
    expect(e.startDate).toBe("");
    expect(e.endDate).toBe("");
    expect(e.chapters).toEqual([]);
  });
});

describe("mkCond", () => {
  it("defaults isActive to true", () => {
    const c = mkCond();
    expect(c.isActive).toBe(true);
    expect(c.type).toBe("Physical");
  });
});

describe("mkEquip", () => {
  it("defaults accessState to Equipped", () => {
    const e = mkEquip();
    expect(e.accessState).toBe("Equipped");
    expect(e.slot).toBe("Weapon");
  });
});

describe("mkSkill", () => {
  it("defaults uses to infinity symbol", () => {
    const s = mkSkill();
    expect(s.uses).toBe("∞");
  });
});

describe("S style constants", () => {
  it("contains expected style keys", () => {
    expect(S.app).toBeTypeOf("object");
    expect(S.row).toBeTypeOf("object");
    expect(S.top).toBeTypeOf("object");
    expect(S.side).toBeTypeOf("object");
    expect(S.main).toBeTypeOf("object");
    expect(S.h2).toBeTypeOf("object");
    expect(S.input).toBeTypeOf("object");
    expect(S.select).toBeTypeOf("object");
    expect(S.ghost).toBeTypeOf("object");
    expect(S.textarea).toBeTypeOf("object");
    expect(S.grid2).toBeTypeOf("object");
    expect(S.grid3).toBeTypeOf("object");
    expect(S.grid4).toBeTypeOf("object");
  });
});
