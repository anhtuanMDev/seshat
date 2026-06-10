import type { Control, FieldValues } from "react-hook-form";
import type { Trauma, Condition, Achievement, Loss, StatusEntry, Relationship } from "../../lib/types";

export interface CharacterForm {
  name: string;
  role: string;
  archetype: string;
  coreWound: string;
  coreFear: string;
  coreDesire: string;
  philosophy: string;
  secrets: string;
  arcStart: string;
  arcType?: string;
  arcLie?: string;
  arcTruth?: string;
  arcBreakingPoint?: string;
  arcFromEventId?: string;
  arcToEventId?: string;
  arcEnd: string;
  statusTimeline: StatusEntry[];
  traumas: Trauma[];
  conditions: Condition[];
  achievements: Achievement[];
  losses: Loss[];
  relationships: Relationship[];
}

export interface BlockProps<T extends FieldValues = CharacterForm> {
  control: Control<T>;
  index: number;
  onDelete: () => void;
}
