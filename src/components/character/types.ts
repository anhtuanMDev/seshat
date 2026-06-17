import type { Control, FieldValues } from "react-hook-form";
import type { Trauma, Condition, Achievement, Loss, StatusEntry, Relationship, Equipment } from "../../lib/types";

export interface CharacterForm {
  name: string;
  role: string;
  archetype: string;
  gender: string;
  dob: string;
  appearance: string;
  coreWound: string;
  coreFear: string;
  coreDesire: string;
  philosophy: string;
  secrets: string;
  arcs: import("../../lib/types").CharacterArc[];
  statusTimeline: StatusEntry[];
  traumas: Trauma[];
  conditions: Condition[];
  equipment: Equipment[];
  achievements: Achievement[];
  losses: Loss[];
  relationships: Relationship[];
}

export interface BlockProps<T extends FieldValues = CharacterForm> {
  control: Control<T>;
  index: number;
  onDelete: () => void;
}
