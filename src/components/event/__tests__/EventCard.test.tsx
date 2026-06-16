import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EventCard } from "../EventCard";
import type { Event, Character } from "../../../lib/types";

describe("EventCard Component", () => {
  const mockCharacters: Character[] = [
    {
      id: "char-1",
      name: "Arthur Pendragon",
      color: "#3b82f6",
      role: "King",
      archetype: "Hero",
      coreWound: "",
      coreFear: "",
      coreDesire: "",
      philosophy: "",
      secrets: "",
      arcs: [],
      statusTimeline: [],
      traumas: [],
      conditions: [],
      achievements: [],
      losses: [],
      relationships: [],
      attributes: {},
      skills: [],
      equipment: [],
      branch: [],
    },
    {
      id: "char-2",
      name: "Merlin",
      color: "#10b981",
      role: "Wizard",
      archetype: "Mentor",
      coreWound: "",
      coreFear: "",
      coreDesire: "",
      philosophy: "",
      secrets: "",
      arcs: [],
      statusTimeline: [],
      traumas: [],
      conditions: [],
      achievements: [],
      losses: [],
      relationships: [],
      attributes: {},
      skills: [],
      equipment: [],
      branch: [],
    },
  ];

  const mockEvent: Event = {
    id: "event-1",
    title: "The Sword in the Stone",
    type: "Story",
    time: 10,
    startDate: "2026-06-15T12:00:00",
    endDate: "2026-06-16T12:00:00",
    subplot: "Main Arc",
    description:
      "Arthur pulls the sword out of the stone and is declared king.",
    consequence: "The kingdom has a new ruler.",
    characters: ["char-1", "char-2"],
    chapters: [],
    setting: "",
  };

  it("renders basic event details correctly", () => {
    const handleClick = vi.fn();
    render(
      <EventCard
        event={mockEvent}
        characters={mockCharacters}
        onClick={handleClick}
      />,
    );

    expect(screen.getByText("The Sword in the Stone")).toBeInTheDocument();
    expect(screen.getByText("T10")).toBeInTheDocument();
    expect(screen.getByText("Story")).toBeInTheDocument();
    expect(screen.getByText("Plot: Main Arc")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Arthur pulls the sword out of the stone and is declared king.",
      ),
    );
    expect(screen.getByText("The kingdom has a new ruler."));
  });

  it("formats date tags appropriately", () => {
    render(
      <EventCard
        event={mockEvent}
        characters={mockCharacters}
        onClick={vi.fn()}
      />,
    );

    expect(
      screen.getByText("2026-06-15 12:00:00 → 2026-06-16 12:00:00"),
    ).toBeInTheDocument();
  });

  it("renders associated characters tags", () => {
    render(
      <EventCard
        event={mockEvent}
        characters={mockCharacters}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText("Arthur Pendragon")).toBeInTheDocument();
    expect(screen.getByText("Merlin")).toBeInTheDocument();
  });

  it("triggers onClick callback when clicked", () => {
    const handleClick = vi.fn();
    render(
      <EventCard
        event={mockEvent}
        characters={mockCharacters}
        onClick={handleClick}
      />,
    );

    fireEvent.click(screen.getByText("The Sword in the Stone"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
