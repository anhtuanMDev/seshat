import { S } from "../../lib/utils";
import { Field, Sel, GhostButton } from "../ui";
import { NAT_TYPES } from "../../lib/constants";
import { NationConnectionBlock } from "./NationConnectionBlock";
import type { BlockProps } from "./types";
import type { NationConnection } from "../../lib/types";
import { FlagIcon, LocationOnIcon, PeopleIcon, ShieldIcon, NotesIcon } from "../ui/icons";

interface NationBlockProps extends BlockProps {
  connections: NationConnection[];
  onAddConnection: () => void;
  onDelConnection: (connId: string) => void;
}

export function NationBlock({ control, index, onDelete, connections, onAddConnection, onDelConnection }: NationBlockProps) {
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
        {/* Left Column: Core Identity & Authority & Diplomacy */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Section 1: Core Identity */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <FlagIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>Core Identity</span>
            </div>
            
            <Field label="Name" name={`nations.${index}.name` as const} control={control} placeholder="The Iron Dominion…" />
            
            <div style={S.grid2} className="seshat-grid2">
              <Sel label="Type" name={`nations.${index}.type` as const} control={control} opts={NAT_TYPES} />
              <Field label="Capital" name={`nations.${index}.capital` as const} control={control} placeholder="Ashveil…" />
            </div>
          </div>

          {/* Section 2: Authority & Scale */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <PeopleIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>Authority & Scale</span>
            </div>
            
            <div style={S.grid2} className="seshat-grid2">
              <Field label="Ruler / governing power" name={`nations.${index}.ruler` as const} control={control} placeholder="Emperor Kael the Blind…" />
              <Field label="Population / scale" name={`nations.${index}.population` as const} control={control} placeholder="12 million, mostly agrarian…" />
            </div>
            
            <div style={S.grid2} className="seshat-grid2">
              <Field label="Economy & resources" name={`nations.${index}.economy` as const} control={control} placeholder="Exports void iron, imports grain…" />
              <Field label="Period active" name={`nations.${index}.periodActive` as const} control={control} placeholder="T0–T12, Year 120–340…" />
            </div>
          </div>

          {/* Section 3: Diplomacy & Alliances */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <ShieldIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>Diplomacy & Alliances</span>
            </div>
            
            <Field label="Alliance logic / diplomatic landscape" name={`nations.${index}.allianceLogic` as const} control={control} multi rows={2} placeholder="Who holds power? What treaties define the region?" />
            
            <div style={styles.connectionsHeaderRow}>
              <span style={styles.connectionsCountText}>Connections ({connections.length})</span>
              <GhostButton onClick={onAddConnection}>+ add connection</GhostButton>
            </div>
            
            {connections.map((conn: NationConnection, ci: number) => (
              <NationConnectionBlock
                key={conn.id}
                control={control}
                nationIndex={index}
                connIndex={ci}
                onDelete={() => onDelConnection(conn.id)}
              />
            ))}
            {!connections.length && <p style={styles.noConnectionsText}>No connections yet.</p>}
          </div>
        </div>

        {/* Right Column: Geography, Society & Secrets */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Section 4: Geography & Territory */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <LocationOnIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>Geography & Territory</span>
            </div>
            <Field label="Geography" name={`nations.${index}.geography` as const} control={control} placeholder="Frozen tundra split by the Ashen River…" />
          </div>

          {/* Section 5: Culture & Customs */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <ShieldIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>Culture & Military</span>
            </div>
            <Field label="Culture & customs" name={`nations.${index}.culture` as const} control={control} multi rows={2} placeholder="Warrior-scholars. Death rites, honor debts…" />
            <Field label="Military power" name={`nations.${index}.military` as const} control={control} multi rows={2} placeholder="50,000 standing army. Elite Grave Knights…" />
          </div>

          {/* Section 6: Secrets & History */}
          <div className="seshat-form-section-container">
            <div className="seshat-form-section-header">
              <NotesIcon sx={{ fontSize: 14, color: "var(--color-primary)" }} />
              <span>Lore, History & Secrets</span>
            </div>
            <Field label="Hidden secrets" name={`nations.${index}.secrets` as const} control={control} multi rows={2} placeholder="The emperor is already dead. The throne is controlled by…" />
            <Field label="Lore & history" name={`nations.${index}.lore` as const} control={control} multi rows={3} placeholder="Founded 400 years ago after the Collapse…" />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  connectionsHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "var(--space-3)",
    marginBottom: "var(--space-1)",
  },
  connectionsCountText: {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--text-secondary)",
  },
  noConnectionsText: {
    ...S.dim,
    fontStyle: "italic",
    margin: "8px 0 0 0",
  },
} satisfies Record<string, React.CSSProperties>;
