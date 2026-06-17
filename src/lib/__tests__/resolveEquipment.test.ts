import { describe, it, expect } from "vitest";
import { resolveEquipmentAt } from "../resolveEquipment";
import type { Equipment, Event, StatusEntry } from "../types";

describe("resolveEquipmentAt", () => {
  const mockEvents: Event[] = [
    { id: "e1", time: 1, title: "Chapter 1" } as unknown as Event,
    { id: "e2", time: 2, title: "Chapter 2" } as unknown as Event,
    { id: "e3", time: 3, title: "Chapter 3" } as unknown as Event,
  ];

  const mockTimeline: StatusEntry[] = [
    { id: "s1", eventId: "e1" } as unknown as StatusEntry,
    { id: "s2", eventId: "e2" } as unknown as StatusEntry,
    { id: "s3", eventId: "e3" } as unknown as StatusEntry,
  ];

  const baseEquipment: Equipment[] = [
    {
      id: "eq_sword",
      name: "Iron Sword",
      slot: "Weapon",
      accessState: "Equipped",
      atEventId: "e1",
    } as unknown as Equipment,
    {
      id: "eq_shield",
      name: "Iron Shield",
      slot: "Offhand",
      accessState: "Stored",
      atEventId: "e1",
      history: [
        { eventId: "e2", accessState: "Equipped" },
      ],
    } as unknown as Equipment,
    {
      id: "eq_hat",
      name: "Silly Hat",
      slot: "Helmet",
      accessState: "Equipped",
      atEventId: "e1",
      lostEventId: "e2",
    } as unknown as Equipment,
    {
      id: "eq_ring",
      name: "Magic Ring",
      slot: "Accessory",
      accessState: "Stored",
      atEventId: "e3",
    } as unknown as Equipment,
  ];

  it("returns base equipment if context is base", () => {
    const result = resolveEquipmentAt(baseEquipment, mockEvents, mockTimeline, "base");
    expect(result).toEqual(baseEquipment);
  });

  it("resolves equipment state at Chapter 1 (e1)", () => {
    const result = resolveEquipmentAt(baseEquipment, mockEvents, mockTimeline, "s1");

    // Sword (introduced e1) -> visible & Equipped (base state)
    const sword = result.find(r => r.id === "eq_sword");
    expect(sword).toBeDefined();
    expect(sword?.accessState).toBe("Equipped");

    // Shield (introduced e1) -> visible & Stored (history is for e2, so base state is used in e1)
    const shield = result.find(r => r.id === "eq_shield");
    expect(shield).toBeDefined();
    expect(shield?.accessState).toBe("Stored");

    // Hat (introduced e1, lost e2) -> visible & Equipped
    const hat = result.find(r => r.id === "eq_hat");
    expect(hat).toBeDefined();
    expect(hat?.accessState).toBe("Equipped");

    // Ring (introduced e3) -> not yet introduced -> filtered out
    const ring = result.find(r => r.id === "eq_ring");
    expect(ring).toBeUndefined();
  });

  it("resolves equipment state at Chapter 2 (e2)", () => {
    const result = resolveEquipmentAt(baseEquipment, mockEvents, mockTimeline, "s2");

    // Sword -> visible & Equipped
    const sword = result.find(r => r.id === "eq_sword");
    expect(sword).toBeDefined();

    // Shield -> visible & Equipped (override at e2 applied)
    const shield = result.find(r => r.id === "eq_shield");
    expect(shield).toBeDefined();
    expect(shield?.accessState).toBe("Equipped");

    // Hat -> lost at e2 -> filtered out
    const hat = result.find(r => r.id === "eq_hat");
    expect(hat).toBeUndefined();

    // Ring -> not yet introduced -> filtered out
    const ring = result.find(r => r.id === "eq_ring");
    expect(ring).toBeUndefined();
  });

  it("resolves equipment state at Chapter 3 (e3)", () => {
    const result = resolveEquipmentAt(baseEquipment, mockEvents, mockTimeline, "s3");

    // Sword -> visible
    expect(result.find(r => r.id === "eq_sword")).toBeDefined();

    // Shield -> visible & Equipped (override at e2 carries over to e3)
    const shield = result.find(r => r.id === "eq_shield");
    expect(shield).toBeDefined();
    expect(shield?.accessState).toBe("Equipped");

    // Hat -> lost at e2 -> filtered out
    expect(result.find(r => r.id === "eq_hat")).toBeUndefined();

    // Ring -> introduced e3 -> visible & Stored
    const ring = result.find(r => r.id === "eq_ring");
    expect(ring).toBeDefined();
    expect(ring?.accessState).toBe("Stored");
  });
});
