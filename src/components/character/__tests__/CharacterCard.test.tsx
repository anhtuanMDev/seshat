import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CharacterCard } from "../CharacterCard";
import type { Character, Skill, Condition } from "../../../lib/types";

describe("CharacterCard Component", () => {
  const mockSkills: Skill[] = [
    {
      id: "skill-1",
      name: "Swordplay",
      atTime: "",
      atEventId: "",
      howGained: "",
      source: "",
      appearance: "",
      attitude: "",
      stats: "",
      cost: "",
      costDescription: "",
      uses: "",
      cooldown: "",
      upside: "",
      downside: "",
      requirement: "",
      notes: "",
    },
    {
      id: "skill-2",
      name: "Riding",
      atTime: "",
      atEventId: "",
      howGained: "",
      source: "",
      appearance: "",
      attitude: "",
      stats: "",
      cost: "",
      costDescription: "",
      uses: "",
      cooldown: "",
      upside: "",
      downside: "",
      requirement: "",
      notes: "",
    },
  ];

  const mockConditions: Condition[] = [
    {
      id: "cond-1",
      name: "Fatigued",
      type: "Physical",
      atTime: "",
      atEventId: "",
      why: "",
      description: "",
      effects: "",
      isActive: true,
    },
  ];

  const mockCharacter: Character = {
    id: "char-123",
    name: "Lancelot",
    role: "Knight",
    archetype: "Fighter",
    coreWound: "Betrayal of trust",
    coreFear: "Dishonor",
    coreDesire: "Serve the king",
    philosophy: "Loyalty above all",
    secrets: "In love with Guinevere",
    color: "#ff00ff",
    skills: mockSkills,
    conditions: mockConditions,
    traumas: [
      {
        id: "t-1",
        title: "Loss of shield",
        when: "",
        description: "",
        trigger: "",
        manifestation: "",
      },
    ],
    arcs: [],
    statusTimeline: [],
    achievements: [],
    losses: [],
    relationships: [],
    attributes: {},
    equipment: [],
    branch: [],
  };

  it("renders character details correctly", () => {
    render(
      <CharacterCard
        character={mockCharacter}
        selected={false}
        onClick={vi.fn()}
        onToggleSelect={vi.fn()}
        isSelectionMode={false}
      />
    );

    expect(screen.getByText("Lancelot")).toBeInTheDocument();
    expect(screen.getByText("Knight")).toBeInTheDocument();
    expect(screen.getByText("Fighter")).toBeInTheDocument();
    expect(screen.getByText("Betrayal of trust")).toBeInTheDocument();
    expect(screen.getByText("Dishonor")).toBeInTheDocument();
    expect(screen.getByText("Serve the king")).toBeInTheDocument();

    // Verify stats badges
    expect(screen.getByText("2 skills")).toBeInTheDocument();
    expect(screen.getByText("1 condition")).toBeInTheDocument();
    expect(screen.getByText("1 trauma")).toBeInTheDocument();
  });

  it("renders selection checkbox when in selection mode", () => {
    const handleToggle = vi.fn();
    render(
      <CharacterCard
        character={mockCharacter}
        selected={true}
        onClick={vi.fn()}
        onToggleSelect={handleToggle}
        isSelectionMode={true}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it("triggers onClick when card is clicked", () => {
    const handleClick = vi.fn();
    render(
      <CharacterCard
        character={mockCharacter}
        selected={false}
        onClick={handleClick}
        onToggleSelect={vi.fn()}
        isSelectionMode={false}
      />
    );

    fireEvent.click(screen.getByText("Lancelot"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
