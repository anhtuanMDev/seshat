import { S } from "../../lib/utils";
import { Field, Sel, EntryBlock } from "../ui";
import { RARITY } from "../../lib/constants";
import type { BlockProps } from "./types";

export function TreasureBlock({ control, index, onDelete }: BlockProps) {
  return (
    <EntryBlock color="var(--color-orange)" onDelete={onDelete}>
      <div style={S.grid3}>
        <Field label="Name" name={`treasures.${index}.name` as const} control={control} placeholder="The Ashen Crown…" />
        <Sel label="Rarity" name={`treasures.${index}.rarity` as const} control={control} opts={RARITY} />
        <Field label="Current location" name={`treasures.${index}.location` as const} control={control} placeholder="Sealed in the Tomb of Kael…" />
      </div>
      <Field label="Description" name={`treasures.${index}.description` as const} control={control} multi rows={2} placeholder="A crown of blackened bone that weeps silver tears…" />
      <Field label="Stats & powers" name={`treasures.${index}.stats` as const} control={control} multi rows={3} placeholder="+200 to all attributes · Grants command over the dead…" />
      <div style={S.grid2}>
        <Field label="Curses (if any)" name={`treasures.${index}.curses` as const} control={control} multi rows={2} placeholder="Slowly replaces the wearer's blood with void-water…" />
        <Field label="Condition to unbind curse" name={`treasures.${index}.unbindCondition` as const} control={control} multi rows={2} placeholder="Worn by its creator's descendant during a solar eclipse…" />
      </div>
      <div style={S.grid2}>
        <Field label="Creator" name={`treasures.${index}.creator` as const} control={control} placeholder="The God-Smith Velath…" />
        <Field label="Ingredients / materials" name={`treasures.${index}.ingredients` as const} control={control} placeholder="God-bone, first tears, void iron…" />
      </div>
      <Field label="History" name={`treasures.${index}.history` as const} control={control} multi rows={3} placeholder="Forged to end the First War. Shattered into three pieces…" />
    </EntryBlock>
  );
}
