import { S } from "../../lib/utils";
import { Field, Sel } from "../ui";
import { MON_TIERS } from "../../lib/constants";
import type { BlockProps } from "./types";
import { BugReportIcon, LocationOnIcon, WarningIcon, NotesIcon } from "../ui/icons";

export function MonsterBlock({ control, index }: BlockProps) {

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
        {/* Left Column: Classification, Habitat & Behavior */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Section 1: Classification & Location */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <BugReportIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>Classification & Habitat</span>
            </div>
            
            <Field label="Name" name={`monsters.${index}.name` as const} control={control} placeholder="Hollow Warden…" />
            
            <div style={S.grid2} className="seshat-grid2">
              <Sel label="Tier" name={`monsters.${index}.tier` as const} control={control} opts={MON_TIERS} />
              <Field label="Habitat" name={`monsters.${index}.habitat` as const} control={control} placeholder="Rifts, abandoned fortresses…" />
            </div>
          </div>

          {/* Section 2: Physical & Behavioral Profile */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <LocationOnIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>Physical & Behavioral Profile</span>
            </div>
            <Field label="Appearance" name={`monsters.${index}.appearance` as const} control={control} multi rows={2} placeholder="Twelve feet tall, skin of cracked obsidian…" />
            <Field label="Behavior / intelligence" name={`monsters.${index}.behavior` as const} control={control} multi rows={2} placeholder="Hunts by fear-scent. Territorial…" />
          </div>
        </div>

        {/* Right Column: Abilities, Vulnerabilities & History */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Section 3: Abilities & Loot */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <WarningIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>Abilities & Loot</span>
            </div>
            <Field label="Abilities / attacks" name={`monsters.${index}.abilities` as const} control={control} multi rows={2} placeholder="Soul-shriek (paralyzes), Void-step (teleport)…" />
            
            <div style={S.grid2} className="seshat-grid2">
              <Field label="Weaknesses" name={`monsters.${index}.weaknesses` as const} control={control} placeholder="Sunlight, salt circles, named iron…" />
              <Field label="What it drops" name={`monsters.${index}.drops` as const} control={control} placeholder="Hollow core (ingredient), Warden's eye (relic)…" />
            </div>
          </div>

          {/* Section 4: History & Chronology */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <NotesIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>History & Chronology</span>
            </div>
            <Field label="First recorded encounter" name={`monsters.${index}.firstSeen` as const} control={control} placeholder="T3 — The Rift of Asveth" />
            <Field label="Lore" name={`monsters.${index}.lore` as const} control={control} multi rows={2} placeholder="Once human. Created when the Ritual of Unmaking…" />
          </div>
        </div>
      </div>
    </div>
  );
}
