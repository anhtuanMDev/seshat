import { S } from "../../lib/utils";
import { Field, Sel, EntryBlock } from "../ui";
import { NAT_TYPES } from "../../lib/constants";
import type { BlockProps } from "./types";

export function NationBlock({ control, index, onDelete }: BlockProps) {
  return (
    <EntryBlock color="var(--color-dark)" onDelete={onDelete}>
      <div style={S.grid3}>
        <Field label="Name" name={`nations.${index}.name` as const} control={control} placeholder="The Iron Dominion…" />
        <Sel label="Type" name={`nations.${index}.type` as const} control={control} opts={NAT_TYPES} />
        <Field label="Capital" name={`nations.${index}.capital` as const} control={control} placeholder="Ashveil…" />
      </div>
      <div style={S.grid2}>
        <Field label="Ruler / governing power" name={`nations.${index}.ruler` as const} control={control} placeholder="Emperor Kael the Blind…" />
        <Field label="Population / scale" name={`nations.${index}.population` as const} control={control} placeholder="12 million, mostly agrarian…" />
      </div>
      <Field label="Geography" name={`nations.${index}.geography` as const} control={control} placeholder="Frozen tundra split by the Ashen River…" />
      <div style={S.grid2}>
        <Field label="Culture & customs" name={`nations.${index}.culture` as const} control={control} multi rows={2} placeholder="Warrior-scholars. Death rites, honor debts…" />
        <Field label="Military power" name={`nations.${index}.military` as const} control={control} multi rows={2} placeholder="50,000 standing army. Elite Grave Knights…" />
      </div>
      <div style={S.grid2}>
        <Field label="Economy & resources" name={`nations.${index}.economy` as const} control={control} placeholder="Exports void iron, imports grain…" />
        <Field label="Allies" name={`nations.${index}.allies` as const} control={control} placeholder="The Sea Confederacy…" />
        <Field label="Enemies" name={`nations.${index}.enemies` as const} control={control} placeholder="The Free Holds…" />
      </div>
      <Field label="Hidden secrets" name={`nations.${index}.secrets` as const} control={control} multi rows={2} placeholder="The emperor is already dead. The throne is controlled by…" />
      <Field label="Lore & history" name={`nations.${index}.lore` as const} control={control} multi rows={3} placeholder="Founded 400 years ago after the Collapse…" />
    </EntryBlock>
  );
}
