import { S } from "../../lib/utils";
import { Field } from "../ui";
import { EntryBlock } from "../ui";
import type { BlockProps } from "./types";

export function TraumaBlock({ control, index, color, onDelete }: BlockProps & { color: string }) {
  return (
    <EntryBlock color={color} onDelete={onDelete}>
      <div style={S.grid2} className="seshat-grid2">
        <Field
          label="Trauma name"
          name={`traumas.${index}.title` as const}
          control={control}
          placeholder="The abandonment…"
        />
        <Field
          label="When it happened"
          name={`traumas.${index}.when` as const}
          control={control}
          placeholder="T2, age 12…"
        />
      </div>
      <Field
        label="What happened"
        name={`traumas.${index}.description` as const}
        control={control}
        multi
        rows={2}
      />
      <div style={S.grid2} className="seshat-grid2">
        <Field
          label="Triggered by"
          name={`traumas.${index}.trigger` as const}
          control={control}
          placeholder="Loud voices, being abandoned…"
        />
        <Field
          label="Manifests as"
          name={`traumas.${index}.manifestation` as const}
          control={control}
          placeholder="Freezes, lashes out…"
        />
      </div>
    </EntryBlock>
  );
}
