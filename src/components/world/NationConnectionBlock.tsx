import { S } from "../../lib/utils";
import { Field, Sel, EntryBlock } from "../ui";
import { NATION_CONNECTION_TYPES } from "../../lib/constants";
import type { Control, FieldValues, Path } from "react-hook-form";

interface NationConnectionBlockProps<T extends FieldValues = FieldValues> {
  control: Control<T>;
  nationIndex: number;
  connIndex: number;
  onDelete: () => void;
}

export function NationConnectionBlock<T extends FieldValues>({ control, nationIndex, connIndex, onDelete }: NationConnectionBlockProps<T>) {
  return (
    <EntryBlock color="var(--text-muted)" onDelete={onDelete}>
      <div style={S.grid3}>
        <Field label="Nation / faction" name={`nations.${nationIndex}.connections.${connIndex}.withNation` as Path<T>} control={control} placeholder="The Iron Dominion…" />
        <Sel label="Relation" name={`nations.${nationIndex}.connections.${connIndex}.relation` as Path<T>} control={control} opts={NATION_CONNECTION_TYPES} />
        <Field label="Since" name={`nations.${nationIndex}.connections.${connIndex}.since` as Path<T>} control={control} placeholder="T3, Year 150…" />
      </div>
      <div style={S.grid2}>
        <Field label="Until (leave blank if ongoing)" name={`nations.${nationIndex}.connections.${connIndex}.until` as Path<T>} control={control} placeholder="T12, Year 340…" />
      </div>
      <Field label="Notes" name={`nations.${nationIndex}.connections.${connIndex}.notes` as Path<T>} control={control} multi rows={2} placeholder="Terms, context, what changed…" />
    </EntryBlock>
  );
}

