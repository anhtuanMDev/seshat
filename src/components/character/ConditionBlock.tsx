import { S } from "../../lib/utils";
import { Field, Sel, Toggle, EventPicker } from "../ui";
import { COND_TYPES } from "../../lib/constants";
import { EntryBlock } from "../ui";
import type { BlockProps } from "./types";

interface ConditionBlockProps extends BlockProps {
  color: string;
  events: Array<{ id: string; time: number; title: string }>;
}

export function ConditionBlock({ control, index, color, onDelete, events }: ConditionBlockProps) {
  return (
    <EntryBlock color={color} onDelete={onDelete}>
      <div style={S.grid3} className="seshat-grid3">
        <Sel
          label="Type"
          name={`conditions.${index}.type` as const}
          control={control}
          opts={COND_TYPES}
        />
        <Field
          label="Name"
          name={`conditions.${index}.name` as const}
          control={control}
          placeholder="Cursed sight, broken ribs…"
        />
        <Toggle
          label="Currently active?"
          name={`conditions.${index}.isActive` as const}
          control={control}
        />
      </div>
      <div style={S.grid2} className="seshat-grid2">
        <Field
          label="At time (T#)"
          name={`conditions.${index}.atTime` as const}
          control={control}
          placeholder="T3"
        />
        <EventPicker
          label="At event"
          name={`conditions.${index}.atEventId` as const}
          control={control}
          events={events}
        />
      </div>
      <Field
        label="Why / how they got it"
        name={`conditions.${index}.why` as const}
        control={control}
        multi
        rows={2}
        placeholder="What caused this condition?"
      />
      <Field
        label="Description"
        name={`conditions.${index}.description` as const}
        control={control}
        multi
        rows={2}
        placeholder="What does it feel like, look like?"
      />
      <Field
        label="Effects on the character"
        name={`conditions.${index}.effects` as const}
        control={control}
        multi
        rows={2}
      />
    </EntryBlock>
  );
}
