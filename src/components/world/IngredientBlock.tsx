import { S } from "../../lib/utils";
import { Field, Sel } from "../ui";
import { RARITY } from "../../lib/constants";
import type { BlockProps } from "./types";
import { ScienceIcon, InfoIcon, NotesIcon } from "../ui/icons";

export function IngredientBlock({ control, index, onDelete }: BlockProps) {
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
        {/* Left Column: Metadata & Visual Appearance */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Section 1: Classification & Source */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <ScienceIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>Classification & Source</span>
            </div>
            
            <Field label="Name" name={`ingredients.${index}.name` as const} control={control} placeholder="Void iron, Moonpetal…" />
            
            <div style={S.grid2} className="seshat-grid2">
              <Sel label="Rarity" name={`ingredients.${index}.rarity` as const} control={control} opts={RARITY} />
              <Field label="Found at / habitat" name={`ingredients.${index}.location` as const} control={control} placeholder="Deep rift mines, only in eclipse season…" />
            </div>
          </div>

          {/* Section 2: Visual Representation */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <InfoIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>Visual Appearance</span>
            </div>
            <Field label="Appearance" name={`ingredients.${index}.appearance` as const} control={control} placeholder="Black ore with crimson veins that pulse…" />
          </div>
        </div>

        {/* Right Column: Traits, Applications & Danger */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Section 3: Traits & Nature */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <InfoIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>Traits & Nature</span>
            </div>
            <Field label="Properties / nature" name={`ingredients.${index}.properties` as const} control={control} placeholder="Absorbs light, conducts soul energy…" />
            <Field label="Uses — what it makes or enables" name={`ingredients.${index}.uses` as const} control={control} multi rows={2} placeholder="Used in forging void-touched weapons…" />
          </div>

          {/* Section 4: Risk & History */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <NotesIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>Risk & History</span>
            </div>
            <Field label="Danger / handling risks" name={`ingredients.${index}.danger` as const} control={control} placeholder="Prolonged contact causes memory erosion…" />
            <Field label="Lore" name={`ingredients.${index}.lore` as const} control={control} multi rows={2} placeholder="Once abundant before the Sundering…" />
          </div>
        </div>
      </div>
    </div>
  );
}
