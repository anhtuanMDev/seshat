import type { Control, FieldValues } from "react-hook-form";
import type { Nation, Technique, Ingredient, Monster, Treasure } from "../../store/worldStore";

export interface WorldForm {
  title: string;
  synopsis: string;
  setting: string;
  themes: string;
  rules: string;
  nations: Nation[];
  techniques: Technique[];
  ingredients: Ingredient[];
  monsters: Monster[];
  treasures: Treasure[];
}

export interface BlockProps<T extends FieldValues = WorldForm> {
  control: Control<T>;
  index: number;
  onDelete: () => void;
}
