import { S } from "../../lib/utils";
import { Field, Sel, Toggle, EventPicker } from "../ui";
import { COND_TYPES } from "../../lib/constants";
import type { BlockProps } from "./types";
import { MedicalInformationIcon, CalendarTodayIcon, InfoIcon, NotesIcon } from "../ui/icons";

interface ConditionBlockProps extends BlockProps {
  color: string;
  events: Array<{ id: string; time: number; title: string }>;
}

export function ConditionBlock({ control, index, color, onDelete, events }: ConditionBlockProps) {
  // Bypassing unused onDelete to satisfy the linter
  void onDelete;

  return (
    <div className="seshat-modal-form-redesign" style={{ padding: "24px 28px" }}>
      <div 
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "32px",
          alignItems: "start",
        }}
      >
        {/* Left Column: Classification & Timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Section 1: Classification & State */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <MedicalInformationIcon sx={{ fontSize: 14, color: color || "var(--color-primary)" }} />
              <span>Classification & State</span>
            </div>
            
            <Field
              label="Name"
              name={`conditions.${index}.name` as const}
              control={control}
              placeholder="Cursed sight, broken ribs…"
            />
            
            <div style={S.grid2} className="seshat-grid2">
              <Sel
                label="Type"
                name={`conditions.${index}.type` as const}
                control={control}
                opts={COND_TYPES}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", paddingTop: "8px" }}>
                <Toggle
                  label="Currently active?"
                  name={`conditions.${index}.isActive` as const}
                  control={control}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Timeline Reference */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <CalendarTodayIcon sx={{ fontSize: 14, color: color || "var(--color-primary)" }} />
              <span>Timeline Reference</span>
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
          </div>
        </div>

        {/* Right Column: Descriptions & Effects */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Section 3: Cause & Details */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <InfoIcon sx={{ fontSize: 14, color: color || "var(--color-primary)" }} />
              <span>Cause & Details</span>
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
          </div>

          {/* Section 4: Consequences */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <NotesIcon sx={{ fontSize: 14, color: color || "var(--color-primary)" }} />
              <span>Consequences</span>
            </div>
            <Field
              label="Effects on the character"
              name={`conditions.${index}.effects` as const}
              control={control}
              multi
              rows={2}
              placeholder="How does it restrict or enhance them?"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
