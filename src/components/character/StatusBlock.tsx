import { S } from "../../lib/utils";
import { Field } from "../ui";
import { EntryBlock } from "../ui";
import { EventPicker } from "../ui/EventPicker";
import { Sel } from "../ui/Sel";
import type { BlockProps } from "./types";
import { POWER_TIERS, ARC_STAGES } from "../../lib/constants";
import type { Event } from "../../lib/types";

export function StatusBlock({
  control,
  index,
  color,
  onDelete,
  events,
}: BlockProps & { color: string; events: Event[] }) {
  return (
    <EntryBlock color={color} onDelete={onDelete}>
      {/* ── Event & Dates ── */}
      <div style={S.grid2} className="seshat-grid2">
        <EventPicker
          label="Event"
          name={`statusTimeline.${index}.eventId` as const}
          control={control}
          events={events}
        />
      </div>
      <div style={S.grid2} className="seshat-grid2">
        <div>
          <label style={S.label}>From date</label>
          <Field
            name={`statusTimeline.${index}.startDate` as const}
            control={control}
            type="datetime-local"
          />
        </div>
        <div>
          <label style={S.label}>To date</label>
          <Field
            name={`statusTimeline.${index}.endDate` as const}
            control={control}
            type="datetime-local"
          />
        </div>
      </div>

      {/* ── Identity ── */}
      <div style={S.grid2} className="seshat-grid2">
        <Field
          label="Role in story"
          name={`statusTimeline.${index}.role` as const}
          control={control}
          placeholder="Protagonist, mentor…"
        />
        <Field
          label="Archetype"
          name={`statusTimeline.${index}.archetype` as const}
          control={control}
          placeholder="The trickster…"
        />
      </div>

      {/* ── Power / Arc ── */}
      <div style={S.grid2} className="seshat-grid2">
        <div>
          <Sel
            label="Power tier"
            name={`statusTimeline.${index}.power` as const}
            control={control}
            opts={POWER_TIERS as string[]}
          />
        </div>
        <div>
          <Sel
            label="Arc stage"
            name={`statusTimeline.${index}.arcStage` as const}
            control={control}
            opts={ARC_STAGES as string[]}
          />
        </div>
      </div>

      {/* ── States ── */}
      <div style={S.grid2} className="seshat-grid2">
        <Field
          label="Emotional state"
          name={`statusTimeline.${index}.emotionalState` as const}
          control={control}
          placeholder="Grief, resolute…"
        />
        <Field
          label="Physical state"
          name={`statusTimeline.${index}.physicalState` as const}
          control={control}
          placeholder="Injured, peak…"
        />
      </div>

      <Field
        label="Note"
        name={`statusTimeline.${index}.note` as const}
        control={control}
        multi
        rows={2}
        placeholder="How are they doing in this period? What's driving them?"
      />
    </EntryBlock>
  );
}
