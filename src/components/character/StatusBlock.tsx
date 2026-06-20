import { Field } from "../ui";
import { EventPicker } from "../ui/EventPicker";
import { Sel } from "../ui/Sel";
import type { BlockProps } from "./types";
import { POWER_TIERS, ARC_STAGES } from "../../lib/constants";
import type { Event } from "../../lib/types";

export function StatusBlock({
  control,
  index,
  events,
}: BlockProps & { color?: string; onDelete?: () => void; events: Event[] }) {
  const sectionHeaderStyle = {
    fontSize: "10px",
    letterSpacing: "1.5px",
    textTransform: "uppercase" as const,
    color: "var(--color-primary)",
    marginBottom: "12px",
    fontWeight: 600,
    borderBottom: "1px solid var(--border)",
    paddingBottom: "6px",
  };

  return (
    <div className="seshat-modal-form-redesign" style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 2-Column Responsive Layout */}
      <div 
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Left Column: Anchor & State */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Section: Timeline Anchor */}
          <div>
            <div style={sectionHeaderStyle}>📅 Timeline Anchor</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <EventPicker
                label="Story Event (Anchor)"
                name={`statusTimeline.${index}.eventId` as const}
                control={control}
                events={events}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <Field
                  label="From date"
                  name={`statusTimeline.${index}.startDate` as const}
                  control={control}
                  type="datetime-local"
                />
                <Field
                  label="To date"
                  name={`statusTimeline.${index}.endDate` as const}
                  control={control}
                  type="datetime-local"
                />
              </div>
            </div>
          </div>

          {/* Section: Stats & State */}
          <div>
            <div style={sectionHeaderStyle}>⚡ Progression & States</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <Sel
                  label="Power tier"
                  name={`statusTimeline.${index}.power` as const}
                  control={control}
                  opts={POWER_TIERS as string[]}
                />
                <Sel
                  label="Arc stage"
                  name={`statusTimeline.${index}.arcStage` as const}
                  control={control}
                  opts={ARC_STAGES as string[]}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
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
            </div>
          </div>
        </div>

        {/* Right Column: Identity Overrides & Chronicle Note */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Section: Profile Overrides */}
          <div>
            <div style={sectionHeaderStyle}>🎭 Profile Overrides</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <Field
                  label="Gender (override)"
                  name={`statusTimeline.${index}.gender` as const}
                  control={control}
                  placeholder="Female, Non-binary…"
                />
                <Field
                  label="DOB / Age (override)"
                  name={`statusTimeline.${index}.dob` as const}
                  control={control}
                  placeholder="Born 201 ERA…"
                />
              </div>

              <Field
                label="Appearance (override)"
                name={`statusTimeline.${index}.appearance` as const}
                control={control}
                multi
                rows={2}
                placeholder="Tall with scarred hands, wearing silver chainmail…"
              />
            </div>
          </div>

          {/* Section: Notes */}
          <div>
            <div style={sectionHeaderStyle}>📝 Chronicle Note</div>
            <Field
              label="Note"
              name={`statusTimeline.${index}.note` as const}
              control={control}
              multi
              rows={2}
              placeholder="How are they doing in this period? What's driving them?"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
