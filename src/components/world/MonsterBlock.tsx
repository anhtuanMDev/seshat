import { S } from "../../lib/utils";
import { Field, Sel, EntryBlock } from "../ui";
import { MON_TIERS } from "../../lib/constants";
import type { BlockProps } from "./types";

export function MonsterBlock({ control, index, onDelete }: BlockProps) {
  return (
    <EntryBlock color="var(--color-red)" onDelete={onDelete}>
      <div style={S.grid3} className="seshat-grid3">
        <Field label="Name" name={`monsters.${index}.name` as const} control={control} placeholder="Hollow Warden…" />
        <Sel label="Tier" name={`monsters.${index}.tier` as const} control={control} opts={MON_TIERS} />
        <Field label="Habitat" name={`monsters.${index}.habitat` as const} control={control} placeholder="Rifts, abandoned fortresses…" />
      </div>
      <Field label="Appearance" name={`monsters.${index}.appearance` as const} control={control} multi rows={2} placeholder="Twelve feet tall, skin of cracked obsidian…" />
      <Field label="Behavior / intelligence" name={`monsters.${index}.behavior` as const} control={control} multi rows={2} placeholder="Hunts by fear-scent. Territorial…" />
      <Field label="Abilities / attacks" name={`monsters.${index}.abilities` as const} control={control} multi rows={2} placeholder="Soul-shriek (paralyzes), Void-step (teleport)…" />
      <div style={S.grid2} className="seshat-grid2">
        <Field label="Weaknesses" name={`monsters.${index}.weaknesses` as const} control={control} placeholder="Sunlight, salt circles, named iron…" />
        <Field label="What it drops" name={`monsters.${index}.drops` as const} control={control} placeholder="Hollow core (ingredient), Warden's eye (relic)…" />
      </div>
      <Field label="First recorded encounter" name={`monsters.${index}.firstSeen` as const} control={control} placeholder="T3 — The Rift of Asveth" />
      <Field label="Lore" name={`monsters.${index}.lore` as const} control={control} multi rows={2} placeholder="Once human. Created when the Ritual of Unmaking…" />
    </EntryBlock>
  );
}
