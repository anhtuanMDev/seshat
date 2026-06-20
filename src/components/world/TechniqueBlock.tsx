import { S } from "../../lib/utils";
import { Field, Sel } from "../ui";
import { TECH_TYPES } from "../../lib/constants";
import type { BlockProps } from "./types";
import { BuildIcon, PeopleIcon, ShieldIcon, NotesIcon } from "../ui/icons";

export function TechniqueBlock({ control, index, onDelete }: BlockProps) {
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
        {/* Left Column: Metadata, Origin, Requirements & Cost */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Section 1: Classification & Era */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <BuildIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>Classification & Era</span>
            </div>
            
            <Field label="Name" name={`techniques.${index}.name` as const} control={control} placeholder="Void Step Discipline…" />
            
            <div style={S.grid2} className="seshat-grid2">
              <Sel label="Type" name={`techniques.${index}.type` as const} control={control} opts={TECH_TYPES} />
              <Field label="Era / period" name={`techniques.${index}.era` as const} control={control} placeholder="Ancient, Third Age…" />
            </div>
          </div>

          {/* Section 2: Creator & Origin */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <PeopleIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>Creator & Origin</span>
            </div>
            
            <Field label="Origin / where it came from" name={`techniques.${index}.origin` as const} control={control} placeholder="Born in the monastery of the silent…" />
            <Field label="Creator (if known)" name={`techniques.${index}.creator` as const} control={control} placeholder="The Blind Master, unknown…" />
          </div>

          {/* Section 3: Requirements & Toll */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <ShieldIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>Requirements & Toll</span>
            </div>
            
            <Field label="Requirements to learn" name={`techniques.${index}.requirement` as const} control={control} placeholder="Must have lost something precious…" />
            <Field label="Cost / price of mastery" name={`techniques.${index}.cost` as const} control={control} placeholder="Gradual blindness, shortened lifespan…" />
          </div>
        </div>

        {/* Right Column: Mechanics, Power, Secrets & History */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Section 4: Functionality & Power */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <NotesIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>Functionality & Power</span>
            </div>
            
            <Field label="What it does / how it works" name={`techniques.${index}.description` as const} control={control} multi rows={3} placeholder="A martial discipline that bends the practitioner's shadow…" />
            <Field label="Effects & power" name={`techniques.${index}.effect` as const} control={control} multi rows={2} placeholder="Can intercept attacks, strike from unexpected angles…" />
          </div>

          {/* Section 5: Lore & Hidden Layers */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <NotesIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>Lore & Secrets</span>
            </div>
            
            <Field label="Secrets / hidden layers" name={`techniques.${index}.secret` as const} control={control} multi rows={2} placeholder="The true final form requires…" />
            <Field label="Lore" name={`techniques.${index}.lore` as const} control={control} multi rows={2} placeholder="Lost for three centuries until…" />
          </div>
        </div>
      </div>
    </div>
  );
}
