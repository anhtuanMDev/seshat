import { S } from "../../lib/utils";
import { Field, EventPicker } from "../ui";
import { EntryBlock } from "../ui";
import type { BlockProps } from "./types";

interface LossBlockProps extends BlockProps {
  events: Array<{ id: string; time: number; title: string }>;
}

export function LossBlock({ control, index, onDelete, events }: LossBlockProps) {
  return (
    <EntryBlock color="var(--color-red)" onDelete={onDelete}>
      <div style={S.grid2} className="seshat-grid2">
        <Field
          label="What was lost"
          name={`losses.${index}.title` as const}
          control={control}
          placeholder="Their mentor, their right eye…"
        />
        <Field
          label="At time (T#)"
          name={`losses.${index}.atTime` as const}
          control={control}
          placeholder="T6"
        />
      </div>
      <EventPicker
        label="At event"
        name={`losses.${index}.atEventId` as const}
        control={control}
        events={events}
      />
      <Field
        label="Description"
        name={`losses.${index}.description` as const}
        control={control}
        multi
        rows={2}
        placeholder="How it happened. What it cost them emotionally."
      />
    </EntryBlock>
  );
}
