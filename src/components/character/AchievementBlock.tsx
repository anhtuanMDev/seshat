import { S } from "../../lib/utils";
import { Field, EventPicker } from "../ui";
import { EntryBlock } from "../ui";
import type { BlockProps } from "./types";

interface AchievementBlockProps extends BlockProps {
  events: Array<{ id: string; time: number; title: string }>;
}

export function AchievementBlock({ control, index, onDelete, events }: AchievementBlockProps) {
  return (
    <EntryBlock color="var(--color-green)" onDelete={onDelete}>
      <div style={S.grid2} className="seshat-grid2">
        <Field
          label="Title"
          name={`achievements.${index}.title` as const}
          control={control}
          placeholder="Mastered the void step…"
        />
        <Field
          label="At time (T#)"
          name={`achievements.${index}.atTime` as const}
          control={control}
          placeholder="T4"
        />
      </div>
      <EventPicker
        label="At event"
        name={`achievements.${index}.atEventId` as const}
        control={control}
        events={events}
      />
      <Field
        label="Description"
        name={`achievements.${index}.description` as const}
        control={control}
        multi
        rows={2}
        placeholder="What happened. Why it matters."
      />
      <Field
        label="What they gained"
        name={`achievements.${index}.gained` as const}
        control={control}
        placeholder="Respect of the guild, a new power, a scar…"
      />
    </EntryBlock>
  );
}
