import { S } from "../../lib/utils";
import { Field, Sel, EntryBlock } from "../ui";
import { RARITY } from "../../lib/constants";
import type { BlockProps } from "./types";

export function IngredientBlock({ control, index, onDelete }: BlockProps) {
  return (
    <EntryBlock color="var(--color-brown)" onDelete={onDelete}>
      <div style={S.grid3} className="seshat-grid3">
        <Field label="Name" name={`ingredients.${index}.name` as const} control={control} placeholder="Void iron, Moonpetal…" />
        <Sel label="Rarity" name={`ingredients.${index}.rarity` as const} control={control} opts={RARITY} />
        <Field label="Found at / habitat" name={`ingredients.${index}.location` as const} control={control} placeholder="Deep rift mines, only in eclipse season…" />
      </div>
      <div style={S.grid2} className="seshat-grid2">
        <Field label="Appearance" name={`ingredients.${index}.appearance` as const} control={control} placeholder="Black ore with crimson veins that pulse…" />
        <Field label="Properties / nature" name={`ingredients.${index}.properties` as const} control={control} placeholder="Absorbs light, conducts soul energy…" />
      </div>
      <Field label="Uses — what it makes or enables" name={`ingredients.${index}.uses` as const} control={control} multi rows={2} placeholder="Used in forging void-touched weapons…" />
      <Field label="Danger / handling risks" name={`ingredients.${index}.danger` as const} control={control} placeholder="Prolonged contact causes memory erosion…" />
      <Field label="Lore" name={`ingredients.${index}.lore` as const} control={control} multi rows={2} placeholder="Once abundant before the Sundering…" />
    </EntryBlock>
  );
}
