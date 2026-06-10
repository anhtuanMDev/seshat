import { S } from "../../lib/utils";
import { Field, EventPicker } from "../ui";
import { EntryBlock } from "../ui";
import type { BlockProps } from "./types";

interface ArcBlockProps extends BlockProps {
  color: string;
  events: Array<{ id: string; time: number; title: string }>;
}

export function ArcBlock({ control, index, color, onDelete, events }: ArcBlockProps) {
  return (
    <EntryBlock color={color} onDelete={onDelete}>
      <div style={S.grid2} className="seshat-grid2">
        <EventPicker
          label="Arc from event"
          name={`arcs.${index}.arcFromEventId` as const}
          control={control}
          events={events}
          placeholder="— Start of story —"
        />
        <EventPicker
          label="Arc to event"
          name={`arcs.${index}.arcToEventId` as const}
          control={control}
          events={events}
          placeholder="— End of story —"
        />
      </div>
      <div style={S.grid2} className="seshat-grid2">
        <Field
          label="Arc from time"
          name={`arcs.${index}.arcFromTime` as const}
          control={control}
          placeholder="e.g. Year 120, Childhood..."
        />
        <Field
          label="Arc to time"
          name={`arcs.${index}.arcToTime` as const}
          control={control}
          placeholder="e.g. Year 125, Adulthood..."
        />
      </div>
      <div style={S.grid2} className="seshat-grid2">
        <Field
          label="Arc type"
          name={`arcs.${index}.arcType` as const}
          control={control}
          placeholder="Positive, Negative, Flat, Fall, Corruption..."
        />
        <Field
          label="The Lie they believe"
          name={`arcs.${index}.arcLie` as const}
          control={control}
          placeholder="What false belief holds them back?"
        />
      </div>
      <div style={S.grid2} className="seshat-grid2">
        <Field
          label="The Truth they must learn"
          name={`arcs.${index}.arcTruth` as const}
          control={control}
          placeholder="The realization that will save (or destroy) them..."
        />
        <Field
          label="The Breaking Point"
          name={`arcs.${index}.arcBreakingPoint` as const}
          control={control}
          placeholder="The moment they must choose the truth or fail..."
        />
      </div>
      <div style={S.grid2} className="seshat-grid2">
        <Field
          label="Arc start — who they are"
          name={`arcs.${index}.arcStart` as const}
          control={control}
          placeholder="Closed off, convinced the world is cruel…"
        />
        <Field
          label="Arc end — who they become"
          name={`arcs.${index}.arcEnd` as const}
          control={control}
          placeholder="Capable of trust, grief without collapse…"
        />
      </div>
    </EntryBlock>
  );
}
