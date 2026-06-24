import { S } from "../../lib/utils";
import { Field, Sel } from "../ui";
import { RARITY } from "../../lib/constants";
import type { BlockProps } from "./types";
import { DiamondIcon, LocationOnIcon, WarningIcon, NotesIcon } from "../ui/icons";

export function TreasureBlock({ control, index }: BlockProps) {

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
        {/* Left Column: Classification, Location & Curses */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Section 1: Classification & Location */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <DiamondIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>Classification & Location</span>
            </div>
            
            <Field label="Name" name={`treasures.${index}.name` as const} control={control} placeholder="The Ashen Crown…" />
            
            <div style={S.grid2} className="seshat-grid2">
              <Sel label="Rarity" name={`treasures.${index}.rarity` as const} control={control} opts={RARITY} />
              <Field label="Current location" name={`treasures.${index}.location` as const} control={control} placeholder="Sealed in the Tomb of Kael…" />
            </div>
          </div>

          {/* Section 2: Curse Details */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <WarningIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>Afflictions & Curses</span>
            </div>
            <Field label="Curses (if any)" name={`treasures.${index}.curses` as const} control={control} multi rows={2} placeholder="Slowly replaces the wearer's blood with void-water…" />
            <Field label="Condition to unbind curse" name={`treasures.${index}.unbindCondition` as const} control={control} multi rows={2} placeholder="Worn by its creator's descendant during a solar eclipse…" />
          </div>
        </div>

        {/* Right Column: Traits, Origins & History */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Section 3: Attributes & Origins */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <LocationOnIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>Attributes & Origin</span>
            </div>
            <Field label="Description" name={`treasures.${index}.description` as const} control={control} multi rows={2} placeholder="A crown of blackened bone that weeps silver tears…" />
            <Field label="Stats & powers" name={`treasures.${index}.stats` as const} control={control} multi rows={3} placeholder="+200 to all attributes · Grants command over the dead…" />
            
            <div style={S.grid2} className="seshat-grid2">
              <Field label="Creator" name={`treasures.${index}.creator` as const} control={control} placeholder="The God-Smith Velath…" />
              <Field label="Ingredients / materials" name={`treasures.${index}.ingredients` as const} control={control} placeholder="God-bone, first tears, void iron…" />
            </div>
          </div>

          {/* Section 4: Relic History */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <NotesIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>Chronicles & History</span>
            </div>
            <Field label="History" name={`treasures.${index}.history` as const} control={control} multi rows={3} placeholder="Forged to end the First War. Shattered into three pieces…" />
          </div>
        </div>
      </div>
    </div>
  );
}
