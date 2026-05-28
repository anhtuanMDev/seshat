import { S } from "../../lib/utils";
import { Field, Sel, EntryBlock } from "../ui";
import { TECH_TYPES } from "../../lib/constants";
import type { BlockProps } from "./types";

export function TechniqueBlock({ control, index, onDelete }: BlockProps) {
  return (
    <EntryBlock color="var(--color-teal)" onDelete={onDelete}>
      <div style={S.grid3}>
        <Field label="Name" name={`techniques.${index}.name` as const} control={control} placeholder="Void Step Discipline…" />
        <Sel label="Type" name={`techniques.${index}.type` as const} control={control} opts={TECH_TYPES} />
        <Field label="Era / period" name={`techniques.${index}.era` as const} control={control} placeholder="Ancient, Third Age…" />
      </div>
      <div style={S.grid2}>
        <Field label="Origin / where it came from" name={`techniques.${index}.origin` as const} control={control} placeholder="Born in the monastery of the silent…" />
        <Field label="Creator (if known)" name={`techniques.${index}.creator` as const} control={control} placeholder="The Blind Master, unknown…" />
      </div>
      <Field label="What it does / how it works" name={`techniques.${index}.description` as const} control={control} multi rows={3} placeholder="A martial discipline that bends the practitioner's shadow…" />
      <Field label="Effects & power" name={`techniques.${index}.effect` as const} control={control} multi rows={2} placeholder="Can intercept attacks, strike from unexpected angles…" />
      <div style={S.grid2}>
        <Field label="Requirements to learn" name={`techniques.${index}.requirement` as const} control={control} placeholder="Must have lost something precious…" />
        <Field label="Cost / price of mastery" name={`techniques.${index}.cost` as const} control={control} placeholder="Gradual blindness, shortened lifespan…" />
      </div>
      <Field label="Secrets / hidden layers" name={`techniques.${index}.secret` as const} control={control} multi rows={2} placeholder="The true final form requires…" />
      <Field label="Lore" name={`techniques.${index}.lore` as const} control={control} multi rows={2} placeholder="Lost for three centuries until…" />
    </EntryBlock>
  );
}
